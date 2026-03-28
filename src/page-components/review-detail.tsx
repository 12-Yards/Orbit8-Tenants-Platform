// @ts-nocheck
"use client";

import { useParams } from "next/navigation";
import Link from "@/components/tenant-link";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, ThumbsUp, ThumbsDown, User, MapPin, Heart, MessageCircle, Send, Pencil, Trash2, CornerDownRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";
import { useToast } from "@/hooks/use-toast";
import type { MemberReview, ReviewComment } from "@shared/schema";
import {
  useGetReviewBySlugQuery,
  useGetReviewLikesQuery,
  useGetReviewLikedQuery,
  useGetReviewCommentsQuery,
  useLikeReviewMutation,
  useCreateReviewCommentMutation,
  useUpdateReviewCommentMutation,
  useDeleteReviewCommentMutation,
} from "@/store/api";

interface ReviewWithAuthor extends MemberReview {
  authorName: string;
  authorProfileImageUrl: string | null;
}

interface CommentWithAuthor extends ReviewComment {
  authorName: string;
  authorProfileImageUrl: string | null;
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Restaurant":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "Bar":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "Accommodation":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "Attraction":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "";
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function CommentItem({ 
  comment, 
  allComments, 
  reviewId, 
  userId, 
  onReply 
}: { 
  comment: CommentWithAuthor; 
  allComments: CommentWithAuthor[];
  reviewId: string;
  userId?: string;
  onReply: (parentId: string) => void;
}) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  
  const replies = allComments.filter(c => c.parentCommentId === comment.id);
  const createdAt = comment.createdAt ? new Date(comment.createdAt) : new Date();
  const canEdit = comment.userId === userId && (Date.now() - createdAt.getTime()) < 5 * 60 * 1000;
  const canDelete = comment.userId === userId;

  const [triggerUpdate, { isLoading: updateLoading }] = useUpdateReviewCommentMutation();
  const [triggerDelete, { isLoading: deleteLoading }] = useDeleteReviewCommentMutation();

  const handleUpdate = () => {
    triggerUpdate({ reviewId, commentId: comment.id, body: { content: editContent } })
      .unwrap()
      .then(() => {
        setIsEditing(false);
        toast({ description: "Comment updated" });
      })
      .catch(() => {
        toast({ variant: "destructive", description: "Failed to update comment" });
      });
  };

