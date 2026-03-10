"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { BarcodeQueryModal } from "@/components/BarcodeQueryModal";

export function BarcodeQueryButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="h-11 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold px-3 md:px-5 shadow-sm rounded-2xl transition-all whitespace-nowrap"
            >
                <ScanBarcode className="mr-2 h-4 w-4" />
                Hızlı Sorgula (Barkod)
            </Button>

            <BarcodeQueryModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
