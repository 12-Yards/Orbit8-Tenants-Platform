"use client";

import Link from "@/components/tenant-link";
import {
  useGetGroupsQuery,
  useGetMyGroupsQuery,
  useGetMyEventGroupsQuery,
  useGetMyCompetitionGroupsQuery,
  useGetMyPendingGroupsQuery,
  useJoinGroupMutation,
  useLeaveGroupMutation,
} from "@/store/api";
import { SEO } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Lock, Globe, UserCheck, Loader2, X, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";
import { useToast } from "@/hooks/use-toast";
import type { Group } from "@shared/schema";

interface GroupWithFlags extends Group {
  isCompetitionGroup?: boolean;
}

function GroupCard({ group, isMember, isPending, isAuthenticated }: { group: GroupWithFlags; isMember: boolean; isPending: boolean; isAuthenticated: boolean }) {
  const { toast } = useToast();
  
  const [joinGroupTrigger, { isLoading: joinLoading }] = useJoinGroupMutation();
  const [leaveGroupTrigger, { isLoading: cancelLoading }] = useLeaveGroupMutation();

  const joinMutation = {
    mutate: () => {
      joinGroupTrigger(group.id).unwrap()
        .then(() => { toast({ title: "Request sent!", description: "You'll be notified when approved." }); })
        .catch(() => { toast({ title: "Failed to send request", variant: "destructive" }); });
    },
    isPending: joinLoading,
  };

  const cancelMutation = {
    mutate: () => {
      leaveGroupTrigger(group.id).unwrap()
        .then(() => { toast({ title: "Join request cancelled" }); })
        .catch(() => { toast({ title: "Failed to cancel request", variant: "destructive" }); });
    },
    isPending: cancelLoading,
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    joinMutation.mutate();
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cancelMutation.mutate();
  };

  // Competition groups cannot be joined directly - must enter competition
  const isCompetitionGroup = group.isCompetitionGroup === true;
  const showJoinButton = isAuthenticated && !isMember && !group.isPublic && !isPending && !isCompetitionGroup;
  const showPendingBadge = isAuthenticated && !isMember && !group.isPublic && isPending && !isCompetitionGroup;
  const hasAccess = group.isPublic || isMember;

  return (
    <Link href={`/groups/${group.slug}`}>
      <Card 
        className={`h-full hover-elevate cursor-pointer flex flex-col ${
          hasAccess 
            ? "border-primary/40 bg-primary/5 dark:bg-primary/10" 
            : ""
        }`} 
        data-testid={`card-group-${group.id}`}
      >
        {group.imageUrl && (
          <img 
            src={group.imageUrl} 
            alt={group.name}
            className="w-full aspect-video object-cover rounded-t-md"
          />
        )}
        {!group.imageUrl && (
          <div className="w-full aspect-video bg-muted flex items-center justify-center rounded-t-md">
            <Users className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1" data-testid={`text-group-name-${group.id}`}>
              {group.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isMember && !group.isPublic && (
                <Badge variant="default" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Member
                </Badge>
              )}
              {group.isPublic ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-group-description-${group.id}`}>
            {group.description || "A private community group"}
          </p>
        </CardContent>
        {showJoinButton && (
          <CardFooter className="pt-0">
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleJoinClick}
              disabled={joinMutation.isPending}
              data-testid={`button-join-${group.id}`}
            >
              {joinMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Request to Join
            </Button>
          </CardFooter>
        )}
        {showPendingBadge && (
          <CardFooter className="pt-0">
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <Badge variant="secondary" className="flex items-center py-2 px-3 bg-orange-500 dark:bg-orange-600 text-white" data-testid={`badge-pending-${group.id}`}>
                <Clock className="h-3 w-3 mr-2" />
                Request Pending
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelClick}
                disabled={cancelMutation.isPending}
                data-testid={`button-cancel-request-${group.id}`}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <X className="h-4 w-4 mr-1" />
                )}
                Cancel Request
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}

export default function Groups() {
  const { isAuthenticated } = useAuth();
  const { data: groups = [], isLoading } = useGetGroupsQuery();
  
  const { data: myGroups = [] } = useGetMyGroupsQuery(undefined, { skip: !isAuthenticated });

  const { data: myEventGroups = [] } = useGetMyEventGroupsQuery(undefined, { skip: !isAuthenticated });

  const { data: myCompetitionGroups = [] } = useGetMyCompetitionGroupsQuery(undefined, { skip: !isAuthenticated });

  const { data: pendingGroupIds = [] } = useGetMyPendingGroupsQuery(undefined, { skip: !isAuthenticated });

  const myGroupIds = new Set(myGroups.map(g => g.id));
  const competitionGroupIds = new Set(myCompetitionGroups.map(g => g.id));
  const eventGroupIds = new Set(myEventGroups.filter(g => !competitionGroupIds.has(g.id)).map(g => g.id));
  const pendingIds = new Set(pendingGroupIds);

  const regularAccessibleGroups = groups.filter(g => (g.isPublic || myGroupIds.has(g.id)) && !eventGroupIds.has(g.id) && !competitionGroupIds.has(g.id));
  const otherGroups = groups.filter(g => !g.isPublic && !myGroupIds.has(g.id) && !eventGroupIds.has(g.id) && !competitionGroupIds.has(g.id));

  return (
    <FeatureGate feature="featureCommunities" featureName="Communities">
    <div className="min-h-screen bg-background">
      <SEO 
        title="Groups"
        description="Join private community groups in Mumbles. Connect with locals and visitors who share your interests."
        canonicalUrl="/groups"
      />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse">
                <div className="w-full aspect-video bg-muted rounded-t-md" />
                <CardContent className="pt-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Groups Yet</h3>
            <p className="text-muted-foreground">
              Community groups will appear here once they're created.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {regularAccessibleGroups.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4" data-testid="heading-your-communities">Your Communities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularAccessibleGroups.map((group) => (
                    <GroupCard key={group.id} group={group} isMember={myGroupIds.has(group.id)} isPending={pendingIds.has(group.id)} isAuthenticated={isAuthenticated} />
                  ))}
                </div>
              </section>
            )}

            {myCompetitionGroups.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4" data-testid="heading-competition-communities">Competition Communities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCompetitionGroups.map((group) => (
                    <GroupCard key={group.id} group={group} isMember={true} isPending={false} isAuthenticated={isAuthenticated} />
                  ))}
                </div>
              </section>
            )}

            {myEventGroups.filter(g => !competitionGroupIds.has(g.id)).length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4" data-testid="heading-event-communities">Event Communities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myEventGroups.filter(g => !competitionGroupIds.has(g.id)).map((group) => (
                    <GroupCard key={group.id} group={group} isMember={true} isPending={false} isAuthenticated={isAuthenticated} />
                  ))}
                </div>
              </section>
            )}

            {otherGroups.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4" data-testid="heading-other-communities">Other Communities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherGroups.map((group) => (
                    <GroupCard key={group.id} group={group} isMember={myGroupIds.has(group.id)} isPending={pendingIds.has(group.id)} isAuthenticated={isAuthenticated} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
    </FeatureGate>
  );
}
