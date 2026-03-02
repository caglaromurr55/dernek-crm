"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react";
import { addStockAction, removeStockAction } from "@/app/actions/item";
import { toast } from "sonner";

interface StockMovementModalProps {
    item: { id: string; name: string; stock: number; unit: string };
    type: "IN" | "OUT";
}

export function StockMovementModal({ item, type }: StockMovementModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState("");
    const [reason, setReason] = useState("");
    const router = useRouter();

    const isAdd = type === "IN";
    const Icon = isAdd ? PlusCircle : MinusCircle;
    const colorClass = isAdd ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" : "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const q = parseInt(quantity);
        if (isNaN(q) || q <= 0) {
            toast.error("Geçerli bir miktar girin.");
            return;
        }

        if (!isAdd && q > item.stock) {
            toast.error("Stokta bu kadar ürün yok.");
            return;
        }

        if (!reason.trim()) {
            toast.error("Lütfen bir neden girin.");
            return;
        }

        setLoading(true);

        try {
            const action = isAdd ? addStockAction : removeStockAction;
            const res = await action(item.id, q, reason);

            if (res.success) {
                toast.success(isAdd ? "Stok başarıyla eklendi." : "Stok başarıyla düşüldü.");
                setOpen(false);
                setQuantity("");
                setReason("");
                // Opsiyonel olarak, mevcut rotayı yenilemek için:
                router.refresh();
            } else {
                toast.error(res.error || "İşlem başarısız.");
            }
        } catch (error) {
            toast.error("Sunucu ile iletişim kurulamadı.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="outline" className={`h-8 w-8 rounded-lg ${colorClass}`} title={isAdd ? "Stok Ekle" : "Stok Düş"}>
                    <Icon className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isAdd ? "Stok Ekle (IN)" : "Stok Düş (OUT)"}</DialogTitle>
                        <DialogDescription>
                            {item.name} için manuel stok {isAdd ? "girişi" : "çıkışı"} yapıyorsunuz. Mevcut Stok: {item.stock} {item.unit}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Miktar</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                max={!isAdd ? item.stock : undefined}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder={`Eklenecek ${item.unit} miktarı`}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reason">{isAdd ? "Kaynak / Ekleyen" : "Sebep / Verilen Yer"}</Label>
                            <Input
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={isAdd ? "Örn: Ahmet Bey bağışı" : "Örn: Bozulma / Farklı şubeye sevk"}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading} className={isAdd ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isAdd ? "Stok Ekle" : "Stok Düş"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
