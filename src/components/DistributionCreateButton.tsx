"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus, RefreshCw, AlertCircle, TrendingUp, Calendar, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createDistributionEventAction } from "@/app/actions/distribution";
import { toast } from "sonner";

interface DistributionCreateButtonProps {
    items: { id: string; name: string; unit: string }[];
    neighborhoods: string[];
}

export function DistributionCreateButton({ items, neighborhoods }: DistributionCreateButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);

        createDistributionEventAction(formData)
            .then((res: any) => {
                if (!res.success) {
                    setErrorMsg(res.message || "Bilinmeyen bir hata oluştu.");
                    toast.error("Oluşturma hatası", {
                        description: res.message
                    });
                    setIsSubmitting(false);
                } else {
                    setOpen(false);
                    setIsSubmitting(false);
                    toast.success("Operasyon başlatıldı", {
                        description: "Akıllı dağıtım listesi başarıyla oluşturuldu."
                    });
                    if (res.eventId) {
                        router.push(`/dagitim/${res.eventId}`);
                    } else {
                        router.refresh();
                    }
                }
            })
            .catch(() => {
                setErrorMsg("Bilinmeyen bir hata oluştu.");
                toast.error("Sunucu hatası");
                setIsSubmitting(false);
            });
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-lg shadow-emerald-100 border-0 h-11">
                <PackagePlus className="mr-2 h-5 w-5" />
                Yeni Dağıtım Oluştur
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl glass-card border-0 p-0 overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
                    <div className="bg-emerald-600 p-8 text-white relative shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-white italic tracking-tighter">Akıllı Dağıtım Analizi</DialogTitle>
                            <DialogDescription className="text-emerald-50 font-medium">
                                İhtiyaç puanı ve mahalle bazlı otomatik hane listeleme sistemi.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="overflow-y-auto px-8 py-6 custom-scrollbar">
                        {errorMsg && (
                            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3 animate-in-fade">
                                <AlertCircle className="w-5 h-5" /> {errorMsg}
                            </div>
                        )}

                        <form id="distribution-form" onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">KAMPANYA ADI</Label>
                                        <Input id="name" name="name" placeholder="Örn: 2026 Kış Yardımı" required className="h-11 bg-secondary/50 border-none rounded-xl focus-visible:ring-emerald-500/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="itemId" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">DAĞITILACAK ÜRÜN</Label>
                                        <Select name="itemId" required>
                                            <SelectTrigger className="h-11 bg-secondary/50 border-none rounded-xl focus:ring-emerald-500/20">
                                                <SelectValue placeholder="Ürün Seçin" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                                {items.map((item) => (
                                                    <SelectItem key={item.id} value={item.id} className="rounded-lg">
                                                        {item.name} ({item.unit})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mahalle" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">HEDEF MAHALLE</Label>
                                    <Select name="mahalle" defaultValue="ALL">
                                        <SelectTrigger className="h-11 bg-secondary/50 border-none rounded-xl focus:ring-emerald-500/20">
                                            <SelectValue placeholder="Tüm Mahalleler" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                            <SelectItem value="ALL" className="rounded-lg">Tüm Mahalleler</SelectItem>
                                            {neighborhoods.map((n) => (
                                                <SelectItem key={n} value={n} className="rounded-lg">{n}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">BİLGİLENDİRME NOTU</Label>
                                    <Textarea id="description" name="description" placeholder="Saha görevlileri için talimatlar..." className="min-h-[80px] bg-secondary/50 border-none rounded-xl focus-visible:ring-emerald-500/20 resize-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/20 p-6 rounded-3xl border border-border/50">
                                <div className="space-y-2">
                                    <Label htmlFor="totalTarget" className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1.5">HEDEF HANE SAYISI</Label>
                                    <Input id="totalTarget" name="totalTarget" type="number" defaultValue="50" required className="h-10 bg-background border-border/50 rounded-xl" />
                                    <p className="text-[9px] text-muted-foreground font-bold italic tracking-tight">* Toplam kaç hane listelenecek?</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="perListCount" className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1.5">LİSTE BAŞI KİŞİ</Label>
                                    <Input id="perListCount" name="perListCount" type="number" defaultValue="10" required className="h-10 bg-background border-border/50 rounded-xl" />
                                    <p className="text-[9px] text-muted-foreground font-bold italic tracking-tight">* Her ekip için kaç hane olacak?</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minScore" className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> MİN. SKOR (HP)</Label>
                                    <Input id="minScore" name="minScore" type="number" defaultValue="60" required className="h-10 bg-background border-border/50 rounded-xl" />
                                    <p className="text-[9px] text-muted-foreground font-bold italic tracking-tight">* Bu puanın altındakiler otomatik elenir.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cooldownDays" className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> SOĞUMA (GÜN)</Label>
                                    <Input id="cooldownDays" name="cooldownDays" type="number" defaultValue="30" required className="h-10 bg-background border-border/50 rounded-xl" />
                                    <p className="text-[9px] text-muted-foreground font-bold italic tracking-tight">* Son dağıtımdan sonra geçmesi gereken gün.</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-dashed border-border">
                                <div className="flex items-center space-x-3 p-4 rounded-2xl bg-secondary/30 border border-emerald-100/50 group hover:bg-secondary/50 transition-colors">
                                    <Checkbox id="onlyApproved" name="onlyApproved" defaultChecked className="w-5 h-5 rounded-md border-emerald-300 data-[state=checked]:bg-emerald-500" />
                                    <div className="space-y-0.5">
                                        <label htmlFor="onlyApproved" className="text-sm font-bold text-foreground">Sadece "Sürekli Onaylı" Haneler</label>
                                        <p className="text-[10px] text-muted-foreground font-black flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Tam doğrulanmış aile önceliği.</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 p-4 rounded-2xl bg-secondary/30 border border-blue-100/50 group hover:bg-secondary/50 transition-colors">
                                    <Checkbox id="includeOnce" name="includeOnce" className="w-5 h-5 rounded-md border-blue-300 data-[state=checked]:bg-blue-500" />
                                    <div className="space-y-0.5">
                                        <label htmlFor="includeOnce" className="text-sm font-bold text-foreground">"Tek Seferlik" Haneleri Dahil Et</label>
                                        <p className="text-[10px] text-muted-foreground font-black flex items-center gap-1"><Info className="w-3 h-3 text-blue-500" /> Dönemsel muhtaçları listeye dahil eder.</p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <DialogFooter className="p-8 bg-secondary/10 border-t border-border shrink-0 flex flex-row justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="h-12 px-6 rounded-xl font-bold hover:bg-secondary/50">İptal</Button>
                        <Button form="distribution-form" type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-10 rounded-xl shadow-xl shadow-emerald-100 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            {isSubmitting ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <PackagePlus className="mr-2 h-5 w-5" />}
                            {isSubmitting ? "LİSTE HAZIRLANIYOR..." : "OPERASYONU BAŞLAT"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
