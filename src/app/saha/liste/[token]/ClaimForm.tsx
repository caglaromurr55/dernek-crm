"use client";

import { useState } from "react";
import { claimDistributionListAction } from "@/app/actions/volunteer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function ClaimForm({ token }: { token: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        formData.append("token", token);

        try {
            const res = await claimDistributionListAction(formData);
            if (!res.success) {
                setError(res.message || "Bilinmeyen bir hata oluştu.");
            }
        } catch (err) {
            setError("Sunucuya bağlanılamadı.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-700 font-bold ml-1">Adınız Soyadınız</Label>
                <Input id="name" name="name" placeholder="Örn: Ahmet Yılmaz" required className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-700 font-bold ml-1">Telefon Numaranız</Label>
                <Input id="phone" name="phone" placeholder="Örn: 0555 555 55 55" required className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider shadow-lg shadow-blue-600/30">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "LİSTEYİ ÜSTLEN"}
            </Button>
            <p className="text-xs text-center text-zinc-400 mt-4 px-4">
                Listeyi üstlendiğinizde bu teslimatlar tamamen sizin adınıza sistemde kaydedilecektir.
            </p>
        </form>
    );
}
