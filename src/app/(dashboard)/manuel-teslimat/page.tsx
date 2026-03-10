"use client";

import React, { useState, useEffect } from "react";
import { searchHouseholdsAction } from "@/app/actions/query";
import { getActiveDistributionEventsAction } from "@/app/actions/distribution";
import { createManualDeliveryAction } from "@/app/actions/delivery";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, MapPin, CheckCircle, Package, User, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ManualDeliveryPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const [selectedEventId, setSelectedEventId] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

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

    async function loadEvents() {
        setLoadingEvents(true);
        const res = await getActiveDistributionEventsAction();
        if (res.success && res.data) {
            setEvents(res.data);
        }
        setLoadingEvents(false);
    }

    async function handleSubmit() {
        if (!selectedHousehold) {
            toast.error("Lütfen teslim edilecek haneyi veya kişiyi seçin.");
            return;
        }
        if (!selectedEventId) {
            toast.error("Lütfen teslim edilecek kampanya veya paketi seçin.");
            return;
        }

        setSubmitting(true);
        const res = await createManualDeliveryAction(selectedHousehold.householdId, selectedEventId, notes);
        setSubmitting(false);

        if (res.success) {
            toast.success("Manuel yardım teslimatı başarıyla kaydedildi ve stoktan düşüldü.");
            // Reset form
            setSelectedHousehold(null);
            setSearchQuery("");
            setNotes("");
            setSelectedEventId("");
            router.refresh();
        } else {
            toast.error(res.message);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in-fade pb-16">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Manuel Yardım Teslimatı</h1>
                    <p className="text-muted-foreground text-sm">Listeden bağımsız anlık elden yardım teslimatları girin ve stoktan düşün.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Sol Taraf: Arama */}
                <div className="space-y-6">
                    <Card className="glass-card border-0 shadow-lg">
                        <CardHeader className="bg-secondary/40 border-b border-border/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2"><User className="w-4 h-4" /> 1. Alıcıyı Bul</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {!selectedHousehold ? (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="TC Kimlik No veya İsim ile arayın..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 bg-background border-border focus:ring-emerald-500/20"
                                        />
                                        {isSearching && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Arama yapılıyor...</span>
                                        )}
                                    </div>
                                    <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                                        {searchResults.map(h => (
                                            <div
                                                key={h.householdId}
                                                onClick={() => setSelectedHousehold(h)}
                                                className="p-3 bg-background hover:bg-muted border border-border rounded-lg cursor-pointer transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-primary">{h.name}</span>
                                                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{h.score} HP</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex gap-3">
                                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {h.identityNo}</span>
                                                    <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {h.address}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-foreground">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-primary text-lg">{selectedHousehold.name}</h3>
                                            <p className="text-sm text-muted-foreground font-mono">{selectedHousehold.identityNo}</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedHousehold(null)} className="h-7 text-xs border-border hover:bg-muted">Değiştir</Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-2 p-2 bg-muted/50 rounded">
                                        <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {selectedHousehold.address}</span>
                                        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> HP: {selectedHousehold.score} | Durum: {selectedHousehold.status}</span>
                                    </div>
                                    {selectedHousehold.status !== "APPROVED" && selectedHousehold.status !== "APPROVED_ONCE" && (
                                        <div className="mt-3 flex items-start gap-2 text-amber-500 bg-amber-500/10 p-2 rounded text-xs border border-amber-500/20">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>Dikkat: Bu hane başvuru durumu "Onaylı" değil. Ancak yine de manuel teslimat girmenize izin verilmektedir.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sağ Taraf: Yardım Seçimi */}
                <div className="space-y-6">
                    <Card className={`glass-card border-0 shadow-lg transition-opacity ${!selectedHousehold ? 'opacity-50 pointer-events-none' : ''}`}>
                        <CardHeader className="bg-secondary/40 border-b border-border/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4" /> 2. Ne Teslim Edilecek?</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Aktif Yardım Kampanyası</label>
                                <Select disabled={loadingEvents} value={selectedEventId} onValueChange={setSelectedEventId}>
                                    <SelectTrigger className="bg-background border-border">
                                        <SelectValue placeholder={loadingEvents ? "Kampanyalar yükleniyor..." : "Bir dağıtım paketi seçiniz..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.length === 0 && !loadingEvents && (
                                            <SelectItem value="none" disabled>Aktif kampanya bulunamadı</SelectItem>
                                        )}
                                        {events.map(ev => (
                                            <SelectItem key={ev.id} value={ev.id}>
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-primary" />
                                                    <span>{ev.name}</span>
                                                    {ev.item && (
                                                        <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 rounded ml-2">Stok: {ev.item.stock}</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-semibold text-foreground">Teslimat Notu (Opsiyonel)</label>
                                <Textarea
                                    placeholder="Dernek bürosunda elden teslim edildi vb."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="resize-none bg-background border-border"
                                />
                            </div>

                            <div className="pt-4 border-t border-border/50 mt-6 pb-2">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting || !selectedEventId || !selectedHousehold}
                                    className="w-full h-12 text-md font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    {submitting ? "KAYDEDİLİYOR..." : "TESLİMATI ONAYLA"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
