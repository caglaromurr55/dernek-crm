import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Phone, PackageCheck, UserCheck, ShieldAlert, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claimDistributionListAction } from "@/app/actions/volunteer";
import { VolunteerDeliveryCard } from "./VolunteerDeliveryCard";

export default async function SahaPublicListPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const list = await prisma.distributionList.findUnique({
        where: { token },
        include: {
            distributionEvent: {
                include: { item: true }
            },
            deliveries: {
                include: {
                    household: {
                        include: {
                            persons: true
                        }
                    }
                },
                orderBy: {
                    household: { score: "desc" }
                }
            }
        }
    });

    if (!list) {
        notFound();
    }

    if (!list.assignedTo) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 pb-24">
                <Card className="max-w-md w-full border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <div className="bg-emerald-600 p-8 text-white text-center">
                        <div className="bg-white/20 w-20 h-20 rounded-3xl backdrop-blur-md flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <UserCheck className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Saha Görevlisi Atama</h1>
                        <p className="text-emerald-50/80 text-sm mt-1 font-medium">Bu listeyi üstlenmek için bilgilerinizi girin.</p>
                    </div>
                    <CardContent className="p-8 pt-10">
                        <form action={async (formData) => { "use server"; await claimDistributionListAction(formData); }} className="space-y-6">
                            <input type="hidden" name="token" value={token} />
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Ad Soyad</Label>
                                <Input id="name" name="name" placeholder="Örn: Ahmet Yılmaz" required className="h-12 bg-zinc-50 border-0 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Telefon Numarası</Label>
                                <Input id="phone" name="phone" type="tel" placeholder="05xx xxx xx xx" required className="h-12 bg-zinc-50 border-0 rounded-xl" />
                            </div>
                            <Button type="submit" className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 text-lg uppercase tracking-tight">
                                GÖREVİ ÜSTLEN
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-zinc-50 p-6 border-t border-zinc-100 italic text-zinc-400 text-[10px] text-center">
                        Girdiğiniz bilgiler otomatik olarak gönüllü sistemine kaydedilecek ve bu liste telefonunuza zimmetlenecektir.
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const pendingDeliveries = list.deliveries.filter(d => d.status === "PENDING");
    const completedDeliveries = list.deliveries.filter(d => d.status === "DELIVERED");

    return (
        <div className="min-h-screen bg-zinc-50 p-4 pb-20 max-w-lg mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4">
                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-zinc-900/5 flex flex-col gap-4 border border-white">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tighter text-zinc-900 uppercase italic">GÖREV LİSTEM</h2>
                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 leading-none">
                                <UserCheck className="w-3.5 h-3.5" /> {list.assignedTo}
                            </p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-full h-10 px-4 font-black text-xs">
                            {completedDeliveries.length} / {list.deliveries.length}
                        </Badge>
                    </div>

                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-1000"
                            style={{ width: `${(completedDeliveries.length / list.deliveries.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[10px] font-black leading-tight text-amber-800 uppercase tracking-tight italic">
                        DAĞITILAN ÜRÜN: <span className="text-zinc-900 ml-1">{list.distributionEvent.item?.name || "Bilinmiyor"}</span>
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {pendingDeliveries.length === 0 ? (
                    <div className="py-20 text-center space-y-4 bg-white rounded-[2rem] border-dashed border-2 border-zinc-200 shadow-inner">
                        <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <PackageCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-black text-zinc-800 italic uppercase">TEBRİKLER!</p>
                            <p className="text-sm text-zinc-500 font-medium">Tüm teslimatları başarıyla tamamladınız.</p>
                        </div>
                    </div>
                ) : (
                    pendingDeliveries.map((delivery) => (
                        <VolunteerDeliveryCard key={delivery.id} delivery={delivery} />
                    ))
                )}
            </div>

            {completedDeliveries.length > 0 && (
                <div className="pt-8 space-y-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-4">TAMAMLANANLAR</h3>
                    <div className="space-y-3 opacity-50">
                        {completedDeliveries.map((delivery) => {
                            const applicant = delivery.household.persons.find(p => p.isApplicant) || delivery.household.persons[0];
                            return (
                                <Card key={delivery.id} className="border-0 shadow-sm bg-zinc-100 rounded-2xl overflow-hidden">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{applicant?.firstName} {applicant?.lastName}</span>
                                            <span className="text-[10px] text-zinc-500">{delivery.household.address.slice(0, 30)}...</span>
                                        </div>
                                        <PackageCheck className="w-5 h-5 text-emerald-500" />
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