  const handleDelete = () => {
    triggerDelete({ reviewId, commentId: comment.id })
      .unwrap()
      .then(() => {
        toast({ description: "Comment deleted" });
      })
      .catch(() => {
        toast({ variant: "destructive", description: "Failed to delete comment" });
      });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.authorProfileImageUrl || undefined} />
          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </span>
            {comment.edited && <span className="text-xs text-muted-foreground">(edited)</span>}
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate} disabled={updateLoading}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditContent(comment.content); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1">{comment.content}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            {userId && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => onReply(comment.id)}
              >
                <CornerDownRight className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            {canEdit && !isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {replies.length > 0 && (
        <div className="ml-8 pl-4 border-l space-y-3">
          {replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              allComments={allComments}
              reviewId={reviewId}
              userId={userId}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: review, isLoading, error } = useGetReviewBySlugQuery(slug!, { skip: !slug }) as { data: ReviewWithAuthor | undefined; isLoading: boolean; error: any };

  const { data: likesData } = useGetReviewLikesQuery(review?.id!, { skip: !review?.id }) as { data: { count: number } | undefined; isLoading: boolean; error: any };

  const { data: likedData } = useGetReviewLikedQuery(review?.id!, { skip: !review?.id || !isAuthenticated }) as { data: { liked: boolean } | undefined; isLoading: boolean; error: any };

  const { data: commentsData } = useGetReviewCommentsQuery(review?.id!, { skip: !review?.id }) as { data: CommentWithAuthor[] | undefined; isLoading: boolean; error: any };

  const [triggerLike, { isLoading: likeLoading }] = useLikeReviewMutation();
  const [triggerAddComment, { isLoading: addCommentLoading }] = useCreateReviewCommentMutation();

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      toast({ description: "Please sign in to like reviews" });
      return;
    }
    triggerLike(review?.id!)
      .unwrap()
      .catch(() => {
        toast({ variant: "destructive", description: "Failed to like review" });
      });
  };

  const handleCommentSubmit = () => {
    if (!commentContent.trim()) return;
    triggerAddComment({ reviewId: review?.id!, body: { content: commentContent.trim() } })
      .unwrap()
      .then(() => {
        setCommentContent("");
        toast({ description: "Comment added" });
      })
      .catch(() => {
        toast({ variant: "destructive", description: "Failed to add comment" });
      });
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim() || !replyingTo) return;
    triggerAddComment({ reviewId: review?.id!, body: { content: replyContent.trim(), parentCommentId: replyingTo } })
      .unwrap()
      .then(() => {
        setReplyContent("");
        setReplyingTo(null);
        toast({ description: "Comment added" });
      })
      .catch(() => {
        toast({ variant: "destructive", description: "Failed to add comment" });
      });
  };

  const topLevelComments = commentsData?.filter(c => !c.parentCommentId) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Loading Review" />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 w-full bg-muted rounded-lg" />
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
            <div className="h-32 w-full bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Review Not Found" />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Review not found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This review may have been removed or doesn't exist.
              </p>
              <Link href="/reviews">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Reviews
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const seoTitle = `${review.title} - ${review.placeName} | Reviews`;
  const seoDescription = review.summary.substring(0, 160);

  return (
      <div className="min-h-screen bg-background">
        <SEO 
          title={seoTitle}
          description={seoDescription}
        ogType="article"
        ogImage={review.imageUrl || undefined}
      />
      
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/reviews">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-reviews">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>
        </Link>

        <article>
          {review.imageUrl && (
            <img 
              src={review.imageUrl} 
              alt={review.placeName}
              className="w-full aspect-[16/9] object-cover rounded-lg mb-6"
              data-testid="img-review-hero"
            />
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={getCategoryColor(review.category)} data-testid="badge-review-category">
              {review.category}
            </Badge>
            <StarRating rating={review.rating} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-review-title">
            {review.title}
          </h1>
          
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <MapPin className="h-4 w-4" />
            <span className="font-medium" data-testid="text-review-place">{review.placeName}</span>
          </div>

          <div className="flex items-center gap-3 pb-6 border-b mb-6">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.authorProfileImageUrl || undefined} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm" data-testid="text-review-author">{review.authorName}</p>
              <p className="text-xs text-muted-foreground">
                {review.createdAt && format(new Date(review.createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-base leading-relaxed" data-testid="text-review-summary">
              {review.summary}
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium mb-3">
                    <ThumbsUp className="h-5 w-5" />
                    What I liked
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-review-liked">
                    {review.liked}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium mb-3">
                    <ThumbsDown className="h-5 w-5" />
                    Could be improved
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-review-disliked">
                    {review.disliked}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Button
                variant={likedData?.liked ? "default" : "outline"}
                onClick={handleLikeClick}
                disabled={likeLoading}
                data-testid="button-like-review"
              >
                <Heart className={`h-4 w-4 mr-2 ${likedData?.liked ? "fill-current" : ""}`} />
                {likedData?.liked ? "Liked" : "Like"} ({likesData?.count || 0})
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{commentsData?.length || 0} comments</span>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Comments</h3>
              
              {isAuthenticated ? (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="min-h-[80px] mb-2"
                      data-testid="input-comment"
                    />
                    <Button 
                      onClick={handleCommentSubmit}
                      disabled={!commentContent.trim() || addCommentLoading}
                      data-testid="button-submit-comment"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-4 text-center text-muted-foreground">
                    <Link href="/auth">
                      <Button variant="outline">Sign in to comment</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {replyingTo && (
                <Card className="ml-8">
                  <CardContent className="py-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[60px] mb-2"
                          autoFocus
                          data-testid="input-reply"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={handleReplySubmit}
                            disabled={!replyContent.trim() || addCommentLoading}
                            data-testid="button-submit-reply"
                          >
                            Reply
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {topLevelComments.length > 0 ? (
                  topLevelComments.map(comment => (
                    <CommentItem 
                      key={comment.id} 
                      comment={comment} 
                      allComments={commentsData || []}
                      reviewId={review.id}
                      userId={user?.id}
                      onReply={(parentId) => { setReplyingTo(parentId); setReplyContent(""); }}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </div>
          </div>
        </article>
        </div>
      </div>
  );
}
