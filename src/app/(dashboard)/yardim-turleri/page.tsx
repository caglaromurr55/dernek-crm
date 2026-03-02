import prisma from "@/lib/prisma";
import Link from "next/link";
import { AddItemButton } from "@/components/inventory/AddItemButton";
import { StockMovementButton } from "@/components/inventory/StockMovementButton";
import { StockMovementModal } from "@/components/inventory/StockMovementModal";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Package, Eye } from "lucide-react";

export default async function ItemsPage() {
    const items = await prisma.item.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Yardım Türleri & Envanter</h1>
                    <p className="text-muted-foreground mt-2">
                        Dağıtılacak yardım malzemelerini tanımlayın ve stok seviyelerini takip edin.
                    </p>
                </div>
                <AddItemButton />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {items.map((item) => (
                    <Card key={item.id} className="relative overflow-hidden">
                        <div className={`absolute top-0 right-0 p-3 opacity-10`}>
                            <Package className="h-20 w-20" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <HeartHandshake className="h-5 w-5 text-emerald-600" />
                                {item.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-bold tracking-tighter">
                                        {item.stock}
                                    </p>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                                        MEVCUT STOK ({item.unit})
                                    </p>
                                </div>
                                <StockMovementButton itemId={item.id} itemName={item.name} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {items.length === 0 && (
                    <Card className="col-span-full py-12 flex flex-col items-center justify-center border-dashed">
                        <Package className="h-12 w-12 text-zinc-300 mb-4" />
                        <p className="text-zinc-500 font-medium">Henüz bir yardım ürünü tanımlanmamış.</p>
                    </Card>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Envanter Detay Listesi</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Yardım Adı</TableHead>
                                <TableHead>Birim</TableHead>
                                <TableHead className="text-right">Güncel Stok</TableHead>
                                <TableHead className="text-center">Durum</TableHead>
                                <TableHead className="text-right">Hızlı Eylemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id} className={item.stock < 50 ? "bg-red-50/30" : ""}>
                                    <TableCell className="font-bold">{item.name}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="text-right font-black text-lg">{item.stock}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={item.stock >= 50 ? "secondary" : "destructive"}
                                            className={item.stock >= 50 ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "animate-pulse"}
                                        >
                                            {item.stock >= 50 ? "Yeterli Seçenek" : item.stock === 0 ? "Tükendi" : "Kritik (50 Altı)"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <StockMovementModal item={item} type="IN" />
                                            <StockMovementModal item={item} type="OUT" />
                                            <Link href={`/yardim-turleri/${item.id}`}>
                                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg bg-zinc-50 hover:bg-zinc-100">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
