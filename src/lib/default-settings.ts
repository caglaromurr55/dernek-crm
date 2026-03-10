export interface ScoringSettings {
    // --- Auto Rejects ---
    autoRejectCarOwner: boolean;
    autoRejectEstateOwner: boolean;
    autoRejectIfWorkerExists: boolean;

    // --- Deductions / Punishments ---
    rentOwnerDeduction: number;
    carOwnershipDeduction: number;
    estateOwnershipDeduction: number;
    workerDeductionPerPerson: number;
    incomeDeductionPer1000: number;

    // --- Bonus Points ---
    baseScore: number;
    noIncomeBonus: number;
    rentTenantBonus: number;
    rentRelativeBonus: number;
    rentAmountBonusMax: number;
    studentBonusPerPerson: number;
    debtBonusMax: number;
    heatingSobaBonus: number;

    // --- Physical Conditions Bonus ---
    waterDamageBonus: number;
    roofLeakingBonus: number;
    roofOldBonus: number;
    furnitureInadequateBonus: number;
    furnitureOldBonus: number;
    noWashingMachineBonus: number;
    noRefrigeratorBonus: number;
    noInternetWithStudentBonus: number;

    // --- Expenses Bonus ---
    expensesBonusMax: number;
}

// Varsayılan ayarlar (sistemde kayıt yoksa bunlar kullanılır)
export const getDefaultScoringSettings = (): ScoringSettings => ({
    autoRejectCarOwner: false,
    autoRejectEstateOwner: false,
    autoRejectIfWorkerExists: false,

    rentOwnerDeduction: 30,
    carOwnershipDeduction: 40,
    estateOwnershipDeduction: 100,
    workerDeductionPerPerson: 20,
    incomeDeductionPer1000: 5,

    baseScore: 50,
    noIncomeBonus: 40,
    rentTenantBonus: 25,
    rentRelativeBonus: 10,
    rentAmountBonusMax: 40,
    studentBonusPerPerson: 10,
    debtBonusMax: 30,
    heatingSobaBonus: 15,

    waterDamageBonus: 20,
    roofLeakingBonus: 20,
    roofOldBonus: 10,
    furnitureInadequateBonus: 15,
    furnitureOldBonus: 5,
    noWashingMachineBonus: 15,
    noRefrigeratorBonus: 20,
    noInternetWithStudentBonus: 15,

    expensesBonusMax: 30,
});
