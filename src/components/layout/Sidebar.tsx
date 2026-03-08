"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MapPin, Package, History, HeartHandshake, Settings, Database, ShoppingCart, Barcode, ChevronLeft, ChevronRight } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { Button } from "@/components/ui/button";

const mainNavigation = [
  { name: "Ana Sayfa", href: "/", icon: Home },
  { name: "İhtiyaç Sahibi Haneler", href: "/haneler", icon: Users },
  { name: "Dağıtım Yönetimi", href: "/dagitim", icon: Package },
  { name: "Stok & Envanter", href: "/yardim-turleri", icon: Database },
  { name: "Sosyal Butik", href: "/butik/stoklar", icon: ShoppingCart },
  { name: "Butik POS Kasa", href: "/butik/kasa", icon: Barcode },
];

const secondaryNavigation = [
  { name: "Sistem Logları", href: "/loglar", icon: History },
  { name: "Ekip Yönetimi", href: "/gonulluler", icon: HeartHandshake },
];

export function SidebarContent({ role, isCollapsed }: { role?: string, isCollapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={`flex h-full flex-col gap-6 p-4 bg-card border-r border-border shadow-xl shadow-zinc-900/5 dark:shadow-black/50 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex h-[60px] items-center px-2 shrink-0 justify-between">
        <Link href="/" className="flex items-center gap-3 group overflow-hidden">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 text-white font-black text-xl transition-transform group-hover:scale-105 group-hover:rotate-3">
            D
          </div>
          {!isCollapsed && (
            <div className="animate-in-fade slide-in-from-left-2 duration-300">
              <span className="font-extrabold text-xl tracking-tight text-foreground group-hover:text-emerald-600 transition-colors uppercase whitespace-nowrap">Dernek CRM</span>
              <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600/70">Yönetim Paneli</p>
            </div>
          )}
        </Link>
      </div>

      <div className="flex-1 space-y-8 mt-2">
        <nav className="flex flex-col gap-1.5">
          {!isCollapsed && <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 animate-in-fade">TEMEL İŞLEMLER</p>}
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : ""}
                className={`flex items-center gap-3 rounded-xl ${isCollapsed ? 'px-2 justify-center' : 'px-4'} py-3 text-sm font-semibold transition-all duration-200 ${isActive
                  ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-emerald-600" : ""}`} />
                {!isCollapsed && <span className="animate-in-fade slide-in-from-left-2">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <nav className="flex flex-col gap-1.5">
          {role !== "VOLUNTEER" && (
            <>
              {!isCollapsed && <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 animate-in-fade">RAPOR & YÖNETİM</p>}
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : ""}
                    className={`flex items-center gap-3 rounded-xl ${isCollapsed ? 'px-2 justify-center' : 'px-4'} py-3 text-sm font-semibold transition-all duration-200 ${isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span className="animate-in-fade slide-in-from-left-2">{item.name}</span>}
                  </Link>
                );
              })}

              <Link
                href="/ayarlar"
                title={isCollapsed ? "Ayarlar" : ""}
                className={`flex items-center gap-3 rounded-xl ${isCollapsed ? 'px-2 justify-center' : 'px-4'} py-3 text-sm font-semibold transition-all duration-200 ${pathname.startsWith("/ayarlar")
                  ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="animate-in-fade slide-in-from-left-2">Ayarlar</span>}
              </Link>
            </>
          )}
          <LogoutButton isCollapsed={isCollapsed} />
        </nav>
      </div>
    </div>
  );
}

export function Sidebar({ role, isCollapsed, onToggle }: { role?: string, isCollapsed: boolean, onToggle: () => void }) {
  return (
    <div className={`hidden lg:flex lg:h-full lg:flex-col lg:border-r lg:border-border lg:bg-card transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <SidebarContent role={role} isCollapsed={isCollapsed} />

      {/* Toggle Button */}
      <Button
        variant="secondary"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-20 h-8 w-8 rounded-full border border-border shadow-md z-50 bg-background hover:bg-muted"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  );
}
