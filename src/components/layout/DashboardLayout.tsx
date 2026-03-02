"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar, SidebarContent } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <header className="flex h-16 items-center border-b border-border bg-card px-4 lg:px-6 shrink-0">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Menüyü Aç</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 border-r border-border bg-card">
                            <div className="h-full" onClick={() => setOpen(false)}>
                                <SidebarContent />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="flex-1 flex justify-between items-center">
                        <Header />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <div className="mx-auto max-w-6xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
