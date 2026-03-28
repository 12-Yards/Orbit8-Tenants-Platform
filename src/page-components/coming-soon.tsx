"use client";

import Link from "@/components/tenant-link";
import { useGetSiteSettingsQuery } from "@/store/api";
import type { SiteSettings } from "@shared/schema";
import { SEO } from "@/components/seo";

export default function ComingSoonPage() {
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const platformName = siteSettings?.platformName || "Our Platform";
  const logoUrl = siteSettings?.logoUrl;

  return (
    <>
      <SEO title="Coming Soon" description={`${platformName} is coming soon.`} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4" data-testid="coming-soon-page">
        <div className="text-center max-w-lg space-y-8">
          {logoUrl && (
            <div className="flex justify-center mb-6">
              <img src={logoUrl} alt={platformName} className="h-20 w-auto object-contain" data-testid="img-coming-soon-logo" />
            </div>
          )}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight" data-testid="text-coming-soon-title">
              Coming Soon
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-coming-soon-description">
              {platformName} is getting ready to launch. We're working hard to bring you something great.
            </p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">Stay tuned for updates.</p>
          </div>
          <div className="pt-2">
            <Link href="/signin" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors" data-testid="link-admin-login">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
