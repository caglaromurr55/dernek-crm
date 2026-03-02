"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import { parse as parseMRZDoc } from "mrz";
import { Camera, RefreshCw, XCircle, BookOpen } from "lucide-react";
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
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("Kamera bekleniyor...");
    const [progress, setProgress] = useState(0);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
            setStatus("HATA: Kamera erişimi için HTTPS (SSL) gereklidir. Lütfen siteyi güvenli bağlantı üzerinden açın.");
            setHasError(true);
        } else {
            setStatus("Kimlik kartının arka yüzünü (Barkodlu alan) kameraya tutun.");
        }
    }, []);

    const handleCameraError = useCallback((error: string | DOMException) => {
        console.error("Kamera hatası:", error);
        setHasError(true);
        if (error.toString().includes("NotAllowedError") || error.toString().includes("Permission denied")) {
            setStatus("Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini onaylayın.");
        } else if (error.toString().includes("NotFoundError")) {
            setStatus("Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun.");
        } else {
            setStatus("Kamera başlatılamadı. Başka bir uygulama kamerayı kullanıyor olabilir.");
        }
    }, []);

    const parseMRZ = (text: string) => {
        // Tesseract'tan gelen metni satırlara böl ve temizle
        const lines = text.split('\n')
            .map(l => l.replace(/\s+/g, '').toUpperCase())
            .filter(l => l.length >= 20);

        let identityNo = "";
        let firstName = "";
        let lastName = "";
        let birthDate = "";

        try {
            // mrz kütüphanesi ile parse et
            const result = parseMRZDoc(lines);
            const fields = result.fields;

            // Türkiye Kimliğinde (TD1) TC No genellikle optional2 alanında (Line 2, char 19-30) yer alır.
            // Bazı durumlarda documentNumber da olabilir (Format farklılıkları için).
            const possibleTCs = [
                fields.optional2?.replace(/</g, ''),
                fields.optional1?.replace(/</g, ''),
                fields.documentNumber?.replace(/</g, '')
            ];

            const foundTC = possibleTCs.find(tc => tc && tc.length === 11 && /^\d+$/.test(tc));
            if (foundTC) identityNo = foundTC;

            // İsim ve Soyisim (Valid olmasa bile OCR çoğu karakteri doğru okumuş olabilir)
            firstName = fields.firstName?.replace(/</g, ' ').trim() || "";
            lastName = fields.lastName?.replace(/</g, ' ').trim() || "";

            // Doğum Tarihi (YYMMDD -> YYYY-MM-DD)
            if (fields.birthDate && fields.birthDate.length === 6) {
                const yearPrefix = parseInt(fields.birthDate.substring(0, 2)) > 50 ? '19' : '20';
                birthDate = `${yearPrefix}${fields.birthDate.substring(0, 2)}-${fields.birthDate.substring(2, 4)}-${fields.birthDate.substring(4, 6)}`;
            }
        } catch (e) {
            console.error("MRZ Parse hatası:", e);
        }

        // Fallback: Eğer kütüphane TC bulamadıysa raw text içinden 11 hane ara
        if (!identityNo) {
            const textWithNumbersMerged = text.toUpperCase()
                .replace(/[OÖD]/g, '0')
                .replace(/[Il]/g, '1')
                .replace(/[SŞ]/g, '5')
                .replace(/[Z]/g, '2');
            const tcMatch = textWithNumbersMerged.replace(/[^0-9]/g, '').match(/([1-9][0-9]{10})/);
            if (tcMatch) identityNo = tcMatch[1];
        }

        return { identityNo, firstName, lastName, birthDate, rawText: text };
    };

    const captureAndScan = useCallback(async () => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsScanning(true);
        setStatus("Görüntü iyileştiriliyor...");
        setProgress(0);

        try {
            // Görüntü Ön İşleme (Canvas üzerinde)
            const img = new Image();
            img.src = imageSrc;
            await new Promise(resolve => img.onload = resolve);

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;

            // Sadece alt %45'lik kısmı (MRZ bölgesi) alalım (ROI - Region of Interest)
            const roiHeight = img.height * 0.45;
            const roiY = img.height * 0.55;

            canvas.width = img.width;
            canvas.height = roiHeight;

            // Kontrast ve Gri Tonlama filtresi (OCR başarısını artırır)
            ctx.filter = "grayscale(100%) contrast(250%) brightness(110%)";
            ctx.drawImage(img, 0, roiY, img.width, roiHeight, 0, 0, img.width, roiHeight);

            const processedImage = canvas.toDataURL("image/jpeg", 0.9);

            setStatus("Metin çözümleniyor (OCR)...");
            const worker: any = await (createWorker as any)('eng', 1, {
                logger: (m: any) => {
                    if (m && m.status === 'recognizing text') {
                        setProgress(Math.floor(m.progress * 100));
                    }
                }
            });

            // Sadece MRZ karakterlerine odaklan
            if (worker.setParameters) {
                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
                });
            }

            const { data: { text } } = await worker.recognize(processedImage);
            await worker.terminate();

            const parsedData = parseMRZ(text);

            if (parsedData.identityNo) {
                setStatus("Başarıyla okundu!");
                onScan({
                    identityNo: parsedData.identityNo,
                    firstName: parsedData.firstName || undefined,
                    lastName: parsedData.lastName || undefined,
                    birthDate: parsedData.birthDate || undefined
                });
            } else {
                setStatus("Okunamadı. Lütfen kimliği daha yakından ve sabit tutun.");
            }

        } catch (error) {
            console.error("Tarama hatası:", error);
            setStatus("Tarama sırasında bir hata oluştu.");
        } finally {
            setIsScanning(false);
        }
    }, [webcamRef, onScan]);

    useEffect(() => {
        // Component yüklendiğinde kameranın hazır olması için kısa bir bekleme
        const timer = setTimeout(() => setStatus("Kimlik kartının arka yüzünü (Barkodlu alan) kameraya tutun."), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <div className={`relative w-full max-w-sm rounded-lg overflow-hidden border-2 ${hasError ? 'border-red-500/50' : 'border-dashed border-zinc-300 dark:border-zinc-700'} bg-black transition-colors`}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    onUserMediaError={handleCameraError}
                    className="w-full h-auto object-cover opacity-80"
                />

                {/* Kamera Kılavuz Çizgileri */}
                {!hasError && (
                    <div className="absolute inset-0 border-4 border-emerald-500/50 m-8 rounded-md flex items-center justify-center pointer-events-none">
                        <div className="w-full h-2/5 bg-emerald-500/20 top-1/2 absolute border-t border-emerald-500/50 flex items-center justify-center">
                            <span className="text-white text-[10px] font-semibold uppercase bg-black/50 px-2 py-1 rounded">
                                MRZ Bölgesi
                            </span>
                        </div>
                    </div>
                )}

                {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/90 backdrop-blur-sm">
                        <XCircle className="h-12 w-12 text-red-500 mb-3" />
                        <p className="text-sm font-bold text-red-400">Kamera Bağlantısı Koptu</p>
                        <p className="text-[10px] text-zinc-500 mt-2 italic px-4 leading-relaxed">
                            Güvenli bağlantı (HTTPS) veya tarayıcı izinlerini kontrol edin.
                        </p>
                    </div>
                )}

                {isScanning && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 transition-all">
                        <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
                        <p className="text-emerald-500 font-medium">Analiz ediliyor: %{progress}</p>
                    </div>
                )}
            </div>

            <div className="text-center w-full">
                <p className={`text-sm mb-4 ${status.includes("hata") || status.includes("algılanamadı") ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {status}
                </p>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={onClose} disabled={isScanning}>
                        İptal
                    </Button>
                    <Button
                        onClick={captureAndScan}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Camera className="mr-2 h-4 w-4" />
                        )}
                        Tara
                    </Button>
                </div>
            </div>
        </div>
    );
}
