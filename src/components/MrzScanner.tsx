"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { parse as parseMRZ } from "mrz";
import { RefreshCw, XCircle, CheckCircle2, Scan, Flashlight, FlashlightOff, Zap, ShieldCheck } from "lucide-react";
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
    const [status, setStatus] = useState("Profesyonel motor hazırlanıyor...");
    const [hasError, setHasError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [lastTC, setLastTC] = useState("");
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [scanCount, setScanCount] = useState(0);

    // Initialize High-Performance Scanner
    const initScanner = useCallback(async () => {
        try {
            // Tesseract OCR - OCR-B Optimized
            const worker = await (createWorker as any)('eng', 1, {
                cacheMethod: 'readOnly',
                gzip: true,
                logger: (m: any) => {
                    if (m.status === 'recognizing text' && m.progress === 1) {
                        setScanCount(c => c + 1);
                    }
                }
            });

            if (worker.setParameters) {
                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
                    tessedit_pageseg_mode: '6', // Structured block
                    tessjs_create_hocr: '0',
                    tessjs_create_tsv: '0',
                });
            }
            workerRef.current = worker;

            // ZXing Barcode (Parallel Path)
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
            codeReaderRef.current = new BrowserMultiFormatReader(hints);

            setStatus("Kamera Hazır: Kimliği parlatmadan kutuya yaklaştırın.");
            setIsScanning(true);
        } catch (error) {
            console.error("Scanner Init Error:", error);
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

    // OTSU'S THRESHOLDING (Dinamik Siyah-Beyaz Eşikleme)
    // Profesyonel görüntü işleme: Işığa göre eşiği belirler, parlamayı kompanse eder.
    const applyOtsuThreshold = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const histogram = new Array(256).fill(0);

        // 1. Grayscale & Histogram
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            data[i] = data[i + 1] = data[i + 2] = gray;
            histogram[gray]++;
        }

        // 2. Otsu Algorithm to find optimal threshold
        let total = width * height;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * histogram[i];

        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVar = 0;
        let threshold = 0;

        for (let i = 0; i < 256; i++) {
            wB += histogram[i];
            if (wB === 0) continue;
            wF = total - wB;
            if (wF === 0) break;
            sumB += i * histogram[i];
            let mB = sumB / wB;
            let mF = (sum - sumB) / wF;
            let varBetween = wB * wF * (mB - mF) * (mB - mF);
            if (varBetween > maxVar) {
                maxVar = varBetween;
                threshold = i;
            }
        }

        // 3. Apply Threshold
        for (let i = 0; i < data.length; i += 4) {
            const val = data[i] > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
    };

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
        setStatus("Kamera erişim hatası. Lütfen izinleri kontrol edin.");
    }, []);

    const processMRZ = (text: string) => {
        const lines = text.split('\n')
            .map(l => l.replace(/[^A-Z0-9<]/g, '').trim())
            .filter(l => l.length >= 20); // Kimlik MRZ satırları uzundur

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

        // Regex Fallback (TC 11 hane)
        const clean = text.toUpperCase().replace(/[^A-Z0-9<]/g, '');
        const tc = clean.match(/[1-9][0-9]{10}/);
        return tc ? { identityNo: tc[0] } : null;
    };

    const performScan = useCallback(async () => {
        if (!webcamRef.current?.video || !isScanning || success || isBusy.current) return;

        isBusy.current = true;
        const video = webcamRef.current.video;
        if (video.readyState !== 4) {
            isBusy.current = false;
            return;
        }

        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

            // Profesyonel Çözünürlük: 800px genişlik (Netlik/Hız dengesi)
            const targetWidth = 800;
            const scale = targetWidth / video.videoWidth;
            const targetHeight = (video.videoHeight * 0.40) * scale;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // ROI: Görüntünün alt yarısı (MRZ/Barcode alanı)
            ctx.drawImage(
                video,
                0, video.videoHeight * 0.50, video.videoWidth, video.videoHeight * 0.40,
                0, 0, targetWidth, targetHeight
            );

            // OCR YOLU (Otsu Binarizasyon Uygulanmış Görüntüyle)
            applyOtsuThreshold(ctx, targetWidth, targetHeight);
            const processedImage = canvas.toDataURL("image/jpeg", 0.9);

            // BARKOD YOLU (Hızlı - İşlenmiş Görüntü ile)
            if (codeReaderRef.current) {
                try {
                    const bResult = await codeReaderRef.current.decodeFromImageUrl(processedImage);
                    const parsed = processMRZ(bResult.getText());
                    if (parsed?.identityNo) {
                        setSuccess(true);
                        setStatus("Süper Hızlı Okuma: Başarılı!");
                        onScan(parsed);
                        return;
                    }
                } catch (e) { }
            }

            // OCR YOLU
            if (workerRef.current) {
                const { data: { text } } = await workerRef.current.recognize(processedImage);
                const parsed = processMRZ(text);

                if (parsed?.identityNo && parsed.identityNo.length === 11) {
                    if (lastTC === parsed.identityNo) {
                        setSuccess(true);
                        setStatus("Kimlik Başarıyla Doğrulandı!");
                        onScan(parsed);
                    } else {
                        setLastTC(parsed.identityNo);
                        setStatus(`Doğrulanıyor: ${parsed.identityNo}`);
                    }
                } else if (text.includes('<')) {
                    setStatus("MRZ Algılandı, Çözümleniyor...");
                }
            }
        } catch (e) {
            console.error("Scan error:", e);
        } finally {
            isBusy.current = false;
        }
    }, [isScanning, success, lastTC, onScan]);

    useEffect(() => {
        const timer = setInterval(performScan, 400); // 400ms döngü
        return () => clearInterval(timer);
    }, [performScan]);

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <div className={`relative w-full max-w-sm rounded-[3rem] overflow-hidden border-4 ${success ? 'border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.5)]' : (hasError ? 'border-red-500' : 'border-zinc-800')} bg-black aspect-[3/4] transition-all duration-500`}>
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
                    className="w-full h-full object-cover scale-105"
                />

                {!success && !hasError && (
                    <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-[88%] h-1/4 border-2 border-emerald-400/60 rounded-[2.5rem] relative shadow-[0_0_100px_rgba(16,185,129,0.2)] bg-emerald-500/5 backdrop-blur-[1px]">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"></div>
                                <div className="absolute -bottom-14 left-0 w-full text-center">
                                    <div className="inline-flex items-center gap-2 bg-black/80 px-5 py-2.5 rounded-full border-2 border-emerald-500/50">
                                        <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                        <span className="text-[11px] text-emerald-500 font-black tracking-[0.2em] uppercase">
                                            PROFESYONEL MOD
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-8 left-8 flex items-center gap-3 bg-zinc-950/80 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-white/10 shadow-2xl">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                            </div>
                            <span className="text-[10px] font-black text-white/90 tracking-widest uppercase">OTSU-ANALYSIS</span>
                        </div>

                        <div className="absolute bottom-12 right-10 z-30">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleFlash}
                                className={`rounded-full h-16 w-16 border-2 shadow-2xl transition-all duration-300 ${isFlashOn ? 'bg-yellow-400 border-yellow-300 text-black scale-110' : 'bg-black/60 border-white/20 text-white hover:bg-black/80'}`}
                            >
                                {isFlashOn ? <FlashlightOff className="h-8 w-8" /> : <Flashlight className="h-8 w-8" />}
                            </Button>
                        </div>
                    </>
                )}

                {success && (
                    <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-3xl flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in duration-700">
                        <div className="bg-white rounded-full p-6 mb-8 shadow-4xl animate-bounce">
                            <ShieldCheck className="h-20 w-20 text-emerald-600" />
                        </div>
                        <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">İşlem Tamam!</h3>
                        <p className="text-emerald-100 font-bold mt-2 opacity-80 uppercase tracking-[0.3em] text-[11px]">Sub-Second Verification</p>
                    </div>
                )}
            </div>

            <div className="text-center w-full max-w-sm px-4">
                <div className={`p-6 rounded-[2.5rem] mb-6 transition-all duration-500 ${success ? 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/5' : 'bg-secondary/40 border-zinc-200 dark:border-zinc-800'} border-2 shadow-xl backdrop-blur-sm`}>
                    <p className={`text-sm font-black tracking-tight uppercase ${success ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {status}
                    </p>
                    {lastTC && !success && (
                        <div className="mt-4 flex items-center justify-center gap-3 py-2.5 px-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 animate-in slide-in-from-top-4">
                            <span className="text-xs font-black text-emerald-600 tracking-widest">KİMLİK: {lastTC}</span>
                        </div>
                    )}
                </div>
                {!success && (
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-2xl text-zinc-500 font-bold hover:bg-zinc-100 h-14 uppercase tracking-widest text-[10px] opacity-60">
                        Vazgeç ve Kapat
                    </Button>
                )}
            </div>
        </div>
    );
}
