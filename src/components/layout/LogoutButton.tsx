"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton({ isCollapsed }: { isCollapsed?: boolean }) {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={isCollapsed ? "Çıkış Yap" : ""}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 dark:text-red-400 dark:hover:bg-red-950/30 ${isCollapsed ? 'w-fit mx-auto justify-center' : 'w-full'}`}
        >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="animate-in-fade slide-in-from-left-2">Çıkış Yap</span>}
        </button>
    );
}
