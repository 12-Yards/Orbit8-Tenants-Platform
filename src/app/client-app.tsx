"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { CookieConsent } from "@/components/cookie-consent";
import { GlobalFavicon } from "@/components/global-favicon";
import { DynamicTheme } from "@/components/dynamic-theme";
import { AppShell } from "./app-shell";

export function ClientApp({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider defaultTheme="light">
      <Provider store={store}>
        <GlobalFavicon />
        <DynamicTheme />
        <TooltipProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
          <CookieConsent />
        </TooltipProvider>
      </Provider>
    </ThemeProvider>
  );
}
