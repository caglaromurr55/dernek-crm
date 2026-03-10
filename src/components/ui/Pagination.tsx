"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    totalPages: number;
    currentPage: number;
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(
                    <PaginationButton
                        key={i}
                        href={createPageURL(i)}
                        isActive={currentPage === i}
                    >
                        {i}
                    </PaginationButton>
                );
            }
        } else {
            // Complex pagination with ellipses
            pages.push(
                <PaginationButton
                    key={1}
                    href={createPageURL(1)}
                    isActive={currentPage === 1}
                >
                    1
                </PaginationButton>
            );

            if (currentPage > 3) {
                pages.push(<span key="dots-1" className="px-2 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></span>);
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (i === 1 || i === totalPages) continue;
                pages.push(
                    <PaginationButton
                        key={i}
                        href={createPageURL(i)}
                        isActive={currentPage === i}
                    >
                        {i}
                    </PaginationButton>
                );
            }

            if (currentPage < totalPages - 2) {
                pages.push(<span key="dots-2" className="px-2 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></span>);
            }

            pages.push(
                <PaginationButton
                    key={totalPages}
                    href={createPageURL(totalPages)}
                    isActive={currentPage === totalPages}
                >
                    {totalPages}
                </PaginationButton>
            );
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 py-4">
            <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-border bg-card hover:bg-secondary disabled:opacity-50"
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
            >
                {currentPage > 1 ? (
                    <Link href={createPageURL(currentPage - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                ) : (
                    <ChevronLeft className="h-4 w-4" />
                )}
            </Button>

            <div className="flex items-center gap-1">
                {renderPageNumbers()}
            </div>

            <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-border bg-card hover:bg-secondary disabled:opacity-50"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
            >
                {currentPage < totalPages ? (
                    <Link href={createPageURL(currentPage + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}

function PaginationButton({
    href,
    isActive,
    children
}: {
    href: string;
    isActive: boolean;
    children: React.ReactNode
}) {
    return (
        <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={`min-w-[40px] h-10 rounded-xl font-bold transition-all ${isActive
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95"
                    : "border-border bg-card hover:bg-secondary text-muted-foreground active:scale-95"
                }`}
            asChild
        >
            <Link href={href}>{children}</Link>
        </Button>
    );
}
