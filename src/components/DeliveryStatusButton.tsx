"use client";

import { useState } from "react";
import { CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateDeliveryStatusAction } from "@/app/actions/distribution";
import { toast } from "sonner";

interface DeliveryStatusButtonProps {
    deliveryId: string;
    currentStatus: string;
}

export function DeliveryStatusButton({ deliveryId, currentStatus }: DeliveryStatusButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async (newStatus: string) => {
        setIsLoading(true);
        try {
            const res = await updateDeliveryStatusAction(deliveryId, newStatus);
            if (res.success) {
                toast.success(newStatus === "DELIVERED" ? "Teslim edildi olarak işaretlendi" : "Durum güncellendi");
            } else {
                toast.error(res.message || "Hata oluştu");
            }
        } catch (error) {
            toast.error("İşlem başarısız");
        } finally {
            setIsLoading(false);
        }
    };

    if (currentStatus === "DELIVERED") {
        return (
            <Button variant="outline" disabled className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold rounded-xl h-9 px-4">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Teslim Edildi
            </Button>
        );
    }

    return (
        <div className="flex gap-2">
            <Button
                onClick={() => handleUpdate("DELIVERED")}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-9 px-4 shadow-sm"
            >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Teslim Et
            </Button>
            <Button
                variant="ghost"
                onClick={() => handleUpdate("FAILED")}
                disabled={isLoading}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl h-9 px-3"
            >
                <XCircle className="w-4 h-4" />
            </Button>
        </div>
    );
}
