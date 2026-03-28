"use client";

import Link from "@/components/tenant-link";
import {
  useGetPodcastsQuery,
  useGetPodcastLikesQuery,
  useGetPodcastLikedQuery,
  useGetPodcastCommentsQuery,
  useLikePodcastMutation,
} from "@/store/api";
import { SEO } from "@/components/seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, Headphones, Play, Heart, MessageCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Podcast } from "@shared/schema";

function PodcastCard({ podcast }: { podcast: Podcast }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: likesData } = useGetPodcastLikesQuery(String(podcast.id), { skip: !podcast.id });

  const { data: likedData } = useGetPodcastLikedQuery(String(podcast.id), { skip: !podcast.id || !user });

  const { data: commentsData } = useGetPodcastCommentsQuery(String(podcast.id), { skip: !podcast.id });

  const [likePodcastTrigger, { isLoading: likeLoading }] = useLikePodcastMutation();

  const likeMutation = {
    mutate: () => {
      likePodcastTrigger(String(podcast.id)).unwrap()
        .catch(() => { toast({ title: "Please sign in to like podcasts", variant: "destructive" }); });
    },
    isPending: likeLoading,
  };

  const likesCount = likesData?.count || 0;
  const commentsCount = commentsData?.length || 0;
  const isLiked = likedData?.liked || false;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in to like podcasts", variant: "destructive" });
      return;
    }
    likeMutation.mutate();
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (podcast.mediaUrl) {
      e.preventDefault();
      e.stopPropagation();
      window.open(podcast.mediaUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Link href={`/podcasts/${podcast.slug}`}>
      <Card
        className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer h-full group"
        data-testid={`card-podcast-${podcast.id}`}
      >
        {podcast.heroImageUrl ? (
          <div className="relative aspect-video overflow-hidden" onClick={handleImageClick}>
            <img
              src={podcast.heroImageUrl}
              alt={podcast.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-12 w-12 text-white" />
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Headphones className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {podcast.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {podcast.excerpt}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {podcast.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(podcast.publishedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 px-2 ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLikeClick}
                disabled={likeMutation.isPending}
                data-testid={`button-like-podcast-${podcast.id}`}
              >
                <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {commentsCount}
              </span>
            </div>
            <span className="text-primary flex items-center gap-1 font-medium">
              Read more <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PodcastCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <div className="aspect-video bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function PodcastsPage() {
  const { data: podcasts, isLoading } = useGetPodcastsQuery();

  return (
    <>
      <SEO
        title="Podcasts"
        description="Listen to the latest podcasts and live streams."
      />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-podcasts-title">Podcasts</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PodcastCardSkeleton key={i} />
            ))}
          </div>
        ) : podcasts && podcasts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Headphones className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No podcasts yet</h2>
            <p className="text-muted-foreground">Check back soon for new episodes and live streams.</p>
          </div>
        )}
      </div>
    </>
  );
}
