"use client";

import { useState } from "react";
import { factoryResetAction } from "@/app/actions/system";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, RefreshCw, ShieldAlert, Loader2 } from "lucide-react";
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

export default function SystemPage() {
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in-fade py-12">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center justify-center gap-3">
                    <ShieldAlert className="w-10 h-10 text-red-600" />
                    Sistem Yönetimi
                </h1>
                <p className="text-muted-foreground font-medium italic">Kritik yönetim ve sıfırlama araçları.</p>
            </div>

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

                    <div className="flex justify-center pt-4">
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

            <div className="p-8 bg-zinc-900 rounded-3xl text-zinc-400 border border-zinc-800 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-500">
                        <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-100 italic">Puanlama Sistemi Güncellendi</h4>
                        <p className="text-xs leading-relaxed max-w-lg mt-1 font-medium">
                            Sıfırlama işleminden sonra yeni eklenen haneler için bekleme süresi puanı (+1/gün) sadece <b>Sürekli Onaylı (APPROVED)</b> olduklarında aktifleşecektir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
