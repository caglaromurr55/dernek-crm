"use client";

import { useState, useRef, useEffect } from "react";
import { PackageCheck, MapPin, Phone, ScanLine, X, Eraser, PenTool, Flashlight, AlertTriangle, UserCog, Edit, Save, Send, ChevronRight, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const [currentPhone, setCurrentPhone] = useState(delivery.household.contactNumber || "");
    const [updateMahalle, setUpdateMahalle] = useState(delivery.household.mahalle || "");
    const [updateSokak, setUpdateSokak] = useState(delivery.household.sokak || "");
    const [updateBinaNo, setUpdateBinaNo] = useState(delivery.household.binaNo || "");
    const [updateKat, setUpdateKat] = useState(delivery.household.kat || "");
    const [updateDaire, setUpdateDaire] = useState(delivery.household.daire || "");
    const [updateAddressDetail, setUpdateAddressDetail] = useState(delivery.household.addressDetail || "");
    const [currentAddress, setCurrentAddress] = useState(delivery.household.address || ""); // Yalnızca read-only yedek gösterim için veya fallback
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
        formData.append("mahalle", updateMahalle);
        formData.append("sokak", updateSokak);
        formData.append("binaNo", updateBinaNo);
        formData.append("kat", updateKat);
        formData.append("daire", updateDaire);
        formData.append("addressDetail", updateAddressDetail);

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
            <div 
                onClick={() => setOpen(true)}
                className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.04] active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group flex items-start gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            >
                {/* Score / Avatar */}
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center shrink-0 border border-emerald-100/50 shadow-inner">
                    <span className="text-[10px] font-black opacity-60 mb-[-2px] tracking-widest uppercase">Skor</span>
                    <span className="text-[19px] font-black tracking-tighter leading-none">{delivery.household.score}</span>
                </div>

                {/* Details */}
                <div className="flex-1 pt-0.5 min-w-0">
                    <h3 className="text-[19px] font-bold text-zinc-900 tracking-tight leading-none mb-2.5 truncate group-hover:text-emerald-700 transition-colors">
                        {applicant ? `${applicant.firstName} ${applicant.lastName}` : "İsimsiz Kayıt"}
                    </h3>
                    
                    <div className="space-y-1.5">
                        <div className="flex items-start gap-2 text-zinc-500">
                            <MapPin className="w-4 h-4 shrink-0 mt-[2px] opacity-70" />
                            <span className="text-[14px] font-medium leading-snug line-clamp-2">{delivery.household.address}</span>
                        </div>
                        
                        {delivery.household.contactNumber && (
                            <div className="flex items-center gap-2 text-zinc-500">
                                <Phone className="w-4 h-4 shrink-0 opacity-70" />
                                <span className="text-[14px] font-mono font-bold tracking-tight">{delivery.household.contactNumber}</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions (Prevent bubbling so it doesn't open the dialog) */}
                    <div className="flex items-center gap-2 mt-4">
                        <a 
                            href={`https://maps.google.com/?q=${encodeURIComponent(delivery.household.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            Yol Tarifi
                        </a>
                        {delivery.household.contactNumber && (
                            <a 
                                href={`tel:${delivery.household.contactNumber}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                Ara
                            </a>
                        )}
                    </div>
                </div>

                {/* Action Chevron */}
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors self-center">
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500" />
                </div>
            </div>

            <Dialog open={open} onOpenChange={(v) => { if (!v) { stopScanning(); setStep("VERIFICATION"); } setOpen(v); }}>
                <DialogContent className="sm:max-w-md rounded-[36px] p-0 overflow-hidden border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] bg-white w-[95vw] md:w-full mx-auto outline-none">
                    
                    {/* Minimal Header */}
                    <div className="px-6 py-6 pb-4 flex items-center gap-4 bg-white">
                        <div className="h-12 w-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-black/[0.04] shadow-sm shrink-0">
                            {step === "VERIFICATION" && <ScanLine className="w-6 h-6 text-zinc-700" />}
                            {step === "OPTIONS" && <UserCog className="w-6 h-6 text-emerald-600" />}
                            {step === "SIGNATURE" && <PenTool className="w-6 h-6 text-zinc-700" />}
                            {step === "REPORT_ISSUE" && <AlertTriangle className="w-6 h-6 text-amber-500" />}
                            {step === "UPDATE_INFO" && <Edit className="w-6 h-6 text-blue-500" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
                                {step === "VERIFICATION" && "Kimlik Teyidi"}
                                {step === "OPTIONS" && "İşlem Seçimi"}
                                {step === "SIGNATURE" && "Teslimat İmzası"}
                                {step === "REPORT_ISSUE" && "Sorun Bildirimi"}
                                {step === "UPDATE_INFO" && "Bilgileri Güncelle"}
                            </DialogTitle>
                            <DialogDescription className="text-[13px] text-zinc-500 font-medium leading-relaxed mt-0.5">
                                {step === "VERIFICATION" && "Lütfen teslim edilecek kişiyi barkodla doğrulayın."}
                                {step === "OPTIONS" && "Doğrulama başarılı. Yapmak istediğiniz işlemi seçin."}
                                {step === "SIGNATURE" && "Hak sahibinden teslimat imzasını alın."}
                                {step === "REPORT_ISSUE" && "Sahada karşılaştığınız engeli seçin."}
                                {step === "UPDATE_INFO" && "Eksik veya yanlış bilgileri düzeltin."}
                            </DialogDescription>
                        </div>
                        
                        <button onClick={() => setOpen(false)} className="ml-auto w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 pt-2 bg-zinc-50/50">
                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[13px] font-semibold border border-red-100 mb-6 flex items-start gap-3">
                                <X className="w-5 h-5 shrink-0" />
                                <span className="pt-0.5">{errorMsg}</span>
                            </div>
                        )}

                        {step === "VERIFICATION" && (
                            <form onSubmit={handleVerifySubmit} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                {isScanning ? (
                                    <div className="relative border-4 border-black/5 rounded-[28px] overflow-hidden bg-black aspect-[3/4] md:aspect-square flex items-center justify-center shadow-inner">
                                        <div id={`reader-${delivery.id}`} className="h-full w-full object-cover opacity-80" />
                                        <div className="absolute top-4 right-4 flex flex-col gap-3 z-30">
                                            <Button type="button" size="icon" variant="destructive" className="rounded-2xl h-12 w-12 shadow-xl bg-white/20 backdrop-blur-md border border-white/30" onClick={stopScanning}>
                                                <X className="h-6 w-6 text-white" />
                                            </Button>
                                            <Button type="button" variant="secondary" size="icon" className="rounded-2xl h-12 w-12 shadow-xl bg-white/20 backdrop-blur-md border border-white/30" onClick={toggleFlash}>
                                                <Flashlight className={`h-6 w-6 ${isFlashOn ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <Button type="button" className="w-full h-16 rounded-[20px] bg-white border border-black-[0.05] hover:border-black/[0.1] text-zinc-900 font-bold flex items-center justify-center gap-3 transition-colors shadow-sm" onClick={startScanning}>
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                                                <ScanLine className="h-4 w-4" />
                                            </div>
                                            <span className="text-[15px] tracking-wide">Kamerayla Tara</span>
                                        </Button>
                                        
                                        <div className="relative flex items-center py-2">
                                            <div className="flex-grow border-t border-zinc-200"></div>
                                            <span className="flex-shrink-0 mx-4 text-zinc-400 text-[11px] font-bold uppercase tracking-widest bg-zinc-50 px-2">Veya El İle</span>
                                            <div className="flex-grow border-t border-zinc-200"></div>
                                        </div>
                                        
                                        <div className="space-y-2.5">
                                            <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">TC Kimlik Numarası</Label>
                                            <Input
                                                value={tcInput}
                                                onChange={(e) => setTcInput(e.target.value)}
                                                placeholder="11 haneli vatandaşlık no"
                                                maxLength={11}
                                                className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-mono font-semibold focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-[15px] transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                                <Button type="submit" disabled={!tcInput} className="w-full h-16 bg-zinc-900 hover:bg-black text-white font-bold rounded-[20px] text-[15px] shadow-[0_8px_20px_rgba(0,0,0,0.15)] disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                                    Doğrula <ChevronRight className="w-5 h-5 opacity-70" />
                                </Button>
                            </form>
                        )}

                        {step === "OPTIONS" && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <button 
                                    type="button" 
                                    onClick={() => setStep("SIGNATURE")} 
                                    className="w-full bg-white border border-black/[0.05] hover:border-emerald-400/50 hover:bg-emerald-50/50 p-5 rounded-[24px] flex items-center gap-5 transition-all text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)] group active:scale-[0.98]"
                                >
                                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <PackageCheck className="h-7 w-7" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-bold text-zinc-900 mb-1">Teslim Et</h4>
                                        <p className="text-[13px] font-medium text-zinc-500">İmza alınıp kaydedilir.</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500" />
                                    </div>
                                </button>

                                <button 
                                    type="button" 
                                    onClick={() => setStep("REPORT_ISSUE")} 
                                    className="w-full bg-white border border-black/[0.05] hover:border-amber-400/50 hover:bg-amber-50/50 p-5 rounded-[24px] flex items-center gap-5 transition-all text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)] group active:scale-[0.98]"
                                >
                                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <AlertTriangle className="h-7 w-7" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-bold text-zinc-900 mb-1">Sorun Bildir</h4>
                                        <p className="text-[13px] font-medium text-zinc-500">Taşınma, ret veya hata.</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-500" />
                                    </div>
                                </button>

                                <button 
                                    type="button" 
                                    onClick={() => setStep("UPDATE_INFO")} 
                                    className="w-full bg-white border border-black/[0.05] hover:border-blue-400/50 hover:bg-blue-50/50 p-5 rounded-[24px] flex items-center gap-5 transition-all text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)] group active:scale-[0.98]"
                                >
                                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <Edit className="h-7 w-7" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[17px] font-bold text-zinc-900 mb-1">Bilgi Güncelle</h4>
                                        <p className="text-[13px] font-medium text-zinc-500">Eksik/hatalı bilgiyi düzelt.</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" />
                                    </div>
                                </button>
                            </div>
                        )}

                        {step === "SIGNATURE" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2.5">
                                    <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Teslimat Notu (İsteğe Bağlı)</Label>
                                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Örn: Komşusuna verildi." className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-[15px] transition-all" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <Label className="text-[13px] font-semibold text-zinc-600">İmza Mühürü</Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => sigPad.current?.clear()} className="h-8 px-3 text-[12px] font-bold text-zinc-500 bg-zinc-100/50 hover:bg-zinc-200 rounded-full">
                                            TEMİZLE
                                        </Button>
                                    </div>
                                    <div className="border border-black/[0.05] rounded-[24px] overflow-hidden bg-white shadow-inner min-h-[220px] relative touch-none ring-1 ring-black/[0.02]">
                                        <SignatureCanvas
                                            ref={sigPad}
                                            penColor="#000000"
                                            canvasProps={{ className: 'w-full h-[220px] cursor-crosshair' }}
                                        />
                                        <div className="absolute bottom-6 left-8 right-8 border-b-2 border-zinc-200 border-dashed pointer-events-none opacity-50"></div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-black/[0.05]">
                                    <Button type="button" variant="outline" className="h-16 flex-1 font-bold text-zinc-600 rounded-[20px] border border-black/[0.08] hover:bg-zinc-50" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleCompleteDelivery} disabled={isSubmitting} className="h-16 flex-[2] bg-zinc-900 hover:bg-black text-white font-bold rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all text-[15px]">
                                        {isSubmitting ? "KAYDEDİLİYOR.." : "TAMAMLA"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "REPORT_ISSUE" && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Sorun Kaynağı</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {["Taşınmış", "Vefat Etmiş", "İhtiyacı Yok", "Adresi Hatalı", "Kişi Reddetti", "Diğer"].map(reason => (
                                            <Button 
                                                key={reason} 
                                                type="button" 
                                                variant={issueReason === reason ? "default" : "outline"}
                                                className={`rounded-[16px] h-14 font-semibold text-[14px] transition-all ${issueReason === reason ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] border-transparent' : 'bg-white border border-black/[0.08] text-zinc-700 hover:bg-zinc-50'}`}
                                                onClick={() => setIssueReason(reason)}
                                            >
                                                {reason}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Ek Notlar</Label>
                                    <Textarea 
                                        value={issueNote} 
                                        onChange={e => setIssueNote(e.target.value)} 
                                        placeholder="Varsa belirtin..."
                                        className="bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 py-3 font-medium focus-visible:ring-amber-500/20 focus-visible:border-amber-500 text-[15px] resize-none min-h-[100px] transition-all"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-black/[0.05]">
                                    <Button type="button" variant="outline" className="h-16 flex-1 font-bold text-zinc-600 rounded-[20px] border border-black/[0.08] hover:bg-zinc-50" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleReportIssue} disabled={isSubmitting} className="h-16 flex-[2] bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-[20px] shadow-[0_8px_20px_rgba(245,158,11,0.25)] active:scale-[0.98] transition-all text-[15px]">
                                        GÖNDER
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "UPDATE_INFO" && (
                            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Adı</Label>
                                        <Input value={updateFirstName} onChange={e => setUpdateFirstName(e.target.value)} className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Soyadı</Label>
                                        <Input value={updateLastName} onChange={e => setUpdateLastName(e.target.value)} className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Telefon</Label>
                                    <Input value={currentPhone} onChange={e => setCurrentPhone(e.target.value)} type="tel" className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-mono font-bold focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Mahalle</Label>
                                        <Input value={updateMahalle} onChange={e => setUpdateMahalle(e.target.value)} className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Sokak / Cadde</Label>
                                        <Input value={updateSokak} onChange={e => setUpdateSokak(e.target.value)} className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2.5">
                                        <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Bina</Label>
                                        <Input value={updateBinaNo} onChange={e => setUpdateBinaNo(e.target.value)} className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Kat</Label>
                                        <Input value={updateKat} onChange={e => setUpdateKat(e.target.value)} className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Daire</Label>
                                        <Input value={updateDaire} onChange={e => setUpdateDaire(e.target.value)} className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[13px] font-semibold text-zinc-600 block pl-1">Adres Detayı / Tarif</Label>
                                    <Input value={updateAddressDetail} onChange={e => setUpdateAddressDetail(e.target.value)} placeholder="Şok marketin yanı, B11 Blok" className="h-14 bg-white border border-black/[0.05] shadow-sm rounded-[16px] px-4 font-medium focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-[15px] transition-all" />
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-black/[0.05]">
                                    <Button type="button" variant="outline" className="h-16 flex-1 font-bold text-zinc-600 rounded-[20px] border border-black/[0.08] hover:bg-zinc-50" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleUpdateInfo} disabled={isSubmitting} className="h-16 flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[20px] shadow-[0_8px_20px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-all text-[15px]">
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
