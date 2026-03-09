import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Home, Wallet, Info, FileText, CheckCircle2, Users, GraduationCap, HeartPulse } from "lucide-react";
import Link from "next/link";
import { updateHouseholdAction, removePersonAction } from "@/app/actions/household";
import { EditHouseholdSidebar } from "@/components/EditHouseholdSidebar";
import { PersonEditModal } from "@/components/PersonEditModal";
import { PersonAddModal } from "@/components/PersonAddModal";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function HaneDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [householdData, neighborhoods] = await Promise.all([
        prisma.household.findUnique({ where: { id }, include: { persons: true } }),
        (prisma as any).neighborhood.findMany({ orderBy: { name: "asc" } })
    ]);
    const household: any = householdData;

    if (!household) notFound();

    const addressParts = (household.address || "").split(" - ");
    const mahalle = addressParts.length > 1 ? addressParts[0] : "";
    const clarifyAddress = addressParts.length > 1 ? addressParts.slice(1).join(" - ") : household.address;

    const navItems = [
        { id: "sakinler", label: "Hane Sakinleri", icon: <Users className="w-4 h-4" /> },
        { id: "iletisim", label: "İletişim & Konum", icon: <Home className="w-4 h-4" /> },
        { id: "mali", label: "Mali Durum", icon: <Wallet className="w-4 h-4" /> },
        { id: "yasam_sartlari", label: "Ev & Yaşam Şartları", icon: <Home className="w-4 h-4" /> },
        { id: "degerlendirme", label: "Değerlendirme", icon: <FileText className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-7xl mx-auto pb-24 animate-in-fade space-y-8">
            <div className="flex items-center gap-6">
                <Link href={`/haneler/${id}`}>
                    <Button variant="ghost" size="icon" className="rounded-full shadow-sm border border-border bg-secondary/50 backdrop-blur-sm transition-transform hover:scale-110">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text">Verileri Güncelle</h1>
                    <p className="text-muted-foreground font-medium mt-1">Hane tahkikat verilerini revize edin. Değişiklikler panoda anında güncellenir.</p>
                </div>
            </div>

            <form action={async (formData: FormData) => { "use server"; await updateHouseholdAction(id, formData); }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">

                <EditHouseholdSidebar navItems={navItems} />

                {/* FORM CONTENT */}
                <div className="lg:col-span-9 space-y-12">

                    {/* HANE SAKİNLERİ */}
                    <div id="sakinler" className="scroll-mt-24">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">1</div>
                                <h2 className="text-2xl font-black tracking-tight text-foreground">Hane Sakinleri</h2>
                            </div>
                            <PersonAddModal householdId={household.id} />
                        </div>
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
                                                        {member.isApplicant && <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] h-4">BAŞVURU SAHİBİ</Badge>}
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
                    </div>

                    {/* İLETİŞİM & ADRES */}
                    <div id="iletisim" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">2</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">İletişim & Konum</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl bg-card overflow-hidden">
                            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                                <div className="p-6 md:p-8 space-y-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4"><Home className="w-5 h-5" /></div>
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">MAHALLE</Label>
                                    <Select name="mahalle" defaultValue={mahalle || "Merkez Mahallesi"}>
                                        <SelectTrigger className="bg-secondary/20 h-12 text-sm border-border"><SelectValue placeholder="Seçim yapınız" /></SelectTrigger>
                                        <SelectContent>
                                            {neighborhoods.length === 0 ? (
                                                <SelectItem value="none" disabled>Mahalle bulunamadı.</SelectItem>
                                            ) : (
                                                neighborhoods.map((n: any) => (
                                                    <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-6 md:p-8 space-y-3 md:col-span-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-10 md:mt-0 block">DETAYLI AÇIK ADRES</Label>
                                    <Input name="adres" defaultValue={clarifyAddress || ""} placeholder="Örn: Bahar Sokak, Gül Apt, No: 12, Daire: 4" required className="bg-secondary/20 h-12 text-sm border-border w-full" />
                                    <div className="pt-4">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-3">İLETİŞİM TELEFONU</Label>
                                        <Input name="telefon" defaultValue={household.contactNumber || ""} placeholder="05XX XXX XX XX" className="bg-secondary/20 h-12 text-sm border-border md:w-1/2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MALİ DURUM & GİDERLER */}
                    <div id="mali" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">3</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Mali Durum & Gider Analizi</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl overflow-hidden">

                            {/* GELIR ROW */}
                            <CardContent className="p-0 border-b border-border bg-emerald-50/30">
                                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4" /> AYLIK NET GELİR</Label>
                                        <div className="relative">
                                            <Input name="gelir" type="number" defaultValue={(household.monthlyIncome || 0).toString()} className="h-14 text-lg font-bold pl-12 bg-white border-emerald-200" />
                                            <span className="absolute left-4 top-4 text-emerald-700 font-bold">₺</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4" /> DÜZENLİ SOSYAL YARDIM</Label>
                                        <div className="relative">
                                            <Input name="socialAidAmount" type="number" defaultValue={(household.socialAidAmount || 0).toString()} className="h-14 text-lg font-bold pl-12 bg-white border-emerald-200 text-emerald-700" />
                                            <span className="absolute left-4 top-4 text-emerald-700 font-bold">₺</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            {/* GIDERLER GRID */}
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground mb-4">Gider Kırılımları (Aylık Tahmini)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                        {[
                                            { name: "kira-miktari", label: "Kira", val: household.rentAmount },
                                            { name: "billExpense", label: "Fatura (Elk/Su/Gaz)", val: household.billExpense },
                                            { name: "foodExpense", label: "Mutfak / Erzak", val: household.foodExpense },
                                            { name: "heatingExpense", label: "Aylık Yakıt/Isınma", val: household.heatingExpense },
                                            { name: "educationExpense", label: "Eğitim & Okul", val: household.educationExpense },
                                            { name: "healthExpense", label: "Sağlık & İlaç", val: household.healthExpense },
                                            { name: "clothingExpense", label: "Giyim Masrafı", val: household.clothingExpense },
                                            { name: "transportationExpense", label: "Ulaşım Gideri", val: household.transportationExpense },
                                            { name: "babyExpense", label: "Bebek Masrafı (Bez/Mama)", val: household.babyExpense },
                                            { name: "debtAmount", label: "Borç & Kredi Ödemesi", val: household.debtAmount },
                                        ].map((gider, i) => (
                                            <div key={i} className="space-y-2">
                                                <Label className="text-[11px] font-bold text-muted-foreground uppercase">{gider.label}</Label>
                                                <div className="relative">
                                                    <Input name={gider.name} type="number" defaultValue={(gider.val || 0).toString()} className="h-10 pl-8 bg-secondary/30 text-sm border-border" />
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
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">4</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Ev & Yaşam Şartları</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl bg-card overflow-hidden">
                            <CardContent className="p-6 md:p-8 space-y-8">

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">Mülkiyet Durumu</Label>
                                        <Select name="kira" defaultValue={household.rentStatus || "kiraci"}>
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
                                        <Select name="heatingType" defaultValue={household.heatingType || "dogalgaz"}>
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
                                        <Select name="roofCondition" defaultValue={household.roofCondition || "saglam"}>
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
                                        <Select name="furnitureCondition" defaultValue={household.furnitureCondition || "yeterli"}>
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
                                        <Checkbox id="c-rutubet" name="waterDamage" value="true" defaultChecked={!!household.waterDamage} className="w-5 h-5 border-red-500 data-[state=checked]:bg-red-500" />
                                        <Label htmlFor="c-rutubet" className="text-sm font-bold cursor-pointer text-red-900">Evde Rutubet Var</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-secondary/40 p-4 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                        <Checkbox id="c-int" name="hasInternet" value="true" defaultChecked={!!household.hasInternet} className="w-5 h-5" />
                                        <Label htmlFor="c-int" className="text-sm font-bold cursor-pointer">İnternet Var</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-secondary/40 p-4 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                        <Checkbox id="c-wash" name="hasWashingMachine" value="true" defaultChecked={!!household.hasWashingMachine} className="w-5 h-5" />
                                        <Label htmlFor="c-wash" className="text-sm font-bold cursor-pointer">Çamaşır Makinesi Var</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-secondary/40 p-4 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                        <Checkbox id="c-ref" name="hasRefrigerator" value="true" defaultChecked={!!household.hasRefrigerator} className="w-5 h-5" />
                                        <Label htmlFor="c-ref" className="text-sm font-bold cursor-pointer">Buzdolabı Var</Label>
                                    </div>
                                </div>
                                <hr className="border-border/60" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 flex flex-col justify-end pb-2">
                                        <div className="flex items-center space-x-3 bg-secondary/40 p-3 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                            <Checkbox id="c-car" name="carOwnership" value="true" defaultChecked={!!household.carOwnership} className="w-5 h-5" />
                                            <Label htmlFor="c-car" className="text-sm font-bold cursor-pointer">Ticari/Şahsi Araç Var</Label>
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex flex-col justify-end pb-2">
                                        <div className="flex items-center space-x-3 bg-secondary/40 p-3 rounded-xl border border-border cursor-pointer hover:bg-emerald-50 transition-colors">
                                            <Checkbox id="c-est" name="estateOwnership" value="true" defaultChecked={!!household.estateOwnership} className="w-5 h-5" />
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
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs ring-4 ring-emerald-50">5</div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Saha Tahkikat Değerlendirmesi</h2>
                        </div>
                        <Card className="glass-card border-0 shadow-xl overflow-hidden bg-card">
                            <div className="h-2 bg-amber-400"></div>
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-amber-900 uppercase flex items-center gap-2"><FileText className="w-4 h-4" /> Hastalık / Engel / Sağlık Detayları</Label>
                                    <Input name="diseaseDetails" defaultValue={household.diseaseDetails || ""} placeholder="Ailenin içerisinde kronik hasta, özel ilgi gerektiren durum veya raporlu/engelli birey varsa buraya detaylıca yazınız." className="h-12 bg-amber-50/50 border-amber-200 focus-visible:ring-amber-500 placeholder:text-amber-800/40 text-amber-950" />
                                </div>
                                <div className="space-y-3 mt-4">
                                    <Label className="text-sm font-bold text-amber-900 uppercase flex items-center gap-2"><FileText className="w-4 h-4" /> Tahkikat Yapan Görevlinin Görüşü</Label>
                                    <textarea name="notes" rows={5} defaultValue={household.notes || ""} placeholder="Gidilen evdeki genel sosyal yapı, tespit edilen spesifik mağduriyetler, gözlemlenen ekstra veriler..." className="w-full rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 placeholder:text-amber-800/40 text-amber-950 leading-relaxed resize-none" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MOBIL SUBMIT BUTTON */}
                    <div className="lg:hidden mt-8 flex flex-col gap-3">
                        <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold h-14 text-lg shadow-xl shadow-emerald-600/20">
                            <Save className="mr-2 h-5 w-5" /> Güncellemeleri Kaydet
                        </Button>
                        <Link href={`/haneler/${id}`}>
                            <Button type="button" variant="outline" className="w-full h-12">İptal, Geri Dön</Button>
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
