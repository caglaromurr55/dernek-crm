"use client";

import { useState, useRef, useEffect } from "react";
import { PackageCheck, MapPin, Phone, ScanLine, X, Eraser, PenTool, Flashlight, AlertTriangle, UserCog, Edit, Save, Send, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import SignatureCanvas from 'react-signature-canvas';
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { updateVolunteerDeliveryAction, reportDeliveryIssueAction, updateHouseholdFieldInfoAction } from "@/app/actions/volunteer";

type StepType = "VERIFICATION" | "OPTIONS" | "SIGNATURE" | "REPORT_ISSUE" | "UPDATE_INFO";

export function VolunteerDeliveryCard({ delivery }: { delivery: any }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<StepType>("VERIFICATION");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Verification
    const [tcInput, setTcInput] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const sigPad = useRef<SignatureCanvas>(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Saha verisi (Hane genel)
    const [currentAddress, setCurrentAddress] = useState(delivery.household.address || "");
    const [currentPhone, setCurrentPhone] = useState(delivery.household.contactNumber || "");
    const [notes, setNotes] = useState(""); // teslimat notu

    // Sorun Bildirimi
    const [issueReason, setIssueReason] = useState("");
    const [issueNote, setIssueNote] = useState("");

    // Bilgi Güncelleme
    const [updateFirstName, setUpdateFirstName] = useState("");
    const [updateLastName, setUpdateLastName] = useState("");

    const applicant = delivery.household.persons.find((p: any) => p.isApplicant) || delivery.household.persons[0];
    const allowedIdentities = delivery.household.persons.map((p: any) => p.identityNo);

    useEffect(() => {
        if (applicant) {
            setUpdateFirstName(applicant.firstName || "");
            setUpdateLastName(applicant.lastName || "");
        }
    }, [applicant]);

    useEffect(() => {
        return () => { stopScanning(); };
    }, []);

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
            setStep("OPTIONS");
        } else {
            setErrorMsg("Hata: Bu TC kimlik numarası hanede kayıtlı değil!");
        }
    };

    const handleCompleteDelivery = async () => {
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
                toast.success("Teslimat tamamlandı!");
            } else {
                setErrorMsg(res.message || "Hata oluştu.");
            }
        } catch (err) {
            setErrorMsg("Sunucu hatası.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReportIssue = async () => {
        if (!issueReason) {
            setErrorMsg("Lütfen bir sorun türü seçin.");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("deliveryId", delivery.id);
        formData.append("householdId", delivery.householdId);
        formData.append("issueReason", issueReason);
        formData.append("issueNote", issueNote);
        formData.append("volunteerName", delivery.distributionList?.assignedTo || "Saha Görevlisi");

        try {
            const res = await reportDeliveryIssueAction(formData);
            if (res.success) {
                setOpen(false);
                toast.success("Sorun bildirildi.");
            } else {
                setErrorMsg(res.message || "Hata oluştu.");
            }
        } catch (err) {
            setErrorMsg("Sunucu hatası.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateInfo = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("householdId", delivery.householdId);
        formData.append("firstName", updateFirstName);
        formData.append("lastName", updateLastName);
        formData.append("phone", currentPhone);
        formData.append("address", currentAddress);

        try {
            const res = await updateHouseholdFieldInfoAction(formData);
            if (res.success) {
                toast.success("Bilgiler güncellendi!");
                setStep("OPTIONS");
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
            <div className="bg-white rounded-[1.25rem] shadow-sm border border-zinc-200 overflow-hidden flex flex-col active:scale-[0.99] transition-transform">
                {/* Header Section */}
                <div className="p-4 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200/60">
                        <User className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="flex-1 pt-1 min-w-0">
                        <h3 className="text-xl font-bold text-zinc-900 leading-none truncate mb-1.5">
                            {applicant ? `${applicant.firstName} ${applicant.lastName}` : "Bilinmiyor"}
                        </h3>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none font-semibold px-2 text-[10px] rounded-sm">
                            SKOR: {delivery.household.score}
                        </Badge>
                    </div>
                </div>

                {/* Details Section */}
                <div className="px-5 pb-5 space-y-4">
                    <div className="flex flex-col gap-1.5 border-l-2 border-zinc-200 pl-3 ml-2">
                        <div className="flex items-start gap-2.5">
                            <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                            <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(delivery.household.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] font-medium text-zinc-600 leading-tight hover:text-blue-600 hover:underline"
                            >
                                {delivery.household.address}
                            </a>
                        </div>
                        
                        {delivery.household.contactNumber && (
                            <div className="flex items-center gap-2.5 mt-1">
                                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                                <a href={`tel:${delivery.household.contactNumber}`} className="text-[14px] font-mono font-bold text-zinc-800 hover:text-blue-600">
                                    {delivery.household.contactNumber}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Section (Full width base) */}
                <div className="bg-zinc-50 border-t border-zinc-200 p-3">
                    <Button
                        className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-semibold rounded-lg shadow-sm flex items-center justify-between px-4 transition-colors"
                        onClick={() => setOpen(true)}
                    >
                        <span className="flex items-center gap-2 text-sm tracking-wide">
                            <PackageCheck className="h-5 w-5 opacity-75" />
                            İŞLEMİ BAŞLAT
                        </span>
                        <ChevronRight className="h-5 w-5 opacity-50" />
                    </Button>
                </div>
            </div>

            <Dialog open={open} onOpenChange={(v) => { if (!v) { stopScanning(); setStep("VERIFICATION"); } setOpen(v); }}>
                <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-zinc-200 shadow-2xl bg-white w-[95vw] md:w-full mx-auto outline-none">
                    
                    {/* Minimal Header */}
                    <div className="border-b border-zinc-100 px-6 py-4 flex items-center gap-4 bg-zinc-50">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-zinc-200 shadow-sm shrink-0">
                            {step === "VERIFICATION" && <ScanLine className="w-5 h-5 text-zinc-700" />}
                            {step === "OPTIONS" && <UserCog className="w-5 h-5 text-emerald-600" />}
                            {step === "SIGNATURE" && <PenTool className="w-5 h-5 text-zinc-700" />}
                            {step === "REPORT_ISSUE" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                            {step === "UPDATE_INFO" && <Edit className="w-5 h-5 text-blue-500" />}
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-zinc-900 uppercase">
                                {step === "VERIFICATION" && "Kimlik Teyidi"}
                                {step === "OPTIONS" && "İşlem Seçimi"}
                                {step === "SIGNATURE" && "Teslimat İmzası"}
                                {step === "REPORT_ISSUE" && "Sorun Bildirimi"}
                                {step === "UPDATE_INFO" && "Bilgileri Güncelle"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500 font-medium">
                                {step === "VERIFICATION" && "Lütfen teslim edilecek kişiyi doğrulayın."}
                                {step === "OPTIONS" && "Hane başarıyla doğrulandı."}
                                {step === "SIGNATURE" && "Hak sahibinden veya yakınından imza alın."}
                                {step === "REPORT_ISSUE" && "Sahada karşılaştığınız olumsuzluğu aktarın."}
                                {step === "UPDATE_INFO" && "Ulaşılamayan veya değişen verileri düzeltin."}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-6">
                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-100 mb-5 flex items-start gap-2">
                                <X className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {step === "VERIFICATION" && (
                            <form onSubmit={handleVerifySubmit} className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                {isScanning ? (
                                    <div className="relative border border-zinc-200 rounded-xl overflow-hidden bg-black aspect-[3/4] md:aspect-square flex items-center justify-center">
                                        <div id={`reader-${delivery.id}`} className="h-full w-full object-cover opacity-80" />
                                        <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
                                            <Button type="button" size="icon" variant="destructive" className="rounded-full h-10 w-10 shadow-lg" onClick={stopScanning}>
                                                <X className="h-5 w-5" />
                                            </Button>
                                            <Button type="button" variant="secondary" size="icon" className="rounded-full h-10 w-10 shadow-lg bg-white text-zinc-900" onClick={toggleFlash}>
                                                <Flashlight className={`h-5 w-5 ${isFlashOn ? 'text-yellow-500' : 'text-zinc-600'}`} />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Button type="button" className="w-full h-14 rounded-xl bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-900 font-bold flex items-center justify-center gap-3 transition-colors" onClick={startScanning}>
                                            <ScanLine className="h-5 w-5 text-zinc-500" />
                                            KAMERA İLE TARA
                                        </Button>
                                        
                                        <div className="relative flex items-center py-2">
                                            <div className="flex-grow border-t border-zinc-200"></div>
                                            <span className="flex-shrink-0 mx-4 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">VEYA EL İLE YAZ</span>
                                            <div className="flex-grow border-t border-zinc-200"></div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-zinc-600 ml-1">TC Kimlik Numarası</Label>
                                            <Input
                                                value={tcInput}
                                                onChange={(e) => setTcInput(e.target.value)}
                                                placeholder="11 haneli"
                                                maxLength={11}
                                                className="h-14 bg-white border-zinc-300 shadow-sm rounded-xl text-lg font-mono font-medium focus-visible:ring-zinc-900"
                                            />
                                        </div>
                                    </div>
                                )}
                                <Button type="submit" disabled={!tcInput} className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                                    DOĞRULA VE GİR <ChevronRight className="w-4 h-4 opacity-70" />
                                </Button>
                            </form>
                        )}

                        {step === "OPTIONS" && (
                            <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                                <button 
                                    type="button" 
                                    onClick={() => setStep("SIGNATURE")} 
                                    className="w-full bg-white border border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50 p-4 rounded-xl flex items-center gap-4 transition-all text-left shadow-sm"
                                >
                                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg">
                                        <PackageCheck className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[15px] font-bold text-zinc-900 mb-0.5">Teslimatı Tamamla</h4>
                                        <p className="text-[12px] font-medium text-zinc-500">İmza alarak görevi bitirin</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-300" />
                                </button>

                                <button 
                                    type="button" 
                                    onClick={() => setStep("REPORT_ISSUE")} 
                                    className="w-full bg-white border border-zinc-200 hover:border-amber-400 hover:bg-amber-50 p-4 rounded-xl flex items-center gap-4 transition-all text-left shadow-sm"
                                >
                                    <div className="bg-amber-100 text-amber-600 p-3 rounded-lg">
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[15px] font-bold text-zinc-900 mb-0.5">Sorun Bildir (İptal)</h4>
                                        <p className="text-[12px] font-medium text-zinc-500">Adres hatalı, vefat, taşınma</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-300" />
                                </button>

                                <button 
                                    type="button" 
                                    onClick={() => setStep("UPDATE_INFO")} 
                                    className="w-full bg-white border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 p-4 rounded-xl flex items-center gap-4 transition-all text-left shadow-sm"
                                >
                                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                        <Edit className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[15px] font-bold text-zinc-900 mb-0.5">Bilgileri Güncelle</h4>
                                        <p className="text-[12px] font-medium text-zinc-500">Tel, isim veya adresi düzelt</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-300" />
                                </button>
                            </div>
                        )}

                        {step === "SIGNATURE" && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-600">Teslimat Notu (İsteğe Bağlı)</Label>
                                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Kime teslim edildi?" className="h-12 bg-white border-zinc-200 shadow-sm rounded-lg" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-semibold text-zinc-600">İmza</Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => sigPad.current?.clear()} className="h-7 px-2 text-[11px] font-bold text-red-500 hover:bg-red-50 hover:text-red-700">
                                            TEMİZLE
                                        </Button>
                                    </div>
                                    <div className="border border-zinc-300 rounded-lg overflow-hidden bg-zinc-50 min-h-[180px] relative touch-none">
                                        <SignatureCanvas
                                            ref={sigPad}
                                            penColor="#000000"
                                            canvasProps={{ className: 'w-full h-[180px] cursor-crosshair' }}
                                        />
                                        <div className="absolute bottom-4 left-6 right-6 border-b border-zinc-300 border-dashed pointer-events-none"></div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="h-12 w-1/3 font-bold text-zinc-600 rounded-lg border-zinc-300" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleCompleteDelivery} disabled={isSubmitting} className="h-12 w-2/3 bg-zinc-900 hover:bg-black text-white font-bold rounded-lg shadow-md">
                                        {isSubmitting ? "KAYDEDİLİYOR.." : "ONAYLA"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "REPORT_ISSUE" && (
                            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-semibold text-zinc-600">Sebebi Nedir?</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["Taşınmış", "Vefat Etmiş", "İhtiyacı Yok", "Adresi Hatalı", "Kişi Reddetti", "Diğer"].map(reason => (
                                            <Button 
                                                key={reason} 
                                                type="button" 
                                                variant={issueReason === reason ? "default" : "outline"}
                                                className={`rounded-lg h-12 font-semibold justify-start px-3 text-[13px] ${issueReason === reason ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                                                onClick={() => setIssueReason(reason)}
                                            >
                                                {reason}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-600">Notunuz (Zorunlu Değil)</Label>
                                    <Textarea 
                                        value={issueNote} 
                                        onChange={e => setIssueNote(e.target.value)} 
                                        placeholder="Ofiste görünecek not..."
                                        className="bg-white border-zinc-200 shadow-sm rounded-lg resize-none min-h-[80px]"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="h-12 w-1/3 font-bold text-zinc-600 rounded-lg border-zinc-300" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleReportIssue} disabled={isSubmitting} className="h-12 w-2/3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-md">
                                        GÖNDER
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "UPDATE_INFO" && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-600">Adı</Label>
                                        <Input value={updateFirstName} onChange={e => setUpdateFirstName(e.target.value)} className="h-12 bg-white border-zinc-200 shadow-sm rounded-lg" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-600">Soyadı</Label>
                                        <Input value={updateLastName} onChange={e => setUpdateLastName(e.target.value)} className="h-12 bg-white border-zinc-200 shadow-sm rounded-lg" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-600">Telefon</Label>
                                    <Input value={currentPhone} onChange={e => setCurrentPhone(e.target.value)} type="tel" className="h-12 bg-white border-zinc-200 shadow-sm rounded-lg font-mono" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-600">Açık Adres</Label>
                                    <Textarea value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} className="bg-white border-zinc-200 shadow-sm rounded-lg resize-none min-h-[80px]" />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" className="h-12 w-1/3 font-bold text-zinc-600 rounded-lg border-zinc-300" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleUpdateInfo} disabled={isSubmitting} className="h-12 w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md">
                                        GÜNCELLE
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
