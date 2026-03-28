"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { tenantHref } from "@/lib/tenant-link";

export function useTenantRouter() {
  const router = useRouter();

  return useMemo(() => ({
    ...router,
    push: (href: string, options?: any) => router.push(tenantHref(href), options),
    replace: (href: string, options?: any) => router.replace(tenantHref(href), options),
  }), [router]);
}
