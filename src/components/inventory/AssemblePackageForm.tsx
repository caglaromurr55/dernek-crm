"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assemblePackageAction } from "@/app/actions/item";

export function AssemblePackageForm({ packageId, maxBuildable }: { packageId: string; maxBuildable: number }) {
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const handleAssemble = async () => {
        if (quantity <= 0 || quantity > maxBuildable) return;
        setLoading(true);
        const result = await assemblePackageAction(packageId, quantity);
        setLoading(false);
        if (!result.success) {
            alert(result.error);
        } else {
            setQuantity(1);
        }
    };

    return (
        <div className="flex items-center gap-2 mt-4 p-4 rounded-xl border bg-emerald-50/50">
            <div className="flex-1">
                <p className="text-sm font-bold text-emerald-900">Mevcut Stoklarla Maksimum: {maxBuildable} Koli</p>
                <p className="text-xs text-emerald-700/80">Belirtilen adette koli oluşturmak için gerekli alt malzemeler stoktan otomatik düşülecektir.</p>
            </div>

            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    min="1"
                    max={maxBuildable}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 bg-white"
                />
                <Button
                    onClick={handleAssemble}
                    disabled={loading || maxBuildable === 0 || quantity > maxBuildable}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Koli Hazırla
                </Button>
            </div>
        </div>
    );
}
