"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Camera, ArrowLeft } from "lucide-react";
import { addPersonToHouseholdAction } from "@/app/actions/person";
import { MrzScanner } from "@/components/MrzScanner";

export function AddPersonDialog({ householdId }: { householdId: string }) {
    const [open, setOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        identityNo: "",
        birthDate: ""
    });

    const handleScan = (data: { identityNo?: string; firstName?: string; lastName?: string; birthDate?: string }) => {
        setFormData(prev => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            identityNo: data.identityNo || prev.identityNo,
            birthDate: data.birthDate || prev.birthDate
        }));
        setScannerOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Kişi Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {scannerOpen ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setScannerOpen(false)}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                Kimlik Tara
                            </DialogTitle>
                            <DialogDescription>
                                TC Kimlik kartınızın arka yüzündeki barkodlu bölgeyi (MRZ) kameraya okutunuz.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-2">
                            <MrzScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="flex flex-row items-start justify-between">
                            <div>
                                <DialogTitle>Kişi Kaydı</DialogTitle>
                                <DialogDescription>
                                    Hanede yaşayan bireyin bilgilerini girin veya kimliğini taratın.
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        <div className="py-2">
                            <Button
                                type="button"
                                onClick={() => setScannerOpen(true)}
                                variant="outline"
                                className="w-full mb-4 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                            >
                                <Camera className="mr-2 h-4 w-4" />
                                Hızlı Kayıt için Kimlik Tara
                            </Button>

                            <form action={async (formData) => {
                                await addPersonToHouseholdAction(formData);
                                setOpen(false);
                            }} className="grid gap-4">
                                <input type="hidden" name="householdId" value={householdId} />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="firstName">Ad</Label>
                                        <Input id="firstName" name="firstName" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="lastName">Soyad</Label>
                                        <Input id="lastName" name="lastName" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="identityNo">TC Kimlik No</Label>
                                        <Input id="identityNo" name="identityNo" required maxLength={11} minLength={11} value={formData.identityNo} onChange={e => setFormData({ ...formData, identityNo: e.target.value })} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="birthDate">Doğum Tarihi</Label>
                                        <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="flex items-center justify-center space-x-2 border p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                                        <input type="checkbox" id="isDisabled" name="isDisabled" className="h-4 w-4 rounded border-gray-300" />
                                        <Label htmlFor="isDisabled" className="text-sm font-medium leading-none">
                                            Engelli Birey
                                        </Label>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2 border p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                                        <input type="checkbox" id="hasChronicIllness" name="hasChronicIllness" className="h-4 w-4 rounded border-gray-300" />
                                        <Label htmlFor="hasChronicIllness" className="text-sm font-medium leading-none">
                                            Kronik Hasta
                                        </Label>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">Kaydet</Button>
                            </form>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
