"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { ScoringSettings, getDefaultScoringSettings } from "@/lib/default-settings";
const SCORING_SETTINGS_KEY = "SCORING_ALGORITHM_SETTINGS";

export async function getScoringSettingsAction(): Promise<{ success: boolean; data?: ScoringSettings; message?: string }> {
    try {
        const setting = await (prisma as any).systemSetting.findUnique({
            where: { key: SCORING_SETTINGS_KEY }
        });

        if (!setting) {
            return { success: true, data: getDefaultScoringSettings() as ScoringSettings };
        }

        const parsed = JSON.parse(setting.value);
        // Varsayılanlarla birleştir (yeni eklenen alanlar patlamasın diye)
        const merged = { ...getDefaultScoringSettings(), ...parsed };
        return { success: true, data: merged as ScoringSettings };
    } catch (error: any) {
        console.error("Get scoring settings error:", error);
        return { success: false, message: error.message || "Ayarlar alınamadı." };
    }
}

export async function updateScoringSettingsAction(settings: Partial<ScoringSettings>): Promise<{ success: boolean; message?: string }> {
    try {
        // Mevcutları al
        const currentData = await getScoringSettingsAction();
        const existingSettings = currentData.data || (getDefaultScoringSettings() as ScoringSettings);

        const newData = { ...existingSettings, ...settings };

        await (prisma as any).systemSetting.upsert({
            where: { key: SCORING_SETTINGS_KEY },
            update: { value: JSON.stringify(newData) },
            create: { key: SCORING_SETTINGS_KEY, value: JSON.stringify(newData) }
        });

        revalidatePath("/sistem");
        revalidatePath("/haneler");

        return { success: true, message: "Algoritma ayarları başarıyla güncellendi." };
    } catch (error: any) {
        console.error("Update scoring settings error:", error);
        return { success: false, message: error.message || "Ayarlar güncellenirken hata oluştu." };
    }
}
