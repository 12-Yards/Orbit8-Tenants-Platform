"use client";

import Link from "@/components/tenant-link";
import { Clock, ArrowRight, Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetArticleLikesQuery, useGetArticleLikedQuery, useGetArticleCommentsQuery, useLikeArticleMutation } from "@/store/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: likesData } = useGetArticleLikesQuery(String(article.id));

  const { data: likedData } = useGetArticleLikedQuery(String(article.id), { skip: !user });

  const { data: commentsData } = useGetArticleCommentsQuery(String(article.id));

  const [likeArticle, { isLoading: isLiking }] = useLikeArticleMutation();

  const likesCount = likesData?.count || 0;
  const commentsCount = commentsData?.length || 0;
  const isLiked = likedData?.liked || false;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in to like articles", variant: "destructive" });
      return;
    }
    likeArticle(String(article.id)).unwrap().catch(() => {
      toast({ title: "Please sign in to like articles", variant: "destructive" });
    });
  };

  return (
    <Link href={`/articles/${article.slug}`}>
      <Card
        className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer h-full"
        data-testid={`card-article-${article.id}`}
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={article.heroImageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {article.category}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readingTime} min read
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 px-2 ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLikeClick}
                disabled={isLiking}
                data-testid={`button-like-article-${article.id}`}
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

export function ArticleCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <div className="aspect-video bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-6 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
