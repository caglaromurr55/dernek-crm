"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-10 h-10 hover:bg-secondary transition-all"
        >
            {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
            ) : (
                <Moon className="h-5 w-5 text-zinc-600" />
            )}
        </Button>
    );
}
