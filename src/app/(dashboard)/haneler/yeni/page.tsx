"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Camera, Users, Trash2, UserPlus, Home, Wallet, Info } from "lucide-react";
import Link from "next/link";
import { createHouseholdAction } from "@/app/actions/household";
import { MrzScanner } from "@/components/MrzScanner";

interface PersonFormData {
    id: string;
    firstName: string;
    lastName: string;
    identityNo: string;
    birthDate: string;
    isStudent: boolean;
    isDisabled: boolean;
    hasChronicIllness: boolean;
}

export default function YeniHaneEklePage() {
    const [scannerOpen, setScannerOpen] = useState<{ open: boolean; targetId: string | "applicant" }>({
        open: false,
        targetId: "applicant"
    });

    const [applicantData, setApplicantData] = useState({
        firstName: "",
        lastName: "",
        identityNo: "",
        birthDate: ""
    });

    const [otherMembers, setOtherMembers] = useState<PersonFormData[]>([]);

    const handleScan = (data: any) => {
        if (scannerOpen.targetId === "applicant") {
            setApplicantData(prev => ({
                ...prev,
                firstName: data.firstName || prev.firstName,
                lastName: data.lastName || prev.lastName,
                identityNo: data.identityNo || prev.identityNo,
                birthDate: data.birthDate || prev.birthDate
            }));
        } else {
            setOtherMembers(prev => prev.map(m =>
                m.id === scannerOpen.targetId
                    ? { ...m, firstName: data.firstName || m.firstName, lastName: data.lastName || m.lastName, identityNo: data.identityNo || m.identityNo, birthDate: data.birthDate || m.birthDate }
                    : m
            ));
        }
        setTimeout(() => setScannerOpen({ open: false, targetId: "applicant" }), 1500);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in-fade">
            <div className="flex items-center gap-6">
                <Link href="/haneler">
                    <Button variant="ghost" size="icon" className="rounded-full shadow-sm border border-border bg-secondary/50 backdrop-blur-sm transition-transform hover:scale-110">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text">Yeni Hane Kaydı</h1>
                    <p className="text-muted-foreground font-medium mt-1">Saha tahkikat verilerini ve hane sakinlerini sisteme işleyin.</p>
                </div>
            </div>

            <form action={createHouseholdAction} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <input type="hidden" name="persons_json" value={JSON.stringify(otherMembers)} />

                <div className="lg:col-span-8 space-y-8">
                    {/* BAŞVURU SAHİBİ */}
                    <Card className="glass-card border-0 shadow-lg overflow-hidden border-l-4 border-l-emerald-500 bg-card">
                        <CardHeader className="p-4 sm:p-6 pb-4 flex flex-row items-center justify-between space-y-0">
                            <div className="flex-1 mr-2">
                                <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Başvuru Sahibi (Hane Reisi)</CardTitle>
                                <CardDescription className="text-[10px] sm:text-xs text-muted-foreground mt-1">Sistem otomatik skorlayacaktır.</CardDescription>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setScannerOpen({ open: true, targetId: "applicant" })}
                                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 h-9 px-3 text-xs"
                                variant="outline"
                                size="sm"
                            >
                                <Camera className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Kimlik Tara</span><span className="sm:hidden">Tara</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">AD</Label>
                                    <Input name="firstName" value={applicantData.firstName} onChange={e => setApplicantData({ ...applicantData, firstName: e.target.value })} required className="bg-secondary/50 border-border h-10 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">SOYAD</Label>
                                    <Input name="lastName" value={applicantData.lastName} onChange={e => setApplicantData({ ...applicantData, lastName: e.target.value })} required className="bg-secondary/50 border-border h-10 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">TC KİMLİK</Label>
                                    <Input name="identityNo" maxLength={11} value={applicantData.identityNo} onChange={e => setApplicantData({ ...applicantData, identityNo: e.target.value })} required className="bg-secondary/50 border-border h-10 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">DOĞUM TARİHİ</Label>
                                    <Input name="birthDate" type="date" value={applicantData.birthDate} onChange={e => setApplicantData({ ...applicantData, birthDate: e.target.value })} className="bg-secondary/50 border-border h-10 text-sm" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DİĞER SAKİNLER */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-md sm:text-lg font-bold flex items-center gap-2 text-foreground"><Users className="w-5 h-5 text-emerald-500" /> Aile Bireyleri</h3>
                            <Button type="button" onClick={() => setOtherMembers([...otherMembers, { id: crypto.randomUUID(), firstName: "", lastName: "", identityNo: "", birthDate: "", isStudent: false, isDisabled: false, hasChronicIllness: false }])} variant="outline" size="sm" className="glass-card border-dashed border-border bg-secondary/50 hover:bg-secondary h-9 text-xs">
                                <UserPlus className="mr-2 h-4 w-4" /> Sakin Ekle
                            </Button>
                        </div>

                        {otherMembers.length === 0 ? (
                            <div className="py-10 bg-secondary/30 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground/60">
                                <Users className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-[11px] font-medium italic">Diğer hane sakinlerini buraya ekleyin.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {otherMembers.map((member, idx) => (
                                    <Card key={member.id} className="glass-card border border-border/50 shadow-md group animate-in-fade bg-card overflow-hidden">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col space-y-4">
                                                <div className="flex justify-between items-center bg-secondary/30 -m-4 mb-2 px-4 py-2 border-b border-border/50">
                                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-tighter">Birey #0{idx + 1}</span>
                                                    <div className="flex gap-1">
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" onClick={() => setScannerOpen({ open: true, targetId: member.id })}><Camera className="h-3.5 w-3.5" /></Button>
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => setOtherMembers(otherMembers.filter(m => m.id !== member.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">AD</Label>
                                                        <Input value={member.firstName} onChange={e => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, firstName: e.target.value } : m))} className="bg-secondary/50 border-border h-8 text-xs" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">SOYAD</Label>
                                                        <Input value={member.lastName} onChange={e => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, lastName: e.target.value } : m))} className="bg-secondary/50 border-border h-8 text-xs" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">TC KİMLİK</Label>
                                                        <Input value={member.identityNo} maxLength={11} onChange={e => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, identityNo: e.target.value } : m))} className="bg-secondary/50 border-border h-8 text-xs" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 pt-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id={`st-${member.id}`} checked={member.isStudent} onCheckedChange={(v) => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, isStudent: !!v } : m))} className="h-3.5 w-3.5 border-border" />
                                                        <Label htmlFor={`st-${member.id}`} className="text-[10px] font-bold text-muted-foreground cursor-pointer">Öğrenci</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id={`di-${member.id}`} checked={member.isDisabled} onCheckedChange={(v) => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, isDisabled: !!v } : m))} className="h-3.5 w-3.5 border-border" />
                                                        <Label htmlFor={`di-${member.id}`} className="text-[10px] font-bold text-muted-foreground cursor-pointer">Engelli</Label>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* ADRES VE EKONOMİK */}
                    <Card className="glass-card border-0 shadow-lg border-t-4 border-t-emerald-500 bg-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground"><Home className="w-5 h-5 text-muted-foreground" /> Tahkikat Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">MAHALLE</Label>
                                    <Select name="mahalle" required>
                                        <SelectTrigger className="bg-secondary/50 border-border h-11 text-foreground"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Merkez Mahallesi">Merkez Mahallesi</SelectItem>
                                            <SelectItem value="Fatih Mahallesi">Fatih Mahallesi</SelectItem>
                                            <SelectItem value="Atatürk Mahallesi">Atatürk Mahallesi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">İLETİŞİM TELEFONU</Label>
                                    <Input name="telefon" placeholder="05XX XXX XX XX" required className="bg-secondary/50 border-border h-11 text-foreground focus:bg-background transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">AÇIK ADRES</Label>
                                    <Input name="adres" placeholder="Sokak, Bina, Daire" required className="bg-secondary/50 border-border h-11 text-foreground focus:bg-background transition-colors" />
                                </div>
                            </div>

                            <hr className="border-border/50" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">GELİR (TL)</Label>
                                    <Input name="gelir" type="number" defaultValue="0" className="bg-secondary/50 border-border" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">KİRA/BORÇ (TL)</Label>
                                    <Input name="debtAmount" type="number" defaultValue="0" className="bg-secondary/50 border-border" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">MÜLKİYET</Label>
                                    <Select name="kira" defaultValue="kiraci">
                                        <SelectTrigger className="bg-secondary/50 border-border h-10 text-foreground text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kiraci">Kiracı</SelectItem>
                                            <SelectItem value="mulk-sahibi">Mülk Sahibi</SelectItem>
                                            <SelectItem value="akraba-yani">Akraba Yanı</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">ISINMA</Label>
                                    <Select name="heatingType" defaultValue="dogalgaz">
                                        <SelectTrigger className="bg-secondary/50 border-border h-10 text-foreground text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dogalgaz">Doğalgaz</SelectItem>
                                            <SelectItem value="soba">Soba</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <div className="flex items-center space-x-2 bg-secondary/50 p-2.5 rounded-xl border border-border flex-1 justify-center transition-colors hover:bg-emerald-500/10 group cursor-pointer">
                                    <Checkbox id="c-car" name="carOwnership" value="true" className="border-border" />
                                    <Label htmlFor="c-car" className="text-xs font-bold text-foreground/80 cursor-pointer group-hover:text-emerald-500">Araç Var</Label>
                                </div>
                                <div className="flex items-center space-x-2 bg-secondary/50 p-2.5 rounded-xl border border-border flex-1 justify-center transition-colors hover:bg-emerald-500/10 group cursor-pointer">
                                    <Checkbox id="c-est" name="estateOwnership" value="true" className="border-border" />
                                    <Label htmlFor="c-est" className="text-xs font-bold text-foreground/80 cursor-pointer group-hover:text-emerald-500">Ek Mülk</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 border-0 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/20 rounded-lg"><Info className="w-5 h-5" /></div>
                                <p className="text-xs font-medium leading-relaxed">
                                    Girdiğiniz veriler V3 skorlama algoritması ile anında işlenerek hane durumunu (Onay/Red) belirleyecektir.
                                </p>
                            </div>
                            <Button type="submit" className="w-full bg-white text-emerald-700 hover:bg-zinc-100 font-bold h-12 text-lg shadow-xl shadow-emerald-900/10">
                                <Save className="mr-2 h-5 w-5" /> Kaydı Tamamla
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>

            <Dialog open={scannerOpen.open} onOpenChange={(v) => setScannerOpen({ ...scannerOpen, open: v })}>
                <DialogContent className="sm:max-w-md bg-zinc-950 text-white border-zinc-800 p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Kimlik Tarayıcı Kamera İzleme</DialogTitle>
                    <DialogDescription className="sr-only">Lütfen kimliğinizin MRZ alanını kameraya okutun.</DialogDescription>
                    <MrzScanner onScan={handleScan} onClose={() => setScannerOpen({ open: false, targetId: "applicant" })} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
