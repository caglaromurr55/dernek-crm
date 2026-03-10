"use client";

import { useState, useEffect } from "react";
import { factoryResetAction } from "@/app/actions/system";
import { getScoringSettingsAction, updateScoringSettingsAction } from "@/app/actions/settings";
import { ScoringSettings, getDefaultScoringSettings } from "@/lib/default-settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, RefreshCw, ShieldAlert, Loader2, Save, Settings2, ShieldCheck, Zap } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SystemPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<ScoringSettings>(getDefaultScoringSettings());
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            const res = await getScoringSettingsAction();
            if (res.success && res.data) {
                setSettings(res.data);
            }
            setIsLoaded(true);
        }
        loadSettings();
    }, []);

    const handleReset = async () => {
        setIsLoading(true);
        try {
            const res = await factoryResetAction();
            if (res.success) {
                toast.success("SİSTEM SIFIRLANDI!", { description: res.message });
                window.location.href = "/";
            } else {
                toast.error("Hata", { description: res.message });
            }
        } catch (error) {
            toast.error("Sistem hatası");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const res = await updateScoringSettingsAction(settings);
            if (res.success) {
                toast.success("Algoritma Ayarları Kaydedildi", {
                    description: "Puanlama kriterleri başarıyla güncellendi."
                });
            } else {
                toast.error("Hata", { description: res.message });
            }
        } catch (error) {
            toast.error("Sistem hatası");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isLoaded) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in-fade py-12">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center justify-center gap-3">
                    <ShieldCheck className="w-10 h-10 text-emerald-600" />
                    Sistem ve Algoritma Yönetimi
                </h1>
                <p className="text-muted-foreground font-medium italic">Puanlama kurallarını ayarlayın veya sistemi yönetin.</p>
            </div>

            <Tabs defaultValue="algorithm" className="space-y-6">
                <div className="flex justify-center">
                    <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 h-auto rounded-2xl gap-2 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
                        <TabsTrigger value="algorithm" className="rounded-xl px-6 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-emerald-600 data-[state=active]:shadow-lg shadow-black/5 font-bold transition-all text-sm">
                            <Zap className="w-4 h-4 mr-2" />
                            Puanlama Algoritması
                        </TabsTrigger>
                        <TabsTrigger value="danger" className="rounded-xl px-6 py-3 data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-950/30 data-[state=active]:text-red-600 data-[state=active]:shadow-lg shadow-red-500/10 font-bold transition-all text-sm">
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Kritik İşlemler
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="algorithm" className="animate-in-fade space-y-6">
                    <Card className="shadow-lg border-zinc-200/50 dark:border-zinc-800">
                        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-zinc-100 dark:border-zinc-800/50 rounded-t-xl py-6">
                            <CardTitle className="flex items-center gap-2 text-2xl font-black text-emerald-700 dark:text-emerald-500">
                                <Settings2 className="w-6 h-6" /> Algoritma Kuralları V6
                            </CardTitle>
                            <CardDescription className="text-emerald-800/70 dark:text-emerald-400/70 font-medium">Değeri değiştirilen alanlar sadece yeni oluşturulan / güncellenen hanelerde etkili olacaktır. Eski haneleri güncellemek için düzenleyp kaydetmeniz gerekir.</CardDescription>
                        </CardHeader>

                        <CardContent className="p-8 pt-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {/* Otomatik Redler */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" /> Otomatik İptal Şartları
                                </h3>

                                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Araç Sahibi İse Reddet</Label>
                                        <p className="text-xs text-muted-foreground">Kişinin üzerine kayıtlı araç varsa sistem direkt "Reddedildi" yapar.</p>
                                    </div>
                                    <Switch
                                        checked={settings.autoRejectCarOwner}
                                        onCheckedChange={(c) => setSettings({ ...settings, autoRejectCarOwner: c })}
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Tapu Sahibi İse Reddet</Label>
                                        <p className="text-xs text-muted-foreground">Mülk sahiplerini direkt olarak puanlamaya dahil etmez.</p>
                                    </div>
                                    <Switch
                                        checked={settings.autoRejectEstateOwner}
                                        onCheckedChange={(c) => setSettings({ ...settings, autoRejectEstateOwner: c })}
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Çalışan Varsa Reddet</Label>
                                        <p className="text-xs text-muted-foreground">Hanede 1 veya daha fazla çalışan birey varsa otonom iptal edilir.</p>
                                    </div>
                                    <Switch
                                        checked={settings.autoRejectIfWorkerExists}
                                        onCheckedChange={(c) => setSettings({ ...settings, autoRejectIfWorkerExists: c })}
                                    />
                                </div>
                            </div>

                            {/* Puan Yapılandırmaları */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                                    <Zap className="w-5 h-5 text-blue-500" /> Esnek Puan Değerleri
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-[1fr,100px] items-center gap-4">
                                        <Label className="font-semibold text-sm">Soba ile Isınma Ek Puanı</Label>
                                        <Input
                                            type="number"
                                            value={settings.heatingSobaBonus}
                                            onChange={(e) => setSettings({ ...settings, heatingSobaBonus: Number(e.target.value) })}
                                            className="text-center font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-[1fr,100px] items-center gap-4">
                                        <Label className="font-semibold text-sm">Kiracı Olma Ek Puanı</Label>
                                        <Input
                                            type="number"
                                            value={settings.rentTenantBonus}
                                            onChange={(e) => setSettings({ ...settings, rentTenantBonus: Number(e.target.value) })}
                                            className="text-center font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-[1fr,100px] items-center gap-4">
                                        <Label className="font-semibold text-sm">Maksimum Kira Yükü Puanı</Label>
                                        <Input
                                            type="number"
                                            value={settings.rentAmountBonusMax}
                                            onChange={(e) => setSettings({ ...settings, rentAmountBonusMax: Number(e.target.value) })}
                                            className="text-center font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-[1fr,100px] items-center gap-4">
                                        <Label className="font-semibold text-sm">Öğrenci Başına Verilen Puan</Label>
                                        <Input
                                            type="number"
                                            value={settings.studentBonusPerPerson}
                                            onChange={(e) => setSettings({ ...settings, studentBonusPerPerson: Number(e.target.value) })}
                                            className="text-center font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-[1fr,100px] items-center gap-4">
                                        <Label className="font-semibold text-sm text-red-600">Gelir Başına Kesinti (Her 1000₺'de)</Label>
                                        <Input
                                            type="number"
                                            value={settings.incomeDeductionPer1000}
                                            onChange={(e) => setSettings({ ...settings, incomeDeductionPer1000: Number(e.target.value) })}
                                            className="text-center font-bold border-red-200 text-red-700 bg-red-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 rounded-b-xl flex justify-end">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                size="lg"
                                className="h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                AYARLARI KAYDET
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="danger" className="animate-in-fade">
                    <Card className="border-red-500/20 bg-red-500/5 shadow-2xl overflow-hidden rounded-3xl h-full border-t-8 border-t-red-600">
                        <CardHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/30">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-red-600">FABRİKA AYARLARINA DÖN</CardTitle>
                                    <CardDescription className="text-red-900 font-bold opacity-70">Tüm veritabanı kayıtlarını kalıcı olarak siler!</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="bg-red-600/10 border border-red-600/20 p-6 rounded-2xl space-y-3">
                                <h4 className="flex items-center gap-2 font-black text-red-800 uppercase text-xs tracking-widest">
                                    <AlertTriangle className="w-4 h-4" /> DİKKAT: BU İŞLEM GERİ DÖNDÜRÜLEMEZ
                                </h4>
                                <ul className="text-sm font-bold text-red-900/60 list-disc list-inside space-y-1">
                                    <li>Tüm İhtiyaç Sahipleri ve Haneler silinecek.</li>
                                    <li>Tüm Dağıtım Listeleri ve Kampanyalar silinecek.</li>
                                    <li>Tüm Teslimat Kayıtları ve İmzalar silinecek.</li>
                                    <li>Tüm Stok ve Butik verileri temizlenecek.</li>
                                    <li className="text-red-800 underline uppercase decoration-wavy">Sadece Personel (Admin) hesapları korunacaktır.</li>
                                </ul>
                            </div>

                            <div className="flex justify-center pt-4 mb-4">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="lg" variant="destructive" className="h-16 px-12 rounded-2xl font-black text-lg tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 transition-transform">
                                            <RefreshCw className="mr-3 h-5 w-5" /> SİSTEMİ SIFIRLA
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-8">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-2xl font-black text-foreground">EMİN MİSİNİZ?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-base font-medium">
                                                Bu işlem sonucunda derneğin tüm operasyonel hafızası temizlenecek. Devam etmek istediğinizden emin misiniz?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="mt-8 flex gap-4">
                                            <AlertDialogCancel className="h-12 rounded-xl flex-1 font-bold border-zinc-200">VAZGEÇ</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleReset}
                                                disabled={isLoading}
                                                className="h-12 rounded-xl flex-[2] bg-red-600 hover:bg-red-700 font-black tracking-widest"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "EVET, HER ŞEYİ SİL"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
