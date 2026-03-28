// @ts-nocheck
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo";
import { Check, Crown, Sparkles, Loader2, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SubscriptionPlan, SiteSettings } from "@shared/schema";
import {
  useGetStripeProductsQuery,
  useGetStripeSubscriptionQuery,
  useGetSubscriptionPlansQuery,
  useGetSiteSettingsQuery,
  useGetUserSubscriptionQuery,
  useStripeCheckoutMutation,
  useStripeChangePlanMutation,
  useStripeCancelMutation,
  useStripeReactivateMutation,
  useStripePortalMutation,
  useStripeSyncMutation,
  useSetUserSubscriptionMutation,
} from "@/store/api";

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
  active: boolean;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, string>;
  prices: StripePrice[];
}

interface StripeSubscription {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end?: number;
  items: {
    data: Array<{
      price: {
        id: string;
        product: string;
        unit_amount: number;
        currency: string;
        recurring: { interval: string } | null;
      };
      current_period_end?: number;
    }>;
  };
}

function getSubscriptionPeriodEnd(subscription: StripeSubscription): number | null {
  if (subscription.current_period_end) {
    return subscription.current_period_end;
  }
  if (subscription.items?.data?.[0]?.current_period_end) {
    return subscription.items.data[0].current_period_end;
  }
  return null;
}

