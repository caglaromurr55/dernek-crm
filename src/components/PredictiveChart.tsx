"use client";

import React, { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { getPredictiveData } from "@/app/actions/predictive";
import { Badge } from "@/components/ui/badge";

export function PredictiveChart() {
    const [data, setData] = useState<{ name: string; deliveries: number; isPrediction: boolean }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getPredictiveData();
                setData(res);
            } catch (error) {
                console.error("Predictive data loading error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Card className="glass-card border-0 shadow-xl h-full flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col flex-wrap gap-4 items-center animate-pulse">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full"></div>
                    <p className="font-bold text-muted-foreground">AI Verileri İşleniyor...</p>
                </div>
            </Card>
        );
    }

    const predictionNode = data.find(d => d.isPrediction);
    const predictionValue = predictionNode?.deliveries || 0;
    const previousNode = data[data.length - 2];
    const previousValue = previousNode?.deliveries || 0;

    // Trend hesaplama
    let trend = 0;
    if (previousValue > 0) {
        trend = ((predictionValue - previousValue) / previousValue) * 100;
    }

    return (
        <Card className="glass-card border-0 shadow-2xl overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-emerald-500" /> Tahmini Koli İhtiyacı
                        </CardTitle>
                        <CardDescription className="font-medium text-xs mt-1">Geçmiş 6 aylık teslimat hızına dayalı AI öngörüsü</CardDescription>
                    </div>
                    {trend > 20 && (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 shadow-sm animate-pulse-subtle">
                            <AlertCircle className="w-3 h-3 mr-1" /> Yoğun Ay Bekleniyor
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-6 mt-2">
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">{predictionNode?.name}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black text-emerald-700">{predictionValue}</h3>
                            <span className="text-sm font-bold text-muted-foreground">koli</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <TrendingUp className={`w-5 h-5 ${trend >= 0 ? 'text-rose-500' : 'text-emerald-500'} ${trend < 0 && 'rotate-180'}`} />
                            <span className={`font-black text-lg ${trend >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                            </span>
                            <span className="text-xs font-bold text-muted-foreground uppercase">Geçen Aya Göre</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 font-medium leading-relaxed max-w-sm">
                            Algoritma sipariş hızındaki lineer ivmelenmeyi baz alarak tedbir amaçlı %10 stok marjı eklemiştir.
                        </p>
                    </div>
                </div>

                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                                itemStyle={{ fontWeight: "bold", color: "#047857" }}
                                formatter={(value: any) => [`${value} Koli`, "Teslimat"]}
                                labelStyle={{ fontWeight: "900", color: "hsl(var(--foreground))", marginBottom: "8px" }}
                            />
                            {/* Gelecek ay çizgisini belirgin gösteren ayırıcı */}
                            <ReferenceLine x={predictionNode?.name} stroke="#10b981" strokeDasharray="3 3" />
                            <Area
                                type="monotone"
                                dataKey="deliveries"
                                stroke="#10b981"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorDeliveries)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: "#047857" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
