"use client";

import Link from "@/components/tenant-link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useVotePollMutation, useRankingVotePollMutation } from "@/store/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Check, Clock, BarChart3, Image, ExternalLink, RotateCcw } from "lucide-react";
import type { Poll } from "@shared/schema";

interface PollWithVotes extends Poll {
  voteCounts?: number[];
  rankingScores?: number[];
  actualVotes: number;
  totalVotes: number;
  userVoteIndex?: number | null;
  userRanking?: number[] | null;
}

interface PollCardProps {
  poll: PollWithVotes;
}

export function PollCard({ poll }: PollCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  
  const options = poll.options as string[];
  const isRankingPoll = poll.pollType === "ranking";
  const isThisOrThatPoll = poll.pollType === "this_or_that";
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);

  const hasVoted = isRankingPoll 
    ? (poll.userRanking !== null && poll.userRanking !== undefined)
    : (poll.userVoteIndex !== null && poll.userVoteIndex !== undefined);
  const optionImages = (poll.optionImages as (string | null)[] | null) || [];

  const endDate = new Date(new Date(poll.startDate).getTime() + poll.durationHours * 60 * 60 * 1000);
  const now = new Date();
  const isExpired = now > endDate;
  const timeRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60 * 24)));
  const hoursRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));
  
  const formatTimeRemaining = () => {
    const parts: string[] = [];
    if (daysRemaining > 0) parts.push(`${daysRemaining}d`);
    if (hoursRemaining > 0 || daysRemaining > 0) parts.push(`${hoursRemaining}h`);
    parts.push(`${minutesRemaining}m`);
    return parts.join(" ") + " left";
  };

  const [votePoll, { isLoading: isVoting }] = useVotePollMutation();

  const [rankingVotePoll, { isLoading: isRankingVoting }] = useRankingVotePollMutation();

  const handleVote = () => {
    if (selectedOption === null) {
      toast({ title: "Please select an option", variant: "destructive" });
      return;
    }
    votePoll({ pollId: String(poll.id), body: { optionIndex: selectedOption } })
      .unwrap()
      .then(() => {
        toast({ title: "Vote submitted!" });
      })
      .catch((error: any) => {
        toast({ 
          title: "Failed to vote", 
          description: error?.data?.message || error?.message || "An error occurred",
          variant: "destructive" 
        });
      });
  };

  const handleRankingVote = () => {
    if (selectedOrder.length !== options.length) {
      toast({ title: "Please rank all options", variant: "destructive" });
      return;
    }
    rankingVotePoll({ pollId: String(poll.id), body: { ranking: selectedOrder } })
      .unwrap()
      .then(() => {
        toast({ title: "Ranking submitted!" });
      })
      .catch((error: any) => {
        toast({ 
          title: "Failed to submit ranking", 
          description: error?.data?.message || error?.message || "An error occurred",
          variant: "destructive" 
        });
      });
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

  const voteCounts = poll.voteCounts || options.map(() => 0);
  const rankingScores = poll.rankingScores || options.map(() => 0);
  const actualVotes = poll.actualVotes || 0;
  const totalVotes = poll.totalVotes || 0;

  return (
    <Card className="overflow-hidden" data-testid={`poll-card-${poll.id}`}>
      {poll.imageUrl && (
        <div className="aspect-video relative overflow-hidden">
          <img 
            src={poll.imageUrl} 
            alt="" 
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg">{poll.title}</CardTitle>
          <div className="flex items-center gap-2">
            {isExpired ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Poll ended
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeRemaining()}
              </span>
            )}
            <Link href={`/polls/${poll.slug}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`link-poll-detail-${poll.id}`}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isExpired ? (
          isThisOrThatPoll ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {options.slice(0, 2).map((option, index) => {
                  const percentage = actualVotes > 0 
                    ? Math.round(((voteCounts[index] || 0) / actualVotes) * 100)
                    : 0;
                  const isUserVote = poll.userVoteIndex === index;
                  const isWinner = voteCounts[index] === Math.max(...voteCounts);
                  const optionImage = optionImages[index];

                  return (
                    <div 
                      key={index}
                      className={`relative rounded-md border overflow-hidden ${
                        isWinner ? "border-primary" : "border-border"
                      }`}
                    >
                      {optionImage && (
                        <div className="aspect-square w-full relative">
                          <img 
                            src={optionImage} 
                            alt={option}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{percentage}%</span>
                          </div>
                        </div>
                      )}
                      <div className="p-3 text-center">
                        <span className={`text-sm font-medium flex items-center justify-center gap-1 ${isWinner ? "text-primary" : ""}`}>
                          {isUserVote && <Check className="h-3 w-3 text-primary" />}
                          {option}
                        </span>
                        {!optionImage && (
                          <span className="text-lg font-bold block mt-1">{percentage}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
              </p>
            </div>
          ) : isRankingPoll ? (
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
                    <div key={originalIndex} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{rank + 1}</Badge>
                          {option}
                          {userRankedPosition && (
                            <span className="text-xs text-muted-foreground ml-1">(you: #{userRankedPosition})</span>
                          )}
                          {optionImage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-1"
                              onClick={() => setViewingImageUrl(optionImage)}
                              data-testid={`button-view-option-image-${poll.id}-${originalIndex}`}
                            >
                              <Image className="h-3 w-3" />
                            </Button>
                          )}
                        </span>
                        <span className="text-muted-foreground">{score} pts</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              <p className="text-xs text-muted-foreground text-center pt-2">
                {totalVotes} {totalVotes === 1 ? "ranking" : "rankings"}
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
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={isUserVote ? "font-medium flex items-center gap-1" : "flex items-center gap-1"}>
                        {isUserVote && <Check className="h-3 w-3 text-primary" />}
                        {option}
                        {optionImage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1"
                            onClick={() => setViewingImageUrl(optionImage)}
                            data-testid={`button-view-option-image-${poll.id}-${index}`}
                          >
                            <Image className="h-3 w-3" />
                          </Button>
                        )}
                      </span>
                      <span className="text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground text-center pt-2">
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
              </p>
            </div>
          )
        ) : hasVoted ? (
          isThisOrThatPoll ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {options.slice(0, 2).map((option, index) => {
                  const isUserVote = poll.userVoteIndex === index;
                  const optionImage = optionImages[index];
                  return (
                    <div 
                      key={index}
                      className={`relative rounded-md border overflow-hidden ${
                        isUserVote ? "border-primary bg-primary/10" : "border-border opacity-50"
                      }`}
                    >
                      {optionImage && (
                        <div className="aspect-square w-full relative">
                          <img 
                            src={optionImage} 
                            alt={option}
                            className={`w-full h-full object-cover ${isUserVote ? "opacity-90" : ""}`}
                          />
                          {isUserVote && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-5 w-5 text-primary bg-background/80 rounded-full p-0.5" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`p-3 text-center ${optionImage ? "" : "py-8"} ${isUserVote ? "bg-primary/10" : ""}`}>
                        <span className={`text-sm font-medium flex items-center justify-center gap-1 ${isUserVote ? "text-primary" : ""}`}>
                          {isUserVote && !optionImage && <Check className="h-4 w-4 text-primary" />}
                          {option}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You voted! Results will be shown when the poll ends.
              </p>
            </div>
          ) : isRankingPoll ? (
            <div className="space-y-3">
              {poll.userRanking && poll.userRanking.map((optionIndex, position) => {
                const optionImage = optionImages[optionIndex];
                return (
                  <div 
                    key={optionIndex} 
                    className="p-3 rounded-md border border-primary bg-primary/10 flex items-center gap-2"
                  >
                    <Badge variant="outline">{position + 1}</Badge>
                    <span className="font-medium flex items-center gap-1">
                      {options[optionIndex]}
                      {optionImage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1"
                          onClick={() => setViewingImageUrl(optionImage)}
                          data-testid={`button-view-option-image-${poll.id}-${optionIndex}`}
                        >
                          <Image className="h-3 w-3" />
                        </Button>
                      )}
                    </span>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground text-center pt-2">
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
                    className={`p-3 rounded-md border ${isUserVote ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    <span className={isUserVote ? "font-medium flex items-center gap-1" : "text-muted-foreground flex items-center gap-1"}>
                      {isUserVote && <Check className="h-4 w-4 text-primary" />}
                      {option}
                      {optionImage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1"
                          onClick={() => setViewingImageUrl(optionImage)}
                          data-testid={`button-view-option-image-${poll.id}-${index}`}
                        >
                          <Image className="h-3 w-3" />
                        </Button>
                      )}
                    </span>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground text-center pt-2">
                You voted! Results will be shown when the poll ends.
              </p>
            </div>
          )
        ) : isThisOrThatPoll ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {options.slice(0, 2).map((option, index) => {
                const optionImage = optionImages[index];
                return (
                  <div 
                    key={index}
                    className={`relative rounded-md border overflow-hidden cursor-pointer transition-all ${
                      selectedOption === index 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => setSelectedOption(index)}
                    data-testid={`this-or-that-option-${poll.id}-${index}`}
                  >
                    {optionImage && (
                      <div className="aspect-square w-full">
                        <img 
                          src={optionImage} 
                          alt={option}
                          className={`w-full h-full object-cover ${selectedOption === index ? "opacity-90" : ""}`}
                        />
                      </div>
                    )}
                    <div className={`p-3 text-center ${optionImage ? "" : "py-8"} ${selectedOption === index ? "bg-primary/10" : ""}`}>
                      <span className={`text-sm font-medium ${selectedOption === index ? "text-primary" : ""}`}>
                        {option}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {isAuthenticated ? (
              <Button 
                className="w-full" 
                onClick={handleVote}
                disabled={selectedOption === null || isVoting}
                data-testid={`button-vote-${poll.id}`}
              >
                {isVoting ? "Voting..." : "Submit Vote"}
              </Button>
            ) : (
              <Link href="/signin">
                <Button variant="secondary" className="w-full" data-testid="button-signin-to-vote">
                  Sign in to vote
                </Button>
              </Link>
            )}
          </div>
        ) : isRankingPoll ? (
          <div className="space-y-3">
            {selectedOrder.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetRanking}
                  className="h-7 text-xs"
                  data-testid={`button-reset-ranking-${poll.id}`}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            )}
            {options.map((option, index) => {
              const optionImage = optionImages[index];
              const rankPosition = selectedOrder.indexOf(index);
              const isSelected = rankPosition !== -1;
              return (
                <div key={index} className="flex gap-1">
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="flex-1 justify-start gap-2"
                    onClick={() => handleOptionClick(index)}
                    data-testid={`ranking-option-${poll.id}-${index}`}
                  >
                    {isSelected && (
                      <Badge variant="secondary" className="text-xs">
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
                      data-testid={`button-view-option-image-${poll.id}-${index}`}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
            {isAuthenticated ? (
              <Button 
                className="w-full mt-2" 
                onClick={handleRankingVote}
                disabled={selectedOrder.length !== options.length || isRankingVoting}
                data-testid={`button-submit-ranking-${poll.id}`}
              >
                {isRankingVoting 
                  ? "Submitting..." 
                  : selectedOrder.length === options.length 
                    ? "Submit Ranking" 
                    : `Select ${options.length - selectedOrder.length} more`}
              </Button>
            ) : (
              <Link href="/signin">
                <Button variant="secondary" className="w-full mt-2" data-testid="button-signin-to-rank">
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
                <div key={index} className="flex gap-1">
                  <Button
                    variant={selectedOption === index ? "default" : "outline"}
                    className="flex-1 justify-start"
                    onClick={() => setSelectedOption(index)}
                    data-testid={`poll-option-${poll.id}-${index}`}
                  >
                    {option}
                  </Button>
                  {optionImage && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewingImageUrl(optionImage)}
                      data-testid={`button-view-option-image-${poll.id}-${index}`}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
            {isAuthenticated ? (
              <Button 
                className="w-full mt-2" 
                onClick={handleVote}
                disabled={selectedOption === null || isVoting}
                data-testid={`button-vote-${poll.id}`}
              >
                {isVoting ? "Voting..." : "Submit Vote"}
              </Button>
            ) : (
              <Link href="/signin">
                <Button variant="secondary" className="w-full mt-2" data-testid="button-signin-to-vote">
                  Sign in to vote
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
