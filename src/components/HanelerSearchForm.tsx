"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function HanelerSearchForm({
    initialQuery,
    initialStatus,
}: {
    initialQuery: string;
    initialStatus: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [query, setQuery] = useState(initialQuery);
    const [status, setStatus] = useState(initialStatus);

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
            params.set("q", query);
        } else {
            params.delete("q");
        }

        if (status && status !== "ALL") {
            params.set("status", status);
        } else {
            params.delete("status");
        }

        // Yeni arama veya filtreleme yapıldığında 1. sayfaya dön
        params.delete("page");

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleClear = () => {
        setQuery("");
        setStatus("ALL");
        const params = new URLSearchParams();
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-card p-4 rounded-3xl border-border/50 w-full shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:flex-1">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="TC Kimlik No, Ad veya Soyad ara..."
                        className="pl-10 bg-secondary border-none h-10 rounded-xl focus-visible:ring-emerald-500/20"
                    />
                </div>

                <Select value={status || "ALL"} onValueChange={setStatus}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-none h-10 rounded-xl focus:ring-emerald-500/20">
                        <SelectValue placeholder="Durum Filtresi" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                        <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                        <SelectItem value="PENDING">İnceleme Bekliyor</SelectItem>
                        <SelectItem value="APPROVED">Onaylandı (Sürekli)</SelectItem>
                        <SelectItem value="APPROVED_ONCE">Onaylandı (Tek Seferlik)</SelectItem>
                        <SelectItem value="REJECTED">Reddedildi</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
                {(query || (status && status !== "ALL")) && (
                    <Button
                        variant="ghost"
                        onClick={handleClear}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl h-10 px-4"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Temizle
                    </Button>
                )}
                <Button
                    onClick={handleSearch}
                    disabled={isPending}
                    className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground rounded-xl px-8 h-10 font-bold"
                >
                    <Filter className="mr-2 h-4 w-4" />
                    {isPending ? "Aranıyor..." : "Uygula"}
                </Button>
            </div>
        </div>
    );
}
