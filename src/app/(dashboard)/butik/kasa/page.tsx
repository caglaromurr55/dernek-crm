"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchHouseholdsAction } from "@/app/actions/query";
import { getBoutiqueItemsAction, checkoutBoutiquecartAction } from "@/app/actions/boutique";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, MapPin, CheckCircle, Package, User, ShoppingCart, Trash2, Zap, Clock, AlertTriangle, Barcode } from "lucide-react";
import { StandaloneScannerModal } from "@/components/StandaloneScannerModal";
import { ExternalMrzScanner } from "@/components/ExternalMrzScanner";

export default function BoutiquePOSPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [selectedHousehold, setSelectedHousehold] = useState<any>(null);

    // POS Cart
    const [scannedBarcode, setScannedBarcode] = useState("");
    const [cart, setCart] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Kasa input referansı
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadInventory();
        // Sayfa yüklendiğinde fokuslan
        setTimeout(() => {
            if (barcodeInputRef.current) {
                barcodeInputRef.current.focus();
            }
        }, 500);
    }, []);

    async function loadInventory() {
        const res = await getBoutiqueItemsAction();
        if (res.success && res.data) {
            setInventory(res.data);
        }
    }

    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            const res = await searchHouseholdsAction(searchQuery);
            if (res.success && res.data) {
                setSearchResults(res.data);
            }
            setIsSearching(false);
        }, 500);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [searchQuery]);

    const handleMrzScan = (dataArray: any[]) => {
        if (!Array.isArray(dataArray) || dataArray.length === 0) return;
        const data = dataArray[0];
        if (data && data.identityNo) {
            setSearchQuery(data.identityNo);
            toast.success("Kimlik başarıyla eklendi!");
        } else {
            toast.error("Kimlikte geçerli bir TC no bulunamadı.");
        }
    };

    // Barkod okuyucu 
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = scannedBarcode.trim();
        if (!code) return;

        // Ürünü envanterde bul
        const item = inventory.find(i => i.barcode === code);

        if (!item) {
            toast.error(`"${code}" barkodlu ürün sistemde bulunamadı.`);
            setScannedBarcode("");
            return;
        }

        if (item.stock <= 0) {
            toast.error(`${item.name} stokta kalmamış!`);
            setScannedBarcode("");
            return;
        }

        // Sepete ekle (zaten varsa miktarını artır)
        setCart(prev => {
            const existing = prev.find(p => p.id === item.id);
            if (existing) {
                // Stok kontrolü yap: eklenmek istenen miktar stoktan fazla mı?
                if (existing.quantity >= item.stock) {
                    toast.error(`Maksimum stoka ulaşıldı: ${item.stock}`);
                    return prev;
                }
                return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
            } else {
                return [...prev, { ...item, quantity: 1 }];
            }
        });

        toast.success(`${item.name} sepete eklendi.`);
        setScannedBarcode("");
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(p => p.id !== id));
    };

    const updateQuantity = (id: string, q: number) => {
        if (q <= 0) return removeFromCart(id);
        const itemInInv = inventory.find(i => i.id === id);
        if (itemInInv && q > itemInInv.stock) {
            toast.error(`Stok yetersiz! Max: ${itemInInv.stock}`);
            return;
        }
        setCart(prev => prev.map(p => p.id === id ? { ...p, quantity: q } : p));
    };

    // Cart totals
    const totalPoints = cart.reduce((acc, item) => acc + (item.points * item.quantity), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Limit check
    const householdBalance = selectedHousehold?.boutiqueBalance || 0;
    const isExceedingLimit = totalPoints > householdBalance;

    async function handleCheckout() {
        if (!selectedHousehold) {
            toast.error("Lütfen alışveriş yapacak haneyi seçin.");
            return;
        }
        if (cart.length === 0) {
            toast.error("Sepet boş.");
            return;
        }
        if (isExceedingLimit) {
            toast.error("Hanenin butik bakiyesi / harcama limiti yetersiz!");
            return;
        }

        setSubmitting(true);
        const checkoutItems = cart.map(c => ({ boutiqueItemId: c.id, quantity: c.quantity }));
        const res = await checkoutBoutiquecartAction(selectedHousehold.householdId, checkoutItems);
        setSubmitting(false);

        if (res.success) {
            toast.success("Alışveriş başarıyla tamamlandı!");
            // Reset state
            setCart([]);
            setSelectedHousehold(null);
            setSearchQuery("");
            loadInventory(); // Stokları güncelle
        } else {
            toast.error(res.message);
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in-fade pb-16">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Butik POS Kasa</h1>
                        <p className="text-muted-foreground text-sm">Hızlı barkod okuyucuyla alışveriş sepeti oluşturun.</p>
                    </div>
                </div>
                {/* Hızlı Seçim Modu Göstergesi */}
                <div className="hidden md:flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    Barkod okuyucunuzu klavye modunda kullanabilirsiniz.
                </div>
            </div>

            {/* ÜST SATIR: Hane Seçimi & Barkod Okuyucu (Genişlik Oranı & Yükseklik Hizalandı) */}
            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-8 flex flex-col">
                    {/* HANE SEÇİMİ */}
                    <Card className="shadow-sm border border-border h-full">
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <User className="w-4 h-4" /> 1. Alışveriş Yapan Hane
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            {!selectedHousehold ? (
                                <div className="space-y-4">
                                    <div className="relative flex gap-2 w-full">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="TC Kimlik No veya İsim ile arayın..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 bg-background text-lg h-12"
                                            />
                                            {isSearching && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Aranıyor...</span>
                                            )}
                                        </div>
                                        <div className="shrink-0 flex gap-2">
                                            <ExternalMrzScanner onScan={handleMrzScan} className="h-12 border-emerald-200 text-emerald-600 hover:bg-emerald-50" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-4 max-h-[220px] overflow-y-auto pr-2">
                                        {searchResults.map(h => (
                                            <div
                                                key={h.householdId}
                                                onClick={() => setSelectedHousehold(h)}
                                                className="p-3 bg-background hover:bg-muted border border-border rounded-lg cursor-pointer transition-colors flex justify-between items-center"
                                            >
                                                <div>
                                                    <div className="font-semibold text-foreground">{h.name}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{h.identityNo} - {h.address}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-primary">{h.boutiqueBalance} Kredi Limit</div>
                                                    <div className="text-[10px] text-muted-foreground">HP: {h.score}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground text-lg leading-tight">{selectedHousehold.name}</h3>
                                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedHousehold.identityNo}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Mevcut Bakiye</p>
                                            <p className={`text-xl font-black ${householdBalance > 0 ? 'text-primary' : 'text-destructive'}`}>
                                                {householdBalance} Parça/Kredi
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedHousehold(null)} className="h-8 hover:bg-muted">
                                            Değiştir
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4 flex flex-col">
                    {/* HIZLI OKUTMA */}
                    <Card className={`shadow-sm border border-border h-full transition-opacity ${!selectedHousehold ? 'opacity-50 pointer-events-none' : ''}`}>
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <Zap className="w-4 h-4" /> Barkod Okuyucu Input
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                                <Input
                                    ref={barcodeInputRef}
                                    placeholder="Barkod okutun veya yazın..."
                                    value={scannedBarcode}
                                    onChange={e => setScannedBarcode(e.target.value)}
                                    className="h-14 flex-1 text-center text-xl font-mono tracking-widest bg-background"
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    onClick={() => setIsScannerOpen(true)}
                                    className="h-14 w-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                >
                                    <Barcode className="w-6 h-6" />
                                </Button>
                                <button type="submit" className="hidden">Ekle</button>
                            </form>
                            <p className="text-xs text-center text-muted-foreground">
                                USB Cihazınız veya kamerayla ürün barkodunu okuttuğunuzda otomatik sepete eklenecektir.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ALT SATIR: Sepet & Özet */}
            <div className="grid lg:grid-cols-12 gap-6 mt-6">
                {/* SEPET */}
                <div className="lg:col-span-8 flex flex-col">
                    <Card className={`shadow-sm border border-border h-full transition-opacity ${!selectedHousehold ? 'opacity-50 pointer-events-none' : ''}`}>
                        <CardHeader className="bg-muted/30 border-b border-border py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <Package className="w-4 h-4" /> 2. Okutulan Ürünler (Sepet)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {cart.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                    <ShoppingCart className="w-12 h-12 mb-4 text-muted-foreground" />
                                    <p className="text-lg font-bold">Sepetiniz Boş</p>
                                    <p className="text-sm">Barkod okutarak veya stok listesinden bularak ekleyin.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {cart.map((item, idx) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-lg">{item.name}</p>
                                                    <div className="flex items-center gap-2 text-xs mt-1">
                                                        <span className="text-muted-foreground font-mono">{item.barcode}</span>
                                                        <span className="text-muted-foreground">|</span>
                                                        <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-medium">{item.size}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 bg-secondary text-secondary-foreground p-1 rounded-lg border border-border">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 rounded"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    >-</Button>
                                                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 rounded"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    >+</Button>
                                                </div>
                                                <div className="w-20 text-right">
                                                    <p className="font-black text-primary text-lg">{item.points * item.quantity} KP</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ÖZET & CHECKOUT */}
                <div className="lg:col-span-4 flex flex-col">
                    <Card className={`shadow-md border border-border h-full transition-opacity ${!selectedHousehold ? 'opacity-50 pointer-events-none' : ''}`}>
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <CardTitle className="text-base font-semibold text-foreground">İşlem Özeti</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Sepetteki Ürün:</span>
                                <span className="font-bold">{totalItems} Adet</span>
                            </div>

                            <div className="flex justify-between items-center text-sm border-b border-border pb-4">
                                <span className="text-muted-foreground">Toplam Harcama:</span>
                                <span className="font-black text-xl text-primary">{totalPoints} Kredi Puanı</span>
                            </div>

                            <div className="flex justify-between items-center text-sm pt-2">
                                <span className="text-muted-foreground">Ailenin Kalan Limiti:</span>
                                <span className={`font-black text-xl ${isExceedingLimit ? 'text-destructive' : 'text-primary'}`}>
                                    {householdBalance - totalPoints} Puan
                                </span>
                            </div>

                            {isExceedingLimit && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Uyarı: Ailenin limiti bu sepeti karşılamaya yetmiyor. Bakiye eksilere düşemez. Ürün çıkarın veya limitlerini artırın.</span>
                                </div>
                            )}

                        </CardContent>
                        <div className="p-4 border-t border-border bg-background/50 rounded-b-lg mt-auto">
                            <Button
                                onClick={handleCheckout}
                                disabled={submitting || cart.length === 0 || isExceedingLimit}
                                className="w-full h-14 text-lg font-bold"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                {submitting ? "KAYDEDİLİYOR..." : "ALIŞVERİŞİ ONAYLA"}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <StandaloneScannerModal
                open={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={(code) => {
                    setScannedBarcode(code);
                    setIsScannerOpen(false);
                    // Use timeout to allow state to settle before form submission behavior
                    setTimeout(() => {
                        const evt = { preventDefault: () => { } } as React.FormEvent;
                        handleBarcodeSubmit(evt); // Use the existing handler to act like hitting ENTER
                        toast.info("Barkod algılandı, sepet kontrol ediliyor...");
                    }, 200);
                }}
                title="Ürün Barkodu Oku"
                description="Kamerayı ürün barkoduna sabitleyin. Algılanan barkod otomatik olarak sepete aktarılır."
            />
        </div>
    );
}
