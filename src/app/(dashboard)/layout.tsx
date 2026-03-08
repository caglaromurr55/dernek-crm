import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { auth } from "@/auth";

export default async function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    return <DashboardLayout role={role}>{children}</DashboardLayout>;
}
