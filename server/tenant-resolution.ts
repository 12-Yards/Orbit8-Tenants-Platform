import type { Request } from "express";
import { prisma } from "./db";

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0].trim().split(":")[0].trim().toLowerCase();
}

export function getRequestHostname(req: Request): string {
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  return normalizeHost(host || req.get("host"));
}

export async function resolveTenantFromHostname(hostname: string) {
  if (!hostname) return null;

  const shortSubdomain = hostname.includes(".") ? hostname.split(".")[0] : hostname;
  const subDomainCandidates = Array.from(new Set([hostname, shortSubdomain].filter(Boolean)));

  return prisma.tenants.findFirst({
    where: {
      OR: [
        { domainName: hostname },
        ...subDomainCandidates.map((value) => ({ subDomain: value })),
      ],
    },
  });
}
