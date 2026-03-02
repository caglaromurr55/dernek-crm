"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Search, XCircle, RefreshCw, HandHeart, Clock, ThumbsUp, XOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryPersonByBarcode } from "@/app/actions/query";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface BarcodeQueryModalProps {
    open: boolean;
    onClose: () => void;
}

export function BarcodeQueryModal({ open, onClose }: BarcodeQueryModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const [statusText, setStatusText] = useState("Kamera başlatılıyor...");
    const [isScanning, setIsScanning] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Sorgu Sonuçları
    const [result, setResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const stopCamera = useCallback(() => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
    }, []);

    const startCamera = useCallback(async () => {
        setResult(null);
        setErrorMsg(null);
        setIsScanning(true);
        setStatusText("Barkodu (Code128) kameraya tutun.");

        // SSL/HTTPS Kontrolü
        if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
            setStatusText("Hata: Güvenli olmayan bağlantı (SSL/HTTPS).");
            setErrorMsg("Kamera erişimi sadece güvenli (HTTPS) bağlantılarda mevcuttur. Lütfen sitenizin SSL sertifikasını kontrol edin.");
            setIsScanning(false);
            return;
        }

        if (!codeReaderRef.current) {
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
            codeReaderRef.current = new BrowserMultiFormatReader(hints);
        }

        try {
            const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
            if (videoInputDevices.length === 0) {
                setStatusText("Hata: Kullanılabilir kamera bulunamadı.");
                return;
            }

            // Öncelikli olarak cihazdaki arka kamerayı bulalım
            let selectedDeviceId: string | null = null;
            if (videoInputDevices.length > 0) {
                const backCamera = videoInputDevices.find(
                    d => d.label.toLowerCase().includes('back') ||
                        d.label.toLowerCase().includes('arka') ||
                        d.label.toLowerCase().includes('environment')
                );
                selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
            }

            // decodeFromVideoDevice Promise döndürür (veya callback tetikler), hataları catch ile yakalayalım
            codeReaderRef.current.decodeFromVideoDevice(
                selectedDeviceId,
                videoRef.current,
                async (resultItem, err) => {
                    if (resultItem) {
                        const rawText = resultItem.getText().trim();
                        const cleanTc = rawText.replace(/\D/g, '');

                        if (cleanTc.length === 11) {
                            stopCamera();
                            setIsScanning(false);
                            handleBarcodeQuery(cleanTc);
                        } else {
                            setStatusText(`Hata: Okunan kod 11 haneli değil. (Okunan: ${rawText})`);
                        }
                    }

                    if (err && !(err instanceof NotFoundException)) {
                        console.error("Tarama hatası (Sessizce yoksayılabilir):", err);
                    }
                }
            ).catch((err: any) => {
                console.error("Kamera başlatılamadı (Örn: NotReadableError):", err);
                if (err.name === 'NotReadableError') {
                    setStatusText("Hata: Kamera başlatılamadı (Hata Kodu: NotReadableError).");
                    setErrorMsg("Kamera şu anda başka bir sekme veya uygulama tarafından kullanılıyor olabilir. Lütfen kamerayı kullanan diğer pencereleri kapatıp tekrar deneyin.");
                } else if (err.name === 'NotAllowedError') {
                    setStatusText("Hata: Kamera izni verilmedi.");
                    setErrorMsg("Tarayıcınızın kamera erişimine izin vermediğiniz için işlem yapılamıyor.");
                } else {
                    setStatusText(`Hata: Kamera başlatılamadı (${err.message || err.name}).`);
                    setErrorMsg("Cihaz cihaz kamerasına erişemedi. Lütfen donanımınızı ve tarayıcı izinlerinizi kontrol edin.");
                }
                setIsScanning(false);
            });
        } catch (err: any) {
            console.error("Kamera başlatılırken genel hata oluştu:", err);
            setStatusText("Hata: Kameraya erişilemedi.");
            setErrorMsg(err.message || "Kamera aygıtlarına ulaşılamadı. Cihazınızda takılı bir kamera olduğundan emin olun.");
            setIsScanning(false);
        }
    }, [stopCamera]);

    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
            setResult(null);
            setErrorMsg(null);
        }

        return () => {
            stopCamera();
        };
    }, [open, startCamera, stopCamera]);

    const handleBarcodeQuery = async (identityNo: string) => {
        setIsLoading(true);
        setStatusText("Sistemden sorgulanıyor...");

        const response = await queryPersonByBarcode(identityNo);

        if (response.success && response.data) {
            setStatusText("Tarama Başarılı!");
            setResult(response.data);
        } else {
            setStatusText("Tarama Tamamlandı.");
            setErrorMsg(response.message || "Bilinmeyen bir hata oluştu.");
        }

        setIsLoading(false);
    };

    // Household Status Çevirme
    const getStatusDetails = (status: string) => {
        switch (status) {
            case "PENDING":
                return { label: "Araştırma Bekliyor", color: "bg-amber-100 text-amber-800", icon: <Clock className="w-5 h-5 text-amber-600" /> };
            case "APPROVED":
                return { label: "Onaylandı (Yardım Alabilir)", color: "bg-emerald-100 text-emerald-800", icon: <ThumbsUp className="w-5 h-5 text-emerald-600" /> };
            case "REJECTED":
                return { label: "Başıvuru Reddedildi", color: "bg-rose-100 text-rose-800", icon: <XOctagon className="w-5 h-5 text-rose-600" /> };
            default:
                return { label: "Bilinmiyor", color: "bg-slate-100 text-slate-800", icon: <Clock className="w-5 h-5" /> };
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md bg-zinc-950 text-white border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Hızlı Barkod Sorgula (Code128)</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Başvuru detaylarını ve yardım geçmişini görmek için Kimlik arkasındaki yatay barkodu okutunuz.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center mt-2 space-y-4">
                    {/* Kamera Ekranı (Eğer hala taranıyorsa) */}
                    {isScanning && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border-2 border-zinc-700">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                            />
                            {/* Hizalama Rehberi */}
                            <div className="absolute inset-x-8 inset-y-12 border-2 border-emerald-500 rounded bg-emerald-500/10 z-10 pointers-none flex items-center justify-center">
                                <div className="w-full h-[2px] bg-red-500/80 absolute top-1/2"></div>
                            </div>
                        </div>
                    )}

                    {/* Yükleniyor Göstergesi */}
                    {isLoading && (
                        <div className="py-12 flex flex-col items-center">
                            <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
                            <p className="text-emerald-500 animate-pulse">Gerçek zamanlı veriler taranıyor...</p>
                        </div>
                    )}

                    {/* Hata Ekranı */}
                    {errorMsg && !isLoading && (
                        <div className="p-6 bg-red-950/30 border border-red-900 rounded-lg w-full text-center">
                            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
                            <h3 className="text-lg font-semibold text-red-400">Kayıt Bulunamadı</h3>
                            <p className="text-sm text-red-200 mt-2">{errorMsg}</p>
                            <Button
                                className="mt-6 bg-zinc-800 hover:bg-zinc-700"
                                onClick={startCamera}
                            >
                                Tekrar Dene
                            </Button>
                        </div>
                    )}

                    {/* Sonuç Ekranı */}
                    {result && !isLoading && (
                        <div className="w-full space-y-4">
                            <div className={`p-4 rounded-xl flex items-center gap-4 ${getStatusDetails(result.status).color} bg-opacity-20 border border-current`}>
                                <div className="p-3 bg-white/20 rounded-full">
                                    {getStatusDetails(result.status).icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight">{result.name}</h3>
                                    <p className="text-sm font-medium opacity-90">{result.identityNo}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Durum</p>
                                    <Badge variant="outline" className={`${getStatusDetails(result.status).color} border-none`}>
                                        {getStatusDetails(result.status).label}
                                    </Badge>
                                </div>
                                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Puan</p>
                                    <p className="font-semibold text-lg text-emerald-400">{result.score} HP</p>
                                </div>
                            </div>

                            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-sm space-y-2">
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-400">Rolü</span>
                                    <span className="font-medium">{result.isApplicant ? "Başvuru Sahibi" : "Hane Bireyi"}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-400">Kayıt Tarihi</span>
                                    <span className="font-medium">{new Date(result.registrationDate).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="flex flex-col pt-1">
                                    <span className="text-zinc-400 text-xs mb-1">İletişim & Adres</span>
                                    <span>{result.phone || "Telefon Yok"}</span>
                                    <span className="text-zinc-300 mt-1">{result.address}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full pt-2">
                                <Button className="flex-1 bg-zinc-800 hover:bg-zinc-700" onClick={startCamera}>
                                    Yeni Sorgu
                                </Button>
                                <Link href={`/haneler/${result.householdId}`} className="flex-1">
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        Haneye Git
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {(!result && !errorMsg && !isLoading) && (
                        <p className="text-sm text-zinc-400">{statusText}</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
