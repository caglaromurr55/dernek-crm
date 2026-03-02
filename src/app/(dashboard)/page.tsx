import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, AlertTriangle, PackageCheck, TrendingUp, HandHeart, Calendar, ArrowRight, UserPlus, MapPin, Activity } from "lucide-react";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const [
    totalHouseholds,
    totalDeliveries,
    pendingDeliveries,
    highScoreCount
  ] = await Promise.all([
    prisma.household.count(),
    (prisma as any).delivery.count({ where: { status: "DELIVERED" } }),
    (prisma as any).delivery.count({ where: { status: "PENDING" } }),
    prisma.household.count({ where: { score: { gte: 80 } } })
  ]);

  const recentHouseholds = await prisma.household.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      persons: {
        where: { isApplicant: true } as any
      }
    }
  });

  return (
    <div className="space-y-10 animate-in-fade">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight premium-gradient-text">Hoş Geldiniz, Yönetici</h1>
          <p className="text-muted-foreground font-medium">Dernek CRM saha operasyonları ve başvuru takip merkezi.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/haneler/yeni">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 h-12 shadow-lg shadow-emerald-500/20 border-0 group">
              <UserPlus className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" /> Yeni Kayıt Oluştur
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam Hane", val: totalHouseholds, sub: "Kayıtlı Başvuru", icon: <Users className="text-emerald-600" />, color: "bg-emerald-500", iconBg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Ulaştırılan Yardım", val: totalDeliveries, sub: "Teslim Edilen Koli", icon: <PackageCheck className="text-blue-600" />, color: "bg-blue-500", iconBg: "bg-blue-50", border: "border-blue-100" },
          { label: "Bekleyen Sevkiyat", val: pendingDeliveries, sub: "Sahadaki Ekipler", icon: <AlertTriangle className="text-amber-500" />, color: "bg-amber-500", iconBg: "bg-amber-50", border: "border-amber-100" },
          { label: "Yüksek Aciliyet", val: highScoreCount, sub: "+80 Skoru Olanlar", icon: <HandHeart className="text-red-500" />, color: "bg-red-500", iconBg: "bg-red-50", border: "border-red-100" }
        ].map((stat, i) => (
          <Card key={i} className={`glass-card hover-lift border-0 shadow-xl overflow-hidden group`}>
            <div className={`h-1.5 w-full ${stat.color}`}></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-black text-muted-foreground/70 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-4xl font-black text-foreground leading-none">{stat.val}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{stat.sub}</p>
                </div>
                <div className={`p-4 rounded-3xl ${stat.iconBg} group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">
        {/* Son Kayıtlar */}
        <Card className="lg:col-span-12 glass-card border-0 shadow-2xl overflow-hidden">
          <CardHeader className="bg-secondary/30 pb-6 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" /> Son Başvuru Hareketleri
              </CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground">Sisteme yeni girilen tahkikat dosyaları</CardDescription>
            </div>
            <Link href="/haneler">
              <Button variant="ghost" size="sm" className="text-emerald-600 font-bold hover:text-emerald-700 hover:bg-emerald-50 rounded-full">
                Tümünü Gör <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentHouseholds.length === 0 ? (
                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-2">
                  <Users className="w-10 h-10" />
                  <p className="font-bold">Henüz başvuru kaydı bulunmuyor.</p>
                </div>
              ) : (
                recentHouseholds.map((h: any) => {
                  const applicant = h.persons[0];
                  return (
                    <div key={h.id} className="p-5 flex items-center justify-between hover:bg-secondary/50 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center font-black text-muted-foreground group-hover:bg-emerald-50/10 group-hover:text-emerald-500 transition-colors">
                          {applicant ? applicant.firstName[0] : "?"}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                            {applicant ? `${applicant.firstName} ${applicant.lastName}` : "Bilinmeyen Başvuru Sahibi"}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {h.address.split(" - ")[0]}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {h.createdAt.toLocaleDateString("tr-TR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`font-black rounded-lg py-1 px-3 ${h.score >= 80 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                          {h.score || 0} HP
                        </Badge>
                        <Link href={`/haneler/${h.id}`}>
                          <Button size="icon" variant="ghost" className="rounded-full hover:bg-secondary hover:shadow-sm transition-all">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
          <div className="p-4 bg-secondary/30 border-t border-border text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gelişmiş Skorlama V3-V4 Aktif</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
