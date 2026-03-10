"use client";

import { useState } from "react";
import { toggleVolunteerBlockAction } from "@/app/actions/volunteerManagement";
import { Button } from "@/components/ui/button";
import { Ban, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VolunteerBlockButtonProps {
    volunteerId: string;
    isBlocked: boolean;
}

export function VolunteerBlockButton({ volunteerId, isBlocked }: VolunteerBlockButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            const res = await toggleVolunteerBlockAction(volunteerId, !isBlocked);
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={isBlocked ? "outline" : "destructive"}
            size="sm"
            disabled={loading}
            onClick={handleToggle}
            className="rounded-xl h-9 px-4 gap-2 font-bold transition-all"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isBlocked ? (
                <>
                    <CheckCircle2 className="h-4 w-4" /> Engeli Kaldır
                </>
            ) : (
                <>
                    <Ban className="h-4 w-4" /> Engelle
                </>
            )}
        </Button>
    );
}
