"use client";

import Link from "@/components/tenant-link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/seo";
import logoImage from "@assets/mvlogo1_1767111414104.png";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleReplitLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <SEO 
        title="Welcome"
        description="Join the MumblesVibe community to comment on articles, share local knowledge, and connect with the Mumbles community."
        canonicalUrl="/auth"
        noIndex={true}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <img src={logoImage.src} alt="MumblesVibe" className="h-16 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold">Welcome to MumblesVibe</h1>
          <p className="text-muted-foreground mt-2">
            Join our community to comment, like articles, and get local updates
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Sign in to interact with the Mumbles community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleReplitLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
              data-testid="button-sign-in"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="pt-4 border-t">
              <h3 className="font-medium text-sm mb-3">What you can do after signing in:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#8226;</span>
                  <span>Comment on articles and share your local knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#8226;</span>
                  <span>Like your favourite articles and recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#8226;</span>
                  <span>Create your unique Mumbles Vibe Name</span>
                </li>
              </ul>
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
