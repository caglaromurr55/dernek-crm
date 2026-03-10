"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Map, MapPin } from "lucide-react";

// Server-side render'ı devre dışı bırakarak react-leaflet yüklüyoruz
const MapRenderer = dynamic(() => import("./MapRenderer"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-zinc-500 font-medium">Harita yükleniyor...</span>
        </div>
    )
});

interface MapModalButtonProps {
    address: string;
    isCompleted?: boolean;
}

export function MapModalButton({ address, isCompleted = false }: MapModalButtonProps) {
    const [open, setOpen] = useState(false);

    // Eğer teslimat tamamlandıysa tıklanamasın
    if (isCompleted) {
        return (
            <div className="flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold border border-zinc-200 text-zinc-500 bg-zinc-50 py-2 w-full text-center">
                <Map className="w-4 h-4 text-emerald-600/50" />
                Harita
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 transition-colors w-full h-[38px]"
                >
                    <Map className="w-4 h-4 text-emerald-600" />
                    Haritada Gör
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white border-zinc-100 shadow-2xl overflow-hidden flex flex-col items-center">
                <DialogHeader className="w-full text-left mb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <MapPin className="text-emerald-500 w-5 h-5" /> Teslimat Noktası
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-zinc-500 line-clamp-2 mt-1">
                        {address}
                    </DialogDescription>
                </DialogHeader>

                {/* Lazy-loaded Leaflet Map */}
                <div className="w-full pt-2">
                    {open && <MapRenderer address={address} onClose={() => setOpen(false)} />}
                </div>
            </DialogContent>
        </Dialog>
    );
}