export default function SubscriptionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useTenantRouter();
  const searchParamsHook = useSearchParams();
  const search = searchParamsHook.toString();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(search);
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [stripeSyncTrigger] = useStripeSyncMutation();

  useEffect(() => {
    if (success) {
      toast({ title: "Subscription successful!", description: "Your subscription has been activated." });
      stripeSyncTrigger();
      router.push("/subscription", { replace: true });
    } else if (canceled) {
      toast({ title: "Checkout canceled", description: "You can try again when you're ready.", variant: "destructive" });
      router.push("/subscription", { replace: true });
    }
  }, [success, canceled, toast]);

  useEffect(() => {
    if (user && !success && !canceled) {
      stripeSyncTrigger();
    }
  }, [user?.id]);

  const { data: stripeProducts, isLoading: productsLoading } = useGetStripeProductsQuery() as {
    data: { data: StripeProduct[] } | undefined;
    isLoading: boolean;
  };

  const { data: stripeSubscription, isLoading: subscriptionLoading } = useGetStripeSubscriptionQuery(undefined, {
    skip: !user,
  }) as {
    data: { subscription: StripeSubscription | null } | undefined;
    isLoading: boolean;
  };

  const { data: localPlans, isLoading: localPlansLoading } = useGetSubscriptionPlansQuery() as {
    data: SubscriptionPlan[] | undefined;
    isLoading: boolean;
  };

  const { data: siteSettings } = useGetSiteSettingsQuery() as {
    data: SiteSettings | undefined;
  };

  const currency = siteSettings?.currency ?? "$";

  const [checkoutTrigger, { isLoading: isCheckingOut }] = useStripeCheckoutMutation();
  const [changePlanTrigger, { isLoading: isChangingPlan }] = useStripeChangePlanMutation();
  const [cancelTrigger, { isLoading: isCancelling }] = useStripeCancelMutation();
  const [reactivateTrigger, { isLoading: isReactivating }] = useStripeReactivateMutation();
  const [portalTrigger, { isLoading: isOpeningPortal }] = useStripePortalMutation();

  const handleCheckout = (priceId: string) => {
    checkoutTrigger({ priceId })
      .unwrap()
      .then((data: any) => {
        if (data.url) {
          window.location.href = data.url;
        }
      })
      .catch(() => toast({ title: "Failed to start checkout", variant: "destructive" }));
  };

  const handleChangePlan = (priceId: string) => {
    changePlanTrigger({ priceId })
      .unwrap()
      .then((data: any) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast({ title: "Plan changed successfully!" });
        }
      })
      .catch(() => toast({ title: "Failed to change plan", variant: "destructive" }));
  };

  const handleCancel = () => {
    cancelTrigger()
      .unwrap()
      .then(() => {
        toast({ title: "Subscription will cancel at period end" });
      })
      .catch(() => toast({ title: "Failed to cancel subscription", variant: "destructive" }));
  };

  const handleReactivate = () => {
    reactivateTrigger()
      .unwrap()
      .then(() => {
        toast({ title: "Subscription reactivated!" });
      })
      .catch(() => toast({ title: "Failed to reactivate subscription", variant: "destructive" }));
  };

  const handlePortal = () => {
    portalTrigger({})
      .unwrap()
      .then((data: any) => {
        if (data.url) {
          window.location.href = data.url;
        }
      })
      .catch(() => toast({ title: "Failed to open billing portal", variant: "destructive" }));
  };

  const isLoading = authLoading || localPlansLoading || (user && subscriptionLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO title="Subscription Plans" description="Choose a subscription plan" />
        <SectionHeader title="Subscription Plans" description="Sign in to manage your subscription" />
        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-muted-foreground">Please sign in to view and manage your subscription.</p>
          <Button onClick={() => router.push("/signin")} data-testid="button-signin">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const activePlans = localPlans?.filter(p => p.isActive) || [];
  const subscription = stripeSubscription?.subscription;
  const currentPriceId = subscription?.items?.data?.[0]?.price?.id;

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(amount / 100);
  };

  const getProductPrice = (product: StripeProduct) => {
    const activePrice = product.prices.find(p => p.active);
    return activePrice;
  };

  const handleSubscribe = (priceId: string) => {
    if (subscription) {
      handleChangePlan(priceId);
    } else {
      handleCheckout(priceId);
    }
  };

  const isPending = isCheckingOut || isChangingPlan || isCancelling || isReactivating;

  const featureList = (plan: SubscriptionPlan) => {
    const features = [];
    if (plan.featureEditorial) features.push("Editorial Content");
    if (plan.featureEventsStandard) features.push("Standard Events");
    if (plan.featureEventsCompetitions) features.push("Competition Events");
    if (plan.featureReviews) features.push("Write Reviews");
    if (plan.featureCommunities) features.push("Community Access");
    if (plan.featureConnections) features.push("Member Connections");
    if (plan.featurePlay) features.push("Play Features");
    if (plan.featurePlayAddRequest) features.push("Create Play Requests");
    if (plan.featureSuggestEvent) features.push("Suggest Events");
    return features;
  };

  const getCurrentPlanFromStripe = () => {
    if (!currentPriceId || !activePlans) return null;
    return activePlans.find(p => p.stripePriceId === currentPriceId);
  };

  const currentPlan = getCurrentPlanFromStripe();

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="Subscription Plans" description="Choose a subscription plan that works for you" />
      <SectionHeader 
        title="Subscription Plans" 
        description="Choose the plan that best fits your needs" 
      />

      {subscription && (
        <Card className="mb-8 border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-md">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Your Current Subscription</CardTitle>
                <CardDescription>
                  Status: <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                  {subscription.cancel_at_period_end && (
                    <Badge variant="destructive" className="ml-2">Canceling</Badge>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {subscription.cancel_at_period_end ? (
                  <span>Access until: {getSubscriptionPeriodEnd(subscription) ? new Date(getSubscriptionPeriodEnd(subscription)! * 1000).toLocaleDateString() : 'Unknown'}</span>
                ) : (
                  <span>Renews: {getSubscriptionPeriodEnd(subscription) ? new Date(getSubscriptionPeriodEnd(subscription)! * 1000).toLocaleDateString() : 'Unknown'}</span>
                )}
              </div>
              <div className="flex gap-2 ml-auto">
                {subscription.cancel_at_period_end ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleReactivate()}
                    disabled={isPending}
                    data-testid="button-reactivate"
                  >
                    {isReactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Reactivate
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCancel()}
                    disabled={isPending}
                    data-testid="button-cancel"
                  >
                    Cancel Subscription
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handlePortal()}
                  disabled={isPending}
                  data-testid="button-manage-billing"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Manage Billing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {subscription?.cancel_at_period_end && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Subscription Ending</AlertTitle>
          <AlertDescription>
            Your subscription will end on {getSubscriptionPeriodEnd(subscription) ? new Date(getSubscriptionPeriodEnd(subscription)! * 1000).toLocaleDateString() : 'Unknown'}. 
            Click "Reactivate" above to continue your subscription.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePlans.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((plan, index) => {
          const isCurrentPlan = currentPlan?.id === plan.id || !!(currentPriceId && plan.stripePriceId === currentPriceId);
          const isPremium = plan.price > 0 && index === activePlans.length - 1;
          const features = featureList(plan);
          const hasStripePrice = !!plan.stripePriceId;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${
                isCurrentPlan 
                  ? "border-primary border-2 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" 
                  : isPremium 
                    ? "border-primary/50 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 hover:border-primary" 
                    : "hover:border-primary/30"
              }`}
              data-testid={`card-plan-${plan.id}`}
            >
              {isCurrentPlan ? (
                <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                  <div className="absolute top-3 right-[-30px] w-32 transform rotate-45 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold py-1 text-center shadow-sm">
                    Current
                  </div>
                </div>
              ) : isPremium ? (
                <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                  <div className="absolute top-3 right-[-30px] w-32 transform rotate-45 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-semibold py-1 text-center shadow-sm">
                    Popular
                  </div>
                </div>
              ) : plan.isDefault && !currentPlan ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              ) : null}
              
              <CardHeader className={`text-center pt-8 pb-4 ${isPremium ? "bg-gradient-to-b from-primary/5 to-transparent" : ""}`}>
                <CardTitle className={`text-xl font-bold ${isPremium ? "text-primary" : ""}`}>
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${isPremium ? "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" : ""}`}>
                    {plan.price === 0 ? "Free" : `${currency}${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm ml-1">/{plan.billingPeriod}</span>
                  )}
                </div>
                {plan.description && (
                  <CardDescription className="mt-3 text-sm">{plan.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 pt-2">
                <ul className="space-y-3">
                  {features.length > 0 ? features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        isPremium ? "bg-primary/20" : "bg-green-500/20"
                      }`}>
                        <Check className={`h-3 w-3 ${isPremium ? "text-primary" : "text-green-600"}`} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  )) : (
                    <li className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-green-500/20">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm">Basic access included</span>
                    </li>
                  )}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-4 pb-6">
                {plan.price === 0 ? (
                  <Button
                    className="w-full h-11 font-semibold"
                    variant={isCurrentPlan ? "secondary" : "outline"}
                    disabled={isCurrentPlan}
                    data-testid={`button-plan-${plan.id}`}
                  >
                    {isCurrentPlan ? "Current Plan" : "Free Plan"}
                  </Button>
                ) : hasStripePrice ? (
                  <Button
                    className={`w-full h-11 font-semibold ${
                      isPremium && !isCurrentPlan
                        ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
                        : ""
                    }`}
                    variant={isCurrentPlan ? "secondary" : "default"}
                    disabled={isCurrentPlan || isPending}
                    onClick={() => handleSubscribe(plan.stripePriceId!)}
                    data-testid={`button-subscribe-${plan.id}`}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : subscription ? (
                      "Change Plan"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-11 font-semibold"
                    variant="outline"
                    disabled
                    data-testid={`button-plan-${plan.id}`}
                  >
                    Coming Soon
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {activePlans.length === 0 && (
        <Card className="mt-8">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No subscription plans are currently available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FallbackSubscriptionPage({ plans, currency }: { plans: SubscriptionPlan[]; currency: string }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: currentSubscription } = useGetUserSubscriptionQuery(undefined, {
    skip: !user,
  }) as { data: { plan: SubscriptionPlan | null } | undefined };

  const [selectPlanTrigger, { isLoading: isSelectingPlan }] = useSetUserSubscriptionMutation();

  const handleSelectPlan = (planId: number) => {
    selectPlanTrigger({ planId })
      .unwrap()
      .then(() => {
        toast({ title: "Subscription updated successfully" });
      })
      .catch(() => toast({ title: "Failed to update subscription", variant: "destructive" }));
  };

  const currentPlan = currentSubscription?.plan;
  const activePlans = plans?.filter(p => p.isActive) || [];

  const featureList = (plan: SubscriptionPlan) => {
    const features = [];
    features.push("Editorial Content");
    if (plan.featureEventsStandard) features.push("Standard Events");
    if (plan.featureEventsCompetitions) features.push("Competition Events");
    if (plan.featureReviews) features.push("Write Reviews");
    if (plan.featureCommunities) features.push("Community Access");
    if (plan.featureConnections) features.push("Member Connections");
    if (plan.featurePlay) features.push("Play Features");
    if (plan.featurePlayAddRequest) features.push("Create Play Requests");
    if (plan.featureSuggestEvent) features.push("Suggest Events");
    return features;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="Subscription Plans" description="Choose a subscription plan that works for you" />
      <SectionHeader 
        title="Subscription Plans" 
        description="Choose the plan that best fits your needs" 
      />

      {currentPlan && (
        <Card className="mb-8 border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-md">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Your Current Plan</CardTitle>
                <CardDescription>You are currently subscribed to {currentPlan.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm px-4 py-1">
                {currentPlan.name}
              </Badge>
              <span className="font-semibold text-foreground">
                {currentPlan.price === 0 ? "Free" : `${currency}${currentPlan.price}/${currentPlan.billingPeriod}`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePlans.map((plan, index) => {
          const isCurrentPlan = currentPlan?.id === plan.id;
          const features = featureList(plan);
          const isPremium = plan.price > 0 && (plan.isDefault || index === activePlans.length - 1);
          
          return (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${
                isCurrentPlan 
                  ? "border-primary border-2 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" 
                  : isPremium 
                    ? "border-primary/50 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 hover:border-primary" 
                    : "hover:border-primary/30"
              }`}
            >
              {isCurrentPlan ? (
                <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                  <div className="absolute top-3 right-[-30px] w-32 transform rotate-45 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold py-1 text-center shadow-sm">
                    Current
                  </div>
                </div>
              ) : isPremium ? (
                <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                  <div className="absolute top-3 right-[-30px] w-32 transform rotate-45 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-semibold py-1 text-center shadow-sm">
                    Popular
                  </div>
                </div>
              ) : plan.isDefault && !currentPlan ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              ) : null}
              
              <CardHeader className={`text-center pt-8 pb-4 ${isPremium ? "bg-gradient-to-b from-primary/5 to-transparent" : ""}`}>
                <CardTitle className={`text-xl font-bold ${isPremium ? "text-primary" : ""}`}>
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${isPremium ? "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" : ""}`}>
                    {plan.price === 0 ? "Free" : `${currency}${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm ml-1">/{plan.billingPeriod}</span>
                  )}
                </div>
                {plan.description && (
                  <CardDescription className="mt-3 text-sm">{plan.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 pt-2">
                <ul className="space-y-3">
                  {features.length > 0 ? (
                    features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          isPremium ? "bg-primary/20" : "bg-green-500/20"
                        }`}>
                          <Check className={`h-3 w-3 ${isPremium ? "text-primary" : "text-green-600"}`} />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground text-sm text-center py-4">
                      Basic access included
                    </li>
                  )}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-4 pb-6">
                <Button
                  className={`w-full h-11 font-semibold ${
                    isPremium && !isCurrentPlan
                      ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
                      : ""
                  }`}
                  variant={isCurrentPlan ? "secondary" : "default"}
                  disabled={isCurrentPlan || isSelectingPlan}
                  onClick={() => handleSelectPlan(plan.id)}
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  {isSelectingPlan ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : currentPlan && plan.price > (currentPlan.price || 0) ? (
                    "Upgrade Now"
                  ) : currentPlan && plan.price < (currentPlan.price || 0) ? (
                    "Downgrade"
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {activePlans.length === 0 && (
        <Card className="mt-8">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No subscription plans are currently available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
