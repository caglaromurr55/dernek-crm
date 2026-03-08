"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Loader2, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("E-posta veya şifre hatalı.");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Giriş yapılırken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-background selection:bg-emerald-500/30">
            {/* Sol Taraf - Markalama ve Görsel (Sadece Desktop) */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-zinc-950 relative overflow-hidden p-14 text-white border-r border-zinc-800/50">
                {/* Dinamik Arka Plan Efektleri */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-600/20 blur-[140px]" />
                    <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 flex items-center gap-3 animate-in-fade">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <HeartHandshake className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-3xl font-black tracking-tight">Dernek CRM</span>
                </div>

                <div className="relative z-10 space-y-8 max-w-lg mb-12 animate-in-fade" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
                    <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight">
                        İyiliği organize <br />etmenin <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">en akıllı</span> yolu.
                    </h1>
                    <p className="text-lg text-zinc-400 font-medium leading-relaxed">
                        Haneleri yönetin, yardım paketlerini koordine edin ve sahadaki gönüllü gücünüzü tek bir merkezden kusursuzca kontrol edin.
                    </p>

                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`w-12 h-12 rounded-full border-[3px] border-zinc-950 flex items-center justify-center bg-zinc-800/80 backdrop-blur-sm z-[${4 - i}]`}>
                                    <ShieldCheck className="w-5 h-5 text-emerald-400/80" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-200">Güvenli Altyapı</span>
                            <span className="text-xs text-zinc-500 font-medium tracking-wide">Uçtan Uca Şifreleme</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs font-semibold text-zinc-600 uppercase tracking-widest animate-in-fade" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
                    &copy; {new Date().getFullYear()} <a href="https://stratilla.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">STRATILLA AI SOLUTIONS</a>. Tüm hakları saklıdır.
                </div>
            </div>

            {/* Sağ Taraf - Giriş Formu */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-background">
                {/* Mobil için arkada hafif bulanık efekt */}
                <div className="absolute inset-0 flex lg:hidden overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] rounded-full bg-emerald-600/10 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-600/10 blur-[120px]" />
                </div>

                <div className="w-full max-w-[460px] space-y-8 relative z-10 bg-white dark:bg-zinc-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-zinc-200/80 dark:border-zinc-800/80 p-8 sm:p-12 rounded-[2rem] animate-in-fade">
                    <div className="text-center space-y-3 mb-8">
                        <div className="flex lg:hidden items-center justify-center gap-3 mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <HeartHandshake className="h-7 w-7 text-white" />
                            </div>
                            <span className="text-3xl font-black tracking-tight text-foreground">Dernek CRM</span>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Hoş Geldiniz</h2>
                        <p className="text-muted-foreground font-medium text-sm sm:text-base">
                            Yönetici paneline erişmek için oturum açın.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-semibold border border-red-200 dark:border-red-500/20 flex items-center gap-3 animate-in-fade">
                                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">E-Posta Adresi</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@dernek.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-14 pl-12 bg-zinc-50 dark:bg-zinc-950/50 border-input dark:border-zinc-800/80 rounded-2xl text-base font-medium focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Şifre</Label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-14 pl-12 bg-zinc-50 dark:bg-zinc-950/50 border-input dark:border-zinc-800/80 rounded-2xl text-base font-medium focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 mt-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-[0.98] group"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    Doğrulanıyor...
                                </>
                            ) : (
                                <span className="flex items-center pb-0.5">
                                    Oturum Aç <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
