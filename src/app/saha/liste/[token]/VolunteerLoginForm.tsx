"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { claimDistributionListAction } from "@/app/actions/volunteer";

export function VolunteerLoginForm({ token }: { token: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const res = await claimDistributionListAction(formData);
            if (!res.success) {
                toast.error(res.message || "Giriş yapılamadı.");
            } else {
                toast.success("Görev başarıyla üstlenildi!");
                // Let Next.js revalidate and refresh the page automatically now
            }
        } catch (error) {
            toast.error("Bir ağ hatası oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="token" value={token} />
            <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Ad Soyad</Label>
                <Input id="name" name="name" placeholder="Örn: Ahmet Yılmaz" required disabled={isSubmitting} className="h-12 bg-zinc-50 border-0 rounded-xl" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Telefon Numarası</Label>
                <Input id="phone" name="phone" type="tel" placeholder="05xx xxx xx xx" required disabled={isSubmitting} className="h-12 bg-zinc-50 border-0 rounded-xl" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 text-lg uppercase tracking-tight">
                {isSubmitting ? "BEKLEYİNİZ..." : "GÖREVİ ÜSTLEN"}
            </Button>
        </form>
    );
}
