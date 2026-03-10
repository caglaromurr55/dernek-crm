"use client";

import { useState } from "react";
import { PenTool, X, Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
    imageUrl: string;
    volunteerName?: string;
    date?: string;
}

export function SignatureModal({ imageUrl, volunteerName, date }: Props) {
    if (!imageUrl) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-lg bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800 gap-1.5 px-2.5">
                    <PenTool className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">İmzayı Gör</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl overflow-hidden p-0 border-0 shadow-2xl">
                <DialogHeader className="p-6 bg-zinc-900 text-white">
                    <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                        <PenTool className="h-5 w-5 text-emerald-400" />
                        TESLİMAT İMZASI
                    </DialogTitle>
                    <div className="flex flex-col gap-1 mt-2 opacity-70">
                        {volunteerName && <p className="text-xs font-bold uppercase tracking-widest">GÖREVLİ: {volunteerName}</p>}
                        {date && <p className="text-[10px] font-medium">{date}</p>}
                    </div>
                </DialogHeader>
                <div className="p-8 bg-white flex flex-col items-center justify-center min-h-[300px] relative">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <img
                        src={imageUrl}
                        alt="Teslimat İmzası"
                        className="max-w-full h-auto relative z-10 drop-shadow-md grayscale hover:grayscale-0 transition-all duration-500"
                    />
                </div>
                <div className="p-4 bg-zinc-50 border-t flex justify-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Search className="w-3 h-3" /> Dijital olarak doğrulanmış saha kaydı
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
