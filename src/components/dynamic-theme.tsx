"use client";

import { useGetSiteSettingsQuery } from "@/store/api";
import { useEffect } from "react";

function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  if (hex.length !== 6) return null;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function generateDarkVariant(hsl: { h: number; s: number; l: number }): { h: number; s: number; l: number } {
  return {
    h: hsl.h,
    s: Math.min(100, hsl.s + 5),
    l: Math.min(70, hsl.l + 8),
  };
}

function generateForeground(hsl: { h: number; s: number; l: number }): string {
  const fgL = hsl.l > 55 ? 10 : 98;
  return `${hsl.h} ${Math.min(hsl.s, 30)}% ${fgL}%`;
}

export function DynamicTheme() {
  const { data: siteSettings } = useGetSiteSettingsQuery();

  useEffect(() => {
    const root = document.documentElement;

    if (siteSettings?.primaryColor) {
      const hsl = hexToHSL(siteSettings.primaryColor);
      if (hsl) {
        const val = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
        const fg = generateForeground(hsl);
        const dark = generateDarkVariant(hsl);
        const darkVal = `${dark.h} ${dark.s}% ${dark.l}%`;
        const darkFg = generateForeground(dark);

        root.style.setProperty("--primary", val);
        root.style.setProperty("--primary-foreground", fg);
        root.style.setProperty("--ring", val);
        root.style.setProperty("--sidebar-primary", val);
        root.style.setProperty("--sidebar-primary-foreground", fg);
        root.style.setProperty("--sidebar-ring", val);
        root.style.setProperty("--chart-1", val);

        root.style.setProperty("--primary-dark", darkVal);
        root.style.setProperty("--primary-foreground-dark", darkFg);
      }
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-primary-foreground");
      root.style.removeProperty("--sidebar-ring");
      root.style.removeProperty("--chart-1");
      root.style.removeProperty("--primary-dark");
      root.style.removeProperty("--primary-foreground-dark");
    }

    if (siteSettings?.secondaryColor) {
      const hsl = hexToHSL(siteSettings.secondaryColor);
      if (hsl) {
        const val = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
        const fg = generateForeground(hsl);

        root.style.setProperty("--secondary", val);
        root.style.setProperty("--secondary-foreground", fg);
      }
    } else {
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--secondary-foreground");
    }

    const isDark = root.classList.contains("dark");
    if (isDark) {
      if (siteSettings?.primaryColor) {
        const hsl = hexToHSL(siteSettings.primaryColor);
        if (hsl) {
          const dark = generateDarkVariant(hsl);
          const darkVal = `${dark.h} ${dark.s}% ${dark.l}%`;
          const darkFg = generateForeground(dark);
          root.style.setProperty("--primary", darkVal);
          root.style.setProperty("--primary-foreground", darkFg);
          root.style.setProperty("--ring", darkVal);
          root.style.setProperty("--sidebar-primary", darkVal);
          root.style.setProperty("--sidebar-primary-foreground", darkFg);
          root.style.setProperty("--sidebar-ring", darkVal);
        }
      }
      if (siteSettings?.secondaryColor) {
        const hsl = hexToHSL(siteSettings.secondaryColor);
        if (hsl) {
          const darkSecondary = {
            h: hsl.h,
            s: Math.max(10, hsl.s - 10),
            l: Math.max(15, hsl.l - 50),
          };
          const val = `${darkSecondary.h} ${darkSecondary.s}% ${darkSecondary.l}%`;
          const fg = `${darkSecondary.h} ${Math.min(darkSecondary.s, 20)}% 95%`;
          root.style.setProperty("--secondary", val);
          root.style.setProperty("--secondary-foreground", fg);
        }
      }
    }
  }, [siteSettings?.primaryColor, siteSettings?.secondaryColor]);

  return null;
}
