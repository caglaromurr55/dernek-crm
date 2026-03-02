"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { parse as parseMRZ } from "mrz";
import { RefreshCw, XCircle, CheckCircle2, Scan, Flashlight, FlashlightOff, Zap, ShieldCheck, Loader2 } from "lucide-react";
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
    const retryCount = useRef(0);

    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("Tesseract v7 Motoru Başlatılıyor...");
    const [progress, setProgress] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [lastTC, setLastTC] = useState("");
    const [isFlashOn, setIsFlashOn] = useState(false);

    // Initialize Tesseract.js v7 (Modern Async Pattern)
    const initScanner = useCallback(async () => {
        try {
            // Tesseract v7: createWorker is async and takes up to 3 args
            // We use 'eng' as the default but we'll optimize it with parameters
            const worker = await createWorker('eng', 1, {
                logger: (m: any) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    } else if (m.status === 'loading tesseract core') {
                        setStatus("Sistem Çekirdeği Yükleniyor...");
                    } else if (m.status === 'loading language traineddata') {
                        setStatus("Dil Paketi Hazırlanıyor...");
                    }
                },
                // Use a reliable CDN for worker and core to avoid slowness
                workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.1.1/dist/worker.min.js',
                corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.1.0/tesseract-core.wasm.js',
            });

            await worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
                tessedit_pageseg_mode: 6 as any, // Assume structured text
                tessjs_create_hocr: '0',
                tessjs_create_tsv: '0',
                tessjs_create_txt: '1',
            });

            workerRef.current = worker;

            // ZXing for Barcodes (Ultra Fast)
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
            codeReaderRef.current = new BrowserMultiFormatReader(hints);

            setStatus("Kamera Hazır: Kimliği Yaklaştırın");
            setIsScanning(true);
        } catch (error) {
            console.error("Scanner Error:", error);
            setHasError(true);
            setStatus("Motor başlatılamadı. Lütfen sayfayı yenileyin.");
        }
    }, []);

    useEffect(() => {
        initScanner();
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
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

    // Otsu Binarization for better OCR accuracy
    const applyOtsu = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const hist = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            hist[gray]++;
        }
        let total = width * height;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];
        let sumB = 0, wB = 0, maxVar = 0, threshold = 0;
        for (let i = 0; i < 256; i++) {
            wB += hist[i];
            if (wB === 0) continue;
            let wF = total - wB;
            if (wF === 0) break;
            sumB += i * hist[i];
            let mB = sumB / wB;
            let mF = (sum - sumB) / wF;
            let varBetween = wB * wF * (mB - mF) * (mB - mF);
            if (varBetween > maxVar) {
                maxVar = varBetween;
                threshold = i;
            }
        }
        for (let i = 0; i < data.length; i += 4) {
            const val = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
    };

    const processResults = (text: string) => {
        const lines = text.split('\n')
            .map(l => l.replace(/[^A-Z0-9<]/g, '').trim())
            .filter(l => l.length >= 10);

        if (lines.length >= 2) {
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

        const tc = text.toUpperCase().replace(/[^0-9]/g, '').match(/[1-9][0-9]{10}/);
        return tc ? { identityNo: tc[0] } : null;
    };

    const performScan = useCallback(async () => {
        if (!webcamRef.current?.video || !workerRef.current || !isScanning || success || isBusy.current) return;

        isBusy.current = true;
        const video = webcamRef.current.video;

        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

            // Speed optimization: 640px is ideal for Tesseract speed/accuracy balance
            const targetWidth = 640;
            const scale = targetWidth / video.videoWidth;
            const targetHeight = (video.videoHeight * 0.40) * scale;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(
                video,
                0, video.videoHeight * 0.55, video.videoWidth, video.videoHeight * 0.40,
                0, 0, targetWidth, targetHeight
            );

            // Parallel Path 1: Instant Barcode
            if (codeReaderRef.current) {
                try {
                    // Create a data URL from the raw canvas for barcode detection
                    const barcodeImage = canvas.toDataURL("image/jpeg", 0.8);
                    const bResult = await codeReaderRef.current.decodeFromImageUrl(barcodeImage);
                    const parsed = processResults(bResult.getText());
                    if (parsed?.identityNo) {
                        setSuccess(true);
                        setStatus("Bingo! Barkod Okundu.");
                        onScan(parsed);
                        return;
                    }
                } catch (e) { }
            }

            // Parallel Path 2: Optimized OCR
            // Every 3rd retry, try WITHOUT binarization for different lighting
            if (retryCount.current % 3 !== 0) {
                applyOtsu(ctx, targetWidth, targetHeight);
            }
            retryCount.current++;

            const processedImage = canvas.toDataURL("image/jpeg", 0.9);
            const { data: { text } } = await workerRef.current.recognize(processedImage);
            const parsed = processResults(text);

            if (parsed?.identityNo && parsed.identityNo.length === 11) {
                if (lastTC === parsed.identityNo) {
                    setSuccess(true);
                    setStatus("Kimlik Onaylandı!");
                    onScan(parsed);
                } else {
                    setLastTC(parsed.identityNo);
                    setStatus(`Taranıyor: ${parsed.identityNo}`);
                }
            } else if (text.includes('<')) {
                setStatus("MRZ Yazıları Algılandı...");
            } else {
                setStatus("Kimliği kutu içine ortalayın...");
            }
        } catch (e) {
            console.error("Scan Failed:", e);
        } finally {
            isBusy.current = false;
        }
    }, [isScanning, success, lastTC, onScan]);

    useEffect(() => {
        const itv = setInterval(performScan, 500);
        return () => clearInterval(itv);
    }, [performScan]);

    return (
        <div className="flex flex-col items-center space-y-6 p-6 max-w-lg mx-auto bg-card rounded-[3rem] shadow-2xl border-4 border-primary/20">
            <div className={`relative w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 ${success ? 'border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.3)]' : 'border-zinc-800'} bg-black`}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    onUserMediaError={handleCameraError}
                    className="w-full h-full object-cover"
                />

                {!success && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-[85%] h-1/4 border-2 border-emerald-400/40 rounded-[2rem] relative bg-emerald-500/5 backdrop-blur-[1px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"></div>
                            <div className="absolute -top-10 left-0 w-full flex justify-center">
                                <div className="bg-black/60 px-4 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-md">
                                    <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">TARAMA ALANI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Bar for Tesseract Loading */}
                {!isScanning && !hasError && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                        <h3 className="text-white font-black tracking-tighter text-xl mb-4">{status}</h3>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden max-w-[200px]">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-zinc-500 text-xs mt-4 font-bold uppercase tracking-widest">Motor Hazırlanıyor: %{progress}</p>
                    </div>
                )}

                {success && (
                    <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-2xl flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-500">
                        <div className="bg-white rounded-full p-6 mb-6 shadow-4xl animate-bounce">
                            <ShieldCheck className="h-16 w-16 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">BAŞARILI!</h2>
                        <p className="text-emerald-100 font-bold opacity-80 uppercase tracking-widest text-[10px] mt-2">Veriler Aktarılıyor</p>
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
                    <p className={`text-sm font-black text-center tracking-tight uppercase ${success ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {status}
                    </p>
                    {lastTC && !success && (
                        <div className="mt-4 flex flex-col items-center">
                            <div className="px-6 py-2 bg-primary/10 rounded-full border border-primary/20">
                                <span className="text-xs font-black text-primary tracking-widest">ID: {lastTC}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-tighter">İkinci Onay Bekleniyor...</p>
                        </div>
                    )}
                </div>

                {!success && (
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-2xl text-zinc-400 font-black h-12 uppercase tracking-[0.2em] text-[10px]">
                        İşlemi İptal Et
                    </Button>
                )}
            </div>
        </div>
    );
}
