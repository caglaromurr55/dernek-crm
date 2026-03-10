"use client";

import { useState } from "react";
import { Plus, Package, Ruler, Hash, Loader2, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { createItemAction } from "@/app/actions/item";

export function AddItemButton({ availableItems = [] }: { availableItems?: any[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Package Composition State
    const [isPackage, setIsPackage] = useState(false);
    const [packageItems, setPackageItems] = useState<{ itemId: string, quantity: number }[]>([]);
    const [selectedSubItem, setSelectedSubItem] = useState("");
    const [subItemQty, setSubItemQty] = useState(1);

    const handleAddSubItem = () => {
        if (!selectedSubItem || subItemQty <= 0) return;
        setPackageItems([...packageItems, { itemId: selectedSubItem, quantity: subItemQty }]);
        setSelectedSubItem("");
        setSubItemQty(1);
    };

    const handleRemoveSubItem = (index: number) => {
        const yeni = [...packageItems];
        yeni.splice(index, 1);
        setPackageItems(yeni);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.set("isPackage", isPackage.toString());
        if (isPackage) {
            formData.set("packageItems", JSON.stringify(packageItems));
        }

        const result = await createItemAction(formData);
        setLoading(false);
        if (result.success) {
            setOpen(false);
            setIsPackage(false);
            setPackageItems([]);
        } else {
            alert(result.error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => {
            setOpen(o);
            if (!o) { setIsPackage(false); setPackageItems([]); }
        }}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" /> Yeni Yardım Türü
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Yeni Yardım Türü Ekle</DialogTitle>
                        <DialogDescription>
                            Sistemde dağıtılacak yeni bir yardım malzemesi veya türü tanımlayın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Ürün / Yardım Adı</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Örn: Gıda Kolisi, Kömür"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="unit">Birim</Label>
                            <Select name="unit" defaultValue="ADET">
                                <SelectTrigger>
                                    <SelectValue placeholder="Birim seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADET">Adet</SelectItem>
                                    <SelectItem value="KG">Kilogram (KG)</SelectItem>
                                    <SelectItem value="LITRE">Litre</SelectItem>
                                    <SelectItem value="TL">Türk Lirası (TL)</SelectItem>
                                    <SelectItem value="PAKET">Paket</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="initialStock">Başlangıç Stoğu</Label>
                            <Input
                                id="initialStock"
                                name="initialStock"
                                type="number"
                                defaultValue="0"
                                min="0"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-xl bg-secondary/20">
                            <div className="space-y-0.5">
                                <Label>Bu bir Paket / Koli mi?</Label>
                                <p className="text-xs text-muted-foreground">İçerisinde başka yardım stoklarını barındıran kompleks bir ürün türüyse aktifleştirin.</p>
                            </div>
                            <Switch checked={isPackage} onCheckedChange={setIsPackage} />
                        </div>

                        {isPackage && (
                            <div className="p-4 border border-emerald-100 rounded-xl bg-emerald-50/30 space-y-4">
                                <Label className="text-emerald-800 font-bold">Koli İçeriği Seçimi</Label>

                                <div className="space-y-2">
                                    {packageItems.map((pi, idx) => {
                                        const itemName = availableItems.find(i => i.id === pi.itemId)?.name || "Bilinmiyor";
                                        return (
                                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border text-sm">
                                                <span className="font-semibold text-emerald-900">{itemName}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-emerald-700">x {pi.quantity}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveSubItem(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {packageItems.length === 0 && <p className="text-xs text-emerald-600/60 italic">Henüz bu koliye ürün eklenmedi.</p>}
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
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
