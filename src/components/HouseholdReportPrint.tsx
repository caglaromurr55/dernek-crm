import React from 'react';
import { ShieldCheck, MapPin, Users, Phone, Wallet, Briefcase, FileText, CheckCircle2, Signature, Calendar, CheckSquare, Home } from "lucide-react";

/**
 * A formalized, A4-friendly printable report for a Household.
 * Hidden on screen, visible only when printing (`print:block hidden`).
 */
export function HouseholdReportPrint({ household }: { household: any }) {
    const applicant = household.persons?.find((m: any) => m.isApplicant) || household.persons?.[0];
    const totalExpenses = (household.rentAmount || 0) + (household.billExpense || 0) + (household.heatingExpense || 0) + (household.foodExpense || 0) + (household.educationExpense || 0) + (household.healthExpense || 0) + (household.clothingExpense || 0) + (household.transportationExpense || 0) + (household.babyExpense || 0) + (household.debtAmount || 0);

    return (
        <div className="hidden print:block w-full max-w-[210mm] mx-auto bg-white text-zinc-900 p-8 font-sans leading-snug" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>

            {/* --- PREMIUM HEADER --- */}
            <div className="flex justify-between items-start border-b-[3px] border-emerald-700 pb-5 mb-8">
                <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm print:bg-emerald-700">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-emerald-900 uppercase">Dernek CRM</h1>
                        <p className="text-sm font-bold text-emerald-700 tracking-widest uppercase mt-0.5">Sosyal Yardım İşleri Birimi</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black text-zinc-900 tracking-tight">HANE TAHKİKAT RAPORU</h2>
                    <div className="inline-flex mt-2 bg-zinc-100 rounded-lg py-1 px-3 items-center gap-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase">Dosya No</span>
                        <span className="text-sm font-black text-zinc-900">{household.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* --- SUMMARY STRIP --- */}
            <div className="flex bg-zinc-50 rounded-xl p-4 gap-6 mb-8 border border-zinc-200 shadow-sm">
                <div className="flex-1 border-r border-zinc-200">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Başvuru Tarihi</p>
                    <p className="text-sm font-bold text-zinc-900 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-600" /> {household.createdAt?.toLocaleDateString("tr-TR")}</p>
                </div>
                <div className="flex-1 border-r border-zinc-200">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Rapor Tarihi</p>
                    <p className="text-sm font-bold text-zinc-900">{new Date().toLocaleDateString("tr-TR")}</p>
                </div>
                <div className="flex-1 border-r border-zinc-200">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sistem Puanı</p>
                    <p className="text-sm font-black text-emerald-700">{household.score || 0} / 100</p>
                </div>
                <div className="flex-1 text-right pl-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Onay Durumu</p>
                    <span className="inline-flex bg-zinc-900 text-white text-xs font-bold px-2.5 py-1 rounded print:bg-black">{household.status === "APPROVED" ? "SÜREKLİ ONAYLI" : household.status === "APPROVED_ONCE" ? "TEK SEFERLİK ONAY" : household.status === "REJECTED" ? "REDDEDİLDİ" : "BEKLEMEDE"}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                {/* --- 1. APPLICANT INFO --- */}
                <div>
                    <h3 className="text-sm font-black uppercase text-emerald-800 border-b-2 border-emerald-100 pb-2 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> 1. Başvuru Sahibi Bilgileri
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-500">Ad Soyad</span>
                            <span className="text-sm font-black uppercase text-zinc-900">{applicant?.firstName} {applicant?.lastName}</span>
                        </div>
                        <div className="bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-500">TC Kimlik / Pasaport</span>
                            <span className="text-sm font-bold font-mono text-zinc-800">{applicant?.identityNo}</span>
                        </div>
                        <div className="bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-500">Doğum Tarihi</span>
                            <span className="text-sm font-bold text-zinc-900">{applicant?.birthDate?.toLocaleDateString("tr-TR")}</span>
                        </div>
                        <div className="bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-500">İletişim Numarası</span>
                            <span className="text-sm font-bold text-zinc-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {household.contactNumber || "Belirtilmemiş"}</span>
                        </div>
                    </div>
                </div>

                {/* --- 2. ADDRESS & HOUSING --- */}
                <div>
                    <h3 className="text-sm font-black uppercase text-emerald-800 border-b-2 border-emerald-100 pb-2 mb-4 flex items-center gap-2">
                        <Home className="w-4 h-4" /> 2. İkametgah ve Barınma
                    </h3>
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 h-[calc(100%-2rem)] flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Açık Adres</p>
                            <p className="text-sm font-semibold text-zinc-900 leading-relaxed">
                                {household.address}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-emerald-200/50">
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Mülkiyet Türü</p>
                                <p className="text-sm font-bold text-zinc-900">{household.rentStatus === 'mulk-sahibi' ? 'EV SAHİBİ' : 'KİRACI'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Isınma Tipi</p>
                                <p className="text-sm font-bold text-zinc-900 uppercase">{household.heatingType?.replace('_', ' ') || "BİLİNMİYOR"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 3. DEMOGRAPHICS GRID --- */}
            <div className="mb-8">
                <h3 className="text-sm font-black uppercase text-emerald-800 border-b-2 border-emerald-100 pb-2 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> 3. Hanede Yaşayan Bireyler ({household.persons?.length || 0} Kişi)
                </h3>
                <div className="rounded-xl border border-zinc-200 overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse bg-white">
                        <thead>
                            <tr className="bg-zinc-100 text-[10px] uppercase tracking-wider text-zinc-600 border-b border-zinc-200">
                                <th className="py-2.5 px-4 font-black">AD SOYAD</th>
                                <th className="py-2.5 px-4 font-black">TC KİMLİK / YAŞ</th>
                                <th className="py-2.5 px-4 font-black">EĞİTİM</th>
                                <th className="py-2.5 px-4 font-black">İSTİHDAM / DURUM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-xs">
                            {household.persons?.map((p: any) => (
                                <tr key={p.id} className="hover:bg-zinc-50">
                                    <td className="py-2.5 px-4 font-bold text-zinc-900">
                                        {p.firstName} {p.lastName} {p.isApplicant && <span className="text-[9px] text-emerald-600 ml-1 font-bold">(BAŞVURAN)</span>}
                                    </td>
                                    <td className="py-2.5 px-4 font-mono text-zinc-600">{p.identityNo}</td>
                                    <td className="py-2.5 px-4 text-zinc-700 capitalize">{p.educationalLevel?.replace('_', ' ').toLowerCase()}</td>
                                    <td className="py-2.5 px-4">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {p.employmentStatus?.toLowerCase() === 'calisan' && <span className="bg-blue-50 text-blue-700 px-1.5 rounded font-bold">Çalışan</span>}
                                            {p.employmentStatus?.toLowerCase() === 'emekli' && <span className="bg-amber-50 text-amber-700 px-1.5 rounded font-bold">Emekli</span>}
                                            {p.isStudent && <span className="bg-zinc-100 text-zinc-700 px-1.5 rounded font-bold">Öğrenci</span>}
                                            {p.isDisabled && <span className="bg-red-50 text-red-700 px-1.5 rounded font-bold">Engel/Hastalık</span>}
                                            {(p.employmentStatus?.toLowerCase() === 'issiz' || p.employmentStatus?.toLowerCase() === 'calismiyor') && !p.isStudent && !p.isDisabled && <span className="text-zinc-500 font-medium">İşsiz</span>}
                                            {p.employmentStatus && !['calisan', 'emekli', 'issiz', 'calismiyor'].includes(p.employmentStatus?.toLowerCase()) && (
                                                <span className="bg-slate-100 text-slate-700 px-1.5 rounded font-bold capitalize">{p.employmentStatus}</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 4. FINANCIAL STATUS --- */}
            <div className="mb-8 p-5 bg-zinc-50 rounded-2xl border border-zinc-200">
                <h3 className="text-sm font-black uppercase text-emerald-800 border-b-2 border-emerald-100 pb-2 mb-4 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> 4. Aylık Mali Durum Özeti
                </h3>

                <div className="grid grid-cols-2 gap-12">
                    <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Teyit Edilmiş Gelirler</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-zinc-100">
                                <span className="text-xs font-bold text-zinc-600">Aylık Haneye Giren Net Gelir</span>
                                <span className="font-black text-sm text-emerald-700">{(household.monthlyIncome || 0).toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-zinc-100">
                                <span className="text-xs font-bold text-zinc-600">Alınan Diğer Sosyal Yardımlar</span>
                                <span className="font-bold text-sm text-zinc-900">{(household.socialAidAmount || 0).toLocaleString()} ₺</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Sabit Giderler ve Borç Yükü</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-zinc-100">
                                <span className="text-xs font-bold text-zinc-600">Aylık Kira Bedeli</span>
                                <span className="font-bold text-sm text-zinc-900">{(household.rentAmount || 0).toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-zinc-100">
                                <span className="text-xs font-bold text-zinc-600">Aylık Fatura & Yakıt</span>
                                <span className="font-bold text-sm text-zinc-900">{((household.billExpense || 0) + (household.heatingExpense || 0)).toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-zinc-100">
                                <span className="text-xs text-red-600 font-bold uppercase">Toplam Ev İçi Giderler Miktarı</span>
                                <span className="font-black text-sm text-red-600">{totalExpenses.toLocaleString()} ₺</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 5. FIELD OFFICER NOTES --- */}
            <div className="mb-8">
                <h3 className="text-sm font-black uppercase text-emerald-800 border-b-2 border-emerald-100 pb-2 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> 5. Saha Görevlisi Tespiti ve Görüşleri
                </h3>
                <div className="border-2 border-dashed border-zinc-300 rounded-xl p-5 min-h-[140px] bg-white relative">
                    {household.diseaseDetails && (
                        <div className="mb-4 bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 text-sm font-medium">
                            <strong className="text-red-900 uppercase text-xs tracking-wider block mb-1">Hastalık / Engel Tespiti:</strong>
                            {household.diseaseDetails}
                        </div>
                    )}

                    {household.notes ? (
                        <p className="text-sm text-zinc-800 leading-relaxed font-medium italic">
                            "{household.notes}"
                        </p>
                    ) : (
                        <div className="text-center text-zinc-400 py-6">
                            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase">Ek olarak raporlanan bir görüş bulunmamaktadır.</p>
                        </div>
                    )}

                    {/* Floating indicators for quick checks */}
                    <div className="absolute right-4 bottom-4 flex gap-2">
                        {household.carOwnership && <span className="bg-zinc-800 text-white text-[9px] font-bold px-2 py-1 rounded">ARAÇ TESPİTİ</span>}
                        {household.waterDamage && <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded">RUTUBET / HASAR</span>}
                    </div>
                </div>
            </div>

            {/* --- SIGNATURES --- */}
            <div className="grid grid-cols-3 mt-16 pt-8 border-t-[3px] border-emerald-700">
                <div className="text-center">
                    <p className="text-xs font-black uppercase text-zinc-500 mb-1">Tahkikatı Yapan Personel</p>
                    <p className="text-sm font-bold text-zinc-900 mb-12">Adı Soyadı / İmza</p>
                    <div className="w-40 border-b border-zinc-400 mx-auto"></div>
                </div>
                <div className="text-center">
                    <p className="text-xs font-black uppercase text-zinc-500 mb-1">Başvuru Sahibi / Vekili</p>
                    <p className="text-sm font-bold text-zinc-900 mb-12">Adı Soyadı / İmza</p>
                    <div className="w-40 border-b border-zinc-400 mx-auto"></div>
                </div>
                <div className="text-center">
                    <p className="text-xs font-black uppercase text-zinc-500 mb-1">Birim Sorumlusu Onayı</p>
                    <p className="text-sm font-bold text-zinc-900 mb-12">Onaylayan / İmza</p>
                    <div className="w-40 border-b border-zinc-400 mx-auto"></div>
                </div>
            </div>

            <div className="mt-8 text-center flex items-center justify-center gap-2 text-[10px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <p>Bu belge <strong>Dernek CRM Premium</strong> otomasyon sistemi tarafından elektronik olarak tanzim edilmiştir. <strong>{new Date().toLocaleString("tr-TR")}</strong></p>
            </div>

        </div>
    );
}
