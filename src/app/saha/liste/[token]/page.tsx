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
        <div className="min-h-[100dvh] bg-[#f4f4f5] relative selection:bg-emerald-500/30 font-sans pb-32 selection:bg-black/10">
            
            {/* Header Area */}
            <div className="bg-white px-6 pb-6 pt-12 shadow-[0_2px_20px_rgba(0,0,0,0.02)] sticky top-0 z-40">
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between items-end mb-6">
                        <div className="space-y-1">
                            <h1 className="text-[32px] font-black tracking-tighter text-zinc-900 leading-none">Görevlerim</h1>
                            <div className="flex items-center gap-1.5 text-zinc-500 mt-1">
                                <UserCheck className="w-4 h-4" />
                                <span className="text-[13px] font-bold uppercase tracking-widest">{list.assignedTo}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-0.5 text-emerald-600 font-black">
                                <span className="text-3xl tracking-tighter leading-none">{completedDeliveries.length}</span>
                                <span className="text-sm opacity-50">/{list.deliveries.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[13px] font-bold">
                            <span className="text-zinc-600 flex items-center gap-2">
                                <PackageCheck className="w-4 h-4" />
                                {list.distributionEvent.item?.name || "Teslimat Paketi"}
                            </span>
                            <span className="text-emerald-600">{progressPercentage}%</span>
                        </div>
                        <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner flex">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 pt-4">
                
                {/* Searchable Client List */}
                <DeliveryListClient pendingDeliveries={pendingDeliveries} />

                {/* Completed */}
                {completedDeliveries.length > 0 && (
                    <div className="space-y-4 pt-6">
                        <div className="px-2 border-t border-black/[0.05] pt-8 opacity-60">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Geçmiş İşlemler</h3>
                        </div>
                        <div className="grid gap-3">
                            {completedDeliveries.map((delivery) => {
                                const applicant = delivery.household.persons.find(p => p.isApplicant) || delivery.household.persons[0];
                                const isCancelled = delivery.status === "CANCELLED";
                                return (
                                    <div key={delivery.id} className="bg-transparent px-4 py-3 flex items-center justify-between border-b border-black/[0.03] opacity-60">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCancelled ? 'bg-zinc-200 text-zinc-500' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {isCancelled ? <ShieldAlert className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-zinc-900 text-[15px] truncate">
                                                    {applicant?.firstName} {applicant?.lastName}
                                                </p>
                                                <p className="text-[12px] text-zinc-500 font-medium truncate mt-0.5 max-w-[200px]">
                                                    {isCancelled ? "Sorun Bildirildi" : "Teslim Edildi"}
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
