export function normalizeTr(text: string | null | undefined): string {
    if (!text) return "";
    return text
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I');
}
