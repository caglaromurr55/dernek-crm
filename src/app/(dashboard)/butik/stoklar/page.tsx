"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Shirt, Plus, Printer, RefreshCw, Barcode as BarcodeIcon, Search, PackagePlus
} from "lucide-react";
import { getBoutiqueItemsAction, createBoutiqueItemAction, updateBoutiqueStockAction } from "@/app/actions/boutique";
import { toast } from "sonner";
import Barcode from 'react-barcode';
import { StandaloneScannerModal } from "@/components/StandaloneScannerModal";

export default function BoutiqueInventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Form states
    const [barcode, setBarcode] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Mont");
    const [gender, setGender] = useState("UNISEX");
    const [size, setSize] = useState("STANDART");
    const [points, setPoints] = useState("1");
    const [stock, setStock] = useState("10");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Printing
    const printRef = useRef<HTMLDivElement>(null);
    const [printItem, setPrintItem] = useState<any>(null);

    // Scanner
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Stock Update Modal
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [selectedItemForStock, setSelectedItemForStock] = useState<any>(null);
    const [addStockAmount, setAddStockAmount] = useState("5");
    const [isUpdatingStock, setIsUpdatingStock] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    async function loadItems() {
        setLoading(true);
        const res = await getBoutiqueItemsAction();
        if (res.success && res.data) {
            setItems(res.data);
        }
        setLoading(false);
    }

    async function handleAddItem(e: React.FormEvent) {
        e.preventDefault();

        if (!name) {
            toast.error("Ürün adı zorunludur.");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("barcode", barcode); // Boşsa sunucuda üretilecek
        formData.append("name", name);
        formData.append("category", category);
        formData.append("gender", gender);
        formData.append("size", size);
        formData.append("points", points);
        formData.append("stock", stock);

        const res = await createBoutiqueItemAction(formData);
        if (res.success) {
            toast.success("Ürün başarıyla eklendi.");
            // Reset
            setBarcode("");
            setName("");
            setStock("10");
            loadItems();
        } else {
            toast.error(res.message || "Ekleme hatası.");
        }
        setIsSubmitting(false);
    }

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePrint = (item: any) => {
        setPrintItem(item);
        setTimeout(() => {
            if (printRef.current) {
                const printContent = printRef.current.innerHTML;
                const originalContent = document.body.innerHTML;

                document.body.innerHTML = printContent;
                window.print();
                document.body.innerHTML = originalContent;
                window.location.reload(); // State kurtarmak için reload at
            }
        }, 100);
    };

    const openStockModal = (item: any) => {
        setSelectedItemForStock(item);
        setAddStockAmount("5");
        setStockModalOpen(true);
    };

    const handleUpdateStock = async () => {
        if (!selectedItemForStock) return;
        const amount = parseInt(addStockAmount, 10);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Geçerli bir ekleme miktarı girin.");
            return;
        }

        setIsUpdatingStock(true);
        const newStock = selectedItemForStock.stock + amount;

        const res = await updateBoutiqueStockAction(selectedItemForStock.id, newStock);
        if (res.success) {
            toast.success("Stok başarıyla güncellendi.");
            setStockModalOpen(false);
            loadItems(); // Verileri tazelemek için liste tekrar yüklenir
        } else {
            toast.error(res.message || "Stok güncellenirken hata oluştu.");
        }
        setIsUpdatingStock(false);
    };

    return (
        <div className="space-y-6 animate-in-fade pb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Shirt className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Butik (Mağaza) Stokları</h1>
                    <p className="text-muted-foreground text-sm">Giyim ve eşya deposunu yönetin, barkod etiketleri yazdırın.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form Alanı */}
                <Card className="lg:col-span-1 h-fit border border-border shadow-sm">
                    <CardHeader className="bg-muted/30 border-b border-border pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                            <Plus className="w-4 h-4" /> Yeni Ürün Girişi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Barkod (Opsiyonel)</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Üzerinde barkod varsa okutunuz..."
                                        value={barcode}
                                        onChange={e => setBarcode(e.target.value)}
                                        className="bg-background flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-10 h-10 p-0 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        onClick={() => setIsScannerOpen(true)}
                                    >
                                        <BarcodeIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">Boş bırakırsanız sistem otomatik barkod üretecektir.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Ürün Adı *</label>
                                <Input
                                    placeholder="Örn: Erkek Kışlık Mont"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="bg-background"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Kategori</label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Mont">Mont / Kaban</SelectItem>
                                            <SelectItem value="Kazak">Kazak / Hırka</SelectItem>
                                            <SelectItem value="Pantolon">Pantolon</SelectItem>
                                            <SelectItem value="Ayakkabi">Ayakkabı</SelectItem>
                                            <SelectItem value="Diger">Diğer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Cinsiyet</label>
                                    <Select value={gender} onValueChange={setGender}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ERKEK">Erkek</SelectItem>
                                            <SelectItem value="KADIN">Kadın</SelectItem>
                                            <SelectItem value="COCUK">Çocuk</SelectItem>
                                            <SelectItem value="UNISEX">Unisex</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Beden</label>
                                    <Input
                                        placeholder="S, M, 38..."
                                        value={size}
                                        onChange={e => setSize(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Eklenecek Stok</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={stock}
                                        onChange={e => setStock(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-foreground">Harcanacak Kredi / Hak Miktarı</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={points}
                                    onChange={e => setPoints(e.target.value)}
                                    className="bg-muted font-bold"
                                />
                                <p className="text-[10px] text-muted-foreground">Hanenin butik limitinden kaç puan/parça düşürülecek? (Genelde 1 seçilir)</p>
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full font-semibold h-10 mt-4">
                                {isSubmitting ? "Kaydediliyor..." : "Yeni Ürün Olarak Kaydet"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Liste Alanı */}
                <Card className="lg:col-span-2 shadow-sm border border-border">
                    <CardHeader className="bg-muted/30 border-b border-border flex flex-row justify-between items-center py-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                            <BarcodeIcon className="w-4 h-4" /> Envanter Listesi
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Barkod veya isim ara..."
                                className="pl-8 h-8 text-xs bg-background"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-20 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="py-3 px-4 font-semibold text-xs">BARKOD / İSİM</TableHead>
                                            <TableHead className="py-3 px-4 font-semibold text-xs">ÖZELLİK</TableHead>
                                            <TableHead className="py-3 px-4 font-semibold text-xs text-center">STOK</TableHead>
                                            <TableHead className="py-3 px-4 font-semibold text-xs text-center">KREDİ</TableHead>
                                            <TableHead className="py-3 px-4 text-right font-semibold text-xs">İŞLEMLER</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">Ürün bulunamadı.</TableCell>
                                            </TableRow>
                                        ) : filteredItems.map(item => (
                                            <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                                                <TableCell className="p-4">
                                                    <div className="font-semibold text-sm text-foreground">{item.name}</div>
                                                    <div className="font-mono text-xs text-muted-foreground mt-0.5">{item.barcode}</div>
                                                </TableCell>
                                                <TableCell className="p-4 text-xs">
                                                    <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium mr-1">{item.category}</span>
                                                    <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium mr-1">{item.gender}</span>
                                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold border border-primary/20">Bdn: {item.size}</span>
                                                </TableCell>
                                                <TableCell className="p-4 text-center">
                                                    <span className={`font-bold text-sm ${item.stock <= 5 ? 'text-destructive' : 'text-emerald-500'}`}>
                                                        {item.stock}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="p-4 text-center font-medium text-xs text-muted-foreground">
                                                    {item.points} Puan
                                                </TableCell>
                                                <TableCell className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                            onClick={() => openStockModal(item)}
                                                        >
                                                            <PackagePlus className="w-3.5 h-3.5 mr-1.5" /> Stok Ekle
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 group hover:bg-primary/10 hover:text-primary transition-colors"
                                                            onClick={() => handlePrint(item)}
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                            <span className="sr-only">Yazdır</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Stok Ekleme Modalı */}
            <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PackagePlus className="w-5 h-5 text-emerald-600" /> Hızlı Stok Ekleme
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItemForStock && (
                                <span className="block mt-2 font-medium text-foreground">
                                    <strong>{selectedItemForStock.name}</strong> ürününe yeni partiler eklenecek. Mevcut Stok: <span className="text-emerald-600 font-bold">{selectedItemForStock.stock}</span>
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="addAmount" className="font-bold text-xs text-muted-foreground">EKLENECEK ADET (Örn: 5)</Label>
                        <Input
                            id="addAmount"
                            type="number"
                            min="1"
                            value={addStockAmount}
                            onChange={(e) => setAddStockAmount(e.target.value)}
                            className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-2">Girdiğiniz adet, mevcut stokla toplanacaktır.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStockModalOpen(false)}>İptal</Button>
                        <Button onClick={handleUpdateStock} disabled={isUpdatingStock} className="bg-emerald-600 hover:bg-emerald-700">
                            {isUpdatingStock ? "Ekleniyor..." : "Stoka Ekle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Gizli Yazdırma Alanı (Görünmez, sadece print edilirken aktif) */}
            <div className="hidden">
                <div ref={printRef} className="print-container">
                    {printItem && (
                        <div style={{ width: '50mm', height: '30mm', padding: '2mm', boxSizing: 'border-box', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: 'white', color: 'black' }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Dernek Butik
                            </div>
                            <div style={{ fontSize: '9px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {printItem.name} ({printItem.size})
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                                <Barcode
                                    value={printItem.barcode}
                                    width={1.2}
                                    height={25}
                                    fontSize={10}
                                    margin={0}
                                    displayValue={true}
                                />
                            </div>
                            <div style={{ fontSize: '8px', color: '#666' }}>
                                {printItem.gender} - {printItem.category} - {-printItem.points} Kredi
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <StandaloneScannerModal
                open={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={(code) => {
                    setBarcode(code);
                    setIsScannerOpen(false);
                    toast.success("Barkod okundu: " + code);
                }}
                title="Ürün Barkodu Okut"
                description="Kamerayı giysinin üzerindeki barkoda hizalayın. Barkod otomatik algılanıp forma eklenecektir."
            />
        </div>
    );
}
