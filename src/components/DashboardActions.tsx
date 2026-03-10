"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, UserPlus, FileSpreadsheet, ScanLine } from "lucide-react";
import { BarcodeQueryModal } from "@/components/BarcodeQueryModal";

export function DashboardActions() {
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

    return (
        <div className="flex flex-wrap gap-3 items-center">
            <Button
                onClick={() => setIsBarcodeModalOpen(true)}
                variant="outline"
                className="border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 font-bold px-4 h-11 shadow-sm group border transition-all rounded-xl"
            >
                <ScanLine className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" /> Hızlı Sorgula (Barkod)
            </Button>

            <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-bold px-4 h-11 shadow-sm group border transition-all rounded-xl"
                onClick={() => alert("Excel aktarım modülü hazırlanıyor...")}
            >
                <FileSpreadsheet className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 text-emerald-600" /> Excel'e Aktar
            </Button>

            <Link href="/manuel-teslimat">
                <Button
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 font-bold px-4 h-11 shadow-sm group border transition-all rounded-xl"
                >
                    <ShoppingBag className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" /> Manuel Teslimat
                </Button>
            </Link>

            <Link href="/haneler/yeni">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 h-11 shadow-lg shadow-emerald-500/20 border-0 group rounded-xl transition-all hover:scale-105 active:scale-95">
                    <UserPlus className="mr-2 h-4 w-4" /> Yeni Hane
                </Button>
            </Link>

            <BarcodeQueryModal
                open={isBarcodeModalOpen}
                onClose={() => setIsBarcodeModalOpen(false)}
            />
        </div>
    );
}
