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
    const [assignBoutique, setAssignBoutique] = useState(false);

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
                <DialogContent className="sm:max-w-3xl glass-card border-0 p-0 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col rounded-[2.5rem]">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white relative shrink-0">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/10 blur-3xl rounded-full -ml-16 -mb-16"></div>
                        <DialogHeader className="relative z-10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
                                    <PackagePlus className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black text-white tracking-tighter italic">DAĞITIM OPERASYONU</DialogTitle>
                                    <DialogDescription className="text-emerald-50/90 font-medium flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                                        <RefreshCw className="w-3 h-3 animate-spin-slow" /> Akıllı Otonom Listeleme Sistemi v2.0
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="overflow-y-auto px-10 py-8 custom-scrollbar space-y-10">
                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-sm font-bold border border-red-100 flex items-center gap-4 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-6 h-6 shrink-0" /> {errorMsg}
                            </div>
                        )}

                        <form id="distribution-form" onSubmit={handleSubmit} className="space-y-12">
                            {/* SECTION 1: TEMEL TANIMLAMALAR */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-1.5 bg-emerald-500 rounded-full"></div>
                                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                                        <Info className="w-5 h-5 text-emerald-600" /> 1. GENEL TANIMLAMALAR
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-secondary/10 p-8 rounded-[2rem] border border-border/40 transition-all hover:bg-secondary/20">
                                    <div className="space-y-3">
                                        <Label htmlFor="name" className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">KAMPANYA ADI</Label>
                                        <Input id="name" name="name" placeholder="Örn: 2026 Kış Yardımı" required className="h-12 bg-white/80 dark:bg-zinc-900/50 border-0 shadow-sm rounded-2xl focus-visible:ring-emerald-500/30 text-base font-medium px-5" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="itemId" className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">DAĞITILACAK ÜRÜN</Label>
                                        <Select name="itemId" required>
                                            <SelectTrigger className="h-12 bg-white/80 dark:bg-zinc-900/50 border-0 shadow-sm rounded-2xl focus:ring-emerald-500/30 text-base font-medium px-5">
                                                <SelectValue placeholder="Ürün Seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[1.5rem] border-white/20 shadow-2xl backdrop-blur-xl">
                                                {items.map((item) => (
                                                    <SelectItem key={item.id} value={item.id} className="rounded-xl py-3 font-medium transition-colors focus:bg-emerald-50">
                                                        {item.name} <span className="text-xs text-muted-foreground opacity-60 ml-1">({item.unit})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <Label htmlFor="description" className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">BİLGİLENDİRME NOTU</Label>
                                        <Textarea id="description" name="description" placeholder="Saha ekipleri için operasyonel talimatlar..." className="min-h-[100px] bg-white/80 dark:bg-zinc-900/50 border-0 shadow-sm rounded-2xl focus-visible:ring-emerald-500/30 text-base font-medium p-5 resize-none transition-all focus:min-h-[120px]" />
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2: AKILLI ALGORİTMA AYARLARI */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-1.5 bg-blue-500 rounded-full"></div>
                                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 text-blue-600" /> 2. AKILLI ALGORİTMA AYARLARI
                                    </h3>
                                </div>
                                <div className="bg-blue-50/20 dark:bg-blue-900/5 p-8 rounded-[2rem] border border-blue-100/30 space-y-8">
                                    <div className="space-y-3">
                                        <Label htmlFor="mahalle" className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1 uppercase">HEDEF LOKASYON / MAHALLE</Label>
                                        <Select name="mahalle" defaultValue="ALL">
                                            <SelectTrigger className="h-12 bg-white/90 dark:bg-zinc-900/80 border-0 shadow-sm rounded-2xl focus:ring-blue-500/30 text-base font-medium px-5">
                                                <SelectValue placeholder="Tüm Mahalleler" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[1.5rem] border-white/20 shadow-2xl backdrop-blur-xl">
                                                <SelectItem value="ALL" className="rounded-xl font-bold text-blue-600">Tüm Mahalleler</SelectItem>
                                                {neighborhoods.map((n) => (
                                                    <SelectItem key={n} value={n} className="rounded-xl">{n}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-3 p-4 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-white/50 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
                                            <Label htmlFor="totalTarget" className="text-[9px] font-black text-zinc-400 block tracking-widest leading-tight">HEDEF HANE</Label>
                                            <Input id="totalTarget" name="totalTarget" type="number" defaultValue="50" required className="h-10 bg-transparent border-0 border-b-2 border-zinc-100 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-blue-500 text-lg font-black p-0" />
                                        </div>
                                        <div className="space-y-3 p-4 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-white/50 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
                                            <Label htmlFor="perListCount" className="text-[9px] font-black text-zinc-400 block tracking-widest leading-tight">EKİP LİMİTİ</Label>
                                            <Input id="perListCount" name="perListCount" type="number" defaultValue="10" required className="h-10 bg-transparent border-0 border-b-2 border-zinc-100 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-blue-500 text-lg font-black p-0" />
                                        </div>
                                        <div className="space-y-3 p-4 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-white/50 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
                                            <Label htmlFor="minScore" className="text-[9px] font-black text-zinc-400 block tracking-widest leading-tight uppercase">Min. Skor (HP)</Label>
                                            <Input id="minScore" name="minScore" type="number" defaultValue="60" required className="h-10 bg-transparent border-0 border-b-2 border-zinc-100 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-blue-500 text-lg font-black p-0" />
                                        </div>
                                        <div className="space-y-3 p-4 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-white/50 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
                                            <Label htmlFor="cooldownDays" className="text-[9px] font-black text-zinc-400 block tracking-widest leading-tight">SOĞUMA (GÜN)</Label>
                                            <Input id="cooldownDays" name="cooldownDays" type="number" defaultValue="30" required className="h-10 bg-transparent border-0 border-b-2 border-zinc-100 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-blue-500 text-lg font-black p-0" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                        <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                                        <p className="text-[11px] font-bold text-blue-700/80 leading-snug tracking-tight">
                                            Algoritma, yukarıdaki kriterlere en uygun personelleri otomatik olarak eşleşmiş listeler halinde sunacaktır.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3: GELİŞMİŞ FİLTRELER & BUTİK */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-1.5 bg-amber-500 rounded-full"></div>
                                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-amber-600" /> 3. GELİŞMİŞ FİLTRELER & BUTİK
                                    </h3>
                                </div>
                                <div className="bg-amber-50/20 dark:bg-amber-900/5 p-8 rounded-[2rem] border border-amber-100/30 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center space-x-4 p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/50 border border-white shadow-sm group hover:border-emerald-300 transition-all cursor-pointer">
                                            <Checkbox id="onlyApproved" name="onlyApproved" defaultChecked className="w-6 h-6 rounded-lg border-zinc-200 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-0" />
                                            <div className="space-y-0.5 pointer-events-none">
                                                <label htmlFor="onlyApproved" className="text-sm font-black text-foreground">Sadece "Sürekli Onaylı"</label>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Tam Doğrulanmış Aileler</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/50 border border-white shadow-sm group hover:border-blue-300 transition-all cursor-pointer">
                                            <Checkbox id="includeOnce" name="includeOnce" className="w-6 h-6 rounded-lg border-zinc-200 data-[state=checked]:bg-blue-500 data-[state=checked]:border-0" />
                                            <div className="space-y-0.5 pointer-events-none">
                                                <label htmlFor="includeOnce" className="text-sm font-black text-foreground">"Tek Seferlik" Dahil</label>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Dönemsel Başvuru Sahipleri</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 p-6 rounded-[1.5rem] bg-secondary/20 border border-border/50">
                                        <div className="space-y-2">
                                            <Label htmlFor="childAgeMin" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">En Küçük Çocuk Yaş</Label>
                                            <Input id="childAgeMin" name="childAgeMin" type="number" placeholder="0" min="0" className="h-11 bg-white/50 dark:bg-zinc-900/30 border-0 rounded-xl px-4" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="childAgeMax" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">En Büyük Çocuk Yaş</Label>
                                            <Input id="childAgeMax" name="childAgeMax" type="number" placeholder="5" min="0" className="h-11 bg-white/50 dark:bg-zinc-900/30 border-0 rounded-xl px-4" />
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-[2rem] transition-all duration-500 ease-in-out border-2 ${assignBoutique ? 'bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-transparent border-dashed border-zinc-200 opacity-60'}`}>
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className={`p-3 rounded-2xl transition-colors ${assignBoutique ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                                                <PackagePlus className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <label htmlFor="assignBoutiquePoints" className="text-lg font-black text-foreground cursor-pointer tracking-tight">Butik Kredisi Tanımla</label>
                                                    <Checkbox
                                                        id="assignBoutiquePoints"
                                                        name="assignBoutiquePoints"
                                                        checked={assignBoutique}
                                                        onCheckedChange={(checked) => setAssignBoutique(checked === true)}
                                                        className="w-7 h-7 rounded-lg border-emerald-300 data-[state=checked]:bg-emerald-500"
                                                    />
                                                </div>
                                                <p className="text-[11px] text-muted-foreground font-bold tracking-tight">Kılık/kıyafet limiti eklensin mi?</p>
                                            </div>
                                        </div>

                                        {assignBoutique && (
                                            <div className="space-y-4 pt-4 border-t border-emerald-200/30 animate-in zoom-in-95 duration-300">
                                                <div className="flex items-end gap-6">
                                                    <div className="flex-1 space-y-2">
                                                        <Label htmlFor="boutiquePointsAmount" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Eklenecek Kredi (Parça)</Label>
                                                        <Input id="boutiquePointsAmount" name="boutiquePointsAmount" type="number" defaultValue="5" min="1" required={assignBoutique} className="h-12 bg-white/80 dark:bg-zinc-900/60 border-emerald-100 rounded-xl text-xl font-black px-5 text-emerald-700" />
                                                    </div>
                                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-400 font-black text-xs h-12 flex items-center px-6">
                                                        ADET / HAK
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2 text-[10px] font-bold text-emerald-600/70 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/10">
                                                    <Info className="w-4 h-4 shrink-0" />
                                                    Sisteme dahil olan her aileye, operasyon onaylandığında bu miktar kadar otomatik Butik bakiyesi tanımlanır.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </form>
                    </div>

                    <DialogFooter className="p-10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-t border-border/40 shrink-0 flex flex-row items-center justify-between gap-6 rounded-b-[2.5rem]">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="h-14 px-10 rounded-[1.25rem] font-black text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all uppercase tracking-widest text-xs">İptal Et</Button>
                        <Button
                            form="distribution-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 px-12 rounded-[1.25rem] shadow-2xl shadow-emerald-500/20 border-0 transition-all hover:scale-[1.03] active:scale-[0.97] group min-w-[280px]"
                        >
                            {isSubmitting ? (
                                <RefreshCw className="mr-3 h-6 w-6 animate-spin" />
                            ) : (
                                <PackagePlus className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                            )}
                            <span className="text-base tracking-tight uppercase">
                                {isSubmitting ? "ANALİZ EDİLİYOR..." : "OPERASYONU BAŞLAT"}
                            </span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
