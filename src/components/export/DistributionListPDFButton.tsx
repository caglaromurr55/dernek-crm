"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeTr, loadTurkishFont } from "@/lib/pdf-utils";


interface DistributionListPDFButtonProps {
    list: any;
}

export function DistributionListPDFButton({ list }: DistributionListPDFButtonProps) {
    const [loading, setLoading] = useState(false);

    const generatePDF = async () => {
        setLoading(true);
        try {
            const doc = new jsPDF("landscape");
            await loadTurkishFont(doc);

            // --- Header ---
            doc.setFontSize(22);
            doc.setTextColor(5, 150, 105);
            doc.text("Dernek CRM - Dagitim Listesi", 20, 20);

            doc.setFontSize(12);
            doc.setTextColor(50);
            doc.text(`Liste Adi: ${normalizeTr(list.name)}`, 20, 30);
            doc.text(`Kampanya: ${normalizeTr(list.distributionEvent.name)}`, 20, 37);
            doc.text(`Urun: ${normalizeTr(list.distributionEvent.item?.name || "Belirtilmedi")}`, 20, 44);
            doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 20, 51);

            // --- QR Code ---
            if (list.token) {
                const qrUrl = `${window.location.origin}/saha/liste/${list.token}`;
                try {
                    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 100 });
                    doc.addImage(qrDataUrl, "PNG", 240, 10, 40, 40);
                    doc.setFontSize(9);
                    doc.setTextColor(100);
                    doc.text("Saha Gorevlisi Atama QR Kodu", 240, 53);
                } catch (e) {
                    console.error("QR Kod uretilemedi:", e);
                }
            }

            // --- Table Header ---
            doc.setDrawColor(200);
            doc.setLineWidth(0.5);
            doc.line(20, 60, 277, 60);

            doc.setFontSize(11);
            doc.setTextColor(0);
            let startY = 68;

            doc.text("Sira", 20, startY);
            doc.text("TC Kimlik", 35, startY);
            doc.text("Ad Soyad", 70, startY);
            doc.text("Telefon", 120, startY);
            doc.text("Adres", 155, startY);
            doc.text("Imza / Not", 230, startY);

            doc.line(20, startY + 2, 277, startY + 2);
            startY += 10;

            // --- Table Rows ---
            doc.setFontSize(10);
            doc.setTextColor(50);

            list.deliveries.forEach((delivery: any, index: number) => {
                const applicant = delivery.household?.persons?.find((p: any) => p.isApplicant) || delivery.household?.persons?.[0];

                if (startY > 180) {
                    doc.addPage();
                    startY = 20;

                    doc.setFontSize(11);
                    doc.setTextColor(0);
                    doc.text("Sira", 20, startY);
                    doc.text("TC Kimlik", 35, startY);
                    doc.text("Ad Soyad", 70, startY);
                    doc.text("Telefon", 120, startY);
                    doc.text("Adres", 155, startY);
                    doc.text("Imza / Not", 230, startY);
                    doc.line(20, startY + 2, 277, startY + 2);
                    startY += 10;
                    doc.setFontSize(10);
                    doc.setTextColor(50);
                }

                doc.text(`${index + 1}`, 20, startY);
                doc.text(`${applicant?.identityNo || "-"}`, 35, startY);
                doc.text(normalizeTr(`${applicant?.firstName} ${applicant?.lastName}`), 70, startY);
                doc.text(`${delivery.household?.contactNumber || "-"}`, 120, startY);

                // Adresi kisaltarak ekle
                const address = delivery.household?.address?.substring(0, 50) + (delivery.household?.address?.length > 50 ? "..." : "") || "-";
                doc.text(normalizeTr(address), 155, startY, { maxWidth: 70 });

                // Imza alani
                doc.line(230, startY, 270, startY);

                startY += 12;
            });

            // --- Footer ---
            doc.setFontSize(9);
            doc.setTextColor(150);
            const adminNote = list.assignedTo ? `Atanan Gonullu: ${normalizeTr(list.assignedTo)} (${list.assignedPhone || '-'})` : "Gorevli atanmadi (QR ile atanabilir).";
            doc.text(`Sistem Bilgisi: ${adminNote}`, 20, 200);

            doc.save(`Dagitim_Listesi_${list.distributionEvent.name.replace(/\s+/g, "_")}.pdf`);
        } catch (error) {
            console.error("PDF olusturulurken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" className="gap-2 shrink-0 border-blue-200 hover:bg-blue-50 text-blue-700" onClick={generatePDF} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Karekodlu Liste Çıktısı Al
        </Button>
    );
}
