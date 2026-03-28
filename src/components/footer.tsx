"use client";

import Link from "@/components/tenant-link";
import { useState, useMemo } from "react";
import { Mail, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { SiTiktok, SiSnapchat } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGetSiteSettingsQuery, useGetArticleCategoriesQuery, useSubscribeNewsletterMutation } from "@/store/api";
import type { SiteSettings, ArticleCategoryRecord } from "@shared/schema";

const allQuickLinks = [
  { label: "Explore", href: "/", setting: null },
  { label: "Editorials", href: "/articles", setting: null },
  { label: "Events", href: "/events", setting: "showEvents" },

  { label: "Communities", href: "/groups", setting: "showCommunity" },
  { label: "Reviews", href: "/reviews", setting: "showReviews" },
] as const;

export function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const { data: articleCategories } = useGetArticleCategoriesQuery();

  const [subscribeNewsletter, { isLoading: isSubmitting }] = useSubscribeNewsletterMutation();

  const quickLinks = useMemo(() => {
    return allQuickLinks.filter((item) => {
      if (!item.setting) return true;
      return siteSettings?.[item.setting] !== false;
    });
  }, [siteSettings]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    subscribeNewsletter({ email })
      .unwrap()
      .then(() => {
        toast({
          title: "Welcome aboard!",
          description: "You've successfully subscribed to our newsletter.",
        });
        setEmail("");
      })
      .catch(() => {
        toast({
          title: "Oops!",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <footer className="bg-card border-t" data-testid="footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold">{siteSettings?.platformName || "MumblesVibe"}</h3>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              {siteSettings?.tagline || "Your community guide to the beautiful seaside village of Mumbles, Swansea. Discover local gems, upcoming events, and connect with the community."}
            </p>
            <div className="flex gap-2 flex-wrap">
              {siteSettings?.twitterUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={siteSettings.twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <Twitter className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {siteSettings?.instagramUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {siteSettings?.youtubeUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={siteSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <Youtube className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {siteSettings?.linkedinUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={siteSettings.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {siteSettings?.tiktokUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={siteSettings.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    <SiTiktok className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {siteSettings?.snapchatUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={siteSettings.snapchatUrl} target="_blank" rel="noopener noreferrer" aria-label="Snapchat">
                    <SiSnapchat className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => window.scrollTo(0, 0)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Popular Categories</h3>
            <ul className="space-y-2">
              {articleCategories?.slice(0, 6).map((category: ArticleCategoryRecord) => (
                <li key={category.id}>
                  <Link 
                    href={`/articles?category=${encodeURIComponent(category.name)}`} 
                    onClick={() => window.scrollTo(0, 0)} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Subscribe</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to {siteSettings?.platformName || "MumblesVibe"} for the latest news, events, and updates.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  required
                  data-testid="input-newsletter-email"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} data-testid="button-newsletter-subscribe">
                {isSubmitting ? "..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p>© {new Date().getFullYear()} {siteSettings?.platformName ?? "Mumbles Vibe"}. All rights reserved.</p>
            <span className="hidden sm:inline text-muted-foreground/50">|</span>
            <a 
              href="https://www.orbit8.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              Powered by Orbit8
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
