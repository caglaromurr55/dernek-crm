"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function PrintButton() {
    return (
        <Button
            variant="outline"
            className="glass-card shadow-sm border-zinc-200 hover:bg-zinc-50"
            onClick={() => window.print()}
        >
            <Download className="mr-2 h-4 w-4" /> Rapor Al
        </Button>
    );
}
