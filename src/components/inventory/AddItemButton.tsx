"use client";

import { useState } from "react";
import { Plus, Package, Ruler, Hash, Loader2 } from "lucide-react";
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
import { createItemAction } from "@/app/actions/item";

export function AddItemButton() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await createItemAction(formData);
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
