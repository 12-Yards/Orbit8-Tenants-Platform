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
import { useSignupMutation, useGetSiteSettingsQuery } from "@/store/api";
import type { SiteSettings } from "@shared/schema";

export default function SignupPage() {
  const router = useTenantRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    mumblesVibeName: "",
    email: "",
    password: "",
  });

  const { data: siteSettings } = useGetSiteSettingsQuery();

  const platformName = (siteSettings as SiteSettings)?.platformName || "Community";
  const logoUrl = (siteSettings as SiteSettings)?.logoUrl;

  const [triggerSignup, { isLoading: signupLoading }] = useSignupMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    triggerSignup(formData).unwrap().then(() => {
      toast({ title: `Welcome to ${platformName}!`, description: "Your account has been created." });
      router.push("/");
    }).catch((error: any) => {
      toast({ title: "Signup failed", description: error?.data?.message || "Failed to create account", variant: "destructive" });
    });
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <SEO 
        title="Create Account"
        description={`Join the ${platformName} community. Create your account to post, comment, and connect with others.`}
        canonicalUrl="/signup"
        noIndex={true}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {logoUrl && (
            <Link href="/">
              <img src={logoUrl} alt={platformName} className="h-16 w-auto mx-auto mb-4" />
            </Link>
          )}
          <h1 className="text-2xl font-bold">Join {platformName}</h1>
          <p className="text-muted-foreground mt-2">
            Create your account to join the community
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Choose your unique display name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vibeName">Display Name</Label>
                <Input
                  id="vibeName"
                  value={formData.mumblesVibeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, mumblesVibeName: e.target.value }))}
                  placeholder="Choose a display name..."
                  required
                  minLength={2}
                  maxLength={50}
                  data-testid="input-vibe-name"
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed on your comments
                </p>
              </div>

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
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
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
                disabled={signupLoading}
                data-testid="button-signup"
              >
                {signupLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/signin" className="text-primary hover:underline" data-testid="link-signin">
                Sign in
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
