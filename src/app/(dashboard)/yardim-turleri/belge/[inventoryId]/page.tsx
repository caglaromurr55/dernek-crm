import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function DocumentDeliveryPrintView({ params }: { params: { inventoryId: string } }) {
    const { inventoryId } = params;

    const inventory = await (prisma as any).inventory.findUnique({
        where: { id: inventoryId },
        include: { item: true }
    });

    if (!inventory || inventory.type !== "OUT" || !inventory.reason?.startsWith("BELGELI_TESLIMAT:")) {
        notFound();
    }

    // "BELGELI_TESLIMAT: Kurum Adı - Notlar" parse işlemi
    const reasonParts = inventory.reason.split("BELGELI_TESLIMAT: ")[1] || "";
    const splitParts = reasonParts.split(" - ");

    // İlk parça her zaman Kurum/Kişi adıdır. Kalan kısımlar notlar olabilir.
    const targetEntity = splitParts[0];
    const notes = splitParts.slice(1).join(" - ") || "Not belirtilmedi.";

    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col items-center py-8 print:py-0 print:bg-white text-zinc-900 font-sans">
            {/* Non-printable Action Bar */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 print:hidden">
                <Link href="/yardim-turleri">
                    <Button variant="outline" className="text-zinc-600 bg-white">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
                    </Button>
                </Link>
                <Button
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    suppressHydrationWarning
                >
                    <Printer className="w-4 h-4 mr-2" />
                    <span onClick={() => {
                        if (typeof window !== "undefined") window.print();
                    }} className="w-full h-full flex items-center">
                        TUTANAĞI YAZDIR
                    </span>
                </Button>
            </div>

            {/* A4 Paper Canvas */}
            <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none print:w-full p-12 relative flex flex-col aspect-[1/1.414]">

                {/* Header */}
                <div className="border-b-4 border-zinc-900 pb-6 mb-10 text-center relative flex justify-center items-center">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-zinc-900 mx-auto">
                        DERNEK YARDIM TESLİMAT TUTANAĞI
                    </h1>
                </div>

                {/* Info Grid */}
                <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-lg mb-10">
                    <div className="grid grid-cols-2 gap-y-6 text-sm">
                        <div>
                            <span className="block font-bold text-zinc-500 uppercase text-xs mb-1">Teslim Tarihi & Saati</span>
                            <span className="font-semibold text-zinc-900">{format(new Date(inventory.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}</span>
                        </div>
                        <div>
                            <span className="block font-bold text-zinc-500 uppercase text-xs mb-1">Belge No (İşlem ID)</span>
                            <span className="font-mono text-zinc-900 text-xs">{inventory.id.split("-")[0].toUpperCase()}</span>
                        </div>
                        <div className="col-span-2 border-t border-zinc-200 pt-6 mt-2">
                            <span className="block font-bold text-zinc-500 uppercase text-xs mb-1">Teslim Edilen Kurum / Kişi</span>
                            <span className="font-bold text-lg text-zinc-900">{targetEntity}</span>
                        </div>
                    </div>
                </div>

                {/* Table for Items */}
                <div className="mb-10 flex-grow">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Teslim Edilen Malzemeler</h2>
                    <table className="w-full border-collapse border border-zinc-300">
                        <thead>
                            <tr className="bg-zinc-100">
                                <th className="border border-zinc-300 px-4 py-3 text-left text-xs font-bold uppercase text-zinc-600">Sıra</th>
                                <th className="border border-zinc-300 px-4 py-3 text-left text-xs font-bold uppercase text-zinc-600">Malzeme Cinsi</th>
                                <th className="border border-zinc-300 px-4 py-3 text-center text-xs font-bold uppercase text-zinc-600">Miktar</th>
                                <th className="border border-zinc-300 px-4 py-3 text-center text-xs font-bold uppercase text-zinc-600">Birim</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-zinc-300 px-4 py-4 text-left font-semibold">1</td>
                                <td className="border border-zinc-300 px-4 py-4 text-left font-bold">{inventory.item.name}</td>
                                <td className="border border-zinc-300 px-4 py-4 text-center font-black text-lg">{inventory.quantity}</td>
                                <td className="border border-zinc-300 px-4 py-4 text-center font-semibold text-zinc-500 uppercase">{inventory.item.unit}</td>
                            </tr>
                            {/* Empty Row for Visual Pad */}
                            <tr>
                                <td className="border border-zinc-300 px-4 py-6 text-left"></td>
                                <td className="border border-zinc-300 px-4 py-6 text-left"></td>
                                <td className="border border-zinc-300 px-4 py-6 text-center"></td>
                                <td className="border border-zinc-300 px-4 py-6 text-center"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Additional Notes */}
                <div className="mb-20">
                    <span className="block font-bold text-zinc-500 uppercase text-xs mb-2">Açıklama / Notlar</span>
                    <div className="min-h-[60px] border border-zinc-300 border-dashed rounded-lg p-4 bg-zinc-50 italic text-zinc-700 text-sm">
                        {notes}
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-10 mt-auto pt-10">
                    <div className="text-center">
                        <div className="font-bold text-sm uppercase text-zinc-900 mb-8 border-b-2 border-zinc-300 pb-2 mx-10">Teslim Eden</div>
                        <div className="h-24"></div>
                        <div className="text-xs text-zinc-500 uppercase">Dernek Yetkilisi (Ad, Soyad, İmza)</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-sm uppercase text-zinc-900 mb-8 border-b-2 border-zinc-300 pb-2 mx-10">Teslim Alan</div>
                        <div className="h-24"></div>
                        <div className="text-xs text-zinc-500 uppercase">Kurum Temsilcisi (Ad, Soyad, İmza)</div>
                    </div>
                </div>

                {/* Footer disclaimer */}
                <div className="mt-16 text-center text-[10px] text-zinc-400 border-t border-zinc-200 pt-4">
                    İşbu tutanak iki (2) nüsha olarak tanzim edilmiş olup, taraflarca okunarak imza altına alınmıştır.<br />
                    Elektronik Sistem Kayıt Numarası: {inventory.id}
                </div>
            </div>

            {/* Print Styles injected locally */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .max-w-\\[210mm\\] * {
                        visibility: visible;
                    }
                    .max-w-\\[210mm\\] {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 20mm !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}} />
        </div>
    );
}
