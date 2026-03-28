"use client";

import { useParams } from "next/navigation";
import Link from "@/components/tenant-link";
import { tenantHref } from "@/lib/tenant-link";
import { useState, useEffect } from "react";
import {
  useGetArticleBySlugQuery,
  useGetArticleCommentsQuery,
  useGetArticleSectionsQuery,
  useGetArticleLikesQuery,
  useGetArticleLikedQuery,
  useLikeArticleMutation,
  useCreateArticleCommentMutation,
  useDeleteArticleCommentMutation,
} from "@/store/api";
import { apiRequest } from "@/lib/queryClient";
import type { Article } from "@shared/schema";
import { ArrowLeft, Clock, User, Calendar, Heart, MessageCircle, Send, Trash2, Reply, Pencil, X, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import MuxPlayer from "@mux/mux-player-react";
import { SEO } from "@/components/seo";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";
import { useToast } from "@/hooks/use-toast";
import { ShareButtons } from "@/components/share-buttons";

interface CommentWithAuthor {
  id: string;
  articleId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  edited: boolean;
  authorName: string;
  authorProfileImageUrl: string | null;
}

interface ArticleSection {
  id: string;
  articleId: string;
  orderIndex: number;
  sectionType: "text" | "image" | "gallery" | "video";
  muxPlaybackId?: string | null;
  muxAssetId?: string | null;
  heading: string | null;
  content: string | null;
  mediaUrls: string[];
  mediaCaptions: string[];
}

function canEditComment(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return now - created < fiveMinutes;
}

function getTimeRemaining(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return Math.max(0, Math.floor((fiveMinutes - (now - created)) / 1000));
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  articleId: string;
  currentUserId?: string;
  isAuthenticated: boolean;
  onReply: (parentId: string) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  getReplies: (parentId: string) => CommentWithAuthor[];
}

function CommentItem({ comment, articleId, currentUserId, isAuthenticated, onReply, replyingTo, onCancelReply, getReplies }: CommentItemProps) {
  const replies = getReplies(comment.id);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");
  const [editTimeRemaining, setEditTimeRemaining] = useState(getTimeRemaining(comment.createdAt));

  useEffect(() => {
    if (!currentUserId || comment.userId !== currentUserId) return;
    const interval = setInterval(() => {
      setEditTimeRemaining(getTimeRemaining(comment.createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [comment.createdAt, currentUserId, comment.userId]);

  const isRemoved = comment.content === "This post has been removed";
  const showEditButton = !isRemoved && currentUserId === comment.userId && editTimeRemaining > 0;

  const [editCommentIsLoading, setEditCommentIsLoading] = useState(false);

  const handleEditComment = async ({ id, content }: { id: string; content: string }) => {
    setEditCommentIsLoading(true);
    try {
      await apiRequest("PATCH", `/api/comments/${id}`, { content });
      setIsEditing(false);
      toast({ title: "Comment updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update comment", variant: "destructive" });
    } finally {
      setEditCommentIsLoading(false);
    }
  };

  const [deleteComment, { isLoading: deleteCommentLoading }] = useDeleteArticleCommentMutation();

  const [addReply, { isLoading: addReplyLoading }] = useCreateArticleCommentMutation();

  const handleEditSubmit = () => {
    if (!editContent.trim()) return;
    handleEditComment({ id: comment.id, content: editContent.trim() });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    addReply({ articleId, body: { content: replyContent.trim(), parentCommentId: comment.id } })
      .unwrap()
      .then(() => {
        setReplyContent("");
        onCancelReply();
        toast({ title: "Reply posted!" });
      })
      .catch((error: any) => {
        toast({ title: "Error", description: error?.data?.message || "Failed to post reply", variant: "destructive" });
      });
  };

  const formatEditTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <Card data-testid={`card-comment-${comment.id}`}>
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              {comment.authorProfileImageUrl ? (
                <AvatarImage src={comment.authorProfileImageUrl} alt={comment.authorName} />
              ) : null}
              <AvatarFallback>
                {comment.authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-medium" data-testid={`text-comment-author-${comment.id}`}>
                  {comment.authorName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
                {comment.edited && (
                  <Badge variant="outline" className="text-xs">
                    Edited
                  </Badge>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-20"
                    data-testid={`input-edit-comment-${comment.id}`}
                  />
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleEditSubmit} 
                      disabled={editCommentIsLoading}
                      data-testid={`button-save-edit-${comment.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                      data-testid={`button-cancel-edit-${comment.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={`text-foreground ${isRemoved ? "italic text-muted-foreground" : ""}`} data-testid={`text-comment-content-${comment.id}`}>
                  {comment.content}
                </p>
              )}
            </div>
            {!isEditing && !isRemoved && (
              <div className="flex items-center gap-1">
                {showEditButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    title={`Edit (${formatEditTime(editTimeRemaining)} remaining)`}
                    data-testid={`button-edit-comment-${comment.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {isAuthenticated && !isRemoved && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onReply(comment.id)}
                    data-testid={`button-reply-comment-${comment.id}`}
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                )}
                {currentUserId === comment.userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      deleteComment({ articleId, commentId: Number(comment.id) })
                        .unwrap()
                        .then(() => toast({ title: "Comment deleted" }));
                    }}
                    disabled={deleteCommentLoading}
                    data-testid={`button-delete-comment-${comment.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {showEditButton && !isEditing && (
            <p className="text-xs text-muted-foreground mt-2">
              Edit window: {formatEditTime(editTimeRemaining)}
            </p>
          )}
        </CardContent>
      </Card>

      {replyingTo === comment.id && (
        <div className="ml-8">
          <form onSubmit={handleReplySubmit} className="space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.authorName}...`}
              className="min-h-20"
              data-testid={`input-reply-${comment.id}`}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={addReplyLoading || !replyContent.trim()} data-testid={`button-submit-reply-${comment.id}`}>
                <Send className="h-4 w-4 mr-1" />
                {addReplyLoading ? "Posting..." : "Reply"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onCancelReply} data-testid={`button-cancel-reply-${comment.id}`}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-8 space-y-3 border-l-2 border-muted pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              articleId={articleId}
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
              onReply={onReply}
              replyingTo={replyingTo}
              onCancelReply={onCancelReply}
              getReplies={getReplies}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleSectionRenderer({ section, articleTitle }: { section: ArticleSection; articleTitle: string }) {
  const [sectionCarouselApi, setSectionCarouselApi] = useState<CarouselApi>();
  const [sectionSlide, setSectionSlide] = useState(0);
  const [sectionSlideCount, setSectionSlideCount] = useState(0);
  const [sectionPlaying, setSectionPlaying] = useState(true);

  useEffect(() => {
    if (!sectionCarouselApi) return;
    setSectionSlideCount(sectionCarouselApi.scrollSnapList().length);
    setSectionSlide(sectionCarouselApi.selectedScrollSnap());
    sectionCarouselApi.on("select", () => {
      setSectionSlide(sectionCarouselApi.selectedScrollSnap());
    });
  }, [sectionCarouselApi]);

  if (section.sectionType === "text") {
    return (
      <div className="space-y-2" data-testid={`section-text-${section.id}`}>
        {section.heading && (
          <h2 className="text-xl font-semibold">{section.heading}</h2>
        )}
        {section.content && (
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        )}
      </div>
    );
  }

  if (section.sectionType === "image" && section.mediaUrls.length > 0) {
    const caption = section.mediaCaptions?.[0] || section.heading;
    return (
      <div data-testid={`section-image-${section.id}`}>
        <div className="rounded-lg overflow-hidden">
          <img
            src={section.mediaUrls[0]}
            alt={caption || articleTitle}
            className="w-full h-auto object-cover"
          />
        </div>
        {caption && (
          <p className="text-sm text-muted-foreground mt-2 italic text-center">{caption}</p>
        )}
      </div>
    );
  }

  if (section.sectionType === "gallery" && section.mediaUrls.length > 0) {
    const currentCaption = section.mediaCaptions?.[sectionSlide];
    return (
      <div className="space-y-2" data-testid={`section-gallery-${section.id}`}>
        {section.heading && (
          <h2 className="text-xl font-semibold">{section.heading}</h2>
        )}
        <div className="relative rounded-lg overflow-hidden">
          <Carousel 
            className="w-full" 
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
            setApi={setSectionCarouselApi}
          >
            <CarouselContent>
              {section.mediaUrls.map((url, index) => (
                <CarouselItem key={index}>
                  <img
                    src={url}
                    alt={section.mediaCaptions?.[index] || `${section.heading || articleTitle} - Image ${index + 1}`}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
        {currentCaption && (
          <p className="text-sm text-muted-foreground italic text-center">{currentCaption}</p>
        )}
        {section.mediaUrls.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => sectionCarouselApi?.scrollPrev()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: sectionSlideCount }).map((_, index) => (
                <button
                  key={index}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    index === sectionSlide 
                      ? "bg-primary" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  onClick={() => sectionCarouselApi?.scrollTo(index)}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => sectionCarouselApi?.scrollNext()}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const autoplayPlugin = sectionCarouselApi?.plugins()?.autoplay;
                if (autoplayPlugin) {
                  if (sectionPlaying) {
                    (autoplayPlugin as any).stop();
                  } else {
                    (autoplayPlugin as any).play();
                  }
                  setSectionPlaying(!sectionPlaying);
                }
              }}
            >
              {sectionPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (section.sectionType === "video" && section.muxPlaybackId) {
    return (
      <div className="space-y-2" data-testid={`section-video-${section.id}`}>
        {section.heading && (
          <h2 className="text-xl font-semibold">{section.heading}</h2>
        )}
        <div className="rounded-lg overflow-hidden">
          <MuxPlayer
            playbackId={section.muxPlaybackId}
            streamType="on-demand"
            accentColor="#16a34a"
            style={{ aspectRatio: "16/9", width: "100%" }}
          />
        </div>
      </div>
    );
  }

  return null;
}

export default function ArticleDetail() {
  const params = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);
  
  const { data: article, isLoading, error } = useGetArticleBySlugQuery(params.slug as string, { skip: !params.slug });

  const { data: comments = [] } = useGetArticleCommentsQuery(article?.id as string, { skip: !article?.id });

  const { data: sections = [] } = useGetArticleSectionsQuery(article?.id as string, { skip: !article?.id });

  const { data: likesData } = useGetArticleLikesQuery(article?.id as string, { skip: !article?.id });

  const { data: likedData } = useGetArticleLikedQuery(article?.id as string, { skip: !article?.id || !isAuthenticated });

  const [likeArticle, { isLoading: likeLoading }] = useLikeArticleMutation();

  const [addComment, { isLoading: addCommentLoading }] = useCreateArticleCommentMutation();

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment({ articleId: article!.id, body: { content: commentText.trim() } })
      .unwrap()
      .then(() => {
        setCommentText("");
        toast({ title: "Comment posted!" });
      })
      .catch((error: any) => {
        toast({ title: "Error", description: error?.data?.message || "Failed to post comment", variant: "destructive" });
      });
  };

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      window.location.href = tenantHref("/signin");
      return;
    }
    likeArticle(article!.id)
      .unwrap()
      .catch(() => {
        toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
      });
  };

  const topLevelComments = comments.filter((c: CommentWithAuthor) => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter((c: CommentWithAuthor) => c.parentCommentId === parentId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-64 w-full mb-8 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The article you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/articles">
          <Button data-testid="button-back-articles">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <FeatureGate feature="featureEditorial" featureName="Articles">
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <SEO 
          title={article.title}
          description={article.excerpt}
          canonicalUrl={`/articles/${article.slug}`}
        ogType="article"
        ogImage={article.heroImageUrl}
      />
      <Link href="/articles">
        <Button variant="ghost" className="mb-6" data-testid="button-back-articles">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Button>
      </Link>

      <Badge variant="secondary" className="mb-4" data-testid={`badge-category-${article.slug}`}>
        {article.category}
      </Badge>

      <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-article-title">
        {article.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span data-testid="text-article-author">{article.author}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span data-testid="text-article-date">{formatDate(article.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span data-testid="text-article-reading-time">{article.readingTime} min read</span>
        </div>
      </div>

      <div className="mb-8">
        {article.imageUrls && (article.imageUrls as string[]).length > 0 ? (
          <>
            <div className="relative rounded-lg overflow-hidden">
              <Carousel 
                className="w-full" 
                opts={{ loop: true }}
                plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
                setApi={setCarouselApi}
              >
                <CarouselContent>
                  <CarouselItem>
                    <img
                      src={article.heroImageUrl}
                      alt={article.title}
                      className="w-full h-64 md:h-96 object-cover"
                      data-testid="img-article-hero"
                    />
                  </CarouselItem>
                  {(article.imageUrls as string[]).map((url, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={url}
                        alt={`${article.title} - Image ${index + 1}`}
                        className="w-full h-64 md:h-96 object-cover"
                        data-testid={`img-article-gallery-${index}`}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => carouselApi?.scrollPrev()}
                data-testid="button-carousel-prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: slideCount }).map((_, index) => (
                  <button
                    key={index}
                    className={`h-3 w-3 rounded-full transition-colors ${
                      index === currentSlide 
                        ? "bg-primary" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    onClick={() => carouselApi?.scrollTo(index)}
                    data-testid={`button-carousel-dot-${index}`}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => carouselApi?.scrollNext()}
                data-testid="button-carousel-next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const autoplayPlugin = carouselApi?.plugins()?.autoplay;
                  if (autoplayPlugin) {
                    if (isPlaying) {
                      (autoplayPlugin as any).stop();
                    } else {
                      (autoplayPlugin as any).play();
                    }
                    setIsPlaying(!isPlaying);
                  }
                }}
                data-testid="button-carousel-pause"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={article.heroImageUrl}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover"
              data-testid="img-article-hero"
            />
          </div>
        )}
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none" data-testid="text-article-content">
        <p className="text-lg text-muted-foreground mb-6">{article.excerpt}</p>
        {sections.length > 0 ? (
          <div className="space-y-4">
            {sections.sort((a: ArticleSection, b: ArticleSection) => a.orderIndex - b.orderIndex).map((section: ArticleSection) => (
              <ArticleSectionRenderer key={section.id} section={section} articleTitle={article.title} />
            ))}
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        )}
      </div>

      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Button
            variant={likedData?.liked ? "default" : "outline"}
            onClick={handleLikeClick}
            disabled={likeLoading}
            data-testid="button-like-article"
          >
            <Heart className={`h-4 w-4 mr-2 ${likedData?.liked ? "fill-current" : ""}`} />
            {likesData?.count || 0} {likesData?.count === 1 ? "Like" : "Likes"}
          </Button>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</span>
          </div>
          <div className="ml-auto">
            <ShareButtons 
              title={article.title} 
              url={`/articles/${article.slug}`}
              description={article.excerpt}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Comments</h3>
          
          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="min-h-24"
                data-testid="input-comment"
              />
              <Button type="submit" disabled={addCommentLoading || !commentText.trim()} data-testid="button-submit-comment">
                <Send className="h-4 w-4 mr-2" />
                {addCommentLoading ? "Posting..." : "Post Comment"}
              </Button>
            </form>
          ) : (
            <Card>
              <CardContent className="py-4">
                <p className="text-muted-foreground">
                  <a href="/signin" className="text-primary hover:underline" data-testid="link-signin-comment">
                      Sign in
                    </a>{" "}
                  to join the conversation.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {topLevelComments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              topLevelComments.map((comment: CommentWithAuthor) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  articleId={article.id}
                  currentUserId={user?.id}
                  isAuthenticated={isAuthenticated}
                  onReply={(parentId) => setReplyingTo(parentId)}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  getReplies={getReplies}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t">
        <Link href="/articles">
          <Button variant="outline" data-testid="button-more-articles">
            Read More Articles
          </Button>
        </Link>
      </div>
      </article>
    </FeatureGate>
  );
}
