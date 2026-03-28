"use client";

import Link from "@/components/tenant-link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type SubscriptionFeature = 
  | "featureEditorial"
  | "featureEventsStandard"
  | "featureEventsCompetitions"
  | "featureReviews"
  | "featureCommunities"
  | "featureConnections"
  | "featurePlay"
  | "featurePlayAddRequest";

interface FeatureGateProps {
  feature: SubscriptionFeature;
  featureName: string;
  children: React.ReactNode;
}

export function FeatureGate({ feature, featureName, children }: FeatureGateProps) {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    return <>{children}</>;
  }

  const hasAccess = auth[feature] as boolean;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="container max-w-2xl py-16">
      <Card className="text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Upgrade Required</CardTitle>
          <CardDescription className="text-base">
            The {featureName} feature is not included in your current subscription plan.
            Upgrade your subscription to access this content.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 items-center">
          <Link href="/subscription">
            <Button size="lg" data-testid="button-upgrade-subscription">
              <CreditCard className="h-4 w-4 mr-2" />
              View Subscription Plans
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" data-testid="button-go-home">
              Go to Homepage
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export function useFeatureAccess(feature: SubscriptionFeature): boolean {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    return true;
  }
  
  return auth[feature] as boolean;
}
