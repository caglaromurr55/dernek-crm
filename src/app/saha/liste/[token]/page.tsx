import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Phone, PackageCheck, UserCheck, ShieldAlert, Navigation, Layers, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { claimDistributionListAction } from "@/app/actions/volunteer";
import { DeliveryListClient } from "./DeliveryListClient";
import { VolunteerLoginForm } from "./VolunteerLoginForm";

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
            <div className="min-h-[100dvh] relative overflow-hidden flex flex-col justify-center animate-in fade-in duration-1000">
                {/* Background Ambient Effects */}
                <div className="absolute inset-0 bg-zinc-950"></div>
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 mix-blend-screen pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-md mx-auto p-6 md:p-8">
                    <Card className="border-0 bg-white/5 backdrop-blur-2xl shadow-2xl rounded-[3rem] overflow-hidden ring-1 ring-white/10">
                        <div className="p-10 text-center flex flex-col items-center border-b border-white/5 bg-gradient-to-b from-white/10 to-transparent">
                            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-400 rounded-3xl shadow-[0_0_40px_rgba(52,211,153,0.3)] flex items-center justify-center mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                                <UserCheck className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-3">Saha Görevi</h1>
                            <p className="text-zinc-400 max-w-[250px] text-sm font-medium leading-relaxed">
                                Size atanan teslimat listesini görmek için bilgilerinizi doğrulayın.
                            </p>
                        </div>
                        <CardContent className="p-8 pt-10">
                            <VolunteerLoginForm token={token} />
                        </CardContent>
                    </Card>

                    <div className="mt-8 text-center px-4">
                        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Güvenli Platform
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const pendingDeliveries = list.deliveries.filter(d => d.status === "PENDING");
    const completedDeliveries = list.deliveries.filter(d => d.status === "DELIVERED" || d.status === "CANCELLED");

    const progressPercentage = list.deliveries.length > 0
        ? Math.round((completedDeliveries.length / list.deliveries.length) * 100)
        : 0;

    return (
        <div className="min-h-[100dvh] bg-[#f8f9fc] relative selection:bg-emerald-500/30 overflow-hidden pb-32">

            {/* Header Blur Layer */}
            <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-zinc-200/50 pt-safe transition-all shadow-sm">
                <div className="max-w-2xl mx-auto px-6 py-5">
                    <div className="flex justify-between items-center mb-5">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-none">Görevlerim</h1>
                            <div className="flex items-center gap-1.5 text-zinc-500">
                                <UserCheck className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-widest">{list.assignedTo}</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-emerald-700 font-black shadow-inner">
                            <span className="text-lg leading-none">{completedDeliveries.length}</span>
                            <span className="text-[9px] opacity-70">/ {list.deliveries.length}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <PackageCheck className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-zinc-700 tracking-tight">
                                    {list.distributionEvent.item?.name || "Belirtilmemiş Paket"}
                                </span>
                            </div>
                            <span className="text-xs font-black text-emerald-600">{progressPercentage}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-200/60 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 ease-out relative"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Containers */}
            <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 space-y-8 relative z-10">
                {/* Pending */}
                <div className="space-y-4">
                    {pendingDeliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/40">
                            <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner text-emerald-500">
                                <PackageCheck className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Harika İş!</h2>
                            <p className="text-zinc-500 font-medium">Tüm teslimatları başarıyla tamamladınız.</p>
                        </div>
                    ) : (
                        <DeliveryListClient pendingDeliveries={pendingDeliveries} />
                    )}
                </div>

                {/* Completed */}
                {completedDeliveries.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 px-2 opacity-60">
                            <Layers className="w-4 h-4 text-zinc-500" />
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Tamamlanan veya İptal Edilenler</h3>
                        </div>
                        <div className="grid gap-3">
                            {completedDeliveries.map((delivery) => {
                                const applicant = delivery.household.persons.find(p => p.isApplicant) || delivery.household.persons[0];
                                const isCancelled = delivery.status === "CANCELLED";
                                return (
                                    <div key={delivery.id} className="group relative bg-white/60 hover:bg-white p-5 rounded-[2rem] flex items-center justify-between border border-zinc-200/50 shadow-sm transition-all grayscale-[0.5] hover:grayscale-0">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCancelled ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                {isCancelled ? <ShieldAlert className="w-5 h-5" /> : <PackageCheck className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-zinc-900 truncate">
                                                    {applicant?.firstName} {applicant?.lastName}
                                                </p>
                                                <p className="text-xs text-zinc-500 truncate mt-0.5 max-w-[200px]">
                                                    {isCancelled ? "İptal: Sorun bildirildi" : "Başarıyla Teslim Edildi"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
