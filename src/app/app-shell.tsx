"use client";

import { useGetSiteSettingsQuery } from "@/store/api";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import type { SiteSettings } from "@shared/schema";
import ComingSoonPage from "@/page-components/coming-soon";

const AUTH_ROUTES = ["/signin", "/signup", "/admin", "/tenants"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const { data: siteSettings, isLoading: settingsLoading } = useGetSiteSettingsQuery();

  if (settingsLoading || authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1" />
        <Footer />
      </div>
    );
  }

  const typedSettings = siteSettings as SiteSettings | undefined;
  const platformLive = typedSettings?.platformLive ?? false;
  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));

  if (!platformLive && !isAdmin && !isAuthRoute) {
    return <ComingSoonPage />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
