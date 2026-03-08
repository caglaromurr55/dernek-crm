"use client";

import { useState, useRef, useEffect } from "react";
import { PackageCheck, MapPin, Phone, CheckCircle2, Navigation, ScanLine, X, Eraser, PenTool, Flashlight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import SignatureCanvas from 'react-signature-canvas';
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { updateVolunteerDeliveryAction } from "@/app/actions/volunteer";

export function VolunteerDeliveryCard({ delivery }: { delivery: any }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"VERIFICATION" | "SIGNATURE">("VERIFICATION");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [tcInput, setTcInput] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const sigPad = useRef<SignatureCanvas>(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const toggleFlash = async () => {
        const scanner = html5QrCodeRef.current;
        if (scanner && scanner.getState() === 2) {
            try {
                await scanner.applyVideoConstraints({
                    advanced: [{ torch: !isFlashOn } as any]
                });
                setIsFlashOn(!isFlashOn);
            } catch (err) {
                console.error("Flaş hatası:", err);
            }
        }
    };

    const applicant = delivery.household.persons.find((p: any) => p.isApplicant) || delivery.household.persons[0];
    const allowedIdentities = delivery.household.persons.map((p: any) => p.identityNo);

    // Saha verisi (Hane guncelleme icin)
    const [currentAddress, setCurrentAddress] = useState(delivery.household.address);
    const [currentPhone, setCurrentPhone] = useState(delivery.household.contactNumber || "");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        return () => { stopScanning(); };
    }, []);

    const stopScanning = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
            } catch (err) { console.error(err); }
            try { html5QrCodeRef.current.clear(); } catch (e) { }
            html5QrCodeRef.current = null;
        }
        setIsScanning(false);
    };

    const startScanning = async () => {
        setErrorMsg("");
        setIsScanning(true);
        setIsFlashOn(false);

        if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
        }

        initTimeoutRef.current = setTimeout(async () => {
            try {
                const element = document.getElementById(`reader-${delivery.id}`);
                if (!element) return;

                if (html5QrCodeRef.current) {
                    await stopScanning();
                }

                const scanner = new Html5Qrcode(`reader-${delivery.id}`);
                html5QrCodeRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 20, qrbox: { width: 250, height: 150 }, disableFlip: false },
                    (decodedText) => {
                        setTcInput(decodedText.trim());
                        stopScanning();
                    },
                    () => { }
                );
            } catch (err) {
                setErrorMsg("Kamera başlatılamadı.");
                setIsScanning(false);
            }
        }, 300);
    };

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (allowedIdentities.includes(tcInput.trim())) {
            setStep("SIGNATURE");
        } else {
            setErrorMsg("Hata: Bu TC kimlik numarası hanede kayıtlı değil!");
        }
    };

    const handleComplete = async () => {
        if (!sigPad.current || sigPad.current.isEmpty()) {
            setErrorMsg("Lütfen imza alın.");
            return;
        }

        setIsSubmitting(true);
        const signatureData = sigPad.current.getTrimmedCanvas().toDataURL("image/png");

        const formData = new FormData();
        formData.append("deliveryId", delivery.id);
        formData.append("householdId", delivery.householdId);
        formData.append("status", "DELIVERED");
        formData.append("address", currentAddress);
        formData.append("phone", currentPhone);
        formData.append("notes", notes);
        formData.append("signatureData", signatureData);

        try {
            const res = await updateVolunteerDeliveryAction(formData);
            if (res.success) {
                setOpen(false);
                toast.success("Teslimat onaylandı!");
            } else {
                setErrorMsg(res.message || "Hata oluştu.");
            }
        } catch (err) {
            setErrorMsg("Sunucu hatası.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-3xl group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <CardHeader className="bg-zinc-50/50 pb-4 border-b border-zinc-100/50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight text-zinc-900 leading-none">
                                {applicant ? `${applicant.firstName} ${applicant.lastName}` : "Bilinmiyor"}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                                <MapPin className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Hane Adresi</span>
                            </div>
                        </div>
                        <Badge className="bg-zinc-900 text-white font-mono text-sm h-8 w-8 rounded-full flex items-center justify-center p-0">
                            {delivery.household.score}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-3 bg-zinc-50 p-4 rounded-2xl">
                        <Navigation className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium text-zinc-700 leading-snug">{delivery.household.address}</span>
                    </div>
                    {delivery.household.contactNumber && (
                        <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-2xl">
                            <Phone className="h-5 w-5 text-zinc-400 shrink-0" />
                            <span className="text-sm font-mono font-bold text-zinc-700">{delivery.household.contactNumber}</span>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-4 gap-3 bg-zinc-50/50 border-t border-zinc-100/50">
                    <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(delivery.household.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                    >
                        <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-white border-zinc-200 shadow-sm hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all">
                            <Navigation className="h-6 w-6 text-zinc-600" />
                        </Button>
                    </a>

                    <Button
                        className="flex-1 h-14 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-zinc-900/10 uppercase tracking-tight text-base gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        onClick={() => setOpen(true)}
                    >
                        <PackageCheck className="h-6 w-6" />
                        Teslim Et
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={open} onOpenChange={(v) => { if (!v) { stopScanning(); setStep("VERIFICATION"); } setOpen(v); }}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl">
                    <DialogHeader className="p-8 bg-zinc-900 text-zinc-50">
                        <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
                            {step === "VERIFICATION" ? "KİMLİK TEYİDİ" : "TESLİMAT İMZASI"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 font-medium">
                            {step === "VERIFICATION" ? "Hane sakinlerinden birinin TC kimliğini doğrulayın." : "Teslim alan kişiden imza alın."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100/50 flex items-center gap-2">
                                <X className="w-4 h-4" /> {errorMsg}
                            </div>
                        )}

                        {step === "VERIFICATION" ? (
                            <form onSubmit={handleVerifySubmit} className="space-y-6">
                                {isScanning ? (
                                    <div className="relative border-4 border-zinc-900 rounded-[2rem] overflow-hidden bg-black aspect-video md:aspect-square md:max-h-[300px] shadow-2xl flex items-center justify-center">
                                        <div id={`reader-${delivery.id}`} className="h-full w-full object-cover" />
                                        <Button type="button" size="icon" variant="destructive" className="absolute top-4 right-4 rounded-full h-10 w-10 shadow-xl z-20" onClick={stopScanning}>
                                            <X className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon"
                                            className="absolute bottom-4 right-4 rounded-full h-10 w-10 shadow-xl z-20 bg-background/80 hover:bg-background"
                                            onClick={toggleFlash}
                                        >
                                            <Flashlight className={`h-5 w-5 ${isFlashOn ? 'text-yellow-500' : 'text-foreground'}`} />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <Button type="button" variant="outline" className="w-full h-16 rounded-[1.25rem] border-2 border-zinc-100 bg-zinc-50 flex items-center justify-center gap-3 text-lg font-black italic tracking-tighter uppercase text-zinc-900 hover:bg-zinc-100 hover:border-zinc-200 transition-all shadow-sm" onClick={startScanning}>
                                            <ScanLine className="h-6 w-6" />
                                            KİMLİK BARKODU TARA
                                        </Button>
                                        <div className="relative flex items-center">
                                            <div className="flex-grow border-t-2 border-zinc-100"></div>
                                            <span className="flex-shrink-0 mx-6 text-zinc-300 text-[10px] font-black uppercase tracking-widest">VEYA ELLE GİRİŞ</span>
                                            <div className="flex-grow border-t-2 border-zinc-100"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">TC KİMLİK NUMARASI</Label>
                                            <Input
                                                value={tcInput}
                                                onChange={(e) => setTcInput(e.target.value)}
                                                placeholder="11 Haneli TC"
                                                maxLength={11}
                                                className="h-14 bg-zinc-50 border-0 rounded-2xl text-lg font-mono font-bold text-center tracking-widest focus-visible:ring-zinc-900"
                                            />
                                        </div>
                                    </div>
                                )}
                                <Button type="submit" disabled={!tcInput} className="w-full h-16 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-lg uppercase italic tracking-tighter shadow-xl shadow-zinc-900/10">
                                    DOĞRULA VE DEVAM ET
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-tight pl-1">ADRES GÜNCELLE (OPSİYONEL)</Label>
                                            <Input value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} className="h-10 bg-zinc-50 border-0 rounded-xl text-xs font-bold" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-tight pl-1">TEL GÜNCELLE</Label>
                                            <Input value={currentPhone} onChange={e => setCurrentPhone(e.target.value)} className="h-10 bg-zinc-50 border-0 rounded-xl text-xs font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-tight pl-1">TESLİMAT NOTU</Label>
                                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Örn: Komşusuna teslim edildi" className="h-10 bg-zinc-50 border-0 rounded-xl text-xs font-bold" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">TESLİMAT İMZASI</Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => sigPad.current?.clear()} className="h-6 text-[10px] font-black text-zinc-400 hover:text-red-500 uppercase flex items-center gap-1">
                                            <Eraser className="h-3 w-3" /> TEMİZLE
                                        </Button>
                                    </div>
                                    <div className="border-2 border-zinc-100 rounded-3xl overflow-hidden bg-white shadow-inner min-h-[180px] flex items-center justify-center">
                                        <SignatureCanvas
                                            ref={sigPad}
                                            penColor="black"
                                            canvasProps={{ className: 'w-64 h-40 cursor-crosshair' }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button type="button" variant="ghost" className="h-14 flex-1 font-bold text-zinc-400 rounded-2xl hover:bg-zinc-50" onClick={() => setStep("VERIFICATION")} disabled={isSubmitting}>GERİ</Button>
                                    <Button type="button" onClick={handleComplete} disabled={isSubmitting} className="h-14 flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl uppercase italic tracking-tighter text-lg shadow-xl shadow-emerald-500/20">
                                        {isSubmitting ? "KAYDEDİLİYOR..." : "TESLİMATI TAMAMLA"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
