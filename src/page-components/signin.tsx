"use client";

import { usePathname } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";
import { useLoginMutation, useGetSiteSettingsQuery } from "@/store/api";
import type { SiteSettings } from "@shared/schema";

export default function SigninPage() {
  const router = useTenantRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { data: siteSettings } = useGetSiteSettingsQuery();

  const platformName = (siteSettings as SiteSettings)?.platformName || "Community";
  const logoUrl = (siteSettings as SiteSettings)?.logoUrl;

  const [triggerLogin, { isLoading: loginLoading }] = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerLogin(formData).unwrap().then(() => {
      toast({ title: "Welcome back!", description: "You've successfully signed in." });
      router.push("/");
    }).catch((error: any) => {
      toast({ title: "Sign in failed", description: error?.data?.message || "Invalid credentials", variant: "destructive" });
    });
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <SEO 
        title="Sign In"
        description={`Sign in to your ${platformName} account to access community features and engage with local content.`}
        canonicalUrl="/signin"
        noIndex={true}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {logoUrl && (
            <Link href="/">
              <img src={logoUrl} alt={platformName} className="h-16 w-auto mx-auto mb-4" />
            </Link>
          )}
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your {platformName} account
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Your password"
                    required
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loginLoading}
                data-testid="button-signin"
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/signup" className="text-primary hover:underline" data-testid="link-signup">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="ghost" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
