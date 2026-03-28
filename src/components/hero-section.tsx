"use client";

import { useGetHeroSettingsQuery, useGetSiteSettingsQuery } from "@/store/api";
import type { HeroSettings, SiteSettings } from "@shared/schema";

const defaultHeroImage = "/images/default_golf_hero.png";

export function HeroSection() {
  const { data: heroSettings, isLoading } = useGetHeroSettingsQuery();
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const backgroundImage = heroSettings?.imageUrl || defaultHeroImage;
  const platformName = siteSettings?.platformName || "Golf Junkies";

  return (
    <section className="relative overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-900" />
        ) : (
          <img
            src={backgroundImage}
            alt={platformName}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl">
          {isLoading ? (
            <>
              <div className="h-12 md:h-14 lg:h-16 bg-white/20 rounded-md mb-4 w-3/4 animate-pulse" />
              <div className="h-6 md:h-7 bg-white/15 rounded-md mb-8 w-2/3 animate-pulse" />
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                {heroSettings?.title || platformName}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
                {heroSettings?.subtitle || ""}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
