"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, RefreshCw, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ExternalMrzScannerProps {
    onScan: (data: any | any[]) => void;
    className?: string;
}

// Optional: Format the YYYY-MM-DD from 'dd.mm.yyyy' or 'yymmdd'
function parseDateString(dateStr: string) {
    if (!dateStr) return null;
    if (dateStr.includes('.')) {
        const parts = dateStr.split('.');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (dateStr.length === 6) {
        const yy = dateStr.substring(0, 2);
        const mm = dateStr.substring(2, 4);
        const dd = dateStr.substring(4, 6);
        const year = parseInt(yy) > 20 ? `19${yy}` : `20${yy}`;
        return `${year}-${mm}-${dd}`;
    }
    return null;
}

function parseRawMrz(scanData: any) {
    const firstName = scanData.given_names_readable || "";
    const lastName = scanData.surname || "";
    const genderRaw = scanData.sex || ""; // "M" or "F"
    let gender = "ERK";
    if (genderRaw === "F" || genderRaw === "K") gender = "KAD";

    const birthDateReadable = scanData.dob_readable || scanData.dob_raw;
    const birthDate = parseDateString(birthDateReadable) || "";

    let identityNo = scanData.optionals || "";
    if (identityNo === "N/A" || identityNo.length < 11) {
        if (scanData.document_number && scanData.document_number.length === 11 && !isNaN(Number(scanData.document_number))) {
            identityNo = scanData.document_number;
        } else {
            identityNo = "";
        }
    }
    if (identityNo.includes('<')) {
        const cleaned = identityNo.replace(/</g, '').trim();
        if (cleaned.length >= 11) identityNo = cleaned.substring(0, 11);
    }

    return { firstName, lastName, gender, birthDate, identityNo };
}

export function ExternalMrzScanner({ onScan, className }: ExternalMrzScannerProps) {
    const [isPolling, setIsPolling] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        getSession().then(session => {
            if (session?.user?.id) setUserId(session.user.id);
        });
    }, []);

    const pollLatestScan = useCallback(async () => {
        if (!isPolling) return;
        try {
            const res = await fetch("/api/mrz-webhook/latest");
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.hasScan && result.data && Array.isArray(result.data)) {
                    // Success!
                    toast.success("Mobil Tara Başarılı", {
                        description: `${result.data.length} kişi başarıyla okundu.`
                    });

                    const parsedArray = result.data.map((item: any) => parseRawMrz(item));
                    onScan(parsedArray); // Pass the whole array up
                    setIsPolling(false);
                }
            }
        } catch (error) {
            console.error("Polling error:", error);
        }
    }, [isPolling, onScan]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (isPolling) {
            pollLatestScan();
            intervalId = setInterval(pollLatestScan, 2000);

            const timeoutId = setTimeout(() => {
                if (isPolling) {
                    setIsPolling(false);
                    toast.error("Zaman Aşımı", {
                        description: "Cihazınızdan 60 saniye içinde okuma yapılamadı."
                    });
                }
            }, 60000);
            return () => { clearInterval(intervalId); clearTimeout(timeoutId); };
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [isPolling, pollLatestScan]);

    const togglePolling = () => {
        if (!isPolling) {
            setIsPolling(true);
            toast.info("Telefon Bekleniyor...", {
                description: "Lütfen mobil uygulamadan kimlikleri tarayıp POST isteğini gönderin."
            });
        } else {
            setIsPolling(false);
        }
    };

    const webhookUrl = userId && typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}/api/mrz-webhook/${userId}`
        : "Yükleniyor...";

    return (
        <div className="flex items-center gap-1">
            <Button
                type="button"
                onClick={togglePolling}
                variant={isPolling ? "default" : "outline"}
                size="sm"
                className={`text-xs rounded-xl shadow-sm transition-all ${isPolling
                        ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse shadow-amber-500/30"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    } ${className || ""}`}
            >
                {isPolling ? (
                    <><RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> Bekleniyor...</>
                ) : (
                    <><Smartphone className="mr-2 h-3.5 w-3.5" /> Telefondan Ekle</>
                )}
            </Button>

            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-full" onClick={() => setShowInfo(true)}>
                <LinkIcon className="h-4 w-4" />
            </Button>

            <Dialog open={showInfo} onOpenChange={setShowInfo}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Webhook URL (Size Özel)</DialogTitle>
                        <DialogDescription>
                            Mobil MRZ uygulamasındaki "POST URL / Webhook" ayarına aşağıdaki linki kopyalayıp yapıştırın. Bu link sadece sizin hesabınıza tarama yapar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 mt-4">
                        <Input readOnly value={webhookUrl} className="bg-secondary/50 font-mono text-xs" />
                        <Button type="button" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Kopyalandı"); }} size="sm">Kopyala</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
