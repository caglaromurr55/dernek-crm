"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, RefreshCw, AlertCircle, UserPlus, ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { createVolunteerAction } from "@/app/actions/volunteerManagement";
import { toast } from "sonner";

export function VolunteerCreateButton() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);

        try {
            const res = await createVolunteerAction(formData);
            if (!res.success) {
                setErrorMsg(res.message || "Bilinmeyen bir hata oluştu.");
                toast.error("İşlem Başarısız", { description: res.message });
            } else {
                toast.success("Hesap Oluşturuldu", { description: res.message });
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            setErrorMsg("Sunucuyla bağlantı sağlanamadı.");
            toast.error("Bağlantı Hatası");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 shadow-md h-11">
                <ShieldPlus className="mr-2 h-4 w-4" />
                Personel / Yönetici Ekle
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md border-border bg-background shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                            <ShieldPlus className="w-5 h-5 text-primary" /> Yeni İdari Hesap Oluştur
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Sistem üzerinde tam yetkiye (Admin) sahip olacak kurum personeli veya yöneticisi için giriş hesabı tanımlayın.
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs font-bold border border-destructive/20 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {errorMsg}
                        </div>
                    )}

                    <form id="volunteer-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase">Ad Soyad</Label>
                            <Input id="name" name="name" placeholder="Örn: Ahmet Yılmaz" required className="h-10 bg-muted/50 focus-visible:ring-primary/20" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase">E-Posta (Giriş Kullanıcı Adı)</Label>
                            <Input id="email" name="email" type="email" placeholder="personel@dernek.org" required className="h-10 bg-muted/50 focus-visible:ring-primary/20" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase">Geçici Şifre</Label>
                            <Input id="password" name="password" type="text" placeholder="Güvenli bir şifre belirleyin" required minLength={6} className="h-10 bg-muted/50 focus-visible:ring-primary/20" />
                            <p className="text-[10px] text-muted-foreground/80 italic">Yeni yönetici bu bilgilerle panele tam erişim sağlayacaktır.</p>
                        </div>
                    </form>

                    <DialogFooter className="gap-2 sm:space-x-0 mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="h-11">
                            İptal
                        </Button>
                        <Button form="volunteer-form" type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 h-11 w-full sm:w-auto font-bold shadow-sm">
                            {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ShieldPlus className="mr-2 h-4 w-4" />}
                            {isSubmitting ? "KAYDEDİLİYOR..." : "HESABI OLUŞTUR"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
