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
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/10 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            >
                <ScanBarcode className="mr-2 h-4 w-4" />
                Hızlı Sorgula (Barkod)
            </Button>

            <BarcodeQueryModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
