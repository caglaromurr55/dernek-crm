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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Edit, Camera, RefreshCw, HeartPulse, GraduationCap, Accessibility, Save } from "lucide-react";
import { updatePersonAction } from "@/app/actions/household";
import { ExternalMrzScanner } from "./ExternalMrzScanner";
import { toast } from "sonner";

interface PersonEditModalProps {
    householdId: string;
    person: any; // The existing person record
}

export function PersonEditModal({ householdId, person }: PersonEditModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Provide safe defaults for dates
    const formattedBirthDate = person.birthDate
        ? new Date(person.birthDate).toISOString().split('T')[0]
        : "";

    const [formData, setFormData] = useState({
        firstName: person.firstName || "",
        lastName: person.lastName || "",
        identityNo: person.identityNo || "",
        birthDate: formattedBirthDate,
        gender: person.gender || "ERK",
        educationalLevel: person.educationalLevel || "ilkokul",
        employmentStatus: person.employmentStatus || "issiz",
        maritalStatus: person.maritalStatus || "bekar",
        monthlyIncome: (person.monthlyIncome || 0).toString(),
        isStudent: !!person.isStudent,
        isDisabled: !!person.isDisabled,
        hasChronicIllness: !!person.hasChronicIllness
    });

    const handleScan = (dataArray: any[]) => {
        if (!Array.isArray(dataArray) || dataArray.length === 0) return;
        const data = dataArray[0];
        setFormData(prev => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            identityNo: data.identityNo || prev.identityNo,
            birthDate: data.birthDate || prev.birthDate
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await updatePersonAction(householdId, person.id, formData);
        setIsSubmitting(false);
        if (result.success) {
            setOpen(false);
            toast.success("Sakin güncellendi", {
                description: `${formData.firstName} ${formData.lastName} bilgileri kaydedildi.`
            });
        } else {
            toast.error("Hata oluştu", {
                description: result.error || "Sakin güncellenirken bir sorun yaşandı."
            });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors opacity-0 group-hover:opacity-100">
                        <Edit className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] glass-card border-border/10 p-0 overflow-hidden shadow-2xl z-50">
                    <div className="bg-emerald-600 p-6 text-white relative">
                        <DialogHeader className="relative z-10">
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit className="w-5 h-5" />
                                Hane Sakini Düzenle
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100 font-medium text-sm mt-1">
                                Bireyin bilgilerini güncelleyin veya eksik verileri tamamlayın.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-foreground">Kişisel Bilgiler</h3>
                            <div className="flex items-center gap-2">
                                <ExternalMrzScanner onScan={handleScan} />
                            </div>
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

                        <DialogFooter className="pt-4 gap-2 border-t border-border mt-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="rounded-md hover:bg-secondary w-full sm:w-auto">İptal</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-md shadow-md border-0 w-full sm:w-auto transition-all active:scale-95">
                                {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
