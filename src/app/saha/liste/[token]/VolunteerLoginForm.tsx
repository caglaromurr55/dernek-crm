"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { claimDistributionListAction } from "@/app/actions/volunteer";
import { useRouter } from "next/navigation";
import { ArrowRight, Phone, User } from "lucide-react";

export function VolunteerLoginForm({ token }: { token: string }) {
    const router = useRouter();
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
                router.refresh();
            }
        } catch (error) {
            toast.error("Bir ağ hatası oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                        <User className="h-5 w-5" />
                    </div>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Ad Soyad"
                        required
                        disabled={isSubmitting}
                        className="pl-12 h-16 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-3xl font-medium focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:bg-white/10 transition-all"
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                        <Phone className="h-5 w-5" />
                    </div>
                    <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="05** *** ** **"
                        required
                        disabled={isSubmitting}
                        className="pl-12 h-16 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-3xl font-medium font-mono tracking-widest focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:bg-white/10 transition-all"
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 mt-2 bg-white text-zinc-950 hover:bg-zinc-200 font-black rounded-3xl text-sm uppercase tracking-widest flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] group"
            >
                {isSubmitting ? (
                    "SİSTEME GİRİŞ YAPILIYOR..."
                ) : (
                    <>
                        GÖREVİ ÜSTLEN
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </>
                )}
            </Button>
        </form>
    );
}
