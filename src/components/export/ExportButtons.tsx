"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHouseholdsForExportAction } from "@/app/actions/export";
import { toast } from "sonner";

interface ExportButtonsProps {
    status?: string;
    query?: string;
    filename?: string;
}

export function ExportButtons({ status, query, filename = "hane-listesi" }: ExportButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const exportToExcel = async () => {
        setIsLoading(true);
        try {
            const result = await getHouseholdsForExportAction(status, query);

            if (!result.success || !result.data || result.data.length === 0) {
                toast.error("Dışa aktarılacak veri bulunamadı.");
                return;
            }

            // Veriyi düzleştir
            const worksheetData = result.data.map((item: any) => ({
                ID: item.id,
                Sokak_Adres: item.address,
                Telefon: item.contactNumber,
                Durum: item.status,
                Skor: item.score,
                Kira_Durumu: item.rentStatus,
                Gelir: item.monthlyIncome,
                Calisan_Sayisi: item.workerCount,
                Kayit_Tarihi: new Date(item.createdAt).toLocaleDateString("tr-TR"),
            }));

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Haneler");
            XLSX.writeFile(workbook, `${filename}.xlsx`);
            toast.success(`${result.data.length} kayıt dışa aktarıldı.`);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Dışa aktarma sırasında bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="h-11 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 md:px-5 font-bold rounded-2xl transition-all whitespace-nowrap"
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Excel'e Aktar
        </Button>
    );
}
