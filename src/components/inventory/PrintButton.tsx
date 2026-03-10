"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <Button
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            onClick={() => {
                if (typeof window !== "undefined") window.print();
            }}
        >
            <Printer className="w-4 h-4 mr-2" />
            TUTANAĞI YAZDIR
        </Button>
    );
}
