export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
    Users, MapPin, Phone, TrendingUp, Calendar, Home, Wallet,
    CheckCircle2, XCircle, FileText, GraduationCap, Car, Flame,
    Receipt, UserPlus, Trash2, Settings, ArrowLeft, Download,
    AlertTriangle, Briefcase, HeartPulse, History, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { approveHouseholdAction, approveOnceHouseholdAction, rejectHouseholdAction, removePersonAction } from "@/app/actions/household";
import Link from "next/link";
import { DeliveryPDFButton } from "@/components/export/DeliveryPDFButton";
import { PersonAddModal } from "@/components/PersonAddModal";
import { PrintButton } from "@/components/PrintButton";

export default async function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const household: any = await (prisma.household as any).findUnique({
        where: { id },
        include: {
            persons: {
                orderBy: { isApplicant: "desc" } as any
            },
            deliveries: {
                include: {
                    distributionEvent: true
                },
                orderBy: { createdAt: "desc" } as any
            }
        }
    });

    if (!household) notFound();

    const applicant = household.persons.find((m: any) => m.isApplicant);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "APPROVED":
                return { label: "Sürekli Onaylı", color: "bg-emerald-500", icon: <ShieldCheck className="w-4 h-4" /> };
            case "APPROVED_ONCE":
                return { label: "Tek Seferlik Onay", color: "bg-blue-500", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "REJECTED":
                return { label: "Reddedildi", color: "bg-red-500", icon: <XCircle className="w-4 h-4" /> };
            default:
                return { label: "İnceleme Bekliyor", color: "bg-amber-500", icon: <Clock className="w-4 h-4" /> };
        }
    };

    const status = getStatusConfig(household.status);

    return (
        <div className="space-y-8 animate-in-fade">
            {/* Üst Header Alanı */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2">
                <div className="flex items-center gap-5">
                    <Link href="/haneler">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border bg-white/50 backdrop-blur-sm transition-all hover:scale-110">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight text-foreground premium-gradient-text">Hane Tahkikat Paneli</h1>
                            <Badge className={`${status.color} px-3 py-1 flex items-center gap-1.5 shadow-md border-0 animate-pulse-subtle`}>
                                {status.icon}
                                {status.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <span className="bg-secondary px-2 py-0.5 rounded text-xs border border-border">#{household.id.slice(0, 8).toUpperCase()}</span>
                            <span>•</span>
                            <Calendar className="w-3.5 h-3.5" /> Kayıt: {household.createdAt?.toLocaleDateString("tr-TR")}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <PrintButton />
                    <Link href={`/haneler/${household.id}/duzenle`}>
                        <Button variant="outline" className="glass-card shadow-sm border-zinc-200 hover:bg-zinc-50">
                            <Settings className="mr-2 h-4 w-4" /> Verileri Güncelle
                        </Button>
                    </Link>
                    {household.status === "PENDING" && (
                        <div className="flex gap-2">
                            <form action={async () => { "use server"; await approveOnceHouseholdAction(id); }}>
                                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Tek Seferlik Onayla
                                </Button>
                            </form>
                            <form action={async () => { "use server"; await approveHouseholdAction(id); }}>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 border-0">
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Sürekli Onayla
                                </Button>
                            </form>
                            <form action={async () => { "use server"; await rejectHouseholdAction(id); }}>
                                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                    <XCircle className="mr-2 h-4 w-4" /> Reddet
                                </Button>
                            </form>
                        </div>
                    )}
                    {household.status !== "PENDING" && (
                        <div className="flex gap-2">
                            <form action={async () => { "use server"; await (prisma.household as any).update({ where: { id }, data: { status: "PENDING" } }); }}>
                                <Button variant="ghost" className="text-muted-foreground text-xs">
                                    <AlertTriangle className="mr-1.5 h-3 w-3" /> Durumu Sıfırla
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Özet Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "İhtiyaç Skoru", value: household.score || 0, sub: "Hane Puanı (HP)", icon: <TrendingUp className="text-emerald-500" />, color: "bg-emerald-50" },
                    { label: "Hane Sakini", value: household.persons?.length || 0, sub: "Toplam Birey", icon: <Users className="text-blue-500" />, color: "bg-blue-50" },
                    { label: "Öğrenci / Dezavantaj", value: `${household.studentCount || 0} / ${household.disabledChildCount || 0}`, sub: "Özel Durumlar", icon: <GraduationCap className="text-indigo-500" />, color: "bg-indigo-50" },
                    { label: "Aylık Gelir", value: `${(household.monthlyIncome || 0).toLocaleString()} ₺`, sub: "Net Giriş", icon: <Wallet className="text-amber-500" />, color: "bg-amber-50" }
                ].map((item, i) => (
                    <Card key={i} className="glass-card hover-lift border-0 overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                                    <h3 className="text-3xl font-black text-foreground">{item.value}</h3>
                                    <p className="text-[10px] text-muted-foreground/70 font-medium">{item.sub}</p>
                                </div>
                                <div className={`p-3 rounded-2xl ${item.color} group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SOL: Ana Detaylar */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Adres ve Tahkikat Özet Box - Geri Getirilen Kısım */}
                    <Card className="glass-card border-0 shadow-lg overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-emerald-500" /> Tahkikat ve Adres Dosyası
                                </CardTitle>
                                <CardDescription>Saha ekipleri için doğrulanmış bilgiler</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Açık Adres</p>
                                        <p className="text-sm font-semibold flex items-start gap-2 text-foreground">
                                            {household.address}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Başvuru Sahibi İletişim</p>
                                        <p className="text-sm font-bold flex items-center gap-2 text-emerald-500">
                                            <Phone className="h-4 w-4" /> {household.contactNumber || "Girilmemiş"}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-foreground">Tahkikat Bulguları</h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: "Mülkiyet", val: household.rentStatus, icon: <Home className="w-3.5 h-3.5" /> },
                                            { label: "Kira Bedeli", val: `${household.rentAmount} ₺`, icon: <Receipt className="w-3.5 h-3.5" /> },
                                            { label: "Isınma", val: household.heatingType, icon: <Flame className="w-3.5 h-3.5" /> },
                                            { label: "Araç Durumu", val: household.carOwnership ? "VAR" : "YOK", icon: <Car className="w-3.5 h-3.5" /> },
                                        ].map((stat, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    {stat.icon} <span>{stat.label}</span>
                                                </div>
                                                <span className="font-bold text-foreground uppercase">{stat.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="members" className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <TabsList className="bg-transparent h-12 gap-2 p-0">
                                <TabsTrigger value="members" className="rounded-full px-6 data-[state=active]:bg-emerald-600 data-[state=active]:text-white shadow-sm border">Hane Sakinleri</TabsTrigger>
                                <TabsTrigger value="history" className="rounded-full px-6 data-[state=active]:bg-emerald-600 data-[state=active]:text-white shadow-sm border">Bağış & Dağıtım</TabsTrigger>
                            </TabsList>
                            <TabsContent value="members" className="m-0">
                                <PersonAddModal householdId={household.id} />
                            </TabsContent>
                        </div>

                        <TabsContent value="members" className="animate-in-fade">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {household.persons?.map((member: any) => (
                                    <Card key={member.id} className="glass-card hover-lift border-0 group relative overflow-hidden">
                                        {member.isApplicant && <div className="absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 bg-emerald-500 transform rotate-45 pointer-events-none opacity-10"></div>}
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-emerald-50/10 group-hover:text-emerald-500 transition-colors">
                                                        <Users className="h-6 w-6" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-foreground">{member.firstName} {member.lastName}</p>
                                                            {member.isApplicant && <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[9px] h-4">BAŞVURU SAHİBİ</Badge>}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground font-medium">TC: {member.identityNo} • {member.birthDate?.toLocaleDateString("tr-TR")}</p>
                                                    </div>
                                                </div>
                                                {!member.isApplicant && (
                                                    <form action={async () => { "use server"; await removePersonAction(id, member.id); }}>
                                                        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </form>
                                                )}
                                            </div>
                                            <div className="flex gap-2 mt-4 ml-16">
                                                {member.isStudent && <Badge className="bg-blue-50 text-blue-700 border-blue-100 shadow-none text-[10px]"><GraduationCap className="w-3 h-3 mr-1" /> Öğrenci</Badge>}
                                                {member.isDisabled && <Badge className="bg-red-50 text-red-700 border-red-100 shadow-none text-[10px]"><HeartPulse className="w-3 h-3 mr-1" /> Dezavantajlı</Badge>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="animate-in-fade">
                            <Card className="glass-card border-0">
                                <CardContent className="p-0">
                                    {household.deliveries?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-3">
                                            <History className="w-12 h-12" />
                                            <p className="font-bold">Henüz bir yardım teslimatı yapılmamış.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {household.deliveries?.map((delivery: any) => (
                                                <div key={delivery.id} className="p-5 flex items-center justify-between hover:bg-secondary transition-all border-b border-border last:border-0 even:bg-secondary/40">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-secondary rounded-2xl"><Receipt className="w-5 h-5 text-muted-foreground" /></div>
                                                        <div>
                                                            <p className="font-bold text-foreground">{delivery.distributionEvent?.name}</p>
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                {delivery.deliveredAt ? `TESLİM: ${delivery.deliveredAt.toLocaleString("tr-TR")}` : "BEKLEMEDE"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className={delivery.status === "DELIVERED" ? "bg-emerald-500 text-white" : "bg-amber-400 text-black"}>
                                                        {delivery.status === "DELIVERED" ? "Teslim Edildi" : "Sevkiyat Sürüyor"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* SAĞ: Özet Bilgiler */}
                <div className="space-y-8">
                    <Card className="glass-card border-0 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[80px]"></div>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-emerald-500" /> Tahkikat Özeti</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Mülkiyet Durumu</span>
                                    <span className="font-bold text-sm uppercase text-foreground">{household.rentStatus}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Aylık Gelir</span>
                                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">{(household.monthlyIncome || 0).toLocaleString()} ₺</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Gider & Borç</span>
                                    <span className="font-black text-sm text-red-600 dark:text-red-400">{(household.rentAmount + household.debtAmount || 0).toLocaleString()} ₺</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Çalışan Sayısı</span>
                                    <span className="font-bold text-sm text-foreground">{household.workerCount} Kişi</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {household.carOwnership && <Badge className="bg-secondary text-muted-foreground border-0 py-1.5"><Car className="w-3 h-3 mr-1.5" /> Araç Sahibi</Badge>}
                                {household.estateOwnership && <Badge className="bg-secondary text-muted-foreground border-0 py-1.5"><Home className="w-3 h-3 mr-1.5" /> Gayrimenkul</Badge>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-0 bg-red-500/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-500"><AlertTriangle className="w-4 h-4" /> Kritik Analiz</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-xs space-y-2 text-muted-foreground font-medium">
                                {household.monthlyIncome === 0 && <li className="flex items-center gap-2">• <span className="text-red-500 font-bold">DİKKAT:</span> Hanede beyan edilmiş gelir yok.</li>}
                                {household.debtAmount > 20000 && <li className="flex items-center gap-2">• Yüksek borç yükü (HP+15) tespit edildi.</li>}
                                {household.disabledChildCount > 0 && <li className="flex items-center gap-2">• Kronik/Engelli birey aciliyeti mevcut.</li>}
                                {household.rentStatus === "mulk-sahibi" && <li className="flex items-center gap-2">• Kişi mülk sahibi olarak kayıtlı (HP-30).</li>}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Clock(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
