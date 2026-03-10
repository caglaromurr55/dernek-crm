"use client";

import jsPDF from "jspdf";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { normalizeTr, loadTurkishFont } from "@/lib/pdf-utils";


interface DeliveryPDFButtonProps {
    delivery: any;
    household: any;
    applicant: any;
}

export function DeliveryPDFButton({ delivery, household, applicant }: DeliveryPDFButtonProps) {
    const [loading, setLoading] = useState(false);

    const generatePDF = async () => {
        setLoading(true);
        try {
            const doc = new jsPDF();
            await loadTurkishFont(doc);

            // Header
            doc.setFontSize(22);
            doc.setTextColor(5, 150, 105); // emerald-600
            doc.text("Dernek CRM - Teslimat Fisi", 20, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 20, 28);
            doc.text(`Fis No: ${delivery.id.slice(0, 8).toUpperCase()}`, 150, 28);

            doc.setLineWidth(0.5);
            doc.setDrawColor(200);
            doc.line(20, 32, 190, 32);

            // Household Info
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Basvuru Sahibi Bilgileri", 20, 45);

            doc.setFontSize(11);
            doc.text(`Ad Soyad: ${normalizeTr(applicant?.firstName)} ${normalizeTr(applicant?.lastName)}`, 20, 55);
            doc.text(`TC Kimlik: ${applicant?.identityNo}`, 20, 62);
            doc.text(`Telefon: ${household.contactNumber}`, 20, 69);
            doc.text(`Adres: ${normalizeTr(household.address)}`, 20, 76, { maxWidth: 160 });

            // Delivery Details
            doc.setFontSize(14);
            doc.text("Teslimat Detaylari", 20, 95);

            doc.setFontSize(11);
            doc.text(`Kampanya: ${normalizeTr(delivery.distributionEvent.name)}`, 20, 105);
            doc.text(`Durum: ${delivery.status === "DELIVERED" ? "Teslim Edildi" : "Beklemede"}`, 20, 112);
            doc.text(`Teslim Tarihi: ${delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString("tr-TR") : "-"}`, 20, 119);
            doc.text(`Notlar: ${normalizeTr(delivery.notes) || "-"}`, 20, 126, { maxWidth: 160 });

            // Signature Area
            if (delivery.signatureData) {
                doc.text("Dijital Imza Onayi:", 20, 150);
                try {
                    let imgData = delivery.signatureData;

                    if (imgData.startsWith('/signatures/')) {
                        imgData = await new Promise((resolve, reject) => {
                            const img = new Image();
                            img.crossOrigin = 'Anonymous';
                            img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0);
                                resolve(canvas.toDataURL('image/png'));
                            };
                            img.onerror = reject;
                            img.src = imgData;
                        });
                    }

                    doc.addImage(imgData, "PNG", 20, 155, 60, 30);
                } catch (e) {
                    doc.text("[Imza Verisi Okunamadi Veya Yuklenemedi]", 20, 160);
                }
            } else {
                doc.text("Imza (Isim ve Soyisim): ________________________", 20, 160);
            }

            // Footer
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text("Bu belge sistem tarafindan otomatik olarak olusturulmustur.", 20, 280);

            doc.save(`teslimat-fisi-${delivery.id.slice(0, 8)}.pdf`);
        } catch (error) {
            console.error("PDF olusturulurken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={generatePDF} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-emerald-600" />}
            PDF Fiş Çıkart
        </Button>
    );
}
