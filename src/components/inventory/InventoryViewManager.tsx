"use client";

import { useState } from "react";
import {
    LayoutGrid,
    List,
    HeartHandshake,
    Package,
    Eye,
    ChevronRight
} from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StockMovementButton } from "@/components/inventory/StockMovementButton";
import { StockMovementModal } from "@/components/inventory/StockMovementModal";
import { QuickAssembleButton } from "@/components/inventory/QuickAssembleButton";

interface InventoryViewManagerProps {
    items: any[];
}

export function InventoryViewManager({ items }: InventoryViewManagerProps) {
    const [view, setView] = useState("list");

    return (
        <Tabs defaultValue="list" onValueChange={setView} className="space-y-6">
            <div className="flex justify-start">
                <TabsList className="bg-secondary/50 p-1 rounded-xl h-12 border border-border/50">
                    <TabsTrigger value="list" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <List className="w-4 h-4 mr-2" />
                        Liste Görünümü
                    </TabsTrigger>
                    <TabsTrigger value="grid" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Kart Görünümü
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="grid" className="mt-0">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                        <Card key={item.id} className="group relative overflow-hidden hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 border-border/50">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.07] transition-all duration-500 pointer-events-none">
                                <Package className="h-24 w-24" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-black flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                            <HeartHandshake className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        {item.name}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-2">
                                        <div className="flex items-baseline gap-1.5 mb-1">
                                            <span className="text-4xl font-black tracking-tighter text-zinc-900 leading-none">
                                                {item.stock}
                                            </span>
                                            <span className="text-xs font-bold text-muted-foreground uppercase opacity-60">
                                                {item.unit}
                                            </span>
                                        </div>
                                        <Badge
                                            variant={item.stock >= 50 ? "secondary" : "destructive"}
                                            className={`rounded-full px-3 text-[10px] font-black uppercase tracking-wider ${item.stock >= 50 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "animate-pulse"}`}
                                        >
                                            {item.stock >= 50 ? "Stok Yeterli" : item.stock === 0 ? "Tükendi" : "Kritik Seviye"}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col gap-2.5 items-end">
                                        <div className="flex gap-2">
                                            {item.isPackage && (
                                                <QuickAssembleButton
                                                    packageId={item.id}
                                                    packageName={item.name}
                                                    unit={item.unit}
                                                    maxBuildable={item.packageContents?.length > 0
                                                        ? Math.min(...item.packageContents.map((pc: any) => Math.floor(pc.item.stock / pc.quantity)))
                                                        : 0
                                                    }
                                                />
                                            )}
                                            <StockMovementButton itemId={item.id} itemName={item.name} />
                                        </div>
                                        <Link href={`/yardim-turleri/${item.id}`} className="w-full">
                                            <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] font-black border-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all group/btn h-8 uppercase tracking-widest">
                                                DETAYLARI İNCELE
                                                <ChevronRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                                            </Button>
                                        </Link>
                                    </div>
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
            </TabsContent>

            <TabsContent value="list" className="mt-0">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/30 hover:bg-secondary/30 border-b border-border/50">
                                    <TableHead className="py-4 pl-6 uppercase text-[10px] font-black tracking-widest leading-none">YARDIM ADI</TableHead>
                                    <TableHead className="uppercase text-[10px] font-black tracking-widest leading-none">BİRİM</TableHead>
                                    <TableHead className="text-right uppercase text-[10px] font-black tracking-widest leading-none">GÜNCEL STOK</TableHead>
                                    <TableHead className="text-center uppercase text-[10px] font-black tracking-widest leading-none">DURUM</TableHead>
                                    <TableHead className="text-right pr-6 uppercase text-[10px] font-black tracking-widest leading-none">İŞLEMLER</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id} className={`group hover:bg-emerald-50/30 transition-colors border-b border-border/30 ${item.stock < 50 ? "bg-red-50/10" : ""}`}>
                                        <TableCell className="py-4 pl-6">
                                            <div className="font-bold flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.stock >= 50 ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`}></div>
                                                {item.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-muted-foreground">{item.unit}</TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-black text-xl tracking-tighter">{item.stock}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={item.stock >= 50 ? "secondary" : "destructive"}
                                                className={`rounded-full px-3 text-[10px] font-black uppercase tracking-tight ${item.stock >= 50 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "animate-pulse"}`}
                                            >
                                                {item.stock >= 50 ? "Yeterli" : item.stock === 0 ? "Tükendi" : "Kritik"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2.5">
                                                {item.isPackage && (
                                                    <QuickAssembleButton
                                                        packageId={item.id}
                                                        packageName={item.name}
                                                        unit={item.unit}
                                                        maxBuildable={item.packageContents?.length > 0
                                                            ? Math.min(...item.packageContents.map((pc: any) => Math.floor(pc.item.stock / pc.quantity)))
                                                            : 0
                                                        }
                                                    />
                                                )}
                                                <StockMovementModal item={item} type="IN" />
                                                <StockMovementModal item={item} type="OUT" />
                                                <Link href={`/yardim-turleri/${item.id}`}>
                                                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg bg-white border-zinc-200 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm">
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
            </TabsContent>
        </Tabs>
    );
}
