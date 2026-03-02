"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import { Camera, RefreshCw, XCircle } from "lucide-react";
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
    const [status, setStatus] = useState("Kamera başlatılıyor...");
    const [progress, setProgress] = useState(0);

    const parseMRZ = (text: string) => {
        // Tesseract < karakterini farklı harfler gibi algılayabilir
        const cleanText = text.replace(/[KCEL]/gi, '<').replace(/\s+/g, '');
        const lines = cleanText.split('\n').filter(l => l.length > 20);

        let identityNo = "";
        let birthDate = "";
        let firstName = "";
        let lastName = "";

        // OCR karakter hatalarını tolere et (Oluşabilecek sayısal alanlarda)
        const textWithNumbersMerged = text.toUpperCase().replace(/[OÖD]/g, '0').replace(/[Il]/g, '1').replace(/[SŞ]/g, '5').replace(/[Z]/g, '2');

        // Serbest metin içinde 11 haneli rakam kalıbını her halükarda yakalamaya çalış
        const tcMatch = textWithNumbersMerged.replace(/[^0-9]/g, '').match(/([1-9][0-9]{10})/);
        if (tcMatch) {
            identityNo = tcMatch[1];
        }

        // TR Kimlik MRZ Formatını (TD1) tespit edelim
        const line1Idx = lines.findIndex(l => l.includes('I<TUR') || l.includes('IDTUR') || l.includes('TUR'));

        if (line1Idx !== -1 && lines.length > line1Idx + 2) {
            const l1 = lines[line1Idx];
            const l2 = lines[line1Idx + 1];
            const l3 = lines[line1Idx + 2];

            // TC No Line 1'de genelde 15. karakterden itibaren başlar (Eğer yukarıdaki regexle bulamadıysa)
            if (!identityNo) {
                const possibleTC = l1.substring(15, 26).replace(/</g, '').replace(/[OÖD\s]/g, '0');
                if (possibleTC.length === 11 && /^\d+$/.test(possibleTC)) {
                    identityNo = possibleTC;
                }
            }

            // Doğum Tarihi Line 2'de 1-6. karakterler (YYMMDD)
            const dobStr = l2.substring(0, 6).replace(/[OÖD]/g, '0');
            if (/^\d{6}$/.test(dobStr)) {
                const yearPrefix = parseInt(dobStr.substring(0, 2)) > 30 ? '19' : '20';
                birthDate = `${yearPrefix}${dobStr.substring(0, 2)}-${dobStr.substring(2, 4)}-${dobStr.substring(4, 6)}`;
            }

            // İsim Soyisim Line 3'te SURNAME<<FIRSTNAME 
            const nameParts = l3.split('<<');
            if (nameParts.length >= 2) {
                lastName = nameParts[0].replace(/</g, ' ').trim();
                firstName = nameParts[1].replace(/</g, ' ').trim();
            }
        }

        return { identityNo, firstName, lastName, birthDate, rawText: text };
    };

    const captureAndScan = useCallback(async () => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsScanning(true);
        setStatus("Görsel analiz ediliyor (OCR)...");
        setProgress(0);

        try {
            const worker = await createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.floor(m.progress * 100));
                    }
                }
            });

            // Sadece gerekli karakterlere odaklanarak tesseractı hızlandır
            await worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<ŞÜÖÇĞIİ',
            });

            const { data: { text } } = await worker.recognize(imageSrc);
            await worker.terminate();

            const parsedData = parseMRZ(text);

            if (parsedData.identityNo || parsedData.firstName) {
                setStatus("Başarıyla okundu!");
                onScan(parsedData);
            } else {
                setStatus(`TC veya MRZ bilgisi okunamadı. Tekrar deneyiniz. (Bulunan mtn: ${text.substring(0, 15)}...)`);
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
            <div className="relative w-full max-w-sm rounded-lg overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-black">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="w-full h-auto object-cover opacity-80"
                />

                {/* Kamera Kılavuz Çizgileri */}
                <div className="absolute inset-0 border-4 border-emerald-500/50 m-8 rounded-md flex items-center justify-center pointer-events-none">
                    <div className="w-full h-1/3 bg-emerald-500/20 top-2/3 absolute border-t border-emerald-500/50 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold uppercase bg-black/50 px-2 py-1 rounded">
                            MRZ Bölgesi
                        </span>
                    </div>
                </div>

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
