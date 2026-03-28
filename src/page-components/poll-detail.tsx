// @ts-nocheck
"use client";

import { useParams } from "next/navigation";
import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import {
  useGetPollBySlugQuery,
  useVotePollMutation,
  useRankingVotePollMutation,
} from "@/store/api";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Clock, BarChart3, Check, Image, ListOrdered, RotateCcw } from "lucide-react";
import type { Poll } from "@shared/schema";

interface PollWithVotes extends Poll {
  voteCounts?: number[];
  rankingScores?: number[];
  actualVotes: number;
  totalVotes: number;
  userVoteIndex?: number | null;
  userRanking?: number[] | null;
}

export default function PollDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: poll, isLoading, error } = useGetPollBySlugQuery(slug!, { skip: !slug });

  const [votePollTrigger, { isLoading: voteLoading }] = useVotePollMutation();
  const [rankingVotePollTrigger, { isLoading: rankingVoteLoading }] = useRankingVotePollMutation();

  const voteMutation = {
    mutate: (optionIndex: number) => {
      votePollTrigger({ pollId: String(poll?.id), body: { optionIndex } }).unwrap()
        .then(() => { toast({ title: "Vote submitted!" }); })
        .catch((error: any) => { toast({ title: "Failed to vote", description: error.message, variant: "destructive" }); });
    },
    isPending: voteLoading,
  };

  const rankingVoteMutation = {
    mutate: (ranking: number[]) => {
      rankingVotePollTrigger({ pollId: String(poll?.id), body: { ranking } }).unwrap()
        .then(() => { toast({ title: "Ranking submitted!" }); })
        .catch((error: any) => { toast({ title: "Failed to submit ranking", description: error.message, variant: "destructive" }); });
    },
    isPending: rankingVoteLoading,
  };

  const handleVote = () => {
    if (selectedOption === null) {
      toast({ title: "Please select an option", variant: "destructive" });
      return;
    }
    voteMutation.mutate(selectedOption);
  };

  const handleRankingVote = () => {
    if (!poll) return;
    const options = poll.options as string[];
    if (selectedOrder.length !== options.length) {
      toast({ title: "Please rank all options", variant: "destructive" });
      return;
    }
    rankingVoteMutation.mutate(selectedOrder);
  };

  const handleOptionClick = (optionIndex: number) => {
    if (selectedOrder.includes(optionIndex)) {
      setSelectedOrder(selectedOrder.filter(i => i !== optionIndex));
    } else {
      setSelectedOrder([...selectedOrder, optionIndex]);
    }
  };

  const resetRanking = () => {
    setSelectedOrder([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Loading Poll | MumblesVibe" />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 w-full bg-muted rounded-lg" />
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="h-32 w-full bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Poll Not Found | MumblesVibe" />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Poll not found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This poll may have been removed or doesn't exist.
              </p>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isRankingPoll = poll.pollType === "ranking";
  const hasVoted = isRankingPoll 
    ? (poll.userRanking !== null && poll.userRanking !== undefined)
    : (poll.userVoteIndex !== null && poll.userVoteIndex !== undefined);
  const endDate = new Date(new Date(poll.startDate).getTime() + poll.durationHours * 60 * 60 * 1000);
  const now = new Date();
  const isExpired = now > endDate;
  const timeRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60 * 24)));
  const hoursRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));
  
  const formatTimeRemaining = () => {
    const parts = [];
    if (daysRemaining > 0) parts.push(`${daysRemaining}d`);
    if (hoursRemaining > 0 || daysRemaining > 0) parts.push(`${hoursRemaining}h`);
    parts.push(`${minutesRemaining}m`);
    return parts.join(" ") + " remaining";
  };

  const options = poll.options as string[];
  const optionImages = (poll.optionImages as (string | null)[] | null) || [];
  const voteCounts = poll.voteCounts || options.map(() => 0);
  const rankingScores = poll.rankingScores || options.map(() => 0);
  const actualVotes = poll.actualVotes || 0;
  const totalVotes = poll.totalVotes || 0;

  const seoTitle = `${poll.title} | MumblesVibe Community Poll`;
  const seoDescription = poll.article 
    ? poll.article.substring(0, 160) 
    : `Vote on ${poll.title} - A community poll on MumblesVibe`;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        ogType="article"
        ogImage={poll.imageUrl || undefined}
      />
      
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <article>
          {poll.imageUrl && (
            <img 
              src={poll.imageUrl} 
              alt={poll.title}
              className="w-full aspect-[16/9] object-cover rounded-lg mb-6"
              data-testid="img-poll-hero"
            />
          )}

          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-poll-title">
              {poll.title}
            </h1>
            {isExpired ? (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Poll ended
              </span>
            ) : (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTimeRemaining()}
              </span>
            )}
          </div>

          {poll.article && (
            <div className="prose prose-slate dark:prose-invert max-w-none mb-8" data-testid="text-poll-article">
              {poll.article.split('\n').filter(p => p.trim()).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">
                  {isExpired ? "Final Results" : hasVoted ? (isRankingPoll ? "Your Ranking" : "Your Vote") : (isRankingPoll ? "Rank Your Preferences" : "Cast Your Vote")}
                </h2>
                {isRankingPoll && (
                  <div className="flex items-center gap-1">
                    <ListOrdered className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Ranking Poll</span>
                  </div>
                )}
              </div>
              
              {isExpired ? (
                isRankingPoll ? (
                  <div className="space-y-3">
                    {[...options]
                      .map((option, originalIndex) => ({ option, score: rankingScores[originalIndex], originalIndex }))
                      .sort((a, b) => b.score - a.score)
                      .map(({ option, score, originalIndex }, rank) => {
                        const maxScore = Math.max(...rankingScores);
                        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                        const optionImage = optionImages[originalIndex];
                        const userRankedPosition = poll.userRanking 
                          ? poll.userRanking.indexOf(originalIndex) + 1 
                          : null;
                        
                        return (
                          <div key={originalIndex} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <Badge variant="outline">{rank + 1}</Badge>
                                {option}
                                {userRankedPosition && (
                                  <span className="text-xs text-muted-foreground">(you: #{userRankedPosition})</span>
                                )}
                                {optionImage && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 ml-1"
                                    onClick={() => setViewingImageUrl(optionImage)}
                                    data-testid={`button-view-option-image-${originalIndex}`}
                                  >
                                    <Image className="h-4 w-4" />
                                  </Button>
                                )}
                              </span>
                              <span className="text-muted-foreground">{score} pts</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      {totalVotes} total {totalVotes === 1 ? "ranking" : "rankings"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {options.map((option, index) => {
                      const percentage = actualVotes > 0 
                        ? Math.round(((voteCounts[index] || 0) / actualVotes) * 100)
                        : 0;
                      const isUserVote = poll.userVoteIndex === index;
                      const optionImage = optionImages[index];

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={isUserVote ? "font-medium flex items-center gap-1" : "flex items-center gap-1"}>
                              {isUserVote && <Check className="h-4 w-4 text-primary" />}
                              {option}
                              {optionImage && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 ml-1"
                                  onClick={() => setViewingImageUrl(optionImage)}
                                  data-testid={`button-view-option-image-${index}`}
                                >
                                  <Image className="h-4 w-4" />
                                </Button>
                              )}
                            </span>
                            <span className="text-muted-foreground">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      {totalVotes} total {totalVotes === 1 ? "vote" : "votes"}
                    </p>
                  </div>
                )
              ) : hasVoted ? (
                isRankingPoll ? (
                  <div className="space-y-3">
                    {poll.userRanking && poll.userRanking.map((optionIndex, position) => {
                      const optionImage = optionImages[optionIndex];
                      return (
                        <div 
                          key={optionIndex} 
                          className="p-4 rounded-md border border-primary bg-primary/10 flex items-center gap-2"
                        >
                          <Badge variant="outline">{position + 1}</Badge>
                          <span className="font-medium flex items-center gap-1">
                            {options[optionIndex]}
                            {optionImage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1"
                                onClick={() => setViewingImageUrl(optionImage)}
                                data-testid={`button-view-option-image-${optionIndex}`}
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                            )}
                          </span>
                        </div>
                      );
                    })}
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      You ranked! Results will be shown when the poll ends.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {options.map((option, index) => {
                      const isUserVote = poll.userVoteIndex === index;
                      const optionImage = optionImages[index];
                      return (
                        <div 
                          key={index} 
                          className={`p-4 rounded-md border ${isUserVote ? "border-primary bg-primary/10" : "border-border"}`}
                        >
                          <span className={isUserVote ? "font-medium flex items-center gap-1" : "text-muted-foreground flex items-center gap-1"}>
                            {isUserVote && <Check className="h-5 w-5 text-primary" />}
                            {option}
                            {optionImage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1"
                                onClick={() => setViewingImageUrl(optionImage)}
                                data-testid={`button-view-option-image-${index}`}
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                            )}
                          </span>
                        </div>
                      );
                    })}
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      You voted! Results will be shown when the poll ends.
                    </p>
                  </div>
                )
              ) : isRankingPoll ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Click options in order of preference</p>
                    {selectedOrder.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetRanking}
                        data-testid="button-reset-ranking"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                  {options.map((option, index) => {
                    const optionImage = optionImages[index];
                    const rankPosition = selectedOrder.indexOf(index);
                    const isSelected = rankPosition !== -1;
                    return (
                      <div key={index} className="flex gap-2">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          className="flex-1 justify-start py-4 gap-2"
                          onClick={() => handleOptionClick(index)}
                          data-testid={`ranking-option-${index}`}
                        >
                          {isSelected && (
                            <Badge variant="secondary">
                              {rankPosition + 1}
                            </Badge>
                          )}
                          {option}
                        </Button>
                        {optionImage && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setViewingImageUrl(optionImage)}
                            data-testid={`button-view-option-image-${index}`}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {isAuthenticated ? (
                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={handleRankingVote}
                      disabled={selectedOrder.length !== options.length || rankingVoteMutation.isPending}
                      data-testid="button-submit-ranking"
                    >
                      {rankingVoteMutation.isPending 
                        ? "Submitting..." 
                        : selectedOrder.length === options.length 
                          ? "Submit Ranking" 
                          : `Select ${options.length - selectedOrder.length} more`}
                    </Button>
                  ) : (
                    <Link href="/signin">
                      <Button variant="secondary" className="w-full mt-4" size="lg" data-testid="button-signin-to-rank">
                        Sign in to rank
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {options.map((option, index) => {
                    const optionImage = optionImages[index];
                    return (
                      <div key={index} className="flex gap-2">
                        <Button
                          variant={selectedOption === index ? "default" : "outline"}
                          className="flex-1 justify-start py-4"
                          onClick={() => setSelectedOption(index)}
                          data-testid={`poll-option-${index}`}
                        >
                          {option}
                        </Button>
                        {optionImage && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setViewingImageUrl(optionImage)}
                            data-testid={`button-view-option-image-${index}`}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {isAuthenticated ? (
                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={handleVote}
                      disabled={selectedOption === null || voteMutation.isPending}
                      data-testid="button-submit-vote"
                    >
                      {voteMutation.isPending ? "Submitting..." : "Submit Vote"}
                    </Button>
                  ) : (
                    <Link href="/signin">
                      <Button variant="secondary" className="w-full mt-4" size="lg" data-testid="button-signin-to-vote">
                        Sign in to vote
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </article>
      </div>

      <Dialog open={!!viewingImageUrl} onOpenChange={(open) => !open && setViewingImageUrl(null)}>
        <DialogContent className="max-w-2xl">
          {viewingImageUrl && (
            <img 
              src={viewingImageUrl} 
              alt="Option image" 
              className="w-full h-auto rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
