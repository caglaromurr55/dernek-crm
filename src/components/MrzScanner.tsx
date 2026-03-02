"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { XCircle, CheckCircle2, Scan, RefreshCw, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MrzScannerProps {
    onScan: (data: {
        identityNo?: string;
        firstName?: string;
        lastName?: string;
        birthDate?: string;
    }) => void;
    onClose: () => void;
}

export function MrzScanner({ onScan, onClose }: MrzScannerProps) {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [statusText, setStatusText] = useState("Kamera başlatılıyor...");
    const [isScanning, setIsScanning] = useState(true);
    const [success, setSuccess] = useState(false);

    const stopCamera = useCallback(async () => {
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
    }, []);

    const startCamera = useCallback(async () => {
        setIsScanning(true);
        setStatusText("Kamera hazırlanıyor...");

        // Render için küçük bir gecikme
        setTimeout(async () => {
            const element = document.getElementById("mrz-barcode-reader");
            if (!element) {
                console.error("mrz-barcode-reader elementi bulunamadı");
                return;
            }

            try {
                if (html5QrCodeRef.current) {
                    await stopCamera();
                }

                html5QrCodeRef.current = new Html5Qrcode("mrz-barcode-reader", { verbose: false });

                const config = {
                    fps: 20,
                    qrbox: { width: 300, height: 150 },
                    aspectRatio: 1.0
                };

                setStatusText("Kimliğin arkasındaki barkodu gösterin.");

                await html5QrCodeRef.current.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // Sadece sayısal karakterleri al ve 11 hane mi kontrol et
                        const cleanTc = decodedText.trim().replace(/\D/g, '');
                        if (cleanTc.length === 11) {
                            if (navigator.vibrate) navigator.vibrate(200);
                            setSuccess(true);
                            setStatusText("Barkod Okundu!");
                            stopCamera();
                            onScan({ identityNo: cleanTc });
                        } else {
                            setStatusText("Barkod algılandı ama 11 hane bulunamadı.");
                        }
                    },
                    () => { } // Hataları sessizce geç
                );
            } catch (err: any) {
                console.error("Kamera başlatılamadı:", err);
                setStatusText("Hata: Kamera başlatılamadı.");
                setIsScanning(false);
            }
        }, 300);
    }, [stopCamera, onScan]);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return (
        <div className="flex flex-col items-center space-y-6 p-6 max-w-lg mx-auto bg-card rounded-[3rem] shadow-2xl border-4 border-primary/10">
            <div className={`relative w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 ${success ? 'border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.3)]' : 'border-zinc-800'} bg-black`}>
                <div id="mrz-barcode-reader" className="w-full h-full" />

                {!success && isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                        {/* Target area for PDF417 - Wide and short like qrbox */}
                        <div className="w-[300px] h-[150px] border-2 border-emerald-400/60 rounded-xl relative bg-emerald-500/5 backdrop-blur-[1px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"></div>
                        </div>
                        <div className="mt-8 bg-black/60 px-4 py-2 rounded-full border border-emerald-500/30 backdrop-blur-md">
                            <p className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">
                                BARKODU BURAYA HİZALAYIN
                            </p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-2xl flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-500">
                        <div className="bg-white rounded-full p-6 mb-6 shadow-4xl animate-bounce">
                            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">BAŞARILI!</h2>
                        <p className="text-emerald-100 font-bold opacity-80 uppercase tracking-widest text-[10px] mt-2">TC Kimlik No Alındı</p>
                    </div>
                )}
            </div>

            <div className="w-full space-y-4 text-center">
                <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center justify-center gap-3">
                        {!success && <Barcode className="w-5 h-5 text-primary animate-pulse" />}
                        <p className={`text-sm font-black tracking-tight uppercase ${success ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {statusText}
                        </p>
                    </div>
                </div>

                {!success && (
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-2xl text-zinc-400 font-black h-12 uppercase tracking-[0.2em] text-[10px]">
                        Tarayıcıyı Kapat
                    </Button>
                )}
            </div>
        </div>
    );
}
