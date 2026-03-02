"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { XCircle, CheckCircle2, Scan, Flashlight, FlashlightOff, Zap, Barcode } from "lucide-react";
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
    const webcamRef = useRef<Webcam>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const isBusy = useRef(false);

    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("Barkod tarayıcı hazırlanıyor...");
    const [hasError, setHasError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);

    // Initialize High-Performance Barcode Engine
    const initScanner = useCallback(async () => {
        try {
            // ZXing for Barcodes (PDF417 focus)
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE]);
            hints.set(DecodeHintType.TRY_HARDER, true); // We can afford this now without OCR

            codeReaderRef.current = new BrowserMultiFormatReader(hints);

            setStatus("Kimliğin arka yüzündeki barkodu çerçeveye ortalayın.");
            setIsScanning(true);
        } catch (error) {
            console.error("Scanner Init Error:", error);
            setHasError(true);
            setStatus("Tarayıcı başlatılamadı.");
        }
    }, []);

    useEffect(() => {
        initScanner();
    }, [initScanner]);

    const handleCameraError = useCallback(() => {
        setHasError(true);
        setStatus("Kamera izni verilmedi veya erişilemiyor.");
    }, []);

    const toggleFlash = useCallback(async () => {
        if (!webcamRef.current?.video) return;
        const stream = webcamRef.current.video.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        try {
            const capabilities = track.getCapabilities() as any;
            if (capabilities.torch) {
                await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] } as any);
                setIsFlashOn(!isFlashOn);
            }
        } catch (e) { }
    }, [isFlashOn]);

    const processBarcodeData = (text: string) => {
        // Turkish ID Barcode (PDF417) often contains tab or semicolon separated data
        // Pattern: TCNO;SURNAME;NAME;BIRTHDATE...
        const parts = text.split(/[;\t\n]/).map(p => p.trim());

        if (parts.length >= 1) {
            // Find 11 digit TC
            const tc = parts.find(p => /^[1-9][0-9]{10}$/.test(p));
            if (tc) {
                // Heuristic for name/surname if available
                const surname = parts[1] && parts[1].length > 1 ? parts[1] : undefined;
                const name = parts[2] && parts[2].length > 1 ? parts[2] : undefined;
                let birthDate = parts[3] && parts[3].length === 8 ? parts[3] : undefined;

                if (birthDate) {
                    // Format DDMMYYYY to YYYY-MM-DD
                    birthDate = `${birthDate.substring(4, 8)}-${birthDate.substring(2, 4)}-${birthDate.substring(0, 2)}`;
                }

                return {
                    identityNo: tc,
                    firstName: name,
                    lastName: surname,
                    birthDate: birthDate
                };
            }
        }

        // Manual fallback for raw TC in any barcode
        const rawMatch = text.match(/[1-9][0-9]{10}/);
        return rawMatch ? { identityNo: rawMatch[0] } : null;
    };

    const performScan = useCallback(async () => {
        if (!webcamRef.current?.video || !codeReaderRef.current || !isScanning || success || isBusy.current) return;

        isBusy.current = true;
        const video = webcamRef.current.video;

        try {
            // ZXing can take the video element directly for maximum speed
            const result = await codeReaderRef.current.decodeFromVideoElement(video);
            if (result) {
                const parsed = processBarcodeData(result.getText());
                if (parsed?.identityNo) {
                    // Success feedback
                    if (navigator.vibrate) navigator.vibrate(200);

                    setSuccess(true);
                    setStatus("Barkod Başarıyla Okundu!");
                    onScan(parsed);
                }
            }
        } catch (e) {
            // decodeFromVideoElement throws if no barcode found in frame, continue loop
        } finally {
            // Small delay to prevent CPU hammering
            setTimeout(() => {
                isBusy.current = false;
            }, 100);
        }
    }, [isScanning, success, onScan]);

    useEffect(() => {
        const interval = setInterval(performScan, 200); // 200ms check (very fast)
        return () => clearInterval(interval);
    }, [performScan]);

    return (
        <div className="flex flex-col items-center space-y-6 p-6 max-w-lg mx-auto bg-card rounded-[3rem] shadow-2xl border-4 border-primary/10">
            <div className={`relative w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 ${success ? 'border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.3)]' : 'border-zinc-800'} bg-black`}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        facingMode: "environment",
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }}
                    onUserMediaError={handleCameraError}
                    className="w-full h-full object-cover"
                />

                {!success && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        {/* Target area for PDF417 - Wide and short */}
                        <div className="w-[90%] h-1/5 border-2 border-emerald-400/60 rounded-xl relative bg-emerald-500/5 backdrop-blur-[1px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"></div>
                            <div className="absolute -top-10 left-0 w-full flex justify-center">
                                <div className="bg-black/60 px-4 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-md">
                                    <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">BARKODU HİZALAYIN</span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-8 text-white/60 text-[10px] uppercase font-bold tracking-tighter bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                            Kimliğin arka yüzündeki siyah barkodu gösterin
                        </p>
                    </div>
                )}

                {success && (
                    <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-2xl flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-500">
                        <div className="bg-white rounded-full p-6 mb-6 shadow-4xl animate-bounce">
                            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">OKUNDU!</h2>
                        <p className="text-emerald-100 font-bold opacity-80 uppercase tracking-widest text-[10px] mt-2">Sisteme Aktarılıyor</p>
                    </div>
                )}

                <div className="absolute bottom-8 right-8 z-30">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleFlash}
                        className={`rounded-full h-14 w-14 border-2 shadow-2xl transition-all ${isFlashOn ? 'bg-yellow-400 border-yellow-300 text-black' : 'bg-black/40 border-white/20 text-white'}`}
                    >
                        {isFlashOn ? <FlashlightOff className="h-7 w-7" /> : <Flashlight className="h-7 w-7" />}
                    </Button>
                </div>
            </div>

            <div className="w-full space-y-4">
                <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center justify-center gap-3 mb-1">
                        {!success && <Barcode className="w-4 h-4 text-primary animate-pulse" />}
                        <p className={`text-sm font-black text-center tracking-tight uppercase ${success ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {status}
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
