import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, User as UserIcon, CheckCircle2, AlertTriangle } from "lucide-react";
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
import { DeliveryStatusButton } from "@/components/DeliveryStatusButton";
import { DistributionListPDFButton } from "@/components/export/DistributionListPDFButton";

export default async function ListeDetayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const list = await prisma.distributionList.findUnique({
        where: { id },
        include: {
            distributionEvent: {
                include: { item: true }
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
    });

    if (!list) {
        notFound();
    }

    const deliveredCount = list.deliveries.filter(d => d.status === "DELIVERED").length;
    const totalCount = list.deliveries.length;
    const progressPercent = totalCount > 0 ? (deliveredCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-8 animate-in-fade pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href={`/dagitim/${list.distributionEventId}`}>
                        <Button variant="outline" size="icon" className="rounded-xl bg-background shadow-sm hover:bg-secondary">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text uppercase">
                            {list.name || "DAĞITIM LİSTESİ"}
                        </h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            Kampanya: <span className="font-bold text-foreground">{list.distributionEvent.name}</span>
                            <Badge variant="outline" className="text-[10px] font-black uppercase text-blue-600 bg-blue-50/10 border-blue-200/50">
                                SAHA TAKİBİ
                            </Badge>
                            {list.assignedTo && (
                                <Badge variant="outline" className="text-[10px] font-black uppercase text-amber-600 bg-amber-50/10 border-amber-200/50">
                                    GÖNÜLLÜ: {list.assignedTo}
                                </Badge>
                            )}
                        </p>
                    </div>
                </div>

                <DistributionListPDFButton list={list} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-3xl border-0 shadow-xl flex flex-col justify-center relative overflow-hidden group border-l-4 border-l-blue-500">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Teslim Edilecek Ürün</p>
                    <p className="text-2xl font-black text-foreground">{list.distributionEvent.item?.name || "Belirtilmedi"}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Birim: {list.distributionEvent.item?.unit || "-"}</p>
                </div>
                <div className="glass-card p-6 rounded-3xl border-0 shadow-xl flex flex-col justify-center relative overflow-hidden group border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Saha İlerleme</p>
                    <div className="flex items-end gap-2">
                        <p className="text-4xl font-black text-emerald-700">{deliveredCount}</p>
                        <p className="text-lg font-bold text-muted-foreground mb-1">/ {totalCount} HANE</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl border-0 shadow-xl flex flex-col justify-center relative overflow-hidden group border-l-4 border-l-amber-500">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">İlerleme Çubuğu</p>
                    <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-xs font-black uppercase">
                            <span>%{Math.round(progressPercent)} TAMAMLANDI</span>
                        </div>
                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-3xl shadow-2xl border-0 overflow-hidden">
                <Table>
                    <TableHeader className="bg-secondary/50">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="font-bold text-muted-foreground py-5 pl-8">HANE / BAŞVURU SAHİBİ</TableHead>
                            <TableHead className="font-bold text-muted-foreground py-5">ADRES & KONUM</TableHead>
                            <TableHead className="font-bold text-muted-foreground py-5 text-center">İLETİŞİM</TableHead>
                            <TableHead className="font-bold text-muted-foreground py-5 text-center">SKOR</TableHead>
                            <TableHead className="font-bold text-muted-foreground py-5 text-right pr-8">DURUM / AKSİYON</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.deliveries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 opacity-30">
                                    <p className="font-bold text-lg">Bu listede hane bulunmuyor.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            list.deliveries.map((delivery) => {
                                const applicant = delivery.household.persons[0];
                                return (
                                    <TableRow key={delivery.id} className="group hover:bg-secondary/50 transition-all border-border/50">
                                        <TableCell className="py-6 pl-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                    <UserIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-foreground uppercase tracking-tighter">
                                                        {applicant ? `${applicant.firstName} ${applicant.lastName}` : "Bilinmiyor"}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-muted-foreground">TC: {applicant?.identityNo || "-"}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <p className="text-xs font-bold text-zinc-600 line-clamp-2" title={delivery.household.address}>
                                                    {delivery.household.address}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 font-black text-xs text-zinc-500 bg-secondary/30 py-1.5 px-3 rounded-xl border border-border/50">
                                                <Phone className="w-3.5 h-3.5" />
                                                {delivery.household.contactNumber || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white font-black text-[10px] shadow-lg">
                                                {delivery.household.score}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <DeliveryStatusButton
                                                deliveryId={delivery.id}
                                                currentStatus={delivery.status}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Field Mode Indicator */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-zinc-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in-slide-up">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-black uppercase tracking-widest">Saha Takip Modu Aktif</p>
                    <div className="w-px h-6 bg-zinc-700"></div>
                    <p className="text-xs font-bold text-zinc-400">Anlık durum güncellemeleri açık.</p>
                </div>
            </div>
        </div>
    );
}
