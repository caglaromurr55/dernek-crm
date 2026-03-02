"use client";

import * as XLSX from "xlsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
    data: any[];
    filename?: string;
}

export function ExportButtons({ data, filename = "hane-listesi" }: ExportButtonsProps) {
    const exportToExcel = () => {
        // Veriyi düzleştir (nested nesneleri temizle veya başlıkları ayarla)
        const worksheetData = data.map((item) => ({
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
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel} className="h-9">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                Excel'e Aktar
            </Button>
        </div>
    );
}
