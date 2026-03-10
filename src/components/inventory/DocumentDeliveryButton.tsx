"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSignature } from "lucide-react";
import { DocumentDeliveryModal } from "./DocumentDeliveryModal";

interface DocumentDeliveryButtonProps {
    itemId: string;
    itemName: string;
    disabled?: boolean;
}

export function DocumentDeliveryButton({ itemId, itemName, disabled }: DocumentDeliveryButtonProps) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="icon"
                disabled={disabled}
                onClick={() => setModalOpen(true)}
                className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 hover:text-white hover:bg-amber-600 border-amber-200 transition-colors shadow-sm"
                title="Belgeli Teslimat (Dışarıya Çıkış)"
            >
                <FileSignature className="h-4 w-4" />
            </Button>

            <DocumentDeliveryModal
                itemId={itemId}
                itemName={itemName}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </>
    );
}
