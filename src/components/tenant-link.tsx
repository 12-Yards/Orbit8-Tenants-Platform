"use client";

import Link from "next/link";
import { tenantHref } from "@/lib/tenant-link";
import { forwardRef } from "react";

type LinkProps = React.ComponentProps<typeof Link>;

const TenantLink = forwardRef<HTMLAnchorElement, LinkProps>(function TenantLink(props, ref) {
  const href = typeof props.href === "string" ? tenantHref(props.href) : props.href;
  return <Link {...props} href={href} ref={ref} />;
});

export default TenantLink;
