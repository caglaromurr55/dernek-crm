"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { XCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface StandaloneScannerModalProps {
    open: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
    title?: string;
    description?: string;
    require11Digits?: boolean;
}

export function StandaloneScannerModal({
    open,
    onClose,
    onScan,
    title = "Barkod Okuyucu",
    description = "Cihaz kamerasını kullanarak fiziksel barkodları sisteme okutun.",
    require11Digits = false
}: StandaloneScannerModalProps) {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [statusText, setStatusText] = useState("Kamera başlatılıyor...");
    const [isScanning, setIsScanning] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const stopCamera = useCallback(async () => {
        const scanner = html5QrCodeRef.current;
        if (scanner) {
            html5QrCodeRef.current = null; // Asenkron stop işleminden önce null yapıyoruz ki çift tetiklenmesin
            try {
                if (scanner.isScanning) {
                    await scanner.stop();
                }
            } catch (err) {
                console.error("Kamera durdurma hatası:", err);
            }
            try {
                scanner.clear();
            } catch (e) { }
        }
        setIsScanning(false);
    }, []);

    const startCamera = useCallback(async () => {
        setErrorMsg(null);
        setIsScanning(true);
        setStatusText("Kamera hazırlanıyor...");

        setTimeout(async () => {
            const element = document.getElementById("generic-barcode-reader");
            if (!element) return;

            try {
                if (html5QrCodeRef.current) {
                    await stopCamera();
                }

                html5QrCodeRef.current = new Html5Qrcode("generic-barcode-reader", { verbose: false });

                const config = {
                    fps: 15,
                    qrbox: { width: 280, height: 160 },
                    aspectRatio: 1.0
                };

                setStatusText("Barkodu kameraya tutun.");
                await html5QrCodeRef.current.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (require11Digits) {
                            const cleanText = decodedText.trim().replace(/\D/g, '');
                            if (cleanText.length === 11) {
                                stopCamera();
                                onScan(cleanText);
                            } else {
                                setStatusText(`Hata: 11 hane bulunamadı. (${decodedText})`);
                            }
                        } else {
                            stopCamera();
                            onScan(decodedText.trim());
                        }
                    },
                    () => { }
                );
            } catch (err: any) {
                console.error("Kamera başlatılamadı:", err);
                setStatusText("Hata: Kamera başlatılamadı.");
                setErrorMsg("Kameraya erişilemedi. Lütfen izinleri ve HTTPS bağlantısını kontrol edin.");
                setIsScanning(false);
            }
        }, 600);
    }, [stopCamera, require11Digits, onScan]);

    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
            setErrorMsg(null);
        }

        return () => {
            stopCamera();
        };
    }, [open, startCamera, stopCamera]);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md bg-background text-foreground border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-primary" /> {title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center mt-2 space-y-4">
                    {isScanning && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border-2 border-border shadow-inner">
                            <div id="generic-barcode-reader" className="w-full h-full" />
                            <div className="absolute inset-x-8 inset-y-12 border-2 border-primary rounded bg-primary/10 z-10 pointer-events-none flex items-center justify-center">
                                <div className="w-full h-[2px] bg-red-500/80 absolute top-1/2"></div>
                            </div>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg w-full text-center">
                            <XCircle className="mx-auto h-12 w-12 text-destructive mb-3" />
                            <h3 className="text-lg font-semibold text-destructive">Kamera Hatası</h3>
                            <p className="text-sm text-destructive/80 mt-2">{errorMsg}</p>
                            <Button
                                variant="outline"
                                className="mt-6 border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={startCamera}
                            >
                                Tekrar Dene
                            </Button>
                        </div>
                    )}

                    {!errorMsg && (
                        <p className="text-xs text-center text-muted-foreground font-mono bg-muted/50 border border-border px-4 py-2 rounded shadow-sm w-full">
                            {statusText}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
