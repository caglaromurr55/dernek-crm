"use client";

import { useState, useRef, useEffect } from "react";
import { PackageCheck, ScanLine, X, Eraser, AlertTriangle, Edit3 } from "lucide-react";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { updateVolunteerDeliveryAction } from "@/app/actions/volunteer";
import SignatureCanvas from 'react-signature-canvas';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { toast } from "sonner";

interface Props {
    deliveryId: string;
    householdId: string;
    allowedIdentities: string[];
    currentAddress: string;
    currentPhone: string;
}

export function VolunteerDeliveryButton({ deliveryId, householdId, allowedIdentities, currentAddress, currentPhone }: Props) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"VERIFICATION" | "ACTION_SELECT" | "SIGNATURE" | "REPORT_ISSUE" | "UPDATE_INFO">("VERIFICATION");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Verification State
    const [tcInput, setTcInput] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

    // Update Info State
    const [addressInput, setAddressInput] = useState(currentAddress);
    const [phoneInput, setPhoneInput] = useState(currentPhone || "");

    // Issue Report State
    const [issueReason, setIssueReason] = useState("Ulaşılamadı");
    const [issueNotes, setIssueNotes] = useState("");

    // Signature State
    const sigPad = useRef<SignatureCanvas>(null);

    useEffect(() => {
        return () => stopScanning();
    }, []);

    const stopScanning = () => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
        setIsScanning(false);
    };

    const startScanning = async () => {
        setErrorMsg("");
        try {
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
            const codeReader = new BrowserMultiFormatReader(hints);
            codeReaderRef.current = codeReader;
            setIsScanning(true);

            setTimeout(async () => {
                if (!videoRef.current) return;
                try {
                    await codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
                        if (result) {
                            setTcInput(result.getText());
                            stopScanning();
                        }
                    });
                } catch (err) {
                    setErrorMsg("Kamera başlatılamadı.");
                    stopScanning();
                }
            }, 500);
        } catch (err) {
            setErrorMsg("Barkod okuyucu başlatılamadı.");
            setIsScanning(false);
        }
    };

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!tcInput) {
            setErrorMsg("Lütfen TC Kimlik numarası girin.");
            return;
        }

        if (allowedIdentities.includes(tcInput.trim())) {
            stopScanning();
            setStep("ACTION_SELECT");
        } else {
            setErrorMsg("Hata: Bu TC kimlik numarası hanede kayıtlı sakinlerden birine ait değil!");
        }
    };

    const handleSubmitComplete = async (status: "DELIVERED" | "FAILED") => {
        setIsSubmitting(true);
        setErrorMsg("");

        let signatureData = "";
        if (status === "DELIVERED" && sigPad.current && !sigPad.current.isEmpty()) {
            signatureData = sigPad.current.getTrimmedCanvas().toDataURL("image/png");
        } else if (status === "DELIVERED") {
            setErrorMsg("Lütfen imza alın.");
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData();
        formData.append("deliveryId", deliveryId);
        formData.append("householdId", householdId);
        formData.append("status", status);
        formData.append("address", addressInput);
        formData.append("phone", phoneInput);

        if (status === "DELIVERED") {
            formData.append("signatureData", signatureData);
        } else if (status === "FAILED") {
            formData.append("notes", `${issueReason}: ${issueNotes}`);
        }

        try {
            const res = await updateVolunteerDeliveryAction(formData);
            if (res.success) {
                setOpen(false);
                toast.success("İşlem Başarılı", { description: "Saha kaydı başarıyla oluşturuldu." });
            } else {
                setErrorMsg(res.message || "Bilinmeyen hata");
            }
        } catch (err) {
            setErrorMsg("Sunucu hatası.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black tracking-wider uppercase shadow-lg shadow-blue-600/30" onClick={() => setOpen(true)}>
                İŞLEM YAP
            </Button>

            <Dialog open={open} onOpenChange={(val) => {
                if (!val) {
                    stopScanning();
                    setStep("VERIFICATION");
                    setTcInput("");
                    setErrorMsg("");
                }
                setOpen(val);
            }}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            {step === "VERIFICATION" && "KİMLİK TEYİDİ"}
                            {step === "ACTION_SELECT" && "İŞLEM TÜRÜ SEÇİN"}
                            {step === "SIGNATURE" && "TESLİMAT İMZASI"}
                            {step === "REPORT_ISSUE" && "SORUN BİLDİR"}
                            {step === "UPDATE_INFO" && "BİLGİLERİ GÜNCELLE"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium">
                            {step === "VERIFICATION" && "Lütfen teslim alacak kişinin kimliğini okutun veya girin."}
                            {step === "ACTION_SELECT" && "Uygulamak istediğiniz saha işlemini seçin."}
                            {step === "SIGNATURE" && "Teslimatın başarıyla kayıt altına alınabilmesi için imza gereklidir."}
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-sm font-semibold border border-red-100 mt-2">
                            {errorMsg}
                        </div>
                    )}

                    {step === "VERIFICATION" && (
                        <form onSubmit={handleVerifySubmit} className="space-y-5 pt-4">
                            {isScanning ? (
                                <div className="space-y-2 relative border-2 border-zinc-200 rounded-3xl overflow-hidden bg-black flex justify-center w-full aspect-square">
                                    <video ref={videoRef} className="h-full w-full object-cover" />
                                    <Button type="button" size="icon" variant="destructive" className="absolute top-4 right-4 rounded-full h-10 w-10 shadow-lg" onClick={stopScanning}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <Button type="button" variant="outline" className="w-full h-16 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-100 text-blue-700 font-bold" onClick={startScanning}>
                                        <ScanLine className="h-6 w-6 mr-3" />
                                        KAMERADAN OKUT
                                    </Button>

                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-zinc-200"></div>
                                        <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs font-black uppercase">VEYA</span>
                                        <div className="flex-grow border-t border-zinc-200"></div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tcIdentity" className="font-bold text-zinc-700 ml-1">Kimlik Numarası (Manuel)</Label>
                                        <Input
                                            id="tcIdentity"
                                            value={tcInput}
                                            onChange={(e) => setTcInput(e.target.value)}
                                            placeholder="11 haneli TC No"
                                            maxLength={11}
                                            className="h-14 rounded-2xl bg-zinc-50 border-zinc-200 text-lg font-bold tracking-widest text-center"
                                        />
                                    </div>
                                </div>
                            )}
                            <Button type="submit" disabled={!tcInput} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-wider shadow-xl shadow-blue-600/20">
                                Doğrula ve İlerle
                            </Button>
                        </form>
                    )}

                    {step === "ACTION_SELECT" && (
                        <div className="grid grid-cols-1 gap-4 pt-4">
                            <Button onClick={() => setStep("SIGNATURE")} className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold text-lg justify-start px-6 shadow-xl shadow-emerald-500/20">
                                <PackageCheck className="mr-3 h-6 w-6" /> TESLİMAT YAP
                            </Button>
                            <Button onClick={() => setStep("REPORT_ISSUE")} variant="outline" className="h-16 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-lg justify-start px-6">
                                <AlertTriangle className="mr-3 h-6 w-6" /> SORUN BİLDİR
                            </Button>
                            <Button onClick={() => setStep("UPDATE_INFO")} variant="outline" className="h-16 rounded-2xl border-2 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-lg justify-start px-6">
                                <Edit3 className="mr-3 h-6 w-6" /> BİLGİLERİ GÜNCELLE
                            </Button>
                        </div>
                    )}

                    {step === "SIGNATURE" && (
                        <div className="space-y-4 pt-4">
                            <div className="border-2 border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-inner">
                                <SignatureCanvas
                                    ref={sigPad}
                                    penColor="black"
                                    canvasProps={{ className: 'w-full h-56 cursor-crosshair' }}
                                />
                            </div>

                            <div className="flex justify-between items-center px-1">
                                <Button type="button" variant="ghost" size="sm" onClick={() => sigPad.current?.clear()} className="text-zinc-500 font-bold">
                                    <Eraser className="h-4 w-4 mr-2" /> TEMİZLE
                                </Button>
                            </div>

                            <DialogFooter className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="h-14 rounded-2xl flex-1 font-bold" onClick={() => setStep("ACTION_SELECT")} disabled={isSubmitting}>GERİ</Button>
                                <Button type="button" onClick={() => handleSubmitComplete("DELIVERED")} disabled={isSubmitting} className="h-14 rounded-2xl flex-[2] bg-emerald-500 hover:bg-emerald-600 font-black tracking-wider shadow-lg shadow-emerald-500/30">
                                    {isSubmitting ? "KAYDEDİLİYOR.." : "ONAYLA"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {step === "REPORT_ISSUE" && (
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-zinc-700 ml-1">Neden Teslim Edilemedi?</Label>
                                <select
                                    className="flex h-12 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                                    value={issueReason}
                                    onChange={(e) => setIssueReason(e.target.value)}
                                >
                                    <option value="Ulaşılamadı">Evde yok / Ulaşılamadı</option>
                                    <option value="Taşınmış">Taşınmış / Adreste yok</option>
                                    <option value="Reddetti">Yardımı Reddetti</option>
                                    <option value="İhtiyacı Yok">Maddi durumu iyi (İhtiyacı kalmamış)</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-zinc-700 ml-1">Ek Notlar (Opsiyonel)</Label>
                                <Textarea
                                    className="resize-none h-24 rounded-xl bg-zinc-50 border-zinc-200"
                                    placeholder="Detaylı bilgi girebilirsiniz..."
                                    value={issueNotes}
                                    onChange={(e) => setIssueNotes(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="h-14 rounded-2xl flex-1 font-bold border-zinc-200" onClick={() => setStep("ACTION_SELECT")}>GERİ</Button>
                                <Button type="button" variant="destructive" className="h-14 rounded-2xl flex-[2] font-black tracking-wider shadow-lg shadow-red-500/30 bg-red-500 hover:bg-red-600" onClick={() => handleSubmitComplete("FAILED")} disabled={isSubmitting}>
                                    İPTAL OLARAK KAYDET
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {step === "UPDATE_INFO" && (
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-zinc-700 ml-1">Telefon Numarası</Label>
                                <Input
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    className="h-12 rounded-xl bg-zinc-50 border-zinc-200 font-medium"
                                    placeholder="Örn: 0555..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-zinc-700 ml-1">Güncel Adres</Label>
                                <Textarea
                                    value={addressInput}
                                    onChange={(e) => setAddressInput(e.target.value)}
                                    className="resize-none h-24 rounded-xl bg-zinc-50 border-zinc-200 font-medium leading-relaxed"
                                />
                            </div>

                            <DialogFooter className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="h-14 rounded-2xl flex-1 font-bold border-zinc-200" onClick={() => setStep("ACTION_SELECT")}>İPTAL</Button>
                                <Button type="button" className="h-14 rounded-2xl flex-[2] font-black tracking-wider bg-zinc-900 hover:bg-black text-white" onClick={() => {
                                    toast.success("Bilgiler uygulamada geçici olarak güncellendi. Teslimat tamamlandığında kaydedilecektir.");
                                    setStep("ACTION_SELECT");
                                }}>
                                    ONAYLA VE DEVAM ET
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
