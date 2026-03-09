export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
    Users, MapPin, Phone, TrendingUp, Calendar, Home, Wallet,
    CheckCircle2, XCircle, FileText, GraduationCap, Car, Flame,
    Receipt, UserPlus, Trash2, Settings, ArrowLeft, Download,
    AlertTriangle, Briefcase, HeartPulse, History, ShieldCheck,
    ShoppingCart, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { approveHouseholdAction, approveOnceHouseholdAction, rejectHouseholdAction, removePersonAction } from "@/app/actions/household";
import Link from "next/link";
import { DeliveryPDFButton } from "@/components/export/DeliveryPDFButton";
import { PersonAddModal } from "@/components/PersonAddModal";
import { PersonEditModal } from "@/components/PersonEditModal";
import { PrintButton } from "@/components/PrintButton";
import { SignatureModal } from "@/components/SignatureModal";
import { HouseholdReportPrint } from "@/components/HouseholdReportPrint";

export default async function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const household: any = await (prisma.household as any).findUnique({
        where: { id },
        include: {
            persons: true,
            deliveries: {
                include: { distributionEvent: true },
                orderBy: { createdAt: "desc" }
            },
            boutiqueTransactions: {
                include: { boutiqueItem: true },
                orderBy: { createdAt: "desc" }
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
        <>
            <HouseholdReportPrint household={household} />
            <div className="space-y-8 animate-in-fade print:hidden">
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
                            {household.tags && household.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 mb-1">
                                    {household.tags.map((tag: string, i: number) => (
                                        <Badge key={i} variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
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
                                                { label: "Çatı Durumu", val: household.roofCondition || "Bilinmiyor", icon: <Home className="w-3.5 h-3.5" /> },
                                                { label: "Eşya Durumu", val: household.furnitureCondition || "Bilinmiyor", icon: <Briefcase className="w-3.5 h-3.5" /> },
                                            ].map((stat, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        {stat.icon} <span>{stat.label}</span>
                                                    </div>
                                                    <span className="font-bold text-foreground uppercase">{stat.val}</span>
                                                </div>
                                            ))}

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {household.waterDamage && <Badge variant="destructive" className="text-[9px]"><AlertTriangle className="w-3 h-3 mr-1" /> RUTUBET / HASAR</Badge>}
                                                {household.hasInternet && <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-700">İnternet</Badge>}
                                                {household.hasWashingMachine && <Badge variant="secondary" className="text-[9px] bg-indigo-50 text-indigo-700">Çamaşır Mk.</Badge>}
                                                {household.hasRefrigerator && <Badge variant="secondary" className="text-[9px] bg-cyan-50 text-cyan-700">Buzdolabı</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="members" className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                                <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 h-auto p-1.5 flex flex-wrap sm:flex-nowrap rounded-2xl gap-1 overflow-visible border border-zinc-200/50 dark:border-zinc-800/50">
                                    <TabsTrigger value="members" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-emerald-600 data-[state=active]:shadow-lg shadow-black/5 text-xs sm:text-sm font-bold transition-all">Hane Sakinleri</TabsTrigger>
                                    <TabsTrigger value="history" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-emerald-600 data-[state=active]:shadow-lg shadow-black/5 text-xs sm:text-sm font-bold transition-all">Bağış & Dağıtım</TabsTrigger>
                                    <TabsTrigger value="boutique" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-950/30 data-[state=active]:text-orange-600 data-[state=active]:shadow-lg shadow-orange-500/10 text-xs sm:text-sm font-bold whitespace-nowrap transition-all"><ShoppingCart className="w-4 h-4 mr-2 inline" /> Butik İşlemleri</TabsTrigger>
                                </TabsList>
                                <TabsContent value="members" className="m-0 sm:ml-auto w-full sm:w-auto mt-0">
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
                                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                                TC: {member.identityNo} • {member.birthDate?.toLocaleDateString("tr-TR")} • {member.gender === 'KAD' ? 'Kadın' : member.gender === 'ERK' ? 'Erkek' : ''}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-medium">
                                                                {member.educationalLevel?.replace('_', ' ').toUpperCase()} • {member.employmentStatus?.replace('_', ' ').toUpperCase()} • {member.maritalStatus?.toUpperCase()} {member.monthlyIncome > 0 ? `• ${member.monthlyIncome}₺ Gelir` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <PersonEditModal householdId={id} person={member} />
                                                        {!member.isApplicant && (
                                                            <form action={async () => { "use server"; await removePersonAction(id, member.id); }}>
                                                                <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </form>
                                                        )}
                                                    </div>
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
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                        {delivery.deliveredAt ? `TESLİM: ${delivery.deliveredAt.toLocaleString("tr-TR")}` : "BEKLEMEDE"}
                                                                    </p>
                                                                    {delivery.deliveredBy && (
                                                                        <Badge variant="outline" className="text-[9px] h-4 border-zinc-200 text-zinc-500 font-medium">
                                                                            GÖREVLİ: {delivery.deliveredBy}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {delivery.signatureData && (
                                                                <SignatureModal
                                                                    imageUrl={delivery.signatureData}
                                                                    volunteerName={delivery.deliveredBy}
                                                                    date={delivery.deliveredAt?.toLocaleString("tr-TR")}
                                                                />
                                                            )}
                                                            <Badge className={delivery.status === "DELIVERED" ? "bg-emerald-500 text-white" : "bg-amber-400 text-black"}>
                                                                {delivery.status === "DELIVERED" ? "Teslim Edildi" : "Sevkiyat Sürüyor"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* BUTIK TAB */}
                            <TabsContent value="boutique" className="animate-in-fade space-y-6">

                                {/* Bakiye Yükleme Kartı */}
                                <Card className="glass-card border-0 shadow-lg border-orange-500/20 bg-orange-500/5">
                                    <CardHeader className="pb-3 border-b border-orange-500/10 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-600">
                                                <ShoppingCart className="w-4 h-4" /> Butik Alışveriş Limiti
                                            </CardTitle>
                                            <CardDescription className="text-xs">Bu ailenin mağazadan kaç parça/kredi ürün alabileceğini belirleyin.</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-orange-500/60 font-bold uppercase">Mevcut Bakiye</p>
                                            <p className="text-3xl font-black text-orange-500">{household.boutiqueBalance}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 flex items-center gap-3">
                                        <form action={async (formData: FormData) => {
                                            "use server";
                                            const { updateHouseholdBoutiqueBalanceAction } = await import("@/app/actions/boutique");
                                            const newBalance = parseInt(formData.get("balance") as string || "0");
                                            await updateHouseholdBoutiqueBalanceAction(household.id, newBalance);
                                        }} className="flex items-center gap-3 w-full">
                                            <div className="flex-1 max-w-sm">
                                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Yeni Bakiye Miktarını Girin</label>
                                                <Input name="balance" type="number" defaultValue={household.boutiqueBalance} className="bg-white/50 w-full font-bold text-lg text-orange-600 h-10 border-orange-200 focus-visible:ring-orange-500" />
                                            </div>
                                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 mt-5">Bakiyeyi Güncelle</Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Alışveriş Geçmişi */}
                                <Card className="glass-card border-0 shadow-sm">
                                    <CardHeader className="pb-3 border-b border-border/50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-400">
                                            <History className="w-4 h-4" /> Alışveriş Geçmişi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {household.boutiqueTransactions?.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                <ShoppingCart className="w-8 h-8 mb-2 text-zinc-400" />
                                                <p className="text-xs font-bold text-zinc-500">Hanenin henüz butik harcaması yok.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border/50">
                                                {household.boutiqueTransactions?.map((tx: any) => (
                                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/10 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                                                                <Package className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-foreground">{tx.boutiqueItem?.name}</p>
                                                                <div className="flex gap-2 text-[10px] text-muted-foreground font-medium mt-1">
                                                                    <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{tx.createdAt.toLocaleDateString("tr-TR")}</span>
                                                                    <span>Personel: {tx.createdBy || 'Sistem'}</span>
                                                                    <span className="font-mono">{tx.boutiqueItem?.barcode}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-zinc-500 font-bold mb-0.5">Miktar: {tx.quantity}x</p>
                                                            <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">
                                                                -{tx.pointsSpent} Kredi
                                                            </Badge>
                                                        </div>
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
                    <div className="space-y-6">
                        <Card className="glass-card border-0 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-3xl"></div>
                            <CardHeader className="pb-4 border-b border-border/50">
                                <CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-500" /> Mali Durum Özeti</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Gelir & Yardım</h4>
                                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                        <div className="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                                            <span className="text-emerald-700 text-xs font-bold">Aylık Net Gelir</span>
                                            <span className="font-black text-sm text-emerald-700">{(household.monthlyIncome || 0).toLocaleString()} ₺</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-emerald-700/80 text-xs font-bold">Sosyal Yardım</span>
                                            <span className="font-bold text-sm text-emerald-600">{(household.socialAidAmount || 0).toLocaleString()} ₺</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Giderler</h4>
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
                                        {[
                                            { label: "Kira", val: household.rentAmount || 0 },
                                            { label: "Faturalar", val: household.billExpense || 0 },
                                            { label: "Yakıt", val: household.heatingExpense || 0 },
                                            { label: "Mutfak", val: household.foodExpense || 0 },
                                            { label: "Eğitim", val: household.educationExpense || 0 },
                                            { label: "Sağlık", val: household.healthExpense || 0 },
                                            { label: "Giyim", val: household.clothingExpense || 0 },
                                            { label: "Ulaşım", val: household.transportationExpense || 0 },
                                            { label: "Bebek/Çocuk", val: household.babyExpense || 0 },
                                            { label: "Borç / Kredi", val: household.debtAmount || 0 },
                                        ].map((expense, i) => expense.val > 0 && (
                                            <div key={i} className="flex justify-between items-center border-b border-red-100/50 pb-2 last:border-0 last:pb-0">
                                                <span className="text-red-700/80 text-xs font-bold">{expense.label}</span>
                                                <span className="font-bold text-sm text-red-700">{(expense.val).toLocaleString()} ₺</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-red-200">
                                            <span className="text-red-800 text-xs font-black uppercase">Toplam Gider</span>
                                            <span className="font-black text-sm text-red-800">
                                                {((household.rentAmount || 0) + (household.billExpense || 0) + (household.heatingExpense || 0) + (household.foodExpense || 0) + (household.educationExpense || 0) + (household.healthExpense || 0) + (household.clothingExpense || 0) + (household.transportationExpense || 0) + (household.babyExpense || 0) + (household.debtAmount || 0)).toLocaleString()} ₺
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Diğer Bilgiler</h4>
                                    <div className="flex justify-between items-center px-4 py-3 bg-secondary/50 rounded-xl">
                                        <span className="text-muted-foreground text-xs font-bold">Mülkiyet</span>
                                        <span className="font-bold text-xs uppercase text-foreground">{household.rentStatus}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3 bg-secondary/50 rounded-xl">
                                        <span className="text-muted-foreground text-xs font-bold">Çalışan Sayısı</span>
                                        <span className="font-bold text-xs text-foreground">{household.workerCount} Kişi</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {household.carOwnership && <Badge className="bg-secondary text-muted-foreground border-0 py-1.5"><Car className="w-3 h-3 mr-1.5" /> Araç Sahibi</Badge>}
                                    {household.estateOwnership && <Badge className="bg-secondary text-muted-foreground border-0 py-1.5"><Home className="w-3 h-3 mr-1.5" /> Gayrimenkul</Badge>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* V6 Note Box */}
                        {(household.notes || household.diseaseDetails) && (
                            <Card className="glass-card border-0 bg-amber-50/50 border-amber-100">
                                <CardHeader className="pb-3 border-b border-amber-100/50">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600"><FileText className="w-4 h-4" /> Tahkikat Değerlendirmesi</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {household.diseaseDetails && (
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-700/60 uppercase mb-1">Hastalık / Engel Durumu</p>
                                            <p className="text-xs font-semibold text-amber-900">{household.diseaseDetails}</p>
                                        </div>
                                    )}
                                    {household.notes && (
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-700/60 uppercase mb-1">Görevli Notu</p>
                                            <p className="text-xs font-medium text-amber-900 italic">"{household.notes}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

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
        </>
    );
}

function Clock(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
