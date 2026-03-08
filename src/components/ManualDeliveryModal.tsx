"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createManualDeliveryAction } from "@/app/actions/delivery";
import { getActiveDistributionEventsAction } from "@/app/actions/distribution";
import { toast } from "sonner";
import { ShoppingBag, CheckCircle, Package, Search } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    householdId: string;
    householdName?: string;
}

export function ManualDeliveryModal({ open, onClose, householdId, householdName }: Props) {
    const [events, setEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const [selectedEventId, setSelectedEventId] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            loadEvents();
            setSelectedEventId("");
            setNotes("");
        }
    }, [open]);

    async function loadEvents() {
        setLoadingEvents(true);
        const res = await getActiveDistributionEventsAction();
        if (res.success && res.data) {
            setEvents(res.data);
        }
        setLoadingEvents(false);
    }

    async function handleSubmit() {
        if (!selectedEventId) {
            toast.error("Lütfen teslim edilecek kampanya veya paketi seçin.");
            return;
        }

        setSubmitting(true);
        const res = await createManualDeliveryAction(householdId, selectedEventId, notes);
        setSubmitting(false);

        if (res.success) {
            toast.success("Manuel yardım teslimatı başarıyla kaydedildi ve stoktan düşüldü.");
            onClose();
        } else {
            toast.error(res.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        Manuel Yardım Teslimatı
                    </DialogTitle>
                    <DialogDescription>
                        {householdName
                            ? <><strong className="text-foreground">{householdName}</strong> adına anında elden teslimat kaydı oluşturuyorsunuz.</>
                            : "Seçili hane için anında elden teslimat kaydı oluşturuyorsunuz."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Kampanya / Yardım Türü</label>
                        <Select disabled={loadingEvents} value={selectedEventId} onValueChange={setSelectedEventId}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingEvents ? "Kampanyalar yükleniyor..." : "Bir dağıtım paketi seçiniz"} />
                            </SelectTrigger>
                            <SelectContent>
                                {events.length === 0 && !loadingEvents && (
                                    <SelectItem value="none" disabled>Aktif kampanya bulunamadı</SelectItem>
                                )}
                                {events.map(ev => (
                                    <SelectItem key={ev.id} value={ev.id}>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-emerald-500" />
                                            <span>{ev.name}</span>
                                            {ev.item && (
                                                <span className="text-[10px] bg-secondary px-1.5 rounded ml-2">Stok: {ev.item.stock}</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Teslimat Notu (Opsiyonel)</label>
                        <Textarea
                            placeholder="Ziyaret esnasında elden teslim edilmiştir vb."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>İptal</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !selectedEventId} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {submitting ? "Kaydediliyor..." : "Teslimatı Kaydet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
