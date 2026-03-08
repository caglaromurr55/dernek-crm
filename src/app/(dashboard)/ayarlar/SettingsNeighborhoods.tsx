"use client";

import { useState } from "react";
import { Plus, Trash2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createNeighborhoodAction, deleteNeighborhoodAction } from "@/app/actions/neighborhood";

interface Neighborhood {
    id: string;
    name: string;
    createdAt: Date;
}

export function SettingsNeighborhoods({ initialData }: { initialData: Neighborhood[] }) {
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = neighborhoods.filter(n => n.name.toLowerCase().includes(search.toLowerCase()));

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        const res = await createNeighborhoodAction(formData);
        if (res.success) {
            toast.success(res.message);
            // Re-fetch handled natively by next cache, but let's emulate optimistic UI for speed
            const newName = (formData.get("name") as string).trim();
            setNeighborhoods([...neighborhoods, { id: Date.now().toString(), name: newName, createdAt: new Date() }]);
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error(res.message);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`'${name}' mahallesini silmek istediğinize emin misiniz? Bu işlem, o mahallede kayıtlı olan evleri silmez ancak adres listesinden mahalleyi kaldırır.`)) return;

        const res = await deleteNeighborhoodAction(id);
        if (res.success) {
            toast.success(res.message);
            setNeighborhoods(neighborhoods.filter(n => n.id !== id));
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Card className="glass-card shadow-xl border-border/50">
            <CardHeader className="bg-secondary/20 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Mahalle ve Lokasyon Tanımlamaları
                </CardTitle>
                <CardDescription>Saha dağıtımlarında ve hane kayıtlarında görünecek standart mahalleleri belirleyin.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8">

                {/* Ekleme Formu */}
                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end bg-emerald-50/50 dark:bg-emerald-950/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex-1 w-full space-y-2">
                        <label htmlFor="name" className="text-xs font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-widest px-1">YENİ MAHALLE ADI</label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Örn: Merkez Mahallesi"
                            required
                            className="bg-white dark:bg-background h-12 border-emerald-200 dark:border-emerald-800"
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="h-12 w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20">
                        <Plus className="w-4 h-4 mr-2" /> Ekle
                    </Button>
                </form>

                {/* Arama ve Liste */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Mahalle ara..."
                            className="pl-12 h-12 bg-secondary/30 border-border/50 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-muted-foreground font-medium bg-secondary/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-3">
                                <MapPin className="w-10 h-10 opacity-20" />
                                {search ? "Aramanıza uygun mahalle bulunamadı." : "Henüz hiç mahalle eklenmemiş."}
                            </div>
                        ) : (
                            filtered.map(n => (
                                <div key={n.id} className="group flex items-center justify-between p-4 bg-background border border-border/50 rounded-2xl shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <p className="font-bold text-foreground truncate">{n.name}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(n.id, n.name)}
                                        className="text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-700 rounded-xl focus:opacity-100 transition-all"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
