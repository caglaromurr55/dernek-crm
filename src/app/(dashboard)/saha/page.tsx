import { MapPin, Phone, CheckCircle, Navigation } from "lucide-react";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompleteDeliveryButton } from "@/components/CompleteDeliveryButton";

export default async function SahaOperasyonPage() {
    // Sadece AKTİF dağıtımlara ait PENDING teslimatları getir
    const deliveries = await prisma.delivery.findMany({
        where: {
            status: "PENDING",
            distributionEvent: {
                status: "ACTIVE"
            }
        },
        include: {
            distributionEvent: true,
            household: {
                include: {
                    persons: true
                }
            }
        },
        orderBy: {
            household: { score: "desc" }
        }
    });

    return (
        <div className="space-y-4 max-w-lg mx-auto pb-20">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Saha Görevleri</h1>
                <p className="text-muted-foreground text-sm flex justify-between items-center mt-1">
                    <span>Bekleyen Teslimat: <Badge variant="secondary" className="ml-1">{deliveries.length}</Badge></span>
                </p>
            </div>

            {deliveries.length === 0 ? (
                <div className="bg-secondary/50 border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                    <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-3 opacity-50" />
                    <p>Şu an için size atanmış bekleyen bir teslimat bulunmuyor.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveries.map((delivery: any) => {
                        const applicant = delivery.household.persons.find((p: any) => p.isApplicant) || delivery.household.persons[0];
                        const allowedIdentities = delivery.household.persons.map((p: any) => p.identityNo);

                        return (
                            <Card key={delivery.id} className="overflow-hidden border-border bg-card">
                                <CardHeader className="bg-secondary/30 pb-3 border-b border-border/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Badge variant="outline" className="mb-2 border-emerald-500/20 text-emerald-500 bg-emerald-500/10 uppercase text-[10px] tracking-wider font-bold">
                                                {delivery.distributionEvent.name}
                                            </Badge>
                                            <CardTitle className="text-lg text-foreground">
                                                {applicant ? `${applicant.firstName} ${applicant.lastName}` : "Bilinmiyor"}
                                            </CardTitle>
                                        </div>
                                        <Badge variant="destructive" className="font-mono text-lg rounded-full h-10 w-10 flex items-center justify-center p-0">
                                            {delivery.household.score}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3 text-sm">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="text-foreground/90">{delivery.household.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-foreground/90 font-mono">
                                            {delivery.household.contactNumber || "Numara Yok"}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-secondary/30 border-t border-border/50 gap-2 pt-3">
                                    <a
                                        href={`https://maps.google.com/?q=${encodeURIComponent(delivery.household.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button variant="outline" className="w-full bg-card hover:bg-secondary">
                                            <Navigation className="mr-2 h-4 w-4" /> Harita
                                        </Button>
                                    </a>

                                    <CompleteDeliveryButton deliveryId={delivery.id} allowedIdentities={allowedIdentities} />
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
