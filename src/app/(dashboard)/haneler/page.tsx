import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Plus, Search, Filter, UserPlus, MapPin, Phone,
    TrendingUp, CheckCircle2, Clock, XCircle, ChevronRight,
    Layers, Download, ScanBarcode, ArrowUp, ArrowDown, ArrowUpDown
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarcodeQueryButton } from "@/components/BarcodeQueryButton";
import HanelerSearchForm from "@/components/HanelerSearchForm";
import { ExportButtons } from "@/components/export/ExportButtons";
import { Pagination } from "@/components/ui/Pagination";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function HanelerPage({ searchParams }: Props) {
    const params = await searchParams;
    const query = typeof params.q === 'string' ? params.q : '';
    const status = typeof params.status === 'string' ? params.status : 'ALL';
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const sort = typeof params.sort === 'string' ? params.sort : 'createdAt';
    const order = (params.order === 'asc' || params.order === 'desc') ? params.order : 'desc';
    const PAGE_SIZE = 20;

    const whereClause: any = {
        isApplicant: true,
    };

    if (query) {
        whereClause.OR = [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { identityNo: { contains: query } },
        ];
    }

    if (status && status !== 'ALL') {
        whereClause.household = { status: status };
    }

    // Sıralama nesnesini oluştur
    let orderBy: any = {};
    if (sort === 'score') {
        orderBy = { household: { score: order } };
    } else if (sort === 'firstName') {
        orderBy = [{ firstName: order }, { lastName: order }];
    } else {
        orderBy = { [sort]: order };
    }

    const [basvuruSahipleri, totalCount] = await Promise.all([
        prisma.person.findMany({
            where: whereClause,
            include: { household: true },
            orderBy: orderBy,
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.person.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const createSortURL = (column: string) => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (status !== 'ALL') params.set('status', status);
        params.set('sort', column);
        params.set('order', sort === column && order === 'asc' ? 'desc' : 'asc');
        params.set('page', '1');
        return `/haneler?${params.toString()}`;
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sort !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
        return order === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
    };

    // Export için filtreleme kriterlerini oluştur
    const exportWhereClause: any = {};
    if (status && status !== 'ALL') {
        exportWhereClause.status = status;
    }
    if (query) {
        exportWhereClause.persons = {
            some: {
                OR: [
                    { firstName: { contains: query, mode: "insensitive" } },
                    { lastName: { contains: query, mode: "insensitive" } },
                    { identityNo: { contains: query } },
                ]
            }
        };
    }

    const householdsForExport = await prisma.household.findMany({
        where: exportWhereClause,
        include: {
            persons: { where: { isApplicant: true } as any, take: 1 },
            _count: { select: { persons: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 2000 // Güvenlik sınırı
    });

    const getStatusBadge = (status: string, score: number) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-sm border-0 gap-1"><CheckCircle2 className="w-3 h-3" /> Sürekli Onaylı</Badge>;
            case "APPROVED_ONCE":
                return <Badge className="bg-blue-500 hover:bg-blue-600 shadow-sm border-0 gap-1"><CheckCircle2 className="w-3 h-3" /> Tek Seferlik Onay</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-500 hover:bg-red-600 shadow-sm border-0 gap-1"><XCircle className="w-3 h-3" /> Reddedildi</Badge>;
            default:
                return <Badge className="bg-amber-400 hover:bg-amber-500 shadow-sm border-0 gap-1"><Clock className="w-3 h-3" /> İnceleme Bekliyor</Badge>;
        }
    };

    return (
        <div className="space-y-8 animate-in-fade">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text">Hane Portföyü</h1>
                    <p className="text-muted-foreground font-medium">Sistemdeki tüm ihtiyaç sahibi haneleri ve başvuru süreçlerini yönetin.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <BarcodeQueryButton />
                    <ExportButtons data={householdsForExport} />
                    <Link href="/haneler/yeni">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-lg shadow-emerald-100 border-0 h-11">
                            <UserPlus className="mr-2 h-5 w-5" /> Yeni Hane Kaydı
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Arama ve Filtreleme Alanı */}
            <div className="glass-card p-6 rounded-3xl shadow-xl border-white/50">
                <HanelerSearchForm initialQuery={query} initialStatus={status} />
            </div>

            <div className="glass-card rounded-3xl shadow-2xl border-0 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-secondary/50">
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="py-5 pl-8">
                                    <Link href={createSortURL('firstName')} className="flex items-center font-bold text-muted-foreground hover:text-foreground transition-colors group/head">
                                        BAŞVURU SAHİBİ <SortIcon column="firstName" />
                                    </Link>
                                </TableHead>
                                <TableHead className="font-bold text-muted-foreground py-5">İLETİŞİM / ADRES</TableHead>
                                <TableHead className="py-5 text-center">
                                    <Link href={createSortURL('score')} className="flex items-center justify-center font-bold text-muted-foreground hover:text-foreground transition-colors group/head">
                                        İHTİYAÇ <SortIcon column="score" />
                                    </Link>
                                </TableHead>
                                <TableHead className="py-5">
                                    <Link href={createSortURL('createdAt')} className="flex items-center font-bold text-muted-foreground hover:text-foreground transition-colors group/head">
                                        KAYIT TARİHİ <SortIcon column="createdAt" />
                                    </Link>
                                </TableHead>
                                <TableHead className="font-bold text-muted-foreground py-5">DURUM</TableHead>
                                <TableHead className="font-bold text-muted-foreground py-5 text-right pr-8">EYLEM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {basvuruSahipleri.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center justify-center opacity-30 gap-3">
                                            <Search className="w-12 h-12" />
                                            <p className="font-bold text-lg">Eşleşen sonuç bulunamadı.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                basvuruSahipleri.map((kisi: any) => (
                                    <TableRow key={kisi.id} className="group hover:bg-secondary transition-all border-border/50 even:bg-secondary/40">
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground font-bold group-hover:bg-emerald-50/10 group-hover:text-emerald-500 transition-all shadow-sm">
                                                    {kisi.firstName[0]}{kisi.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground leading-none">{kisi.firstName} {kisi.lastName}</p>
                                                    <p className="text-[11px] font-bold text-muted-foreground/60 mt-1.5 uppercase tracking-tighter">TC: {kisi.identityNo}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground/90">
                                                    <Phone className="w-3 h-3 text-emerald-500" /> {kisi.household.contactNumber || "-"}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={kisi.household.address}>
                                                    {kisi.household.address}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={`inline-flex items-center justify-center h-10 w-10 rounded-2xl font-black text-sm shadow-inner transition-colors ${kisi.household.score >= 80 ? "bg-red-500/10 text-red-500" :
                                                kisi.household.score >= 60 ? "bg-emerald-500/10 text-emerald-500" :
                                                    "bg-secondary text-muted-foreground"
                                                }`}>
                                                {kisi.household.score || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{new Date(kisi.createdAt).toLocaleDateString('tr-TR')}</span>
                                                <span className="text-[10px] text-muted-foreground">{new Date(kisi.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(kisi.household.status, kisi.household.score)}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <Link href={`/haneler/${kisi.householdId}`}>
                                                <Button variant="ghost" size="sm" className="rounded-xl group-hover:bg-white group-hover:shadow-sm">
                                                    İncele <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-border">
                    {basvuruSahipleri.length === 0 ? (
                        <div className="text-center py-10 opacity-30"> Sonuç bulunamadı </div>
                    ) : (
                        basvuruSahipleri.map((kisi: any) => (
                            <Link href={`/haneler/${kisi.householdId}`} key={kisi.id} className="block p-5 active:bg-secondary transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-xs">
                                            {kisi.firstName[0]}{kisi.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm leading-tight">{kisi.firstName} {kisi.lastName}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tight">TC: {kisi.identityNo}</p>
                                        </div>
                                    </div>
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${kisi.household.score >= 80 ? "bg-red-500/10 text-red-500" : "bg-secondary text-muted-foreground"}`}>
                                        {kisi.household.score || 0}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[11px] font-semibold flex items-center gap-1 text-muted-foreground">
                                            <Phone className="w-2.5 h-2.5" /> {kisi.household.contactNumber || "-"}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                            <MapPin className="w-2.5 h-2.5 inline mr-1" /> {kisi.household.address}
                                        </p>
                                    </div>
                                    {getStatusBadge(kisi.household.status, kisi.household.score)}
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Alt Bilgi */}
                <div className="p-4 bg-secondary/30 border-t border-border flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 gap-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest order-2 md:order-1">
                        TOPLAM: {totalCount} HANE {totalPages > 1 && `(SAYFA ${page}/${totalPages})`}
                    </p>
                    <div className="order-1 md:order-2">
                        <Pagination totalPages={totalPages} currentPage={page} />
                    </div>
                    <div className="hidden lg:flex gap-4 order-3">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Sürekli
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Tek Seferlik
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase">
                            <div className="w-2 h-2 rounded-full bg-amber-400"></div> İncelemede
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
