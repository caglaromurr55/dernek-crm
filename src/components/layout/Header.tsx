import { Bell, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";

export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card"></span>
                </Button>
                <div className="h-6 w-px bg-border"></div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">Yönetici</span>
                        <span className="text-[10px] font-bold text-muted-foreground">admin@dernek.org</span>
                    </div>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="" alt="Admin" />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <UserCircle className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
