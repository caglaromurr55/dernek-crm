"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Navigation, Phone, MapPin, Map, PackageCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VolunteerDeliveryButton } from "./VolunteerDeliveryButton";

export function VolunteerDeliveryItem({ delivery }: { delivery: any }) {
    const household = delivery.household;
    const applicant = household.persons.find((p: any) => p.isApplicant) || household.persons[0];
    const isCompleted = delivery.status !== "PENDING";

    const getGoogleMapsUrl = () => {
        const query = encodeURIComponent(`${household.address}`);
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    };

    return (
        <div className={`p-4 rounded-3xl border transition-all ${isCompleted ? 'bg-secondary/30 border-secondary opacity-75' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/40'}`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-black uppercase tracking-tight ${isCompleted ? 'text-zinc-600' : 'text-zinc-900'} text-lg`}>
                            {applicant ? `${applicant.firstName} ${applicant.lastName}` : "Bilinmiyor"}
                        </h3>
                        {delivery.status === "DELIVERED" && <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] px-1.5 py-0">TESLİM</Badge>}
                        {delivery.status === "FAILED" && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">İPTAL / SORUN</Badge>}
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 bg-zinc-50 p-2.5 rounded-2xl">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className={`text-sm font-semibold leading-snug ${isCompleted ? 'text-zinc-500' : 'text-zinc-700'}`}>
                        {household.address || "Adres bilgisi yok"}
                    </p>
                </div>

                <div className="flex gap-2">
                    <a
                        href={`tel:${household.contactNumber}`}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border transition-colors ${isCompleted ? 'border-zinc-200 text-zinc-500' : 'border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100'}`}
                    >
                        <Phone className="w-4 h-4" />
                        {household.contactNumber || "Tel Yok"}
                    </a>
                    <a
                        href={getGoogleMapsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold border transition-colors ${isCompleted ? 'border-zinc-200 text-zinc-500' : 'border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50'}`}
                    >
                        <Map className="w-4 h-4 text-emerald-600" />
                        Harita
                    </a>
                </div>
            </div>

            {isCompleted ? (
                <div className={`w-full py-3 rounded-2xl text-center font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${delivery.status === "DELIVERED" ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {delivery.status === "DELIVERED" ? <><CheckCircle2 className="w-5 h-5" /> TESLİM EDİLDİ</> : <><AlertTriangle className="w-5 h-5" /> TESLİM EDİLEMEDİ</>}
                </div>
            ) : (
                <VolunteerDeliveryButton
                    deliveryId={delivery.id}
                    householdId={household.id}
                    allowedIdentities={household.persons.map((p: any) => p.identityNo)}
                    currentAddress={household.address}
                    currentPhone={household.contactNumber}
                />
            )}
        </div>
    );
}
