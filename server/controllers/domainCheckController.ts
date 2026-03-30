import type { Request, Response } from "express";
import { checkDomainConfiguration } from "../services/domainCheckService";

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;

/**
 * GET /api/domain/check?domain=<domain>
 *
 * Returns whether the given domain is "fully configured with www working".
 *
 * Response shape:
 *   { configured: boolean, domain: { ... }, message: string }
 *
 * configured === true  → isDNSConfigured === 1 in the tenants table
 * configured === false → tenant not found OR isDNSConfigured !== 1
 */
export async function checkDomainHandler(req: Request, res: Response): Promise<void> {
    try {
        const raw = (req.query.domain as string | undefined)?.trim();

        if (!raw) {
            res.status(400).json({ error: "Missing required query parameter: domain" });
            return;
        }

        // Normalise before validation
        const normalised = raw
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "")
            .split("/")[0]
            .replace(/^www\./, "");

        if (!DOMAIN_REGEX.test(normalised)) {
            res.status(400).json({ error: "Invalid domain name format" });
            return;
        }

        const result = await checkDomainConfiguration(normalised);

        res.status(200).json(result);
    } catch (error) {
        console.error("[DomainCheckController] Error checking domain:", error);
        res.status(500).json({ error: "Failed to check domain configuration" });
    }
}
