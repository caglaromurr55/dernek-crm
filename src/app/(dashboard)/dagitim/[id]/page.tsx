import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle, MapPin, Phone } from "lucide-react";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AllDistributionListsPDFButton } from "@/components/export/AllDistributionListsPDFButton";

export default async function DagitimDetayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const event = await prisma.distributionEvent.findUnique({
        where: { id },
        include: {
            item: true,
            lists: {
                include: {
                    _count: {
                        select: { deliveries: true }
                    },
                    deliveries: {
                        include: {
                            household: {
                                include: {
                                    persons: {
                                        where: { isApplicant: true }
                                    }
                                }
                            }
                        },
                        orderBy: {
                            household: { score: "desc" }
                        }
                    }
                }
            },
            deliveries: {
                select: { status: true }
            }
        }
    });

    if (!event) {
        notFound();
    }

    const totalDeliveries = event.deliveries.length;
    const totalDelivered = event.deliveries.filter(d => d.status === "DELIVERED").length;
    const totalProgress = totalDeliveries > 0 ? (totalDelivered / totalDeliveries) * 100 : 0;

    return (
        <div className="space-y-8 animate-in-fade">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/dagitim">
                        <Button variant="outline" size="icon" className="rounded-xl bg-background shadow-sm hover:bg-secondary">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text uppercase">{event.name}</h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            {event.startDate.toLocaleDateString("tr-TR")} Tarihli Operasyon •
                            <Badge variant="outline" className="text-[10px] font-black uppercase border-emerald-200/50 text-emerald-600 bg-emerald-50/10">
                                {event.status === "ACTIVE" ? "AKTİF" : "TAMAMLANDI"}
                            </Badge>
                        </p>
                    </div>
                </div>
                {event.lists.length > 0 && (
                    <AllDistributionListsPDFButton event={event} lists={event.lists} />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-3xl border-0 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-zinc-500/10 transition-colors"></div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">TOPLAM HANE</p>
                    <p className="text-4xl font-black text-foreground">{totalDeliveries}</p>
                </div>
                <div className="glass-card p-6 rounded-3xl border-0 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group border-b-4 border-b-emerald-500/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">TESLİM EDİLEN</p>
                    <p className="text-4xl font-black text-emerald-700">{totalDelivered}</p>
                </div>
                <div className="glass-card p-6 rounded-3xl border-0 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group border-b-4 border-b-amber-500/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-colors"></div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">BEKLEYEN</p>
                    <p className="text-4xl font-black text-amber-700">{totalDeliveries - totalDelivered}</p>
                </div>
                <div className="glass-card p-6 rounded-3xl border-0 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group border-b-4 border-b-blue-500/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors"></div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">İLERLEME</p>
                    <p className="text-4xl font-black text-blue-700">%{Math.round(totalProgress)}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                            DAĞITIM LİSTELERİ
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium">Bu kampanya kapsamında oluşturulan alt çalışma listeleri.</p>
                    </div>
                </div>

                <div className="glass-card rounded-3xl shadow-2xl border-0 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-secondary/50">
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="font-bold text-muted-foreground py-5 pl-8">LİSTE ADI / SORUMLU</TableHead>
                                <TableHead className="font-bold text-muted-foreground py-5 text-center">HANE SAYISI</TableHead>
                                <TableHead className="font-bold text-muted-foreground py-5">İLERLEME DURUMU</TableHead>
                                <TableHead className="font-bold text-muted-foreground py-5 text-right pr-8">TAKİP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {event.lists.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20">
                                        <div className="flex flex-col items-center justify-center opacity-30 gap-3">
                                            <p className="font-bold text-lg">Bu kampanyada henüz bir liste oluşturulmadı.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                event.lists.map((list) => {
                                    const listDelivered = list.deliveries.filter(d => d.status === "DELIVERED").length;
                                    const listTotal = list._count.deliveries;
                                    const listPercent = listTotal > 0 ? (listDelivered / listTotal) * 100 : 0;

                                    return (
                                        <TableRow key={list.id} className="group hover:bg-secondary transition-all border-border/50">
                                            <TableCell className="py-5 pl-8 font-bold text-foreground group-hover:text-emerald-700 transition-colors">
                                                {list.name || `Liste - ${list.id.slice(0, 8)}`}
                                                <div className="text-[10px] text-muted-foreground font-black uppercase mt-1 tracking-tighter">Oluşturulma: {list.createdAt.toLocaleDateString('tr-TR')}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="bg-secondary font-black px-3 rounded-lg border-0">{listTotal} HANE</Badge>
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                        <span>{listDelivered} / {listTotal} TESLİMAT</span>
                                                        <span>%{Math.round(listPercent)}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 transition-all duration-500"
                                                            style={{ width: `${listPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Link href={`/dagitim/liste/${list.id}`}>
                                                    <Button variant="ghost" size="sm" className="rounded-xl group-hover:bg-white group-hover:shadow-sm font-bold text-emerald-700">
                                                        Detayları Gör <ArrowLeft className="ml-1 h-3.5 w-3.5 rotate-180" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
