"use client";

import { useState } from "react";
import { ArrowUpDown, PlusCircle, MinusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { addStockAction, removeStockAction } from "@/app/actions/item";

interface StockMovementButtonProps {
    itemId: string;
    itemName: string;
}

export function StockMovementButton({ itemId, itemName }: StockMovementButtonProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<"IN" | "OUT">("IN");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const quantity = parseInt(formData.get("quantity") as string);
        const reason = formData.get("reason") as string;

        const action = type === "IN" ? addStockAction : removeStockAction;
        const result = await action(itemId, quantity, reason);

        setLoading(false);
        if (result.success) {
            setOpen(false);
        } else {
            alert(result.error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <ArrowUpDown className="h-3.5 w-3.5" /> Stok Har.
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Stok Hareketi: {itemName}</DialogTitle>
                        <DialogDescription>
                            Ürünün stok miktarını giriş veya çıkış yaparak güncelleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md">
                            <button
                                type="button"
                                onClick={() => setType("IN")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === "IN"
                                        ? "bg-white dark:bg-zinc-800 shadow-sm text-emerald-600"
                                        : "text-zinc-500 hover:text-zinc-700"
                                    }`}
                            >
                                <PlusCircle className="h-4 w-4" /> Stok Girişi
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("OUT")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === "OUT"
                                        ? "bg-white dark:bg-zinc-800 shadow-sm text-red-600"
                                        : "text-zinc-500 hover:text-zinc-700"
                                    }`}
                            >
                                <MinusCircle className="h-4 w-4" /> Stok Çıkışı
                            </button>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Miktar</Label>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="1"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="reason">Açıklama / Sebep</Label>
                            <Input
                                id="reason"
                                name="reason"
                                placeholder={type === "IN" ? "Örn: Satın Alma, Bağış" : "Örn: Fire, Sayım Eksikliği"}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={type === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {type === "IN" ? "Stok Ekle" : "Stoktan Düş"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
