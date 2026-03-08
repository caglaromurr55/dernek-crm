"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { UserPlus, Camera, RefreshCw, HeartPulse, GraduationCap, X, Accessibility } from "lucide-react";
import { addPersonAction } from "@/app/actions/household";
import { MrzScanner } from "./MrzScanner";
import { toast } from "sonner";

interface PersonAddModalProps {
    householdId: string;
}

export function PersonAddModal({ householdId }: PersonAddModalProps) {
    const [open, setOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        identityNo: "",
        birthDate: "",
        gender: "ERK",
        educationalLevel: "ilkokul",
        employmentStatus: "issiz",
        maritalStatus: "bekar",
        monthlyIncome: "0",
        isStudent: false,
        isDisabled: false,
        hasChronicIllness: false
    });

    const handleScan = (data: any) => {
        setFormData(prev => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            identityNo: data.identityNo || prev.identityNo,
            birthDate: data.birthDate || prev.birthDate
        }));
        setTimeout(() => setScannerOpen(false), 1500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await addPersonAction(householdId, formData);
        setIsSubmitting(false);
        if (result.success) {
            setOpen(false);
            toast.success("Sakin eklendi", {
                description: `${formData.firstName} ${formData.lastName} başarıyla haneye kaydedildi.`
            });
            setFormData({
                firstName: "",
                lastName: "",
                identityNo: "",
                birthDate: "",
                gender: "ERK",
                educationalLevel: "ilkokul",
                employmentStatus: "issiz",
                maritalStatus: "bekar",
                monthlyIncome: "0",
                isStudent: false,
                isDisabled: false,
                hasChronicIllness: false
            });
        } else {
            toast.error("Hata oluştu", {
                description: result.error || "Sakin eklenirken bir sorun yaşandı."
            });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 rounded-full shadow-sm hover-lift font-bold px-5">
                        <UserPlus className="mr-2 h-4 w-4" /> Yeni Sakin Ekle
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md glass-card border-border/10 p-0 overflow-hidden shadow-2xl">
                    <div className="bg-emerald-600 p-6 text-white relative">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-white">Hane Sakini Ekle</DialogTitle>
                            <DialogDescription className="text-emerald-100 font-medium">
                                Yeni bireyin bilgilerini girin veya kimlik taratın.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={() => setScannerOpen(true)}
                                variant="outline"
                                size="sm"
                                className="text-xs bg-secondary border-muted-foreground/10 text-emerald-500 hover:bg-secondary/80 rounded-xl"
                            >
                                <Camera className="mr-2 h-3.5 w-3.5" /> Kimlik Kartı Tara (MRZ)
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">AD</Label>
                                <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required className="h-10 border-border bg-secondary/30 focus:border-emerald-500/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">SOYAD</Label>
                                <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required className="h-10 border-border bg-secondary/30 focus:border-emerald-500/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">TC KİMLİK</Label>
                                <Input value={formData.identityNo} onChange={e => setFormData({ ...formData, identityNo: e.target.value })} maxLength={11} required className="h-10 border-border bg-secondary/30 focus:border-emerald-500/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">DOĞUM TARİHİ</Label>
                                <Input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="h-10 border-border bg-secondary/30 focus:border-emerald-500/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">CİNSİYET</Label>
                                <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                                    <SelectTrigger className="h-10 bg-secondary/30 border-border/50 focus:ring-emerald-500/20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="KAD">Kadın</SelectItem>
                                        <SelectItem value="ERK">Erkek</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">EĞİTİM</Label>
                                <Select value={formData.educationalLevel} onValueChange={(val) => setFormData({ ...formData, educationalLevel: val })}>
                                    <SelectTrigger className="h-10 bg-secondary/30 border-border/50 focus:ring-emerald-500/20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="okuryazar_degil">Okuryazar Değil</SelectItem>
                                        <SelectItem value="ilkokul">İlkokul</SelectItem>
                                        <SelectItem value="ortaokul">Ortaokul</SelectItem>
                                        <SelectItem value="lise">Lise</SelectItem>
                                        <SelectItem value="universite">Üniversite</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">MEDENİ DURUM</Label>
                                <Select value={formData.maritalStatus} onValueChange={(val) => setFormData({ ...formData, maritalStatus: val })}>
                                    <SelectTrigger className="h-10 bg-secondary/30 border-border/50 focus:ring-emerald-500/20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bekar">Bekar</SelectItem>
                                        <SelectItem value="evli">Evli</SelectItem>
                                        <SelectItem value="bosanmis">Boşanmış</SelectItem>
                                        <SelectItem value="dul">Dul</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">AYLIK GELİR (₺)</Label>
                                <Input type="number" value={formData.monthlyIncome} onChange={e => setFormData({ ...formData, monthlyIncome: e.target.value })} className="h-10 border-border bg-secondary/30 focus:border-emerald-500/50" />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase">ÇALIŞMA DURUMU</Label>
                                <Select value={formData.employmentStatus} onValueChange={(val) => setFormData({ ...formData, employmentStatus: val })}>
                                    <SelectTrigger className="h-10 bg-secondary/30 border-border/50 focus:ring-emerald-500/20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="calisiyor">Çalışıyor</SelectItem>
                                        <SelectItem value="issiz">İşsiz</SelectItem>
                                        <SelectItem value="emekli">Emekli</SelectItem>
                                        <SelectItem value="ev_hanimi">Ev Hanımı</SelectItem>
                                        <SelectItem value="ogrenci">Öğrenci</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div
                                onClick={() => setFormData({ ...formData, isStudent: !formData.isStudent })}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${formData.isStudent ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-100/50' : 'bg-secondary/20 border-border/30 text-muted-foreground'}`}
                            >
                                <GraduationCap className={`w-5 h-5 mb-1.5 transition-colors ${formData.isStudent ? 'text-blue-600' : 'group-hover:text-blue-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Öğrenci</span>
                            </div>

                            <div
                                onClick={() => setFormData({ ...formData, isDisabled: !formData.isDisabled })}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${formData.isDisabled ? 'bg-red-50 border-red-200 text-red-700 shadow-sm shadow-red-100/50' : 'bg-secondary/20 border-border/30 text-muted-foreground'}`}
                            >
                                <Accessibility className={`w-5 h-5 mb-1.5 transition-colors ${formData.isDisabled ? 'text-red-600' : 'group-hover:text-red-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Engelli</span>
                            </div>

                            <div
                                onClick={() => setFormData({ ...formData, hasChronicIllness: !formData.hasChronicIllness })}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${formData.hasChronicIllness ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/50' : 'bg-secondary/20 border-border/30 text-muted-foreground'}`}
                            >
                                <HeartPulse className={`w-5 h-5 mb-1.5 transition-colors ${formData.hasChronicIllness ? 'text-amber-600' : 'group-hover:text-amber-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Kronik</span>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="rounded-xl hover:bg-secondary">İptal</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-emerald-500/10 border-0">
                                {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isSubmitting ? "Ekleniyor..." : "Haneye Sakin Ekle"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-950 text-white border-zinc-800 p-0 overflow-hidden shadow-2xl">
                    <DialogTitle className="sr-only">Kimlik Tarayıcı Kamera İzleme</DialogTitle>
                    <DialogDescription className="sr-only">Lütfen kimliğinizin MRZ alanını kameraya okutun.</DialogDescription>
                    <MrzScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
