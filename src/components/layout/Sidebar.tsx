import Link from "next/link";
import {
  Home,
  Users,
  UserPlus,
  Settings,
  Package,
  ListChecks,
  HeartHandshake,
  LogOut
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Haneler", href: "/haneler", icon: Users },
  { name: "Yeni Hane Ekle", href: "/haneler/yeni", icon: UserPlus },
  { name: "Dağıtım Listeleri", href: "/dagitim", icon: ListChecks },
  { name: "Saha Görevlerim", href: "/saha", icon: Package },
  { name: "Yardım Türleri", href: "/yardim-turleri", icon: HeartHandshake },
];

export function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <HeartHandshake className="h-6 w-6 text-emerald-600" />
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Dernek CRM</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4 space-y-2">
        <Link
          href="/ayarlar"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
        >
          <Settings className="h-5 w-5" />
          Ayarlar
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="hidden lg:flex lg:h-full lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
      <SidebarContent />
    </div>
  );
}
