"use client";

import Link from "@/components/tenant-link";
import { useGetPollsQuery } from "@/store/api";
import { SEO } from "@/components/seo";
import { PollCard } from "@/components/poll-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Poll } from "@shared/schema";

interface PollWithVotes extends Poll {
  voteCounts: number[];
  totalVotes: number;
  actualVotes: number;
  userVoteIndex?: number | null;
}

export default function EndedPollsPage() {
  const { data: polls, isLoading } = useGetPollsQuery();

  const endedPolls = (polls as PollWithVotes[] | undefined)?.filter((poll) => {
    const endDate = new Date(new Date(poll.startDate).getTime() + poll.durationHours * 60 * 60 * 1000);
    return new Date() > endDate;
  }) || [];

  return (
    <>
      <SEO 
        title="Ended Polls" 
        description="View the results of past community polls"
      />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explore
              </Button>
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-2" data-testid="text-ended-polls-title">Ended Polls</h1>
          <p className="text-muted-foreground mb-8">View the results of past community polls</p>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : endedPolls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No ended polls yet</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
              {endedPolls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
