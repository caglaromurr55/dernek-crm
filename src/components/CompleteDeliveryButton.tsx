"use client";

import { useState, useRef, useEffect } from "react";
import { Check, CheckCircle2, PackageCheck, ScanLine, X, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { completeDeliveryAction } from "@/app/actions/delivery";
import SignatureCanvas from 'react-signature-canvas';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { toast } from "sonner";

export function CompleteDeliveryButton({ deliveryId, allowedIdentities }: { deliveryId: string, allowedIdentities: string[] }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"VERIFICATION" | "SIGNATURE">("VERIFICATION");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Verification State
    const [tcInput, setTcInput] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // Signature State
    const sigPad = useRef<SignatureCanvas>(null);

    // Stop scanning on unmount or when step changes
    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, []);

    const stopScanning = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
            } catch (err) {
                console.error("Kamera durdurma hatası:", err);
            }
            html5QrCodeRef.current = null;
        }
        setIsScanning(false);
    };

    const startScanning = async () => {
        setErrorMsg("");
        setIsScanning(true);

        // Div render olmasını bekleyelim
        setTimeout(async () => {
            try {
                const element = document.getElementById("delivery-barcode-reader");
                if (!element) return;

                if (html5QrCodeRef.current) {
                    await stopScanning();
                }

                html5QrCodeRef.current = new Html5Qrcode("delivery-barcode-reader");

                const config = {
                    fps: 15,
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.0
                };

                await html5QrCodeRef.current.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        setTcInput(decodedText.trim());
                        stopScanning();
                    },
                    () => { }
                );
            } catch (err) {
                console.error(err);
                setErrorMsg("Kamera başlatılamadı. Lütfen izinleri ve SSL bağlantısını kontrol edin.");
                setIsScanning(false);
            }
        }, 600);
    };

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!tcInput) {
            setErrorMsg("Lütfen TC Kimlik numarası girin.");
            return;
        }

        // Teyit: Girilen veya okutulan TC hane bireylerinden birine ait mi?
        if (allowedIdentities.includes(tcInput.trim())) {
            // Başarılı, imza ekranına geç
            stopScanning();
            setStep("SIGNATURE");
        } else {
            setErrorMsg("Hata: Bu TC kimlik numarası hanede kayıtlı sakinlerden birine ait değil!");
        }
    };

    const handleComplete = async () => {
        if (!sigPad.current || sigPad.current.isEmpty()) {
            setErrorMsg("Lütfen teslimatı alan kişinin imzasını alın.");
            return;
        }

        setIsSubmitting(true);
        setErrorMsg("");

        // İmza verisini Base64 olarak al
        const signatureData = sigPad.current.getTrimmedCanvas().toDataURL("image/png");

        const formData = new FormData();
        formData.append("deliveryId", deliveryId);
        formData.append("signatureData", signatureData);

        try {
            const res = await completeDeliveryAction(formData);

            if (res.success) {
                setIsSuccess(true);
                setOpen(false);
                toast.success("Teslimat onaylandı", {
                    description: "Hane teslimatı başarıyla kaydedildi ve puanlar güncellendi.",
                });
            } else {
                setErrorMsg(res.message || "Bilinmeyen hata");
                toast.error("Teslimat hatası", {
                    description: res.message
                });
            }
        } catch (err) {
            setErrorMsg("Sunucu hatası.");
            toast.error("Sunucu bağlantı hatası oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Button variant="outline" className="flex-1 border-emerald-500 text-emerald-600 bg-emerald-50 pointer-events-none w-full" disabled>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Teslim Edildi
            </Button>
        );
    }

    return (
        <div className="w-full flex">
            <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setOpen(true)}
            >
                <PackageCheck className="mr-2 h-4 w-4" /> Teslim Et
            </Button>

            <Dialog open={open} onOpenChange={(val) => {
                if (!val) {
                    stopScanning();
                    setStep("VERIFICATION");
                    setTcInput("");
                    setErrorMsg("");
                }
                setOpen(val);
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{step === "VERIFICATION" ? "Kimlik Teyidi" : "Teslimat İmzası"}</DialogTitle>
                        <DialogDescription>
                            {step === "VERIFICATION"
                                ? "Teslimatı yapmadan önce paketi alan kişinin (Hane sakini) TC kimliğini girin veya kimlik barkodunu okutun."
                                : "Lütfen teslim alan kişiden elektronik imza alın."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                            {errorMsg}
                        </div>
                    )}

                    {step === "VERIFICATION" ? (
                        <form onSubmit={handleVerifySubmit} className="space-y-4 py-4">

                            {isScanning ? (
                                <div className="space-y-2 relative border rounded-lg overflow-hidden bg-black flex justify-center w-full aspect-video">
                                    <div id="delivery-barcode-reader" className="h-full w-full" />
                                    <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 rounded-full h-8 w-8 z-20" onClick={() => stopScanning()}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Button type="button" variant="outline" className="w-full h-12" onClick={startScanning}>
                                        <ScanLine className="h-5 w-5 mr-2" />
                                        Kameradan Kimlik Barkodu Okut
                                    </Button>
                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                                        <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs">VEYA</span>
                                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tcIdentity">Elle TC Kimlik No</Label>
                                        <Input
                                            id="tcIdentity"
                                            value={tcInput}
                                            onChange={(e) => setTcInput(e.target.value)}
                                            placeholder="11 haneli TC No"
                                            maxLength={11}
                                        />
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={!tcInput} className="w-full bg-blue-600 hover:bg-blue-700">Teyit Et ve İmzaya Geç</Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white">
                                <SignatureCanvas
                                    ref={sigPad}
                                    penColor="black"
                                    canvasProps={{ className: 'w-full h-48 cursor-crosshair' }}
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <Button type="button" variant="ghost" size="sm" onClick={() => sigPad.current?.clear()} className="text-zinc-500">
                                    <Eraser className="h-4 w-4 mr-1" /> Temizle
                                </Button>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setStep("VERIFICATION")} disabled={isSubmitting}>Geri</Button>
                                <Button type="button" onClick={handleComplete} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmitting ? "Kaydediliyor..." : "İmzayı Onayla ve Teslim Et"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
