"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FileSignature, Send } from "lucide-react";
import { createDocumentedDeliveryAction } from "@/app/actions/item";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DocumentDeliveryModalProps {
    itemId: string;
    itemName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DocumentDeliveryModal({ itemId, itemName, open, onOpenChange }: DocumentDeliveryModalProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quantity, setQuantity] = useState("");
    const [targetEntity, setTargetEntity] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            toast.error("Lütfen geçerli bir miktar girin.");
            return;
        }

        if (!targetEntity.trim()) {
            toast.error("Lütfen alıcı kurum/kişi adını girin.");
            return;
        }

        setIsSubmitting(true);
        const result = await createDocumentedDeliveryAction(itemId, parsedQuantity, targetEntity.trim(), notes.trim());
        setIsSubmitting(false);

        if (result.success && result.inventoryId) {
            toast.success("Belgeli teslimat başarıyla kaydedildi.", {
                description: "Teslim tesellüm tutanağı otomatik olarak açılıyor..."
            });
            onOpenChange(false);

            // Yönlendirmeyi yap: Yazdırılabilir Tutanak Sayfasına git
            router.push(`/yardim-turleri/belge/${result.inventoryId}`);

            // Formu sıfırla
            setQuantity("");
            setTargetEntity("");
            setNotes("");
        } else {
            toast.error("Hata", {
                description: result.error || "İşlem sırasında bir sorun oluştu."
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-border/50 shadow-2xl">
                <div className="bg-amber-500 p-6 text-white text-center">
                    <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                        <FileSignature className="w-6 h-6 text-white" />
                    </div>
                    <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2">
                        Belge İle Teslimat
                    </DialogTitle>
                    <DialogDescription className="text-amber-100 font-medium text-sm mt-1">
                        Dış kurumlara veya kişilere yapılacak resmi, ıslak imzalı teslimat formu.
                    </DialogDescription>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-secondary/30 rounded-xl p-3 border border-border/50 text-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Seçili Malzeme</span>
                        <div className="text-lg font-black text-foreground">{itemName}</div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-foreground">Teslim Edilecek Miktar</Label>
                            <Input
                                type="number"
                                required
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="h-12 bg-background border-border text-lg font-bold placeholder:font-normal placeholder:text-muted-foreground/50"
                                placeholder="Örn: 2000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-foreground">Alıcı Kurum / Kişi Adı</Label>
                            <Input
                                type="text"
                                required
                                value={targetEntity}
                                onChange={(e) => setTargetEntity(e.target.value)}
                                className="h-10 bg-background border-border placeholder:text-muted-foreground/50"
                                placeholder="Örn: X Derneği, Y Okulu, Veli Yılmaz"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-foreground">Teslimat Notu <span className="text-muted-foreground/50 font-normal">(İsteğe Bağlı)</span></Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="resize-none bg-background border-border placeholder:text-muted-foreground/50"
                                placeholder="Plaka numarası, ek açıklamalar vb."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2 border-t border-border/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="w-full sm:w-auto hover:bg-muted font-bold text-muted-foreground"
                        >
                            İPTAL
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 shadow-lg shadow-amber-500/20"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmitting ? "KAYDEDİLİYOR..." : "OLUŞTUR VE YAZDIR"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
