"use client";

import { useState } from "react";
import {
    Boxes,
    Loader2,
    Zap,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assemblePackageAction } from "@/app/actions/item";
import { toast } from "sonner";

interface QuickAssembleButtonProps {
    packageId: string;
    packageName: string;
    maxBuildable: number;
    unit: string;
}

export function QuickAssembleButton({ packageId, packageName, maxBuildable, unit }: QuickAssembleButtonProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const handleAssemble = async () => {
        if (quantity <= 0 || quantity > maxBuildable) return;
        setLoading(true);
        const result = await assemblePackageAction(packageId, quantity);
        setLoading(false);

        if (result.success) {
            toast.success("Koli Hazırlandı", {
                description: `${quantity} adet ${packageName} başarıyla oluşturuldu ve alt malzemeler stoktan düşüldü.`
            });
            setOpen(false);
            setQuantity(1);
        } else {
            toast.error("Hata", {
                description: result.error || "Koli hazırlanırken bir sorun oluştu."
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-200 transition-all shadow-sm hover:shadow-emerald-200"
                    title="Koli Hazırla"
                >
                    <Boxes className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <Boxes className="h-6 w-6 text-emerald-600" />
                        Koli / Set Hazırla
                    </DialogTitle>
                    <DialogDescription className="font-medium text-emerald-900/70 pt-1">
                        {packageName} için hızlı montaj işlemi.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-0.5">Maksimum Üretilebilir</p>
                            <p className="text-2xl font-black text-emerald-950 flex items-baseline gap-1">
                                {maxBuildable} <span className="text-xs font-bold opacity-50">{unit}</span>
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-emerald-200" />
                    </div>

                    <div className="space-y-2 px-1">
                        <Label className="text-xs font-bold text-zinc-600 flex justify-between">
                            <span>HAZIRLANACAK ADET</span>
                            <span className={quantity > maxBuildable ? "text-red-500" : "text-emerald-600"}>
                                {quantity} / {maxBuildable}
                            </span>
                        </Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="1"
                                max={maxBuildable}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className="h-12 text-lg font-black rounded-xl border-zinc-200 focus:ring-emerald-500/20 focus:border-emerald-500/50 pr-12"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xs uppercase tracking-widest">{unit}</div>
                        </div>
                        {maxBuildable === 0 && (
                            <div className="flex items-start gap-2 text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded-lg mt-2">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>Alt malzemeler yetersiz olduğu için üretim yapılamaz!</span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="rounded-xl"
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleAssemble}
                        disabled={loading || maxBuildable === 0 || quantity > maxBuildable || quantity <= 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 min-w-[120px]"
                    >
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2 fill-current" />}
                        Sürüm Hazırla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
