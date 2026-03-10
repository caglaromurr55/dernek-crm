"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VolunteerDeliveryCard } from "./VolunteerDeliveryCard";

export function DeliveryListClient({ pendingDeliveries }: { pendingDeliveries: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredDeliveries = pendingDeliveries.filter((delivery) => {
        const applicant = delivery.household.persons.find((p: any) => p.isApplicant) || delivery.household.persons[0];
        const fullName = `${applicant?.firstName || ""} ${applicant?.lastName || ""}`.toLowerCase();
        const address = (delivery.household.address || "").toLowerCase();
        const phone = (delivery.household.contactNumber || "").toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return fullName.includes(searchLower) || address.includes(searchLower) || phone.includes(searchLower);
    });

    return (
        <div className="space-y-6">
            <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                    <Search className="h-5 w-5" />
                </div>
                <Input
                    type="text"
                    placeholder="İsim, adres veya telefon ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 bg-white border-0 shadow-sm rounded-2xl font-medium focus-visible:ring-2 focus-visible:ring-emerald-500 w-full text-zinc-900"
                />
            </div>

            <div className="space-y-4">
                {filteredDeliveries.map((delivery) => (
                    <VolunteerDeliveryCard key={delivery.id} delivery={delivery} />
                ))}
            </div>

            {filteredDeliveries.length === 0 && searchTerm && (
                <div className="text-center py-10 bg-white/50 backdrop-blur-sm rounded-3xl border border-zinc-200">
                    <p className="text-zinc-500 font-medium tracking-tight">"{searchTerm}" için sonuç bulunamadı.</p>
                </div>
            )}
        </div>
    );
}
