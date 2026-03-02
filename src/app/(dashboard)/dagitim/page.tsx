export const dynamic = "force-dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Calendar, ChevronRight, Activity, Clock, CheckCircle2, XCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DistributionCreateButton } from "@/components/DistributionCreateButton";

export default async function DagitimPage() {
    const events = await (prisma as any).distributionEvent.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { deliveries: true } }
        }
    });

    const items = await (prisma as any).item.findMany({
        select: { id: true, name: true, unit: true },
        orderBy: { name: "asc" }
    });

    const households = await (prisma as any).household.findMany({
        select: { address: true }
    });

    const neighborhoods = Array.from(new Set(
        households
            .map((h: any) => h.address.split(" - ")[0])
            .filter((n: string) => n && n.length > 0)
    )).sort() as string[];

    return (
        <div className="space-y-8 animate-in-fade">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text">Dağıtım Operasyonları</h1>
                    <p className="text-muted-foreground font-medium">Sahadaki yardım paketlerinin, koli ve ödenek dağıtımlarının akıllı takibi.</p>
                </div>
                <DistributionCreateButton items={items} neighborhoods={neighborhoods} />
            </div>

            <div className="glass-card rounded-3xl shadow-2xl border-0 overflow-hidden">
                <Table>
                    <TableHeader className="bg-secondary/50">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="font-bold text-muted-foreground py-5 pl-8">KAMPANYA / DAĞITIM ADI</TableHead>
                            <TableHead className="font-bold text-muted-foreground py-5">BAŞLANGIÇ</TableHead>
                            <TableHead className="font-bold text-muted-foreground py-5 text-center">HEDEF HANE</TableHead>
                            <TableHead className="font-bold text-muted-foreground py-5">DURUM</TableHead>
                            <TableHead className="font-bold text-muted-foreground py-5 text-right pr-8">İŞLEMLER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 px-8">
                                    <div className="flex flex-col items-center justify-center opacity-30 gap-4">
                                        <Package className="h-16 w-16 text-zinc-300" />
                                        <div className="space-y-1">
                                            <p className="font-black text-xl">Henüz bir kampanya yok.</p>
                                            <p className="text-sm font-medium">Sağ üstten yeni bir dağıtım operasyonu başlatabilirsiniz.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((evt: any) => (
                                <TableRow key={evt.id} className="group hover:bg-secondary transition-all border-border even:bg-secondary/40">
                                    <TableCell className="py-5 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-11 w-11 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-emerald-50/10 group-hover:text-emerald-500 transition-all shadow-sm">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{evt.name}</p>
                                                <p className="text-[10px] font-black text-muted-foreground mt-1 tracking-widest uppercase truncate max-w-[100px]">ID: {evt.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                                            <Calendar className="h-4 w-4 text-emerald-500" />
                                            {evt.startDate?.toLocaleDateString("tr-TR")}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center justify-center bg-secondary text-foreground h-9 px-4 rounded-xl font-black text-sm group-hover:bg-background group-hover:shadow-inner transition-all border border-transparent group-hover:border-border">
                                            {evt._count?.deliveries || 0} Hane
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                evt.status === "ACTIVE"
                                                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-sm border-0 gap-1.5"
                                                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 border-0 gap-1.5"
                                            }
                                        >
                                            {evt.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {evt.status === "ACTIVE" ? "Aktif Operasyon" : "Tamamlandı"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <Link href={`/dagitim/${evt.id}`}>
                                            <Button variant="ghost" size="sm" className="rounded-xl group-hover:bg-background group-hover:shadow-sm font-bold text-emerald-700">
                                                Yönet <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-8 glass-card rounded-3xl relative overflow-hidden shadow-xl border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-2">
                        <h4 className="text-xl font-black text-foreground">Operasyonel Verimlilik</h4>
                        <p className="text-muted-foreground text-sm font-medium max-w-lg leading-relaxed">
                            Otomatik liste oluşturma algoritması, hanelerin son yardım alma tarihlerini ve ihtiyaç skorlarını analiz ederek adil bir dağıtım planlar.
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div className="text-center">
                            <p className="text-4xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">{events.filter((e: any) => e.status === "ACTIVE").length}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aktif Kampanya</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-black tracking-tighter text-foreground">{events.length}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Toplam Operasyon</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
