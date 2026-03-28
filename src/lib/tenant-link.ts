export function tenantHref(href: string): string {
  if (typeof window === "undefined") return href;
  const params = new URLSearchParams(window.location.search);
  const tenantId = params.get("_tenantId");
  if (!tenantId) return href;
  if (href.includes("_tenantId=")) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}_tenantId=${encodeURIComponent(tenantId)}`;
}
