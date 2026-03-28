"use client";

import { useEffect } from "react";
import { useGetSiteSettingsQuery } from "@/store/api";
import type { SiteSettings } from "@shared/schema";

export function GlobalFavicon() {
  const { data: siteSettings } = useGetSiteSettingsQuery();

  useEffect(() => {
    if (!siteSettings?.faviconUrl) return;

    const setFavicon = (rel: string, sizes: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"][sizes="${sizes}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        link.setAttribute("sizes", sizes);
        document.head.appendChild(link);
      }
      link.href = href;
    };

    setFavicon("icon", "32x32", siteSettings.faviconUrl);
    setFavicon("icon", "16x16", siteSettings.faviconUrl);
    setFavicon("apple-touch-icon", "180x180", siteSettings.faviconUrl);

    let shortcut = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement | null;
    if (!shortcut) {
      shortcut = document.createElement("link");
      shortcut.rel = "shortcut icon";
      document.head.appendChild(shortcut);
    }
    shortcut.href = siteSettings.faviconUrl;
  }, [siteSettings?.faviconUrl]);

  return null;
}
