"use client";

import { useState } from "react";
import { Loader2, Trash2, Pencil } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updatePackageContentsAction } from "@/app/actions/item";

export function EditPackageButton({
    packageId,
    initialItems,
    availableItems
}: {
    packageId: string;
    initialItems: { itemId: string, quantity: number, itemName: string }[];
    availableItems: any[];
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Package Composition State
    const [packageItems, setPackageItems] = useState<{ itemId: string, quantity: number, itemName: string }[]>(initialItems);
    const [selectedSubItem, setSelectedSubItem] = useState("");
    const [subItemQty, setSubItemQty] = useState(1);

    const handleAddSubItem = () => {
        if (!selectedSubItem || subItemQty <= 0) return;

        if (packageItems.some(pi => pi.itemId === selectedSubItem)) {
            setPackageItems(packageItems.map(pi => pi.itemId === selectedSubItem ? { ...pi, quantity: pi.quantity + subItemQty } : pi));
        } else {
            const item = availableItems.find(i => i.id === selectedSubItem);
            setPackageItems([...packageItems, { itemId: selectedSubItem, quantity: subItemQty, itemName: item?.name || "Bilinmiyor" }]);
        }

        setSelectedSubItem("");
        setSubItemQty(1);
    };

    const handleRemoveSubItem = (index: number) => {
        const yeni = [...packageItems];
        yeni.splice(index, 1);
        setPackageItems(yeni);
    };

    const handleSubmit = async () => {
        setLoading(true);
        const submitData = packageItems.map(pi => ({ itemId: pi.itemId, quantity: pi.quantity }));
        const result = await updatePackageContentsAction(packageId, submitData);
        setLoading(false);
        if (result.success) {
            setOpen(false);
        } else {
            alert(result.error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => {
            setOpen(o);
            if (!o) { setPackageItems(initialItems); }
            else { setPackageItems(initialItems); }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200">
                    <Pencil className="h-3.5 w-3.5" /> Düzenle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Koli İçeriğini Düzenle</DialogTitle>
                    <DialogDescription>
                        Bu paketin içeriğindeki ürünleri ve miktarlarını güncelleyebilirsiniz. Bu değişiklik mevcut hazır kolilerin stoğunu etkilemez.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {packageItems.map((pi, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border text-sm">
                                <span className="font-semibold text-emerald-900">{pi.itemName}</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-emerald-700">x {pi.quantity}</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveSubItem(idx)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {packageItems.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-2">Henüz bu koliye ürün eklenmedi.</p>}
                    </div>

                    <div className="flex items-end gap-2 pt-2 border-t border-emerald-100">
                        <div className="flex-1 space-y-1">
                            <Label className="text-[10px] uppercase text-emerald-700">İçerik</Label>
                            <Select value={selectedSubItem} onValueChange={setSelectedSubItem}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Seçim..." /></SelectTrigger>
                                <SelectContent>
                                    {availableItems.filter(i => !i.isPackage).map(i => (
                                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-16 space-y-1">
                            <Label className="text-[10px] uppercase text-emerald-700">Adet</Label>
                            <Input type="number" min="1" className="h-9" value={subItemQty} onChange={(e) => setSubItemQty(parseInt(e.target.value) || 1)} />
                        </div>
                        <Button type="button" onClick={handleAddSubItem} className="h-9 bg-emerald-600 hover:bg-emerald-700">Ekle</Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Değişiklikleri Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
