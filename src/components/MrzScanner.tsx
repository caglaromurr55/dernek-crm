"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { parse as parseMRZ } from "mrz";
import { RefreshCw, XCircle, CheckCircle2, Scan, Flashlight, FlashlightOff, Info } from "lucide-react";
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
    const [status, setStatus] = useState("Sistem hazırlanıyor...");
    const [hasError, setHasError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [lastTC, setLastTC] = useState("");
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [filterIndex, setFilterIndex] = useState(0);

    // Initialize Tesseract and ZXing
    const initScanner = useCallback(async () => {
        try {
            // Tesseract OCR - Mode 6 for structured text
            const worker = await (createWorker as any)('eng', 1);
            if (worker.setParameters) {
                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
                    tessedit_pageseg_mode: '6',
                });
            }
            workerRef.current = worker;

            // ZXing Barcode
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE]);
            codeReaderRef.current = new BrowserMultiFormatReader(hints);

            setStatus("Kimliğin arka yüzünü (yazılı taraf) çerçeveye iyice yaklaştırın.");
            setIsScanning(true);
        } catch (error) {
            console.error("Başlatma hatası:", error);
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
        if (!webcamRef.current || !webcamRef.current.video) return;
        const stream = webcamRef.current.video.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        if (!capabilities.torch) return;
        try {
            await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] } as any);
            setIsFlashOn(!isFlashOn);
        } catch (e) {
            console.error("Flash error:", e);
        }
    }, [isFlashOn]);

    const handleCameraError = useCallback(() => {
        setHasError(true);
        setStatus("Kamera erişim hatası.");
    }, []);

    const processMRZResult = (text: string) => {
        // OCR metnini satırlara böl ve temizle
        const lines = text.split('\n')
            .map(l => l.replace(/[^A-Z0-9<]/g, '').trim())
            .filter(l => l.length >= 10);

        if (lines.length < 3) return null;

        try {
            // "mrz" kütüphanesi ile doğrula ve ayrıştır
            const result = parseMRZ(lines);
            if (result && result.valid) {
                const fields = (result as any).fields;
                return {
                    identityNo: fields.documentNumber || fields.personalNumber,
                    firstName: fields.firstName,
                    lastName: fields.lastName,
                    birthDate: fields.birthDate ? `19${fields.birthDate.substring(0, 2)}-${fields.birthDate.substring(2, 4)}-${fields.birthDate.substring(4, 6)}` : undefined
                };
            }
        } catch (e) {
            // Library parsing failed, try manual fallback
        }

        // Manual Fallback (Regex)
        const normalized = text.toUpperCase().replace(/[^A-Z0-9<]/g, '');
        const tcMatch = normalized.match(/[1-9][0-9]{10}/);
        if (tcMatch) {
            return { identityNo: tcMatch[0] };
        }

        return null;
    };

    const performScan = useCallback(async () => {
        if (!webcamRef.current || !webcamRef.current.video || !isScanning || success || isBusy.current) return;

        const video = webcamRef.current.video;
        if (video.readyState !== 4) return;

        isBusy.current = true;

        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;

            // Çözünürlüğü artır (OCR için kritik)
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight * 0.45; // Alt bölge

            // Filtreleme döngüsü (Adaptif)
            const filters = [
                "grayscale(100%) contrast(200%) brightness(95%)",
                "grayscale(100%) contrast(350%) brightness(85%)",
                "grayscale(100%) contrast(150%) brightness(110%) sharpness(3)"
            ];
            ctx.filter = filters[filterIndex];
            setFilterIndex((prev) => (prev + 1) % filters.length);

            // Görüntüyü kırp ve çiz
            ctx.drawImage(
                video,
                0, video.videoHeight * 0.50, video.videoWidth, video.videoHeight * 0.45,
                0, 0, canvas.width, canvas.height
            );

            const processedImage = canvas.toDataURL("image/jpeg", 0.95);

            // 1. Barkod (Anlık)
            if (codeReaderRef.current) {
                try {
                    const barcodeResult = await codeReaderRef.current.decodeFromImageUrl(processedImage);
                    const results = processMRZResult(barcodeResult.getText());
                    if (results?.identityNo) {
                        setSuccess(true);
                        setStatus("Barkod ile doğrulandı!");
                        onScan(results);
                        return;
                    }
                } catch (e) { }
            }

            // 2. OCR (Tesseract)
            if (workerRef.current) {
                const { data: { text } } = await workerRef.current.recognize(processedImage);
                const results = processMRZResult(text);

                if (results?.identityNo && results.identityNo.length === 11) {
                    if (lastTC === results.identityNo) {
                        setSuccess(true);
                        setStatus("MRZ Başarıyla Okundu!");
                        onScan(results);
                    } else {
                        setLastTC(results.identityNo);
                        setStatus(`Tarama: ${results.identityNo}...`);
                    }
                } else if (text.includes('<')) {
                    setStatus("Metin algılandı, netleştiriliyor...");
                }
            }
        } catch (e) {
            console.error("Scan error:", e);
        } finally {
            isBusy.current = false;
        }
    }, [isScanning, success, lastTC, filterIndex, onScan]);

    useEffect(() => {
        const timer = setInterval(performScan, 600);
        return () => clearInterval(timer);
    }, [performScan]);

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <div className={`relative w-full max-w-sm rounded-[2.5rem] overflow-hidden border-4 ${success ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : (hasError ? 'border-red-500' : 'border-zinc-800')} bg-black aspect-[3/4] transition-all duration-500`}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        facingMode: "environment",
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }}
                    onUserMediaError={handleCameraError}
                    className="w-full h-full object-cover scale-105"
                />

                {!success && !hasError && (
                    <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-[90%] h-1/4 border-2 border-emerald-500/40 rounded-3xl relative shadow-[0_0_60px_rgba(16,185,129,0.15)] bg-emerald-500/5 backdrop-blur-[2px]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"></div>
                                <div className="absolute -bottom-12 left-0 w-full text-center flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-emerald-300 font-black tracking-widest uppercase bg-black/80 px-4 py-1.5 rounded-full border border-emerald-500/30">
                                        ODAKLANILIYOR
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[9px] font-bold text-white/80 tracking-tighter uppercase">CANLI ANALİZ</span>
                        </div>

                        <div className="absolute bottom-8 right-8 z-30 flex flex-col gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleFlash}
                                className={`rounded-full h-14 w-14 border-2 transition-all shadow-xl ${isFlashOn ? 'bg-yellow-400 border-yellow-300 text-black' : 'bg-black/60 border-white/20 text-white'}`}
                            >
                                {isFlashOn ? <FlashlightOff className="h-7 w-7" /> : <Flashlight className="h-7 w-7" />}
                            </Button>
                        </div>

                        <div className="absolute top-6 right-6">
                            <div className="bg-white/10 backdrop-blur-lg p-2 rounded-full border border-white/10 cursor-help group relative">
                                <Info className="w-5 h-5 text-white/50" />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 text-[10px] text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20 z-50">
                                    Kimlikteki 3 satırlık yazıyı (MRZ) parlamadan kutu içine denk getirin. En iyi sonuç için telefonu yaklaştırın.
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {success && (
                    <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-xl flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in duration-500">
                        <div className="bg-white rounded-full p-4 mb-6 shadow-2xl scale-110 animate-pulse">
                            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tight">KİMLİK OKUNDU</h3>
                        <p className="text-emerald-100 font-semibold mt-2 opacity-80 uppercase tracking-widest text-xs">Sisteme Aktarılıyor</p>
                    </div>
                )}
            </div>

            <div className="text-center w-full max-w-sm">
                <div className={`p-5 rounded-[2rem] mb-6 transition-all duration-300 ${success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'} border-2`}>
                    <p className={`text-sm font-bold ${success ? 'text-emerald-600' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {status}
                    </p>
                    {lastTC && !success && (
                        <div className="mt-3 flex items-center justify-center gap-3 py-2 px-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 animate-in slide-in-from-top-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-black text-emerald-600 tracking-wider">DOĞRULANIYOR: {lastTC}</span>
                        </div>
                    )}
                </div>
                {!success && (
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-2xl text-zinc-400 font-black hover:bg-zinc-100 dark:hover:bg-zinc-800 uppercase tracking-widest text-xs h-12">
                        Vazgeç
                    </Button>
                )}
            </div>
        </div>
    );
}
