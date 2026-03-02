"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (query.trim()) {
            router.push(`/haneler?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hane, kişi veya TC Kimlik ara..."
                className="w-full bg-secondary border-none h-10 rounded-xl pl-10 focus-visible:ring-emerald-500/20"
            />
        </form>
    );
}
