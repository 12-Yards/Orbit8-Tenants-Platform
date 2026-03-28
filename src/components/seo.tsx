"use client";

import Head from "next/head";
import { useGetSiteSettingsQuery } from "@/store/api";
import type { SiteSettings } from "@shared/schema";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

const DEFAULT_SITE_NAME = "Community Platform";
const DEFAULT_DESCRIPTION = "Discover local content, events, and community features.";
const BASE_URL = "";

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = "Mumbles, Swansea, Wales, coastal village, events, restaurants, beaches, travel guide",
  ogImage,
  ogType = "website",
  canonicalUrl,
  noIndex = false,
}: SEOProps) {
  const { data: siteSettings } = useGetSiteSettingsQuery();
  
  const siteName = siteSettings?.platformName ?? DEFAULT_SITE_NAME;
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const canonical = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : undefined;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {siteSettings?.faviconUrl && (
        <>
          <link rel="icon" type="image/x-icon" href={siteSettings.faviconUrl} />
          <link rel="shortcut icon" href={siteSettings.faviconUrl} />
        </>
      )}
    </Head>
  );
}
