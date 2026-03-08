"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info, Save } from "lucide-react";

interface EditHouseholdSidebarProps {
    navItems: { id: string; label: string; icon: any }[];
}

export function EditHouseholdSidebar({ navItems }: EditHouseholdSidebarProps) {
    const [activeSection, setActiveSection] = useState(navItems[0]?.id || "");

    useEffect(() => {
        const scrollContainer = document.getElementById("main-scroll-container");
        if (!scrollContainer) return;

        const handleScroll = () => {
            const sections = navItems.map(item => item.id);
            let current = "";
            for (const section of sections) {
                const el = document.getElementById(section);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 300) {
                        current = section;
                    }
                }
            }
            if (current && current !== activeSection) {
                setActiveSection(current);
            }
        };

        handleScroll();
        scrollContainer.addEventListener("scroll", handleScroll);
        return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, [activeSection, navItems]);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        const scrollContainer = document.getElementById("main-scroll-container");
        if (el && scrollContainer) {
            const offset = 80;
            const y = scrollContainer.scrollTop + el.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top - offset;
            scrollContainer.scrollTo({ top: y, behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    return (
        <div className="hidden lg:block lg:col-span-3 sticky top-24 h-fit">
            <Card className="glass-card border-0 shadow-lg bg-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Form Bölümleri
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 p-3 pt-0">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollToSection(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold border-l-4 ${activeSection === item.id
                                ? "bg-emerald-50 text-emerald-700 border-l-emerald-500 shadow-sm"
                                : "bg-transparent text-muted-foreground border-l-transparent hover:bg-secondary/50 hover:text-foreground"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    ))}
                </CardContent>
            </Card>

            <Card className="bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 border-0 overflow-hidden relative mt-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                <CardContent className="p-6 space-y-5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/20 rounded-xl"><Info className="w-5 h-5" /></div>
                        <p className="text-xs font-medium leading-relaxed">
                            Değişiklikleri kaydettikten sonra sistem hane ihtiyacını <strong>otomatik olarak yeniden skorlayacaktır.</strong>
                        </p>
                    </div>
                    <Button type="submit" className="w-full bg-white text-emerald-700 hover:bg-zinc-100 font-extrabold h-12 text-sm shadow-xl shadow-emerald-900/10 transition-transform active:scale-95">
                        <Save className="mr-2 h-4 w-4" /> Güncellemeleri Kaydet
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
