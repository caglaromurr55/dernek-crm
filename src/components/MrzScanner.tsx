"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { RefreshCw, XCircle, CheckCircle2, Scan, Flashlight, FlashlightOff } from "lucide-react";
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

    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("Sistem hazırlanıyor...");
    const [hasError, setHasError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [lastTC, setLastTC] = useState("");
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [filterIndex, setFilterIndex] = useState(0); // 0: Normal, 1: High Contrast, 2: Sharp

    // Initialize Tesseract and ZXing
    const initScanner = useCallback(async () => {
        try {
            // Tesseract OCR
            const worker = await (createWorker as any)('eng', 1);
            if (worker.setParameters) {
                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
                    tessedit_pageseg_mode: '6',
                });
            }
            workerRef.current = worker;

            // ZXing Barcode (PDF417 focus)
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE]);
            codeReaderRef.current = new BrowserMultiFormatReader(hints);

            setStatus("Kimliği çerçeveye hizalayın.");
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

    // Flashlight (Torch) Control
    const toggleFlash = useCallback(async () => {
        if (!webcamRef.current || !webcamRef.current.video) return;

        const stream = webcamRef.current.video.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;

        if (!capabilities.torch) {
            setStatus("Bu cihazda flaş desteği bulunamadı.");
            return;
        }

        try {
            await track.applyConstraints({
                advanced: [{ torch: !isFlashOn }]
            } as any);
            setIsFlashOn(!isFlashOn);
        } catch (e) {
            console.error("Flash error:", e);
        }
    }, [isFlashOn]);

    const handleCameraError = useCallback(() => {
        setHasError(true);
        setStatus("Kamera erişim hatası.");
    }, []);

    const parseRawText = (text: string) => {
        const normalized = text.toUpperCase()
            .replace(/[ \n\r]/g, '')
            .replace(/O/g, '0')
            .replace(/[IL]/g, '1')
            .replace(/S/g, '5')
            .replace(/B/g, '8');

        let identityNo = "";
        let firstName = "";
        let lastName = "";
        let birthDate = "";

        // TC Number (11 digits)
        const tcMatch = normalized.match(/[1-9][0-9]{10}/);
        if (tcMatch) identityNo = tcMatch[0];

        // MRZ Line Split for Names
        const lines = text.split('\n').map(l => l.replace(/[^A-Z0-9<]/g, ''));
        const lineWithNames = lines.find(l => l.includes('<<'));
        if (lineWithNames) {
            const parts = lineWithNames.split('<<');
            lastName = parts[0].replace(/</g, ' ').trim();
            firstName = parts[1]?.split('<')[0].replace(/</g, ' ').trim() || "";
        }

        // Birth Date (TUR pattern in MRZ)
        const dobMatch = normalized.match(/TUR([0-9]{6})/);
        if (dobMatch) {
            const dob = dobMatch[1];
            const yearPrefix = parseInt(dob.substring(0, 2)) > 50 ? '19' : '20';
            birthDate = `${yearPrefix}${dob.substring(0, 2)}-${dob.substring(2, 4)}-${dob.substring(4, 6)}`;
        }

        return { identityNo, firstName, lastName, birthDate };
    };

    const performScan = useCallback(async () => {
        if (!webcamRef.current || !webcamRef.current.video || !isScanning || success) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        try {
            const img = new Image();
            img.src = imageSrc;
            await new Promise(resolve => img.onload = resolve);

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;

            // Hibrit ROI: Kartın alt yarısını (hem MRZ hem Barkod alanı) kapsayalım
            const roiHeight = img.height * 0.50;
            const roiY = img.height * 0.45;
            canvas.width = img.width;
            canvas.height = roiHeight;

            // Adaptif Filtreleme Döngüsü
            const filters = [
                "grayscale(100%) contrast(150%)", // Standart
                "grayscale(100%) contrast(300%) brightness(80%)", // High Contrast
                "grayscale(100%) contrast(200%) brightness(120%) saturate(0) contrast(400%)" // Sharp/Binarized
            ];
            ctx.filter = filters[filterIndex];
            setFilterIndex((prev) => (prev + 1) % filters.length);

            ctx.drawImage(img, 0, roiY, img.width, roiHeight, 0, 0, img.width, roiHeight);
            const processedImage = canvas.toDataURL("image/jpeg", 0.9);

            // 1. Barcode Taraması (ZXing - PDF417)
            if (codeReaderRef.current) {
                try {
                    const barcodeResult = await codeReaderRef.current.decodeFromImageUrl(processedImage);
                    if (barcodeResult) {
                        const results = parseRawText(barcodeResult.getText());
                        if (results.identityNo) {
                            setSuccess(true);
                            setStatus("Barkod ile okundu!");
                            onScan(results);
                            return;
                        }
                    }
                } catch (e) { /* No barcode found in this frame */ }
            }

            // 2. OCR Taraması (Tesseract)
            if (workerRef.current) {
                const { data: { text } } = await workerRef.current.recognize(processedImage);
                const results = parseRawText(text);

                if (results.identityNo && results.identityNo.length === 11) {
                    if (lastTC === results.identityNo) {
                        setSuccess(true);
                        setStatus("MRZ ile doğrulandı!");
                        onScan(results);
                    } else {
                        setLastTC(results.identityNo);
                        setStatus(`Okunuyor: ${results.identityNo}...`);
                    }
                }
            }
        } catch (e) {
            // Silently continue
        }
    }, [isScanning, success, lastTC, filterIndex, onScan]);

    useEffect(() => {
        let timer: any;
        if (isScanning && !success && !hasError) {
            timer = setInterval(performScan, 700); // More aggressive loop
        }
        return () => clearInterval(timer);
    }, [isScanning, success, hasError, performScan]);

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <div className={`relative w-full max-w-sm rounded-[2rem] overflow-hidden border-4 ${success ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20' : (hasError ? 'border-red-500' : 'border-zinc-800')} bg-black aspect-[3/4] transition-all duration-500`}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    onUserMediaError={handleCameraError}
                    className="w-full h-full object-cover scale-110"
                />

                {/* Animation Overlay */}
                {!success && !hasError && (
                    <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[85%] h-1/3 border-2 border-emerald-500/50 rounded-2xl relative shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"></div>
                                <div className="absolute -bottom-10 left-0 w-full text-center">
                                    <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase bg-black/60 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                                        Hibrit Tarama Aktif
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Flash Toggle */}
                        <div className="absolute bottom-6 right-6 z-30">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleFlash}
                                className={`rounded-full h-12 w-12 border-2 ${isFlashOn ? 'bg-yellow-500 border-yellow-400 text-black animate-pulse' : 'bg-black/50 border-white/20 text-white backdrop-blur-md'}`}
                            >
                                {isFlashOn ? <FlashlightOff className="h-6 w-6" /> : <Flashlight className="h-6 w-6" />}
                            </Button>
                        </div>
                    </>
                )}

                {/* Success UI */}
                {success && (
                    <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-20 w-20 text-white mb-4 animate-bounce" />
                        <h3 className="text-2xl font-black text-white">BİLGİLER ALINDI</h3>
                        <p className="text-emerald-100 font-medium">Veri kaydediliyor...</p>
                    </div>
                )}

                {/* Error UI */}
                {hasError && (
                    <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
                        <XCircle className="h-16 w-16 text-red-500 mb-4" />
                        <p className="font-bold text-red-100">Bağlantı Hatası</p>
                        <Button variant="outline" size="sm" className="mt-4 border-red-500/30 text-red-400" onClick={() => window.location.reload()}>Tekrar Dene</Button>
                    </div>
                )}
            </div>

            <div className="text-center w-full px-4">
                <div className={`p-4 rounded-3xl mb-4 transition-colors ${success ? 'bg-emerald-500/10' : 'bg-secondary/50'}`}>
                    <p className={`text-sm font-bold ${success ? 'text-emerald-500' : 'text-foreground/70'}`}>
                        {status}
                    </p>
                    {lastTC && !success && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-black text-emerald-500/60 transition-all opacity-0 animate-in fade-in slide-in-from-bottom-2">
                            <Scan className="w-3 h-3" /> DOĞRULANIYOR: {lastTC}
                        </div>
                    )}
                </div>
                {!success && (
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl text-muted-foreground font-bold hover:bg-zinc-100">
                        Tarayıcıyı Kapat
                    </Button>
                )}
            </div>
        </div>
    );
}
