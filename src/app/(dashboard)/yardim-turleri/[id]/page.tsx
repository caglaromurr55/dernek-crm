export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, History, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssemblePackageForm } from "@/components/inventory/AssemblePackageForm";
import { EditPackageButton } from "@/components/inventory/EditPackageButton";
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

    const item = await (prisma as any).item.findUnique({
        where: { id },
        include: {
            packageContents: {
                include: { item: true }
            },
            inventories: {
                orderBy: { createdAt: "desc" }
            }
        }
    });

    const availableItems = await (prisma as any).item.findMany({
        where: { isPackage: false },
        orderBy: { name: "asc" }
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

                {item.isPackage && (
                    <Card className="col-span-1 md:col-span-2 shadow-sm border-emerald-100">
                        <CardHeader className="pb-3 border-b border-border/50 bg-emerald-50/30 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2 text-lg text-emerald-900">
                                <Boxes className="h-5 w-5 text-emerald-600" />
                                Koli İçeriği ve Üretim
                            </CardTitle>
                            <EditPackageButton
                                packageId={item.id}
                                initialItems={item.packageContents.map((pc: any) => ({
                                    itemId: pc.itemId,
                                    quantity: pc.quantity,
                                    itemName: pc.item.name
                                }))}
                                availableItems={availableItems}
                            />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-sm text-emerald-800 mb-4 font-medium">Bu paket/koli aşağıdaki malzemelerden oluşmaktadır:</p>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {item.packageContents.map((pc: any) => {
                                    const maxFromThis = Math.floor(pc.item.stock / pc.quantity);
                                    return (
                                        <div key={pc.item.id} className="p-3 border rounded-xl bg-white shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-semibold text-sm leading-tight text-emerald-950">{pc.item.name}</span>
                                                <Badge variant="outline" className="text-[10px] whitespace-nowrap bg-emerald-50">x {pc.quantity}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between mt-1 pt-2 border-t text-xs">
                                                <span className="text-muted-foreground">Mevcut: <strong className={pc.item.stock < pc.quantity ? "text-red-600" : "text-emerald-700"}>{pc.item.stock} {pc.item.unit}</strong></span>
                                                <span className="text-zinc-400">|</span>
                                                <span className="text-muted-foreground text-[10px]">Max: <strong>{maxFromThis}</strong></span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <AssemblePackageForm
                                packageId={item.id}
                                maxBuildable={item.packageContents.length > 0
                                    ? Math.min(...item.packageContents.map((pc: any) => Math.floor(pc.item.stock / pc.quantity)))
                                    : 0
                                }
                            />
                        </CardContent>
                    </Card>
                )}

                <Card className={`shadow-sm border-0 glass-card ${item.isPackage ? "col-span-1 md:col-span-3" : "col-span-1 md:col-span-2"}`}>
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
