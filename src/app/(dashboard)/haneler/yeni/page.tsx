"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Save, Camera, Users, Trash2, UserPlus, Home, Wallet, Info, FileText, CheckCircle2, GraduationCap, Accessibility, HeartPulse } from "lucide-react";
import Link from "next/link";
import { createHouseholdAction } from "@/app/actions/household";
import { getNeighborhoodsAction } from "@/app/actions/neighborhood";
import { MrzScanner } from "@/components/MrzScanner";

interface PersonFormData {
    id: string;
    firstName: string;
    lastName: string;
    identityNo: string;
    birthDate: string;
    gender: string;
    educationalLevel: string;
    maritalStatus: string;
    employmentStatus: string;
    monthlyIncome: string;
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
        birthDate: "",
        gender: "ERK"
    });

    const [activeSection, setActiveSection] = useState("kisisel");
    const [otherMembers, setOtherMembers] = useState<PersonFormData[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchNeighborhoods = async () => {
            const res = await getNeighborhoodsAction();
            if (res.success && res.data) {
                setNeighborhoods(res.data);
            }
        };
        fetchNeighborhoods();
    }, []);

    useEffect(() => {
        const scrollContainer = document.getElementById("main-scroll-container");
        if (!scrollContainer) return;

        const handleScroll = () => {
            const sections = navItems.map(item => item.id);
            let current = "";
            for (const section of sections) {
                const el = document.getElementById(section);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    // 300px'e kadar girince aktif say
                    if (rect.top <= 300) {
                        current = section;
                    }
                }
            }
            if (current && current !== activeSection) {
                setActiveSection(current);
            }
        };

        handleScroll();
        scrollContainer.addEventListener("scroll", handleScroll);
        return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, [activeSection]);

    // ... (handleScan unchanged)
    const handleScan = (data: any) => {
        if (scannerOpen.targetId === "applicant") {
            setApplicantData(prev => ({
                ...prev,
                firstName: data.firstName || prev.firstName,
                lastName: data.lastName || prev.lastName,
                identityNo: data.identityNo || prev.identityNo,
                birthDate: data.birthDate || prev.birthDate,
                gender: data.gender || prev.gender || ""
            }));
        } else {
            setOtherMembers(prev => prev.map(m =>
                m.id === scannerOpen.targetId
                    ? {
                        ...m,
                        firstName: data.firstName || m.firstName,
                        lastName: data.lastName || m.lastName,
                        identityNo: data.identityNo || m.identityNo,
                        birthDate: data.birthDate || m.birthDate,
                        gender: data.gender || m.gender
                    }
                    : m
            ));
        }
        setTimeout(() => setScannerOpen({ open: false, targetId: "applicant" }), 1500);
    };

    const navItems = [
        { id: "kisisel", label: "Başvuru Sahibi", icon: Users },
        { id: "bireyler", label: "Aile Bireyleri", icon: UserPlus },
        { id: "iletisim", label: "İletişim & Konum", icon: Home },
        { id: "mali", label: "Mali Durum", icon: Wallet },
        { id: "yasam_sartlari", label: "Ev & Yaşam Şartları", icon: Home },
        { id: "degerlendirme", label: "Değerlendirme", icon: FileText },
    ];

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        const scrollContainer = document.getElementById("main-scroll-container");
        if (el && scrollContainer) {
            const offset = 80;
            const y = scrollContainer.scrollTop + el.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top - offset;
            scrollContainer.scrollTo({ top: y, behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-24 animate-in-fade space-y-8">
            <div className="flex items-center gap-6">
                <Link href="/haneler">
                    <Button variant="ghost" size="icon" className="rounded-full shadow-sm border border-border bg-secondary/50 backdrop-blur-sm transition-transform hover:scale-110">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text">Yeni Hane Kaydı</h1>
                    <p className="text-muted-foreground font-medium mt-1">Saha tahkikat verilerini ve puanlama sistemini doldurun.</p>
                </div>
            </div>

            <form action={createHouseholdAction} className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
                <input type="hidden" name="persons_json" value={JSON.stringify(otherMembers)} />

                {/* STICKY SIDEBAR NAVIGATION */}
                <div className="hidden lg:block lg:col-span-3 sticky top-24">
                    <Card className="glass-card border-0 shadow-lg bg-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kayıt Adımları</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 p-3 pt-0">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => scrollToSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold border-l-4 ${activeSection === item.id
                                        ? "bg-emerald-50 text-emerald-700 border-l-emerald-500 shadow-sm"
                                        : "bg-transparent text-muted-foreground border-l-transparent hover:bg-secondary/50 hover:text-foreground"}`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 border-0 overflow-hidden relative mt-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                        <CardContent className="p-6 space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/20 rounded-xl"><Info className="w-5 h-5" /></div>
                                <p className="text-xs font-medium leading-relaxed">
                                    Girdiğiniz veriler <strong>V6 Puanlama Algoritması</strong> ile işlenecek, yoksulluk skoru otomatik hesaplanacaktır.
                                </p>
                            </div>
                            <Button type="submit" className="w-full bg-white text-emerald-700 hover:bg-zinc-100 font-extrabold h-12 text-sm shadow-xl shadow-emerald-900/10 transition-transform active:scale-95">
                                <Save className="mr-2 h-4 w-4" /> Tüm Kaydı Tamamla
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* FORM CONTENT */}
                <div className="lg:col-span-9 space-y-12">

                    {/* BAŞVURU SAHİBİ */}
                    <div id="kisisel" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">1</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Başvuru Sahibi (Hane Reisi)</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl overflow-hidden bg-card">
                            <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-border/40 pb-5">
                                <CardDescription className="text-sm">Vatandaşın T.C. Kimlik numarasını ve temel bilgilerini eksiksiz girin.</CardDescription>
                                <Button
                                    type="button"
                                    onClick={() => setScannerOpen({ open: true, targetId: "applicant" })}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 h-10 px-4 transition-transform active:scale-95"
                                >
                                    <Camera className="mr-2 h-4 w-4" /> Kimlik Tara
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AD</Label>
                                        <Input name="firstName" value={applicantData.firstName} onChange={e => setApplicantData({ ...applicantData, firstName: e.target.value })} required className="bg-secondary/30 h-10 text-sm" placeholder="Örn: Ahmet" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SOYAD</Label>
                                        <Input name="lastName" value={applicantData.lastName} onChange={e => setApplicantData({ ...applicantData, lastName: e.target.value })} required className="bg-secondary/30 h-10 text-sm" placeholder="Örn: Yılmaz" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">TC KİMLİK</Label>
                                        <Input name="identityNo" maxLength={11} value={applicantData.identityNo} onChange={e => setApplicantData({ ...applicantData, identityNo: e.target.value })} required className="bg-secondary/30 h-10 text-sm" placeholder="11 Haneli" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">DOĞUM TARİHİ</Label>
                                        <Input name="birthDate" type="date" value={applicantData.birthDate} onChange={e => setApplicantData({ ...applicantData, birthDate: e.target.value })} className="bg-secondary/30 h-10 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cinsiyet</Label>
                                        <Select name="gender" defaultValue="ERK">
                                            <SelectTrigger className="bg-secondary/30 h-10 text-sm"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="KAD">Kadın</SelectItem>
                                                <SelectItem value="ERK">Erkek</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Eğitim Durumu</Label>
                                        <Select name="educationalLevel" defaultValue="ilkokul">
                                            <SelectTrigger className="bg-secondary/30 h-10 text-sm"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="okuryazar_degil">Okuryazar Değil</SelectItem>
                                                <SelectItem value="ilkokul">İlkokul</SelectItem>
                                                <SelectItem value="ortaokul">Ortaokul</SelectItem>
                                                <SelectItem value="lise">Lise</SelectItem>
                                                <SelectItem value="universite">Üniversite</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Çalışma Durumu</Label>
                                        <Select name="employmentStatus" defaultValue="issiz">
                                            <SelectTrigger className="bg-secondary/30 h-10 text-sm"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="calisiyor">Çalışıyor</SelectItem>
                                                <SelectItem value="issiz">İşsiz</SelectItem>
                                                <SelectItem value="emekli">Emekli</SelectItem>
                                                <SelectItem value="ev_hanimi">Ev Hanımı</SelectItem>
                                                <SelectItem value="ogrenci">Öğrenci</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Medeni Durum</Label>
                                        <Select name="maritalStatus" defaultValue="evli">
                                            <SelectTrigger className="bg-secondary/30 h-10 text-sm"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bekar">Bekar</SelectItem>
                                                <SelectItem value="evli">Evli</SelectItem>
                                                <SelectItem value="bosanmis">Boşanmış</SelectItem>
                                                <SelectItem value="dul">Dul</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* DİĞER SAKİNLER */}
                    <div id="bireyler" className="scroll-mt-24">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">2</div>
                                <h2 className="text-2xl font-black tracking-tight text-foreground">Diğer Aile Bireyleri</h2>
                            </div>
                            <Button type="button" onClick={() => setOtherMembers([...otherMembers, { id: crypto.randomUUID(), firstName: "", lastName: "", identityNo: "", birthDate: "", gender: "ERK", educationalLevel: "ilkokul", maritalStatus: "bekar", employmentStatus: "ogrenci", monthlyIncome: "0", isStudent: false, isDisabled: false, hasChronicIllness: false }])} variant="outline" className="glass-card shadow-sm bg-background border-border hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
                                <UserPlus className="mr-2 h-4 w-4" /> Birey Ekle
                            </Button>
                        </div>

                        {otherMembers.length === 0 ? (
                            <Card className="border-2 border-dashed border-border/60 bg-transparent flex flex-col items-center justify-center py-16 text-muted-foreground/60 shadow-none">
                                <div className="w-16 h-16 bg-secondary/80 rounded-full flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 opacity-50" />
                                </div>
                                <h3 className="text-lg font-bold text-muted-foreground">Hanede Başka Kimse Yok mu?</h3>
                                <p className="text-sm font-medium italic mb-6">Eğer kayıt edilen ailede başka kişiler yaşıyorsa sağ üstten ekleyebilirsiniz.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {otherMembers.map((member, idx) => (
                                    <Card key={member.id} className="glass-card border border-border/50 shadow-md group animate-in-fade bg-card overflow-hidden hover:border-emerald-200 transition-colors">
                                        <CardHeader className="bg-secondary/30 pb-4 pt-4 px-5 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase">#{idx + 1}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 border-emerald-200 bg-white shadow-sm" onClick={() => setScannerOpen({ open: true, targetId: member.id })}><Camera className="h-4 w-4" /></Button>
                                                <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100 border-red-200 bg-white shadow-sm" onClick={() => setOtherMembers(otherMembers.filter(m => m.id !== member.id))}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-5">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AD</Label>
                                                    <Input value={member.firstName} onChange={e => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, firstName: e.target.value } : m))} className="bg-background h-8 text-xs" placeholder="Örn: Ayşe" />
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SOYAD</Label>
                                                    <Input value={member.lastName} onChange={e => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, lastName: e.target.value } : m))} className="bg-background h-8 text-xs" placeholder="Örn: Yılmaz" />
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TC KİMLİK</Label>
                                                    <Input value={member.identityNo} maxLength={11} onChange={e => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, identityNo: e.target.value } : m))} className="bg-background h-8 text-xs" />
                                                </div>
                                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">CİNSİYET</Label>
                                                    <Select value={member.gender} onValueChange={(val) => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, gender: val } : m))}>
                                                        <SelectTrigger className="bg-background h-8 text-xs border-border/50"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="KAD">Kadın</SelectItem>
                                                            <SelectItem value="ERK">Erkek</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">DOĞUM TARİHİ</Label>
                                                    <Input type="date" value={member.birthDate} onChange={e => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, birthDate: e.target.value } : m))} className="bg-background h-8 text-xs border-border/50" />
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">EĞİTİM</Label>
                                                    <Select value={member.educationalLevel} onValueChange={(val) => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, educationalLevel: val } : m))}>
                                                        <SelectTrigger className="bg-background h-8 text-xs"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="okuryazar_degil">Okuryazar Değil</SelectItem>
                                                            <SelectItem value="ilkokul">İlkokul</SelectItem>
                                                            <SelectItem value="ortaokul">Ortaokul</SelectItem>
                                                            <SelectItem value="lise">Lise</SelectItem>
                                                            <SelectItem value="universite">Üniversite</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ÇALIŞMA DURUMU</Label>
                                                    <Select value={member.employmentStatus} onValueChange={(val) => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, employmentStatus: val } : m))}>
                                                        <SelectTrigger className="bg-background h-8 text-xs"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
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

                                            <div className="grid grid-cols-3 gap-3 pt-2">
                                                <div
                                                    onClick={() => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, isStudent: !m.isStudent } : m))}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${member.isStudent ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-100/50' : 'bg-secondary/20 border-border/30 text-muted-foreground'}`}
                                                >
                                                    <GraduationCap className={`w-5 h-5 mb-1.5 transition-colors ${member.isStudent ? 'text-blue-600' : 'group-hover:text-blue-400'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">Öğrenci</span>
                                                </div>

                                                <div
                                                    onClick={() => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, isDisabled: !m.isDisabled } : m))}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${member.isDisabled ? 'bg-red-50 border-red-200 text-red-700 shadow-sm shadow-red-100/50' : 'bg-secondary/20 border-border/30 text-muted-foreground'}`}
                                                >
                                                    <Accessibility className={`w-5 h-5 mb-1.5 transition-colors ${member.isDisabled ? 'text-red-600' : 'group-hover:text-red-400'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">Engelli</span>
                                                </div>

                                                <div
                                                    onClick={() => setOtherMembers(prev => prev.map(m => m.id === member.id ? { ...m, hasChronicIllness: !m.hasChronicIllness } : m))}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${member.hasChronicIllness ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/50' : 'bg-secondary/20 border-border/30 text-muted-foreground'}`}
                                                >
                                                    <HeartPulse className={`w-5 h-5 mb-1.5 transition-colors ${member.hasChronicIllness ? 'text-amber-600' : 'group-hover:text-amber-400'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">Kronik</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* İLETİŞİM & ADRES */}
                    <div id="iletisim" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">3</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">İletişim & Konum</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl bg-card overflow-hidden">
                            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                                <div className="p-6 md:p-8 space-y-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4"><Home className="w-5 h-5" /></div>
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">MAHALLE</Label>
                                    <Select name="mahalle" required>
                                        <SelectTrigger className="bg-secondary/20 h-12 text-sm border-border"><SelectValue placeholder="Seçim yapınız" /></SelectTrigger>
                                        <SelectContent>
                                            {neighborhoods.length === 0 ? (
                                                <SelectItem value="none" disabled>Mahalle yükleniyor...</SelectItem>
                                            ) : (
                                                neighborhoods.map((n) => (
                                                    <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-6 md:p-8 space-y-3 md:col-span-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-10 md:mt-0 block">DETAYLI AÇIK ADRES</Label>
                                    <Input name="adres" placeholder="Örn: Bahar Sokak, Gül Apt, No: 12, Daire: 4" required className="bg-secondary/20 h-12 text-sm border-border w-full" />
                                    <div className="pt-4">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-3">İLETİŞİM TELEFONU</Label>
                                        <Input name="telefon" placeholder="05XX XXX XX XX" required className="bg-secondary/20 h-12 text-sm border-border md:w-1/2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MALİ DURUM & GİDERLER */}
                    <div id="mali" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">4</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Mali Durum & Gider Analizi</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl overflow-hidden">

                            {/* GELIR ROW */}
                            <CardContent className="p-0 border-b border-border bg-emerald-50/30">
                                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4" /> AYLIK NET GELİR</Label>
                                        <div className="relative">
                                            <Input name="gelir" type="number" defaultValue="0" className="h-14 text-lg font-bold pl-12 bg-white border-emerald-200" />
                                            <span className="absolute left-4 top-4 text-emerald-700 font-bold">₺</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Haneye giren toplam nakit giriş (Maaş, yevmiye vb.)</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-emerald-800 uppercase tracking-widest">DÜZENLİ SOSYAL YARDIM</Label>
                                        <div className="relative">
                                            <Input name="socialAidAmount" type="number" defaultValue="0" className="h-14 text-lg font-bold pl-12 bg-white border-emerald-200 text-emerald-700" />
                                            <span className="absolute left-4 top-4 text-emerald-700 font-bold">₺</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Devlet, Valilik veya başka kurumlardan alınan maaş/yardım.</p>
                                    </div>
                                </div>
                            </CardContent>

                            {/* GIDERLER GRID */}
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground mb-4">Gider Kırılımları (Aylık Tahmini)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                        {[
                                            { name: "kira-miktari", label: "Kira", placeholder: "0" },
                                            { name: "billExpense", label: "Fatura (Elk/Su/Gaz)", placeholder: "0" },
                                            { name: "foodExpense", label: "Mutfak / Erzak", placeholder: "0" },
                                            { name: "heatingExpense", label: "Aylık Yakıt/Isınma", placeholder: "0" },
                                            { name: "educationExpense", label: "Eğitim & Okul", placeholder: "0" },
                                            { name: "healthExpense", label: "Sağlık & İlaç", placeholder: "0" },
                                            { name: "clothingExpense", label: "Giyim Masrafı", placeholder: "0" },
                                            { name: "transportationExpense", label: "Ulaşım Gideri", placeholder: "0" },
                                            { name: "babyExpense", label: "Bebek Masrafı (Bez/Mama)", placeholder: "0" },
                                            { name: "debtAmount", label: "Borç & Kredi Ödemesi", placeholder: "0" },
                                        ].map((gider, i) => (
                                            <div key={i} className="space-y-2">
                                                <Label className="text-[11px] font-bold text-muted-foreground uppercase">{gider.label}</Label>
                                                <div className="relative">
                                                    <Input name={gider.name} type="number" defaultValue="0" className="h-10 pl-8 bg-secondary/30 text-sm border-border" />
                                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-xs font-bold">₺</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* EV & YAŞAM ŞARTLARI */}
                    <div id="yasam_sartlari" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">5</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Ev & Yaşam Şartları</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl overflow-hidden bg-card">
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">Mülkiyet Durumu</Label>
                                        <Select name="kira" defaultValue="kiraci">
                                            <SelectTrigger className="h-11 text-sm bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kiraci">Kiracı</SelectItem>
                                                <SelectItem value="mulk-sahibi">Mülk Sahibi</SelectItem>
                                                <SelectItem value="akraba-yani">Akraba Yanı</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">Isınma Sistemi</Label>
                                        <Select name="heatingType" defaultValue="dogalgaz">
                                            <SelectTrigger className="h-11 text-sm bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dogalgaz">Doğalgaz (Kombi)</SelectItem>
                                                <SelectItem value="soba">Kömür Sobası</SelectItem>
                                                <SelectItem value="elektrik">Elektrikli Isıtıcı</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">Çatı / Yapı Durumu</Label>
                                        <Select name="roofCondition" defaultValue="saglam">
                                            <SelectTrigger className="h-11 text-sm bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="saglam">Sağlam</SelectItem>
                                                <SelectItem value="eski">Eski / Bakımsız</SelectItem>
                                                <SelectItem value="akitiyor">Hasarlı / Akıtıyor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">Ev İçi Eşya Durumu</Label>
                                        <Select name="furnitureCondition" defaultValue="yeterli">
                                            <SelectTrigger className="h-11 text-sm bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yeterli">Yeterli / İyi</SelectItem>
                                                <SelectItem value="eski">Eski / Karışık</SelectItem>
                                                <SelectItem value="yetersiz">Çok Yetersiz / Hasarlı</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Label className="text-sm font-bold text-foreground">Fiziksel / Olanak Tespiti</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="flex items-center space-x-3 bg-secondary/40 p-4 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                        <Checkbox id="c-rutubet" name="waterDamage" value="true" className="w-5 h-5 border-red-500 data-[state=checked]:bg-red-500" />
                                        <Label htmlFor="c-rutubet" className="text-sm font-bold cursor-pointer text-red-900">Evde Rutubet Var</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-secondary/40 p-4 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                        <Checkbox id="c-int" name="hasInternet" value="true" className="w-5 h-5" />
                                        <Label htmlFor="c-int" className="text-sm font-bold cursor-pointer">İnternet Var</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-secondary/40 p-4 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                        <Checkbox id="c-wash" name="hasWashingMachine" value="true" className="w-5 h-5" />
                                        <Label htmlFor="c-wash" className="text-sm font-bold cursor-pointer">Çamaşır Makinesi Var</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-secondary/40 p-4 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                        <Checkbox id="c-ref" name="hasRefrigerator" value="true" className="w-5 h-5" />
                                        <Label htmlFor="c-ref" className="text-sm font-bold cursor-pointer">Buzdolabı Var</Label>
                                    </div>
                                </div>
                                <hr className="border-border/60" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 flex flex-col justify-end pb-2">
                                        <div className="flex items-center space-x-3 bg-secondary/40 p-3 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                            <Checkbox id="c-car" name="carOwnership" value="true" className="w-5 h-5" />
                                            <Label htmlFor="c-car" className="text-sm font-bold cursor-pointer">Ticari/Şahsi Araç Var</Label>
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex flex-col justify-end pb-2">
                                        <div className="flex items-center space-x-3 bg-secondary/40 p-3 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                            <Checkbox id="c-est" name="estateOwnership" value="true" className="w-5 h-5" />
                                            <Label htmlFor="c-est" className="text-sm font-bold cursor-pointer">Kirada Ek Mülk Var</Label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* DEĞERLENDİRME & NOTLAR */}
                    <div id="degerlendirme" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">6</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Saha Tahkikat Değerlendirmesi</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl overflow-hidden bg-card">
                            <div className="h-2 bg-amber-400"></div>
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-amber-900 uppercase flex items-center gap-2"><FileText className="w-4 h-4" /> Hastalık / Engel / Sağlık Detayları</Label>
                                    <Input name="diseaseDetails" placeholder="Ailenin içerisinde kronik hasta, özel ilgi gerektiren durum veya raporlu/engelli birey varsa buraya detaylıca yazınız. Örn: 1.çocuk Astım, yatalak babaanne vb." className="h-12 bg-amber-50/50 border-amber-200 focus-visible:ring-amber-500 placeholder:text-amber-800/40 text-amber-950" />
                                </div>
                                <div className="space-y-3 mt-4">
                                    <Label className="text-sm font-bold text-amber-900 uppercase flex items-center gap-2"><FileText className="w-4 h-4" /> Tahkikat Yapan Görevlinin Görüşü</Label>
                                    <textarea name="notes" rows={5} placeholder="Gidilen evdeki genel sosyal yapı, tespit edilen spesifik mağduriyetler, komşulardan alınan veya gözlemlenen ekstra veriler (Örn: Evin çatısı akıyor, yakacak yardımı elzem vb.)." className="w-full rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 placeholder:text-amber-800/40 text-amber-950 leading-relaxed resize-none" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MOBIL SUBMIT BUTTON */}
                    <div className="lg:hidden mt-8">
                        <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold h-14 text-lg shadow-xl shadow-emerald-600/20">
                            <Save className="mr-2 h-5 w-5" /> Kaydı Tamamla
                        </Button>
                    </div>
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
