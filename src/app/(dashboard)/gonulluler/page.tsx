import { getVolunteersAction, getPhoneVolunteersAction } from "@/app/actions/volunteerManagement";
import { VolunteerCreateButton } from "@/components/VolunteerCreateButton";
import { VolunteerBlockButton } from "@/components/VolunteerBlockButton";
import { ShieldCheck, HeartHandshake, User, Mail, Calendar, Activity, Phone, Ban, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function VolunteersPage() {
    const [staffRes, phoneRes] = await Promise.all([
        getVolunteersAction(),
        getPhoneVolunteersAction()
    ]);

    const staffVolunteers = staffRes.success ? (staffRes.data || []) : [];
    const phoneVolunteers = phoneRes.success ? (phoneRes.data || []) : [];

    return (
        <div className="space-y-8 animate-in-fade">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <HeartHandshake className="w-10 h-10 text-primary" />
                        Ekip & Gönüllü Yönetimi
                    </h1>
                    <p className="text-muted-foreground font-medium">İdari personeli yetkilendirin ve sahadaki gönüllü ekibini koordine edin.</p>
                </div>
                <VolunteerCreateButton />
            </div>

            <Tabs defaultValue="field" className="w-full">
                <TabsList className="bg-muted/50 p-1 gap-1 rounded-2xl mb-6">
                    <TabsTrigger value="field" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Users className="w-4 h-4" /> Saha Gönüllüleri (Geçici / Şifresiz)
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <ShieldCheck className="w-4 h-4" /> İdari Personel (Tam Yetkili / Şifreli)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="field">
                    <div className="glass-card rounded-3xl shadow-sm border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-border text-center">
                                        <TableHead className="font-bold text-muted-foreground py-5 pl-8 text-xs uppercase tracking-widest w-[100px]">Durum</TableHead>
                                        <TableHead className="font-bold text-muted-foreground py-5 text-xs uppercase tracking-widest">İsim Soyisim</TableHead>
                                        <TableHead className="font-bold text-muted-foreground py-5 text-xs uppercase tracking-widest">Telefon Numarası</TableHead>
                                        <TableHead className="font-bold text-muted-foreground py-5 text-xs uppercase tracking-widest">İlk Katılım</TableHead>
                                        <TableHead className="font-bold text-muted-foreground py-5 text-right pr-8 text-xs uppercase tracking-widest">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {phoneVolunteers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 px-8">
                                                <div className="opacity-40 flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                                        <Users className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                    <p className="font-black text-xl">Sistemde Henüz Saha Gönüllüsü Yok</p>
                                                    <p className="text-sm max-w-xs mx-auto font-medium">Dağıtım linkleri üzerinden kayıt olan gönüllüler burada listelenecektir.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        phoneVolunteers.map((vol: any) => (
                                            <TableRow key={vol.id} className="group hover:bg-muted/20 transition-all border-border">
                                                <TableCell className="py-5 pl-8">
                                                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm ${vol.isBlocked ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                        {vol.isBlocked ? <Ban className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-bold text-foreground text-base">{vol.name}</p>
                                                    {vol.isBlocked && <Badge variant="destructive" className="mt-1 text-[9px] h-4">ENGELİ</Badge>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                                        <Phone className="h-4 w-4 shrink-0" />
                                                        {vol.phone}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 shrink-0 opacity-50" />
                                                        {vol.createdAt.toLocaleDateString("tr-TR")}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <VolunteerBlockButton volunteerId={vol.id} isBlocked={vol.isBlocked} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="staff">
                    <div className="glass-card rounded-3xl shadow-sm border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="font-bold text-muted-foreground py-5 pl-8 text-xs uppercase tracking-widest w-[100px]">Durum</TableHead>
                                        <TableHead className="font-bold text-muted-foreground py-5 text-xs uppercase tracking-widest">Ad Soyad / Kimlik</TableHead>
                                        <TableHead className="font-bold text-muted-foreground py-5 text-xs uppercase tracking-widest">Kurumsal E-Posta</TableHead>
                                        <TableHead className="font-bold text-muted-foreground py-5 text-xs uppercase tracking-widest">Kayıt Tarihi</TableHead>
                                        <TableHead className="font-bold text-muted-foreground py-5 text-right pr-8 text-xs uppercase tracking-widest">Erişim Seviyesi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffVolunteers.map((vol: any) => (
                                        <TableRow key={vol.id} className="group hover:bg-muted/20 transition-all border-border">
                                            <TableCell className="py-5 pl-8">
                                                <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-bold text-foreground text-base">{vol.name}</p>
                                                <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1 opacity-70">
                                                    <Activity className="w-3 h-3" /> {vol.id.slice(0, 8)}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                    <Mail className="h-4 w-4 shrink-0 opacity-50" />
                                                    {vol.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-muted-foreground">
                                                    {vol.createdAt.toLocaleDateString("tr-TR")}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                {vol.role === 'ADMIN' ? (
                                                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 border-0">YÖNETİCİ</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-primary border-primary/20">STAFF</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="p-6 bg-secondary/50 rounded-2xl border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary border border-primary/20">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-sm uppercase tracking-tight">Hibrit Yetki ve Saha Yönetimi</h4>
                        <p className="text-xs text-muted-foreground max-w-md">
                            Sistem iki türlü çalışır: <b>Saha Gönüllüleri</b> şifresiz/telefonla liste üstlenirken, <b>İç Ekip</b> tam yetkili (Admin) hesaplara sahiptir ve tüm yönetim paneline erişebilirler.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
