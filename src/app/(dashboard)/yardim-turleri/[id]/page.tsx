import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const item = await prisma.item.findUnique({
        where: { id },
        include: {
            inventories: {
                orderBy: { createdAt: "desc" }
            }
        }
    });

    if (!item) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/yardim-turleri">
                    <Button variant="outline" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Package className="h-4 w-4" /> Envanter Geçmişi
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                    <div className="absolute top-0 right-0 p-6 opacity-20">
                        <Package className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-emerald-50">Mevcut Stok</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black">{item.stock} <span className="text-xl font-medium opacity-80">{item.unit}</span></div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 shadow-sm border-0 glass-card">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <History className="h-5 w-5 text-muted-foreground" />
                            Stok Hareketleri Logu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-secondary/50">
                                <TableRow>
                                    <TableHead className="pl-6">Tarih</TableHead>
                                    <TableHead>İşlem Türü</TableHead>
                                    <TableHead className="text-center">Miktar</TableHead>
                                    <TableHead>Açıklama / Kaynak</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {item.inventories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                            Henüz bir stok hareketi kaydedilmemiş.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    item.inventories.map((inv: any) => (
                                        <TableRow key={inv.id} className="hover:bg-secondary/50">
                                            <TableCell className="pl-6 text-muted-foreground whitespace-nowrap">
                                                {inv.createdAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={inv.type === "IN" ? "secondary" : "destructive"}
                                                    className={inv.type === "IN" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-rose-100 text-rose-800 hover:bg-rose-200"}
                                                >
                                                    {inv.type === "IN" ? "GİRİŞ" : "ÇIKIŞ"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-bold font-mono">
                                                {inv.type === "IN" ? "+" : "-"}{inv.quantity}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={inv.reason || "-"}>
                                                {inv.reason || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
