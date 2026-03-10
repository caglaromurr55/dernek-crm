"use client";

import { useState } from "react";
import { Search, Map as MapIcon, List as ListIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { VolunteerDeliveryCard } from "./VolunteerDeliveryCard";

const MapView = dynamic(() => import("./MapComponent").then(m => m.MapComponent), { ssr: false });

export function DeliveryListClient({ pendingDeliveries }: { pendingDeliveries: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "map">("list");

    const filteredDeliveries = pendingDeliveries.filter((delivery) => {
        const applicant = delivery.household.persons.find((p: any) => p.isApplicant) || delivery.household.persons[0];
        const fullName = `${applicant?.firstName || ""} ${applicant?.lastName || ""}`.toLowerCase();
        const address = (delivery.household.address || "").toLowerCase();
        const phone = (delivery.household.contactNumber || "").toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return fullName.includes(searchLower) || address.includes(searchLower) || phone.includes(searchLower);
    });

    return (
        <div className="space-y-4">
            <div className="relative sticky top-[108px] z-30 pt-2 pb-4 -mx-2 px-2 bg-[#f4f4f5]/80 backdrop-blur-xl flex items-center gap-3">
                <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="İsim, adres veya telefon ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-white/70 hover:bg-white focus:bg-white border-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[20px] text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    />
                </div>
                
                <button 
                    onClick={() => setViewMode(v => v === "list" ? "map" : "list")}
                    className="h-14 px-4 bg-white/70 hover:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[20px] flex items-center gap-2 text-zinc-700 font-bold text-[14px] transition-all border border-transparent hover:border-black/[0.04]"
                >
                    {viewMode === "list" ? (
                        <>
                            <MapIcon className="w-5 h-5 text-blue-500" />
                            <span className="hidden sm:inline">Harita</span>
                        </>
                    ) : (
                        <>
                            <ListIcon className="w-5 h-5 text-emerald-500" />
                            <span className="hidden sm:inline">Liste</span>
                        </>
                    )}
                </button>
            </div>

            {viewMode === "map" ? (
                <div className="pb-8 animate-in fade-in duration-500">
                    <MapView deliveries={filteredDeliveries} />
                </div>
            ) : (
                <div className="space-y-3 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {filteredDeliveries.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-[32px] border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-1">Bulunamadı</h3>
                            <p className="text-zinc-500 font-medium text-sm">Arama kriterlerinize uyan kayıt yok.</p>
                        </div>
                    ) : (
                        filteredDeliveries.map((delivery) => (
                            <VolunteerDeliveryCard key={delivery.id} delivery={delivery} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
