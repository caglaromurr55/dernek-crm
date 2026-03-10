"use client";

import { useState, useRef, useEffect } from "react";
import { PackageCheck, MapPin, Phone, CheckCircle2, Navigation, ScanLine, X, Eraser, PenTool, Flashlight, AlertTriangle, UserCog, Edit, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
                toast.success("Sorun merkeze bildirildi!");
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
                setStep("OPTIONS"); // Dönüş
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
                        Teslim Görevi
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={open} onOpenChange={(v) => { if (!v) { stopScanning(); setStep("VERIFICATION"); } setOpen(v); }}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl bg-zinc-50">
                    <DialogHeader className="p-8 bg-zinc-900 text-zinc-50">
                        <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                            {step === "VERIFICATION" && <><ScanLine className="w-6 h-6" /> Kimlik Teyidi</>}
                            {step === "OPTIONS" && <><UserCog className="w-6 h-6" /> Hane İşlemleri</>}
                            {step === "SIGNATURE" && <><PenTool className="w-6 h-6" /> Teslimat İmzası</>}
                            {step === "REPORT_ISSUE" && <><AlertTriangle className="w-6 h-6 text-amber-500" /> Sorun Bildirimi</>}
                            {step === "UPDATE_INFO" && <><Edit className="w-6 h-6 text-blue-400" /> Bilgileri Güncelle</>}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 font-medium">
                            {step === "VERIFICATION" && "Hane sakinlerinden birinin TC kimliğini doğrulayın."}
                            {step === "OPTIONS" && "Kimlik doğrulandı! Şimdi yapmak istediğiniz işlemi seçin."}
                            {step === "SIGNATURE" && "Lütfen başvuru sahibinden veya bir yakından imza alın."}
                            {step === "REPORT_ISSUE" && "Hanede karşılaştığınız durumu merkeze bildirin."}
                            {step === "UPDATE_INFO" && "Bu hanenin iletişim veya adres bilgilerini düzeltin."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100/50 flex items-center gap-2">
                                <X className="w-4 h-4 shrink-0" /> {errorMsg}
                            </div>
                        )}

                        {step === "VERIFICATION" && (
                            <form onSubmit={handleVerifySubmit} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
                                        <Button type="button" variant="outline" className="w-full h-16 rounded-[1.25rem] border-2 border-zinc-200 bg-white flex items-center justify-center gap-3 text-lg font-black italic tracking-tighter uppercase text-zinc-900 hover:bg-zinc-100 transition-all shadow-sm" onClick={startScanning}>
                                            <ScanLine className="h-6 w-6 text-emerald-600" />
                                            KİMLİK BARKODU TARA
                                        </Button>
                                        <div className="relative flex items-center">
                                            <div className="flex-grow border-t-2 border-zinc-200"></div>
                                            <span className="flex-shrink-0 mx-6 text-zinc-400 text-[10px] font-black uppercase tracking-widest">VEYA ELLE GİRİŞ</span>
                                            <div className="flex-grow border-t-2 border-zinc-200"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">TC KİMLİK NUMARASI</Label>
                                            <Input
                                                value={tcInput}
                                                onChange={(e) => setTcInput(e.target.value)}
                                                placeholder="11 Haneli TC"
                                                maxLength={11}
                                                className="h-14 bg-white border border-zinc-200 shadow-sm rounded-2xl text-lg font-mono font-bold text-center tracking-widest focus-visible:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                )}
                                <Button type="submit" disabled={!tcInput} className="w-full h-16 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-lg uppercase italic tracking-tighter shadow-xl shadow-zinc-900/10">
                                    DOĞRULA VE DEVAM ET
                                </Button>
                            </form>
                        )}

                        {step === "OPTIONS" && (
                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                                <Button onClick={() => setStep("SIGNATURE")} className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-[1.5rem] shadow-xl shadow-emerald-500/20 justify-start px-6 gap-4">
                                    <div className="bg-white/20 p-2 rounded-xl">
                                        <PackageCheck className="h-6 w-6" />
                                    </div>
                                    TESLİM ET
                                </Button>

                                <Button onClick={() => setStep("REPORT_ISSUE")} variant="outline" className="w-full h-20 border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-lg rounded-[1.5rem] shadow-sm justify-start px-6 gap-4">
                                    <div className="bg-amber-200/50 p-2 rounded-xl">
                                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                                    </div>
                                    SORUN BİLDİR
                                </Button>

                                <Button onClick={() => setStep("UPDATE_INFO")} variant="outline" className="w-full h-20 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-lg rounded-[1.5rem] shadow-sm justify-start px-6 gap-4">
                                    <div className="bg-blue-200/50 p-2 rounded-xl">
                                        <Edit className="h-6 w-6 text-blue-600" />
                                    </div>
                                    BİLGİLERİ GÜNCELLE
                                </Button>
                            </div>
                        )}

                        {step === "SIGNATURE" && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-1.5 focus-within:text-emerald-700">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-tight pl-1 transition-colors">TESLİMAT NOTU (OPSİYONEL)</Label>
                                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Örn: Komşusuna teslim edildi" className="h-12 bg-white border border-zinc-200 shadow-sm rounded-xl text-sm font-bold focus-visible:ring-emerald-500" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">İMZA ALANI</Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => sigPad.current?.clear()} className="h-6 text-[10px] font-black text-zinc-400 hover:text-red-500 uppercase flex items-center gap-1 rounded-full">
                                            <Eraser className="h-3 w-3" /> TEMİZLE
                                        </Button>
                                    </div>
                                    <div className="border-2 border-zinc-200 rounded-3xl overflow-hidden bg-white shadow-inner min-h-[180px] flex items-center justify-center relative">
                                        <SignatureCanvas
                                            ref={sigPad}
                                            penColor="#047857"
                                            canvasProps={{ className: 'w-full h-48 cursor-crosshair' }}
                                        />
                                        <div className="absolute bottom-4 left-0 w-full flex justify-center pointer-events-none opacity-20">
                                            <div className="w-3/4 border-b-2 border-zinc-900 border-dashed"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="h-14 w-1/3 font-bold text-zinc-500 rounded-2xl border-2 border-zinc-200" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleCompleteDelivery} disabled={isSubmitting} className="h-14 w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl uppercase italic tracking-tighter text-lg shadow-xl shadow-emerald-500/20">
                                        {isSubmitting ? "KAYDEDİLİYOR..." : "TAMAMLA"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "REPORT_ISSUE" && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-300">
                                <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200">
                                    <p className="text-sm font-medium text-amber-800">
                                        Sorun bildirdiğinizde bu teslimat görevi iptal edilecek ve hane "İnceleme Bekliyor" statüsüne geçerek ofis personeline uyarı düşecektir.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Sorun Türü Seçin</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["Taşınmış", "Vefat Etmiş", "İhtiyacı Yok", "Adres Bulunamadı", "Kişi Reddetti", "Diğer"].map(reason => (
                                            <Button
                                                key={reason}
                                                type="button"
                                                variant={issueReason === reason ? "default" : "outline"}
                                                className={`rounded-xl h-12 font-bold ${issueReason === reason ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-amber-50 hover:border-amber-200'}`}
                                                onClick={() => setIssueReason(reason)}
                                            >
                                                {reason}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Notunuz (İsteğe Bağlı)</Label>
                                    <Textarea
                                        value={issueNote}
                                        onChange={e => setIssueNote(e.target.value)}
                                        placeholder="Ofis personeline iletmek istediğiniz detaylar..."
                                        className="bg-white border-zinc-200 rounded-2xl shadow-sm resize-none focus-visible:ring-amber-500"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="h-14 w-1/3 font-bold text-zinc-500 rounded-2xl border-2 border-zinc-200" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleReportIssue} disabled={isSubmitting} className="h-14 w-2/3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl uppercase italic tracking-tighter text-lg shadow-xl shadow-amber-500/20 gap-2">
                                        <Send className="w-5 h-5" />
                                        {isSubmitting ? "GÖNDERİLİYOR..." : "BİLDİRİMİ İLET"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "UPDATE_INFO" && (
                            <div className="space-y-5 animate-in slide-in-from-bottom-8 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Adı</Label>
                                        <Input value={updateFirstName} onChange={e => setUpdateFirstName(e.target.value)} className="h-12 bg-white border border-zinc-200 shadow-sm rounded-xl font-bold focus-visible:ring-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Soyadı</Label>
                                        <Input value={updateLastName} onChange={e => setUpdateLastName(e.target.value)} className="h-12 bg-white border border-zinc-200 shadow-sm rounded-xl font-bold focus-visible:ring-blue-500" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Telefon Numarası</Label>
                                    <Input value={currentPhone} onChange={e => setCurrentPhone(e.target.value)} type="tel" className="h-12 bg-white border border-zinc-200 shadow-sm rounded-xl font-bold font-mono focus-visible:ring-blue-500" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Açık Adres</Label>
                                    <Textarea value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} className="bg-white border-zinc-200 shadow-sm rounded-xl font-medium focus-visible:ring-blue-500 resize-none h-24" />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" className="h-14 w-1/3 font-bold text-zinc-500 rounded-2xl border-2 border-zinc-200" onClick={() => setStep("OPTIONS")} disabled={isSubmitting}>İPTAL</Button>
                                    <Button type="button" onClick={handleUpdateInfo} disabled={isSubmitting} className="h-14 w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl uppercase italic tracking-tighter text-lg shadow-xl shadow-blue-500/20 gap-2">
                                        <Save className="w-5 h-5" />
                                        {isSubmitting ? "KAYDEDİLİYOR..." : "BİLGİLERİ KAYDET"}
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
