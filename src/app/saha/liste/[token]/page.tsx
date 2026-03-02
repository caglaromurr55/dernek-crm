import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ClaimForm } from "./ClaimForm";
import { VolunteerDeliveryItem } from "./VolunteerDeliveryItem";

export const metadata = {
    title: "Saha Dağıtım Ekranı | Dernek CRM",
    description: "Dernek CRM Gönüllü Dağıtım Ekranı"
};

export default async function VolunteerTokenPage({ params }: { params: Promise<{ token: string }> }) {
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
                            persons: {
                                where: { isApplicant: true }
                            }
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

    // Eğer henüz kimseye atanmamışsa, atama (zimmet) formunu göster
    if (!list.assignedTo) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
                            <span className="text-2xl text-white font-black">CRM</span>
                        </div>
                        <h1 className="text-2xl font-black text-zinc-900 mb-2">Dağıtım Listesi Ataması</h1>
                        <p className="text-zinc-500">Bu dağıtım listesini üstlenmek için bilgilerinizi girin.</p>
                    </div>

                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-zinc-100">
                        <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Kampanya</p>
                            <p className="font-black text-zinc-900">{list.distributionEvent.name}</p>
                            <p className="text-sm font-medium text-zinc-500 mt-1">{list.name}</p>

                            <div className="mt-3 pt-3 border-t border-blue-100 flex justify-between items-center">
                                <span className="text-xs text-zinc-500">Dağıtılacak Hane:</span>
                                <span className="font-black text-emerald-600">{list.deliveries.length} Adet</span>
                            </div>
                        </div>

                        <ClaimForm token={token} />
                    </div>
                </div>
            </div>
        );
    }

    // Eğer atanmışsa (claim edilmişse), doğrudan teslimat listesini göster
    return (
        <div className="min-h-screen bg-zinc-50 pb-24">
            <div className="bg-blue-600 text-white rounded-b-[2.5rem] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 -z-10"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

                <div className="flex justify-between items-center mb-6 pt-2">
                    <h1 className="text-xl font-black tracking-tight">{list.distributionEvent.name}</h1>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-lg">
                        {list.assignedTo?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-0.5">Saha Görevlisi</p>
                        <p className="font-bold leading-none">{list.assignedTo}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 -mt-4 relative z-10">
                <div className="flex justify-between items-end mb-4 px-2">
                    <div>
                        <h2 className="text-sm font-black text-zinc-800 uppercase tracking-widest">{list.name}</h2>
                        <p className="text-xs text-zinc-500 mt-1 font-medium">{list.deliveries.filter(d => d.status === "DELIVERED").length} / {list.deliveries.length} Teslimat</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {list.deliveries.map((delivery) => (
                        <VolunteerDeliveryItem key={delivery.id} delivery={delivery} />
                    ))}
                </div>
            </div>
        </div>
    );
}
