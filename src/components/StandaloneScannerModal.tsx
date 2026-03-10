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
import { Flashlight } from "lucide-react";

interface StandaloneScannerModalProps {
    open: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
    title?: string;
    description?: string;
    require11Digits?: boolean;
    continuous?: boolean;
}

export function StandaloneScannerModal({
    open,
    onClose,
    onScan,
    title = "Barkod Okuyucu",
    description = "Cihaz kamerasını kullanarak fiziksel barkodları sisteme okutun.",
    require11Digits = false,
    continuous = false
}: StandaloneScannerModalProps) {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [statusText, setStatusText] = useState("Kamera başlatılıyor...");
    const [isScanning, setIsScanning] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastScannedCodeRef = useRef("");
    const lastScanTimeRef = useRef(0);
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    const playBeep = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.error("Audio beep error:", e);
        }
    }, []);

    const toggleFlash = useCallback(async () => {
        const scanner = html5QrCodeRef.current;
        if (scanner && scanner.getState() === 2) { // 2 = SCANNING state
            try {
                await scanner.applyVideoConstraints({
                    advanced: [{ torch: !isFlashOn } as any]
                });
                setIsFlashOn(!isFlashOn);
            } catch (err) {
                console.error("Flaş değiştirme hatası:", err);
                setStatusText("Flaş desteklenmiyor veya açılamadı.");
            }
        }
    }, [isFlashOn]);

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
        setIsFlashOn(false);

        if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
        }

        initTimeoutRef.current = setTimeout(async () => {
            const element = document.getElementById("generic-barcode-reader");
            if (!element) return;

            try {
                if (html5QrCodeRef.current) {
                    await stopCamera();
                }

                const scanner = new Html5Qrcode("generic-barcode-reader", { verbose: false });
                html5QrCodeRef.current = scanner;

                const config = {
                    fps: 20, // Increased for faster scanning
                    qrbox: { width: 280, height: 160 },
                    aspectRatio: 1.0,
                    disableFlip: false, // Ensures reading mirrors is supported if needed
                };

                setStatusText("Barkodu kameraya tutun.");
                await scanner.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        const code = decodedText.trim();
                        if (continuous && lastScannedCodeRef.current === code && (Date.now() - lastScanTimeRef.current < 1500)) {
                            return; // Yineliyen okumayı 1.5 sn engelle
                        }
                        lastScannedCodeRef.current = code;
                        lastScanTimeRef.current = Date.now();

                        if (require11Digits) {
                            const cleanText = code.replace(/\D/g, '');
                            if (cleanText.length === 11) {
                                if (!continuous) stopCamera();
                                playBeep();
                                setStatusText("Başarılı! " + cleanText);
                                onScanRef.current(cleanText);
                            } else {
                                setStatusText(`Hata: 11 hane bulunamadı. (${code})`);
                            }
                        } else {
                            if (!continuous) stopCamera();
                            playBeep();
                            setStatusText("Başarılı! " + code);
                            onScanRef.current(code);
                        }
                    },
                    () => { } // Ignore continuous read errors
                );
            } catch (err: any) {
                console.error("Kamera başlatılamadı:", err);
                setStatusText("Hata: Kamera başlatılamadı.");
                setErrorMsg("Kameraya erişilemedi. Lütfen izinleri ve cihazınızı kontrol edin.");
                setIsScanning(false);
            }
        }, 300); // reduced timeout slightly, but using clear timeout to prevent double runs
    }, [stopCamera, require11Digits, continuous]);

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

                <div className="flex flex-col items-center mt-2 space-y-4 w-full">
                    {isScanning && (
                        <div className="relative w-full aspect-video md:aspect-square md:max-h-[300px] rounded-lg overflow-hidden bg-black border-2 border-border shadow-inner flex items-center justify-center">
                            <div id="generic-barcode-reader" className="w-full h-full object-cover" />
                            <div className="absolute inset-x-8 inset-y-12 border-2 border-primary rounded bg-primary/10 z-10 pointer-events-none flex items-center justify-center">
                                <div className="w-full h-[2px] bg-red-500/80 absolute top-1/2"></div>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute bottom-4 right-4 rounded-full shadow-lg z-20 bg-background/80 hover:bg-background"
                                onClick={toggleFlash}
                            >
                                <Flashlight className={`h-5 w-5 ${isFlashOn ? 'text-yellow-500' : 'text-foreground'}`} />
                            </Button>
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
