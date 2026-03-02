import jsPDF from "jspdf";

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export async function loadTurkishFont(doc: jsPDF) {
    try {
        const response = await fetch("/fonts/Roboto-Regular.ttf");
        const fontBuffer = await response.arrayBuffer();

        const base64Font = arrayBufferToBase64(fontBuffer);

        doc.addFileToVFS("Roboto-Regular.ttf", base64Font);
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
        doc.setFont("Roboto");
    } catch (error) {
        console.error("Roboto fontu yuklenemedi, varsayilan kullaniliyor.", error);
    }
}

// Geriye dönük uyumluluk veya yedek (fallback) amaçlı tutabiliriz ama artık gerek yok.
export function normalizeTr(text: string | null | undefined): string {
    if (!text) return "";
    return text; // Artık dönüştürmeye gerek yok, doğrudan döndürüyoruz.
}
