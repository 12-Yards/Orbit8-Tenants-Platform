import dns from "dns";
import { prisma } from "../db";

export type DomainCheckResult = {
    configured: boolean;
    domain: {
        tenantId: string;
        name: string;
        domainName: string | null;
        subDomain: string | null;
        isDNSConfigured: number;
        dnsResolved: boolean;
        wwwDnsResolved: boolean;
        createdAt: Date | null;
    };
    message: string;
};

function resolveDomain(hostname: string): Promise<boolean> {
    return dns.promises.resolve4(hostname).then(() => true).catch(() => false);
}

async function resolvesToIp(domain: string): Promise<boolean> {
    try {
        const targetIp = process.env.SERVER_PUBLIC_IP || null;
        if (!targetIp) {
            throw new Error("SERVER_PUBLIC_IP env var is required");
        }
        const addresses = await dns.promises.resolve4(domain);
        return addresses.includes(targetIp);
    } catch {
        return false;
    }
}

/**
 * Looks up the tenant by domainName and returns whether it is
 * "fully configured with www working" (isDNSConfigured === 1).
 *
 * Also performs a live DNS check for the www subdomain so callers
 * can see whether www resolves independently of the DB flag.
 */
export async function checkDomainConfiguration(rawInput: string): Promise<DomainCheckResult> {
    // Normalise: strip protocol, trailing slashes, www prefix
    const normalised = rawInput
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .split("/")[0]
        .replace(/^www\./, "");

    // Find the tenant whose domainName matches (bare or with www)
    const tenant = await prisma.tenants.findFirst({
        where: {
            OR: [
                { domainName: normalised },
                { domainName: `www.${normalised}` },
            ],
        },
    });

    if (!tenant) {
        return {
            configured: false,
            domain: {
                tenantId: "",
                name: "",
                domainName: normalised,
                subDomain: null,
                isDNSConfigured: 0,
                dnsResolved: false,
                wwwDnsResolved: false,
                createdAt: null,
            },
            message: `No tenant found for domain "${normalised}"`,
        };
    }

    const dnsResolved = await resolvesToIp(normalised);
    const wwwDnsResolved = await resolvesToIp(`www.${normalised}`);
    const configured = tenant.isDNSConfigured === 1;

    return {
        configured,
        domain: {
            tenantId: tenant.id,
            name: tenant.name,
            domainName: tenant.domainName ?? null,
            subDomain: tenant.subDomain ?? null,
            isDNSConfigured: tenant.isDNSConfigured,
            dnsResolved,
            wwwDnsResolved,
            createdAt: tenant.createdAt ?? null,
        },
        message: configured
            ? `Domain "${normalised}" is fully configured with www working.`
            : `Domain "${normalised}" is not yet fully configured (isDNSConfigured=${tenant.isDNSConfigured}).`,
    };
}
