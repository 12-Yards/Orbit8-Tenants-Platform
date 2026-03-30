import type { Express } from "express";
import { spawnSync, execSync } from "child_process";
import dns from "dns";
import { prisma } from "./db";
import { isAdmin } from "./auth";
import { ensureTenantNginxConfig } from "./nginx-tenant-config";
import { log } from ".";

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;

async function resolvesToIp(domain: string): Promise<boolean> {
    try {
        const targetIp = process.env.SERVER_PUBLIC_IP;
        if (!targetIp) throw new Error("SERVER_PUBLIC_IP env var is required");

        const addresses = await dns.promises.resolve4(domain);
        return addresses.includes(targetIp);
    } catch {
        return false;
    }
}

// ✅ FIXED certbot
function generateSslCert(baseDomain: string): void {
    const email = process.env.SSL_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    if (!email) {
        throw new Error("SSL_ADMIN_EMAIL or ADMIN_EMAIL env var is required");
    }

    const result = spawnSync("certbot", [
        "certonly",
        "--nginx",
        "-d", baseDomain,
        "-d", `www.${baseDomain}`,
        "--non-interactive",
        "--agree-tos",
        "-m", email
    ], { stdio: "pipe" });

    if (result.status !== 0) {
        const stderr =
            result.stderr?.toString().trim() ||
            result.stdout?.toString().trim() ||
            "unknown error";

        throw new Error(stderr);
    }
}

export type TenantResult = {
    tenantId: string;
    domainName: string;
    dnsResolved: boolean;
    wwwDnsResolved: boolean;
    sslGenerated: boolean;
    nginxUpdated: boolean;
    markedConfigured: boolean;
    error?: string;
};

export async function runDnsSslCheck(): Promise<{ message: string; results: TenantResult[] }> {
    const tenants = await prisma.tenants.findMany({
        where: {
            domainName: { not: null },
            isDNSConfigured: 0,
        },
    });

    const pendingTenants = tenants.filter(t => t.domainName && t.domainName.trim() !== "");

    const results: TenantResult[] = [];

    for (const tenant of pendingTenants) {
        const rawDomain = tenant.domainName!.trim().toLowerCase().replace(/^www\./, "");

        const result: TenantResult = {
            tenantId: tenant.id,
            domainName: rawDomain,
            dnsResolved: false,
            wwwDnsResolved: false,
            sslGenerated: false,
            nginxUpdated: false,
            markedConfigured: false,
        };

        if (!DOMAIN_REGEX.test(rawDomain)) {
            throw new Error(`Invalid domain format: ${rawDomain}`);
        }

        try {
            // ✅ 1. DNS check
            result.dnsResolved = await resolvesToIp(rawDomain);
            result.wwwDnsResolved = await resolvesToIp(`www.${rawDomain}`);

            if (!result.dnsResolved) {
                throw new Error(`DNS not pointing to server`);
            }

            // ✅ 2. HTTP config first
            ensureTenantNginxConfig(rawDomain, false, true);
            result.nginxUpdated = true;

            // ✅ 3. Generate SSL
            generateSslCert(rawDomain);
            result.sslGenerated = true;

            // ✅ 4. Apply HTTPS config
            ensureTenantNginxConfig(rawDomain, true, true);
            result.nginxUpdated = true;

            // ✅ 5. Mark configured
            await prisma.tenants.update({
                where: { id: tenant.id },
                data: { isDNSConfigured: 1 },
            });

            result.markedConfigured = true;

        } catch (err) {
            result.error = err instanceof Error ? err.message : String(err);
            log(`Error for ${rawDomain}: ${result.error}`, "dns-ssl");
        }

        results.push(result);
    }

    return {
        message: `Processed ${results.length} tenant(s)`,
        results,
    };
}

export function registerDnsSslRoutes(app: Express): void {
    app.post("/api/tenants/check-dns-and-generate-ssl", isAdmin, async (req, res) => {
        try {
            const user = await prisma.users.findUnique({ where: { id: (req as any).userId } });

            if (!user?.isSuperAdmin) {
                return res.status(403).json({ error: "Super admin access required" });
            }

            const result = await runDnsSslCheck();
            return res.json(result);

        } catch (error) {
            console.error("DNS/SSL error:", error);
            return res.status(500).json({ error: "Failed to process DNS and SSL" });
        }
    });
}