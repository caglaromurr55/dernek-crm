import { Household, Person } from "@prisma/client";

export function calculateHouseholdTags(
    household: Partial<Household>,
    persons: Partial<Person>[]
): string[] {
    const tags: Set<string> = new Set();

    // 1. Eğitim Etiketi: Hanede öğrenci varsa
    const hasStudent = persons.some(p => p.isStudent) || (household.studentCount && household.studentCount > 0);
    if (hasStudent) {
        tags.add("Eğitim");
    }

    // 2. Özel Destek Etiketi: Hanede engelli birey varsa
    const hasDisabled = persons.some(p => p.isDisabled) || (household.disabledChildCount && household.disabledChildCount > 0);
    if (hasDisabled) {
        tags.add("Özel Destek");
    }

    // 3. Sağlık Etiketi: Hanede kronik hasta varsa
    const hasChronic = persons.some(p => p.hasChronicIllness);
    if (hasChronic) {
        tags.add("Sağlık");
    }

    // 4. Acil Destek Etiketi: Hanede çalışan yok ve gelir 5000'den azsa
    const isUrgent = (household.workerCount === 0 || !household.workerCount) &&
        (household.monthlyIncome !== null && household.monthlyIncome !== undefined && household.monthlyIncome < 5000);
    if (isUrgent) {
        tags.add("Acil Destek");
    }

    // 5. Borçlu Etiketi: Borç miktarı 15000'den fazlaysa
    if (household.debtAmount && household.debtAmount >= 15000) {
        tags.add("Ağır Borçlu");
    }

    return Array.from(tags);
}
