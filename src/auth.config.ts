import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;
            const isOnLogin = pathname.startsWith("/login");
            const isVolunteerPublicRoute = pathname.startsWith("/saha/liste/");

            // Giriş sayfasındaysa ve giriş yapmışsa ana sayfaya at
            if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
                return true;
            }

            // Gönüllülerin paylaşımlı liste ekranı (Token bazlı) LOGIN GEREKTİRMEZ
            if (isVolunteerPublicRoute) {
                return true;
            }

            // Diğer tüm sayfalar için giriş şart
            if (!isLoggedIn) {
                return false;
            }

            // --- YETKİ (ROLE) KONTROLÜ ---
            const userRole = (auth?.user as any)?.role;
            const isVolunteerUser = userRole === "VOLUNTEER";

            // Eğer giren kişi LOGIN OLMUŞ BİR GÖNÜLLÜ ise SADECE /saha dizinine girebilir 
            if (isVolunteerUser) {
                if (!pathname.startsWith("/saha")) {
                    return Response.redirect(new URL("/saha", nextUrl));
                }
            }

            return true;
        },
    },
    providers: [],
    trustHost: true,
} satisfies NextAuthConfig;
