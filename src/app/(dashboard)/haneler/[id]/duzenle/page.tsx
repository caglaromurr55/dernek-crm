export const dynamic = "force-dynamic";
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
import { ArrowLeft, Save, Home, Wallet, Info, Receipt, Flame, Car } from "lucide-react";
import Link from "next/link";
import { updateHouseholdAction } from "@/app/actions/household";

export default async function HaneDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const household: any = await prisma.household.findUnique({
        where: { id }
    });

    if (!household) notFound();

    const addressParts = (household.address || "").split(" - ");
    const mahalle = addressParts.length > 1 ? addressParts[0] : "";
    const clarifyAddress = addressParts.length > 1 ? addressParts.slice(1).join(" - ") : household.address;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in-fade">
            <div className="flex items-center gap-6">
                <Link href={`/haneler/${id}`}>
                    <Button variant="ghost" size="icon" className="rounded-full shadow-sm border bg-white/50 backdrop-blur-sm transition-transform hover:scale-110">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text">Verileri Güncelle</h1>
                    <p className="text-zinc-500 font-medium mt-1">Hane tahkikat verilerini revize edin. Değişiklikler skoru anında etkiler.</p>
                </div>
            </div>

            <form action={async (formData: FormData) => { "use server"; await updateHouseholdAction(id, formData); }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <Card className="glass-card border-0 shadow-xl overflow-hidden mb-8">
                        <div className="h-2 bg-emerald-500"></div>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-2"><Home className="w-5 h-5 text-emerald-500" /> Adres ve İletişim</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500">MAHALLE</Label>
                                    <Select name="mahalle" defaultValue={mahalle || "Merkez Mahallesi"}>
                                        <SelectTrigger className="bg-zinc-50 h-11 border-zinc-100"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Merkez Mahallesi">Merkez Mahallesi</SelectItem>
                                            <SelectItem value="Fatih Mahallesi">Fatih Mahallesi</SelectItem>
                                            <SelectItem value="Atatürk Mahallesi">Atatürk Mahallesi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500">İLETİŞİM TELEFONU</Label>
                                    <Input name="telefon" defaultValue={household.contactNumber || ""} className="bg-zinc-50 h-11 border-zinc-100" />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500">AÇIK ADRES</Label>
                                    <Input name="adres" defaultValue={clarifyAddress || ""} className="bg-zinc-50 h-11 border-zinc-100" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-0 shadow-xl overflow-hidden">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-xl font-bold flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-500" /> Sosyo-Ekonomik Durum</CardTitle>
                            <CardDescription>Gelir ve gider kalemlerini buradan yönetin.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-zinc-400" /> AYLIK GELİR (TL)</Label>
                                    <Input name="gelir" type="number" defaultValue={(household.monthlyIncome || 0).toString()} className="h-11 font-bold text-lg text-emerald-600" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-zinc-400" /> KİRA/BORÇ (TL)</Label>
                                    <Input name="debtAmount" type="number" defaultValue={(household.debtAmount || 0).toString()} className="h-11 font-bold text-lg text-red-600" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-zinc-400" /> MÜLKİYET</Label>
                                    <Select name="kira" defaultValue={household.rentStatus || "kiraci"}>
                                        <SelectTrigger className="h-11 bg-zinc-50 border-zinc-100"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kiraci">Kiracı</SelectItem>
                                            <SelectItem value="mulk-sahibi">Mülk Sahibi</SelectItem>
                                            <SelectItem value="akraba-yani">Akraba Yanı</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-zinc-400" /> ISINMA</Label>
                                    <Select name="heatingType" defaultValue={household.heatingType || "dogalgaz"}>
                                        <SelectTrigger className="h-11 bg-zinc-50 border-zinc-100"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dogalgaz">Doğalgaz</SelectItem>
                                            <SelectItem value="soba">Soba</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-3 p-5 rounded-2xl bg-zinc-50 border border-zinc-100 min-w-[200px] flex-1">
                                    <Checkbox id="car" name="carOwnership" value="true" defaultChecked={!!household.carOwnership} className="w-5 h-5" />
                                    <div>
                                        <Label htmlFor="car" className="text-sm font-bold block">Araç Sahipliği</Label>
                                        <p className="text-[10px] text-zinc-400 font-medium">Hane adına kayıtlı taşıt</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-5 rounded-2xl bg-zinc-50 border border-zinc-100 min-w-[200px] flex-1">
                                    <Checkbox id="est" name="estateOwnership" value="true" defaultChecked={!!household.estateOwnership} className="w-5 h-5" />
                                    <div>
                                        <Label htmlFor="est" className="text-sm font-bold block">Ek Gayrimenkul</Label>
                                        <p className="text-[10px] text-zinc-400 font-medium">Gelir getiren veya ek tapu</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-12 flex justify-end gap-3 pt-6 border-t border-dashed">
                    <Link href={`/haneler/${id}`}>
                        <Button type="button" variant="ghost" className="h-12 px-8">İptal</Button>
                    </Link>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-12 text-lg font-bold shadow-xl shadow-emerald-200">
                        <Save className="mr-2 h-5 w-5" /> Güncellemeleri Kaydet
                    </Button>
                </div>
            </form>
        </div>
    );
}
