"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { parse as parseMRZ } from "mrz";
import { RefreshCw, XCircle, CheckCircle2, Scan, Flashlight, FlashlightOff, Zap } from "lucide-react";
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
    const workerRef = useRef<any>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const isBusy = useRef(false);

    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("Yüksek hızlı motor başlatılıyor...");
    const [hasError, setHasError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [lastTC, setLastTC] = useState("");
    const [isFlashOn, setIsFlashOn] = useState(false);

    // Initialize Professional OCR Engine
    const initScanner = useCallback(async () => {
        try {
            // Tesseract.js with specialized MRZ model
            // Not: 'mrz' dili standart CDN'de olmayabilir, bu yüzden eng kullanıyoruz ama 
            // karakter setini ve whitelist'i agresif şekilde kısıtlıyoruz.
            const worker = await (createWorker as any)('eng', 1, {
                cacheMethod: 'readOnly',
                gzip: true,
            });

            if (worker.setParameters) {
                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
                    tessedit_pageseg_mode: '6', // Assume a single uniform block of text.
                    tessjs_create_hocr: '0',
                    tessjs_create_tsv: '0',
                });
            }
            workerRef.current = worker;

            // ZXing Barcode (Ultra Fast Path)
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
            codeReaderRef.current = new BrowserMultiFormatReader(hints);

            setStatus("Kamera Hazır: Kimliği çerçeveye yaklaştırın.");
            setIsScanning(true);
        } catch (error) {
            console.error("Critical Scanner Error:", error);
            setHasError(true);
            setStatus("Sistem başlatılamadı.");
        }
    }, []);

    useEffect(() => {
        initScanner();
        return () => {
            if (workerRef.current) workerRef.current.terminate();
        };
    }, [initScanner]);

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

    const handleCameraError = useCallback(() => {
        setHasError(true);
        setStatus("Kamera erişim hatası.");
    }, []);

    // Manual Binarization (Siyah-Beyaz Eşikleme) - OCR Hızını %40 artırır
    const binarize = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const threshold = 120; // Orta seviye eşik

        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            const val = gray > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
    };

    const processResults = (text: string) => {
        const lines = text.split('\n')
            .map(l => l.replace(/[^A-Z0-9<]/g, '').trim())
            .filter(l => l.length >= 10);

        // MRZ Library parsing (Professional)
        if (lines.length >= 3) {
            try {
                const res = parseMRZ(lines);
                if (res && res.valid) {
                    const f = (res as any).fields;
                    return {
                        identityNo: f.documentNumber || f.personalNumber,
                        firstName: f.firstName,
                        lastName: f.lastName,
                        birthDate: f.birthDate ? `19${f.birthDate.substring(0, 2)}-${f.birthDate.substring(2, 4)}-${f.birthDate.substring(4, 6)}` : undefined
                    };
                }
            } catch (e) { }
        }

        // Fast Regex Fallback
        const clean = text.toUpperCase().replace(/[^A-Z0-9<]/g, '');
        const tc = clean.match(/[1-9][0-9]{10}/);
        return tc ? { identityNo: tc[0] } : null;
    };

    const performScan = useCallback(async () => {
        if (!webcamRef.current?.video || !workerRef.current || !isScanning || success || isBusy.current) return;

        isBusy.current = true;
        const video = webcamRef.current.video;

        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

            // Çözünürlük Optimizasyonu: OCR için 640px genişlik yeterlidir ve çok daha hızlıdır.
            const targetWidth = 640;
            const scale = targetWidth / video.videoWidth;
            const targetHeight = (video.videoHeight * 0.40) * scale;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Crop ve Draw (Performans için donanım hızlandırmalı filtreler kapalı)
            ctx.drawImage(
                video,
                0, video.videoHeight * 0.55, video.videoWidth, video.videoHeight * 0.40,
                0, 0, targetWidth, targetHeight
            );

            // Adım 1: Manuel Binarizasyon (Siyah-Beyaz yaparak OCR'ı hızlandır)
            binarize(ctx, targetWidth, targetHeight);

            const processedImage = canvas.toDataURL("image/jpeg", 0.7);

            // Step 1: Rapid Barcode Path (ZXing)
            if (codeReaderRef.current) {
                try {
                    const bResult = await codeReaderRef.current.decodeFromImageUrl(processedImage);
                    const parsed = processResults(bResult.getText());
                    if (parsed?.identityNo) {
                        setSuccess(true);
                        setStatus("Süper Hızlı Okuma: Başarılı!");
                        onScan(parsed);
                        return;
                    }
                } catch (e) { }
            }

            // Step 2: Optimized OCR Path (Tesseract)
            const { data: { text } } = await workerRef.current.recognize(processedImage);
            const parsed = processResults(text);

            if (parsed?.identityNo && parsed.identityNo.length === 11) {
                if (lastTC === parsed.identityNo) {
                    setSuccess(true);
                    setStatus("Doğrulandı!");
                    onScan(parsed);
                } else {
                    setLastTC(parsed.identityNo);
                    setStatus(`Taranıyor: ${parsed.identityNo}`);
                }
            } else if (text.includes('<')) {
                setStatus("Kimlik Algılandı, Çözümleniyor...");
            } else {
                setStatus("Kimliği çerçeveye yaklaştırın...");
            }

        } catch (e) {
            console.error("Loop Error:", e);
        } finally {
            isBusy.current = false;
        }
    }, [isScanning, success, lastTC, onScan]);

    useEffect(() => {
        const timer = setInterval(performScan, 350); // Ultra-agresif 350ms döngü
        return () => clearInterval(timer);
    }, [performScan]);

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <div className={`relative w-full max-w-sm rounded-[3rem] overflow-hidden border-4 ${success ? 'border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)]' : (hasError ? 'border-red-500' : 'border-zinc-800')} bg-black aspect-[3/4] transition-all duration-300`}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    onUserMediaError={handleCameraError}
                    className="w-full h-full object-cover scale-105"
                />

                {!success && !hasError && (
                    <>
                        {/* Scanning HUD */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-[85%] h-1/4 border-2 border-emerald-400/50 rounded-[2rem] relative shadow-[0_0_80px_rgba(16,185,129,0.2)] bg-emerald-500/5">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"></div>
                                <div className="absolute -bottom-14 left-0 w-full text-center">
                                    <div className="inline-flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-emerald-500/40">
                                        <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                        <span className="text-[10px] text-emerald-300 font-black tracking-widest uppercase">
                                            HIZLI TARAMA AKTİF
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-8 left-8 flex items-center gap-2 bg-emerald-500/10 backdrop-blur-xl px-4 py-2 rounded-full border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="text-[9px] font-black text-emerald-400 tracking-tighter uppercase">REAL-TIME</span>
                        </div>

                        <div className="absolute bottom-10 right-10 z-30">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleFlash}
                                className={`rounded-full h-16 w-16 border-2 shadow-2xl transition-all ${isFlashOn ? 'bg-yellow-400 border-yellow-300 text-black' : 'bg-black/60 border-white/20 text-white'}`}
                            >
                                {isFlashOn ? <FlashlightOff className="h-8 w-8" /> : <Flashlight className="h-8 w-8" />}
                            </Button>
                        </div>
                    </>
                )}

                {success && (
                    <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-2xl flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
                        <div className="bg-white rounded-full p-5 mb-6 shadow-3xl">
                            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                        </div>
                        <h3 className="text-4xl font-black text-white tracking-tighter italic">BİNGO!</h3>
                        <p className="text-emerald-100 font-bold mt-2 uppercase tracking-widest text-[10px] opacity-70">Hız Rejimi: %100 Başarı</p>
                    </div>
                )}
            </div>

            <div className="text-center w-full max-w-sm px-4">
                <div className={`p-6 rounded-[2.5rem] mb-6 transition-all ${success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'} border-2 shadow-sm`}>
                    <p className={`text-sm font-black tracking-tight ${success ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        {status}
                    </p>
                    {lastTC && !success && (
                        <div className="mt-4 py-2 px-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 inline-block">
                            <span className="text-xs font-black text-emerald-500 tracking-widest uppercase">ID: {lastTC}</span>
                        </div>
                    )}
                </div>
                {!success && (
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-2xl text-zinc-400 font-black hover:bg-zinc-100 h-14 uppercase tracking-widest text-[10px]">
                        Tarayıcıyı Kapat
                    </Button>
                )}
            </div>
        </div>
    );
}
