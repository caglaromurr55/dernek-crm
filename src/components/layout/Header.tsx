import { Bell, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";

export function Header() {
    return (
        <div className="flex w-full items-center justify-between gap-4">
            <div className="flex flex-1 max-w-sm items-center space-x-2">
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hidden xs:flex">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card"></span>
                </Button>
                <div className="h-6 w-px bg-border hidden sm:block"></div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">Yönetici</span>
                        <span className="text-[10px] font-bold text-muted-foreground">admin@dernek.org</span>
                    </div>
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        <AvatarImage src="" alt="Admin" />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <UserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    );
}
