export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { AddItemButton } from "@/components/inventory/AddItemButton";
import { InventoryViewManager } from "@/components/inventory/InventoryViewManager";

export default async function ItemsPage() {
    const items = await (prisma as any).item.findMany({
        orderBy: { name: "asc" },
        include: {
            packageContents: {
                include: {
                    item: true
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Yardım Türleri & Envanter</h1>
                    <p className="text-muted-foreground mt-2">
                        Dağıtılacak yardım malzemelerini tanımlayın ve stok seviyelerini takip edin.
                    </p>
                </div>
                <AddItemButton availableItems={items} />
            </div>

            <InventoryViewManager items={items} />
        </div>
    );
}
