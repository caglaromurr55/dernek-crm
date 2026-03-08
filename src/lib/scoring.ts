import prisma from "@/lib/prisma";
import { calculateHouseholdTags } from "@/lib/tagging";

export async function recalculateHouseholdScore(householdId: string) {
    const household = await (prisma as any).household.findUnique({
        where: { id: householdId },
        select: {
            id: true,
            score: true,
            status: true,
            tags: true,
            rentStatus: true,
            rentAmount: true,
            monthlyIncome: true,
            workerCount: true,
            carOwnership: true,
            estateOwnership: true,
            debtAmount: true,
            heatingType: true,
            billExpense: true,
            foodExpense: true,
            heatingExpense: true,
            educationExpense: true,
            healthExpense: true,
            clothingExpense: true,
            transportationExpense: true,
            babyExpense: true,
            roofCondition: true,
            waterDamage: true,
            furnitureCondition: true,
            hasInternet: true,
            hasWashingMachine: true,
            hasRefrigerator: true,
            lastAidDate: true,
            createdAt: true,
            persons: {
                select: {
                    isStudent: true,
                    isDisabled: true,
                    hasChronicIllness: true
                }
            }
        }
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
        studentCount: actualStudentCount,
        disabledChildCount: actualDisabledCount,
        carOwnership: household.carOwnership,
        estateOwnership: household.estateOwnership,
        debtAmount: household.debtAmount,
        heatingType: household.heatingType,
        // --- YENİ EKLENEN GİDERLER ---
        billExpense: household.billExpense,
        foodExpense: household.foodExpense,
        heatingExpense: household.heatingExpense,
        educationExpense: household.educationExpense,
        healthExpense: household.healthExpense,
        clothingExpense: household.clothingExpense,
        transportationExpense: household.transportationExpense,
        babyExpense: household.babyExpense,
        // --- YENİ EKLENEN FİZİKSEL DURUMLAR ---
        roofCondition: household.roofCondition,
        waterDamage: household.waterDamage,
        furnitureCondition: household.furnitureCondition,
        hasInternet: household.hasInternet,
        hasWashingMachine: household.hasWashingMachine,
        hasRefrigerator: household.hasRefrigerator
    });

    // Bireylere (Persons) göre ek puanlar
    for (const person of household.persons) {
        // Hanedeki her birey temel yüktür
        score += 5;
    }

    // Hastalık / Engellilik Aciliyeti Puanı (Kişi kayıtlarından sayılanlar)
    score += (actualDisabledCount * 30);
    score += (actualChronicCount * 20);

    // Bekleme Süresi Puanı (Sadece SÜREKLİ ONAYLI kişiler için her gün +1 puan)
    if (household.status === "APPROVED") {
        const referenceDate = household.lastAidDate || household.createdAt;
        const now = new Date();
        const diffTime = now.getTime() - referenceDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            score += diffDays;
        }
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

    // --- OTOMATİK ETİKET ATAMA (Smart Labels) ---
    const newTags = calculateHouseholdTags(household, household.persons);

    // Sadece bir değişiklik varsa güncelle (Gereksiz Write I/O'yu engelle)
    const isScoreChanged = household.score !== score;
    const isStatusChanged = household.status !== newStatus;
    const isTagsChanged = JSON.stringify(household.tags) !== JSON.stringify(newTags);

    if (isScoreChanged || isStatusChanged || isTagsChanged) {
        await (prisma as any).household.update({
            where: { id: householdId },
            data: {
                score,
                status: newStatus,
                tags: newTags,
                // Senkronizasyon
                studentCount: actualStudentCount,
                disabledChildCount: actualDisabledCount
            }
        });
    }

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
    // Yeni Giderler
    billExpense?: number | null;
    foodExpense?: number | null;
    heatingExpense?: number | null;
    educationExpense?: number | null;
    healthExpense?: number | null;
    clothingExpense?: number | null;
    transportationExpense?: number | null;
    babyExpense?: number | null;
    // Yeni Şartlar
    roofCondition?: string | null;
    waterDamage?: boolean | null;
    furnitureCondition?: string | null;
    hasInternet?: boolean | null;
    hasWashingMachine?: boolean | null;
    hasRefrigerator?: boolean | null;
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

    // --- YENİ EKLENEN FİZİKSEL ŞARTLAR YÜKLERİ ---
    if (data.waterDamage) {
        score += 20; // Rutubetli ev ekstra sağlık riskidir
    }
    if (data.roofCondition === "akitiyor") {
        score += 20;
    } else if (data.roofCondition === "eski") {
        score += 10;
    }

    if (data.furnitureCondition === "yetersiz") {
        score += 15; // Çok yetersiz eşya ek yardım gerektirir
    } else if (data.furnitureCondition === "eski") {
        score += 5;
    }

    if (data.hasWashingMachine === false) {
        score += 15; // Temel beyaz eşya eksiği
    }
    if (data.hasRefrigerator === false) {
        score += 20; // Gıda saklama sorunu çok kritiktir
    }
    if (data.hasInternet === false && data.studentCount && data.studentCount > 0) {
        score += 15; // Öğrenci var ama internet yoksa dezavantaj çok artar
    }

    // --- GİDER YÜKÜ (Toplam Aylık Giderlerin Gelire Oranı / Etkisi) ---
    // Sadece kira değil, tüm giderlerin faturasını hafifçe skora yansıt
    const totalExpenses =
        (data.rentAmount || 0) +
        (data.billExpense || 0) +
        (data.heatingExpense || 0) +
        (data.foodExpense || 0) +
        (data.educationExpense || 0) +
        (data.healthExpense || 0) +
        (data.clothingExpense || 0) +
        (data.transportationExpense || 0) +
        (data.babyExpense || 0);

    if (totalExpenses > 0) {
        // Her 1000 TL total gider için skoru hafifçe (+2) artır. Üst limit 30
        const expenseScore = Math.min(Math.floor(totalExpenses / 1000) * 2, 30);
        score += expenseScore;
    }

    return score;
}
