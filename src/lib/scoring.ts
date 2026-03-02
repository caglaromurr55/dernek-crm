import prisma from "@/lib/prisma";

export async function recalculateHouseholdScore(householdId: string) {
    const household = await (prisma as any).household.findUnique({
        where: { id: householdId },
        include: { persons: true }
    });

    if (!household) return 0;

    // --- V4 Dinamik Veri Sayımı ---
    // Manuel girilen counts yerine gerçek person listesinden sayıyoruz
    const actualStudentCount = household.persons.filter((p: any) => p.isStudent).length;
    const actualDisabledCount = household.persons.filter((p: any) => p.isDisabled).length;
    const actualChronicCount = household.persons.filter((p: any) => p.hasChronicIllness).length;

    let score = calculateBaseHouseholdScore({
        rentStatus: household.rentStatus,
        rentAmount: household.rentAmount,
        monthlyIncome: household.monthlyIncome,
        workerCount: household.workerCount,
        studentCount: actualStudentCount, // Kişi verilerinden geliyor
        disabledChildCount: 0, // Bu alan artık person.isDisabled içinde eridi
        carOwnership: household.carOwnership,
        estateOwnership: household.estateOwnership,
        debtAmount: household.debtAmount,
        heatingType: household.heatingType,
    });

    // Bireylere (Persons) göre ek puanlar
    for (const person of household.persons) {
        // Hanedeki her birey temel yüktür
        score += 5;
    }

    // Hastalık / Engellilik Aciliyeti Puanı (Kişi kayıtlarından sayılanlar)
    score += (actualDisabledCount * 30);
    score += (actualChronicCount * 20);

    // Bekleme Süresi Puanı (Yardım Alınmayan Veya Başvurudan İtibaren Geçen Her Gün İçin +1 Puan)
    const referenceDate = household.lastAidDate || household.createdAt;
    const now = new Date();
    const diffTime = now.getTime() - referenceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        score += diffDays;
    }

    // --- OTOMATİK DURUM ATAMA (Eşikler) ---
    let newStatus = household.status;

    if (score < 30) {
        newStatus = "REJECTED";
    } else if (score >= 30 && score < 60) {
        newStatus = "APPROVED_ONCE";
    } else if (score >= 60) {
        newStatus = "APPROVED";
    }

    // Güncelleme
    await (prisma as any).household.update({
        where: { id: householdId },
        data: {
            score,
            status: newStatus,
            // Senkronizasyon: Hane üzerindeki sayısal alanları da güncelle
            studentCount: actualStudentCount,
            disabledChildCount: actualDisabledCount
        }
    });

    return score;
}

export function calculateBaseHouseholdScore(data: {
    rentStatus?: string | null;
    rentAmount?: number | null;
    monthlyIncome?: number | null;
    workerCount?: number | null;
    studentCount?: number | null;
    disabledChildCount?: number | null;
    carOwnership?: boolean | null;
    estateOwnership?: boolean | null;
    debtAmount?: number | null;
    heatingType?: string | null;
}) {
    let score = 50; // Taban puan

    // Kira Durumu Etkisi
    if (data.rentStatus === "kiraci") {
        score += 25;
    } else if (data.rentStatus === "akraba-yani") {
        score += 10;
    } else if (data.rentStatus === "mulk-sahibi") {
        score -= 30;
    }

    // Kira yükü (Her 500 TL için +1 puan, maks +40)
    if (data.rentAmount && data.rentAmount > 0) {
        const rentScore = Math.min(Math.floor(data.rentAmount / 500), 40);
        score += rentScore;
    }

    // --- NEGATİF PUANLAR (Zenginlik Kısımları) ---
    if (data.monthlyIncome && data.monthlyIncome > 0) {
        const incomeDeduction = Math.floor(data.monthlyIncome / 1000) * 5;
        score -= incomeDeduction;
    } else {
        score += 40;
    }

    if (data.carOwnership) {
        score -= 40;
    }
    if (data.estateOwnership) {
        score -= 100;
    }

    if (data.workerCount && data.workerCount > 0) {
        score -= (data.workerCount * 20);
    }

    // --- POZİTİF PUANLAR (Ek Yükler) ---
    // Eğitim
    if (data.studentCount && data.studentCount > 0) {
        score += (data.studentCount * 10);
    }

    // Borç Durumu (Her 5000 TL borç için +5 Puan, maks 30)
    if (data.debtAmount && data.debtAmount > 0) {
        const debtScore = Math.min(Math.floor(data.debtAmount / 5000) * 5, 30);
        score += debtScore;
    }

    // Isınma Türü
    if (data.heatingType === "soba") {
        score += 15;
    }

    return score;
}
