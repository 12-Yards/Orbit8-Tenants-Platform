"use client";

import { usePathname } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useMemo } from "react";
import { Menu, X, LogOut, User, Search, CreditCard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useGetSiteSettingsQuery } from "@/store/api";
import type { SiteSettings } from "@shared/schema";

const allNavItems = [
  { label: "Explore", href: "/", setting: null, authRequired: false, subscriptionFeature: null },
  { label: "Editorials", href: "/articles", setting: null, authRequired: false, subscriptionFeature: "featureEditorial" },
  { label: "Podcasts", href: "/podcasts", setting: "showPodcasts", authRequired: false, subscriptionFeature: null },
  { label: "Events", href: "/events", setting: "showEvents", authRequired: false, subscriptionFeature: "featureEventsStandard" },

  { label: "Reviews", href: "/reviews", setting: "showReviews", authRequired: false, subscriptionFeature: null },
  { label: "Communities", href: "/groups", setting: "showCommunity", authRequired: false, subscriptionFeature: "featureCommunities" },
  { label: "Connections", href: "/members", setting: "showConnections", authRequired: true, subscriptionFeature: "featureConnections" },
  { label: "Play", href: "/play", setting: "showPlay", authRequired: true, subscriptionFeature: "featurePlay" },
] as const;

type SubscriptionFeatureKey = 
  | "featureEditorial" 
  | "featureEventsStandard" 
  | "featureEventsCompetitions" 

  | "featureReviews" 
  | "featureCommunities" 
  | "featureConnections" 
  | "featurePlay" 
  | "featurePlayAddRequest";

export function Header() {
  const location = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const auth = useAuth();
  const { user, isAuthenticated, isLoading: authLoading, logout } = auth;
  
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      if (item.authRequired && !isAuthenticated) return false;
      if (item.setting && siteSettings?.[item.setting] === false) return false;
      if (item.subscriptionFeature && isAuthenticated) {
        const featureKey = item.subscriptionFeature as SubscriptionFeatureKey;
        if (!auth[featureKey]) return false;
      }
      return true;
    });
  }, [siteSettings, isAuthenticated, auth]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 md:h-24 items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {siteSettings?.logoUrl ? (
              <img 
                src={siteSettings.logoUrl} 
                alt={siteSettings?.platformName || "Site Logo"} 
                className="h-10 sm:h-14 md:h-20 w-auto" 
              />
            ) : (
              <div className="h-10 w-10 sm:h-14 sm:w-14 md:h-20 md:w-20 bg-muted rounded animate-pulse" />
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-main">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => window.scrollTo(0, 0)}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="font-medium"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/search">
              <Button 
                variant="ghost" 
                size="icon" 
                data-testid="button-search"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            <ThemeToggle />
            {isAuthenticated && <NotificationBell />}
            
            {!authLoading && (
              isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {user?.profileImageUrl ? (
                      <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" data-testid="button-user-menu">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.profileImageUrl} alt={user.mumblesVibeName || "Profile"} />
                          <AvatarFallback className="text-[10px]">
                            {user.mumblesVibeName?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ) : (
                      <Button variant="outline" size="icon" data-testid="button-user-menu">
                        <User className="h-4 w-4" />
                      </Button>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user?.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" data-testid="link-admin">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" data-testid="link-profile">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" data-testid="link-subscription">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>
                    {(siteSettings?.allowPlatformLogin !== false || user?.isAdmin || user?.isSuperAdmin) && (
                      <DropdownMenuItem onClick={() => logout()} data-testid="button-logout">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : siteSettings?.allowPlatformLogin !== false ? (
                <>
                <Link href="/signin">
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-signin"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="default"
                    size="sm"
                    data-testid="button-signup"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
              ) : null
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 gap-1" data-testid="nav-mobile">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => window.scrollTo(0, 0)}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
