import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { SettingsNeighborhoods } from "./SettingsNeighborhoods";
import { Settings, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const session = await auth();

    if (!session || (session.user as any)?.role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in-fade">
                <ShieldAlert className="w-20 h-20 text-red-500 opacity-20" />
                <h1 className="text-2xl font-black text-foreground">Yetkisiz Erişim</h1>
                <p className="text-muted-foreground font-medium">Bu sayfayı görüntülemek için Yönetici (ADMIN) yetkisine sahip olmalısınız.</p>
            </div>
        );
    }

    const neighborhoods = await (prisma as any).neighborhood.findMany({
        orderBy: { name: "asc" }
    });

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in-fade pb-24">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-inner">
                    <Settings className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text uppercase">Sistem Ayarları</h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Uygulama genelindeki statik verileri, lokasyonları ve operasyonel kuralları buradan yönetebilirsiniz.
                    </p>
                </div>
            </div>

            <SettingsNeighborhoods initialData={neighborhoods} />
        </div>
    );
}
