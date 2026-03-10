import { getAuditLogsAction } from "@/app/actions/audit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, History, User, Box, ShieldCheck, Tag } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = "force-dynamic";

function getActionStyle(action: string) {
    if (action.includes("CREATE") || action.includes("ADD")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (action.includes("DELETE") || action.includes("REMOVE")) return "bg-red-100 text-red-700 border-red-200";
    if (action.includes("APPROVE")) return "bg-amber-100 text-amber-700 border-amber-200";
    if (action.includes("REJECT")) return "bg-zinc-100 text-zinc-700 border-zinc-200";
    return "bg-secondary text-secondary-foreground border-border";
}

function getActionLabel(action: string) {
    const labels: Record<string, string> = {
        "CREATE_HOUSEHOLD": "Hane Kayıt Edildi",
        "UPDATE_HOUSEHOLD": "Hane Güncellendi",
        "DELETE_HOUSEHOLD": "Hane Silindi",
        "APPROVE_HOUSEHOLD": "Hane Onaylandı",
        "APPROVE_ONCE_HOUSEHOLD": "Tek Seferlik Onay",
        "REJECT_HOUSEHOLD": "Hane Reddedildi",
        "ADD_PERSON": "Birey Eklendi",
        "REMOVE_PERSON": "Birey Çıkarıldı",
        "CREATE_DELIVERY": "Dağıtım Kaydı",
        "UPDATE_DELIVERY": "Dağıtım Güncelleme",
        "CREATE_ITEM": "Stok Eklendi",
        "DELETE_ALL": "Log Temizliği",
    };
    return labels[action] || action;
}

export default async function AuditLogPage() {
    const res = await getAuditLogsAction(1, 100);
    const logs = res.success && res.data ? res.data.logs : [];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in-fade pb-16">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <History className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Sistem Logları</h1>
                    <p className="text-muted-foreground text-sm">Sistem üzerinde yapılan işlemlerin zaman çizelgesi.</p>
                </div>
            </div>

            <Card className="glass-card border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-secondary/40 border-b border-border/50 pb-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Son İz Kayıtları (Audit Trail)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center opacity-50">
                            <History className="w-12 h-12 mb-4 text-muted-foreground" />
                            <p className="text-lg font-bold">Henüz kaydedilmiş log bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {logs.map((log: any) => (
                                <div key={log.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/30 transition-colors">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${getActionStyle(log.action).split(' ')[0]}`}></div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={getActionStyle(log.action) + " font-bold text-[10px] uppercase tracking-wider"}>
                                                    {getActionLabel(log.action)}
                                                </Badge>
                                                <span className="text-sm font-bold text-foreground">{log.entity}</span>
                                                {log.entityId && <span className="text-xs text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">#{log.entityId.slice(0, 8)}</span>}
                                            </div>
                                            {log.details && <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{log.details}</p>}
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-1 text-[11px] text-muted-foreground md:min-w-[150px]">
                                        <div className="flex items-center font-medium">
                                            <User className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {log.userId}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
