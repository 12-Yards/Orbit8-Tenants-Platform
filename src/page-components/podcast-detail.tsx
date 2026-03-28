"use client";

import { useParams } from "next/navigation";
import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import {
  useGetPodcastBySlugQuery,
  useGetPodcastCommentsQuery,
  useGetPodcastLikesQuery,
  useGetPodcastLikedQuery,
  useLikePodcastMutation,
  useCreatePodcastCommentMutation,
  useDeletePodcastCommentMutation,
} from "@/store/api";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, User, Headphones, ExternalLink, Heart, MessageCircle, Send, Trash2, Reply, Pencil, X, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShareButtons } from "@/components/share-buttons";
import type { Podcast } from "@shared/schema";

interface CommentWithAuthor {
  id: string;
  podcastId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  edited: boolean;
  authorName: string;
  authorProfileImageUrl: string | null;
}

function isYouTubeUrl(url: string) {
  return /youtube\.com\/watch|youtu\.be\/|youtube\.com\/embed/.test(url);
}

function getYouTubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function isSpotifyUrl(url: string) {
  return /open\.spotify\.com/.test(url);
}

function getSpotifyEmbedUrl(url: string) {
  return url.replace("open.spotify.com/", "open.spotify.com/embed/");
}

function MediaEmbed({ url }: { url: string }) {
  if (!url) return null;

  if (isYouTubeUrl(url)) {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (embedUrl) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            title="YouTube video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid="youtube-embed"
          />
        </div>
      );
    }
  }

  if (isSpotifyUrl(url)) {
    const embedUrl = getSpotifyEmbedUrl(url);
    return (
      <div className="rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg"
          data-testid="spotify-embed"
        />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline font-medium" data-testid="link-media-external">
      <Headphones className="h-4 w-4" /> Listen / Watch <ExternalLink className="h-3 w-3" />
    </a>
  );
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

interface PodcastCommentItemProps {
  comment: CommentWithAuthor;
  podcastId: string;
  currentUserId?: string;
  isAuthenticated: boolean;
  onReply: (parentId: string) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  getReplies: (parentId: string) => CommentWithAuthor[];
}

function PodcastCommentItem({ comment, podcastId, currentUserId, isAuthenticated, onReply, replyingTo, onCancelReply, getReplies }: PodcastCommentItemProps) {
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

  const editComment = {
    mutate: ({ id, content }: { id: string; content: string }) => {
      apiRequest("PATCH", `/api/podcast-comments/${id}`, { content })
        .then(() => {
          setIsEditing(false);
          toast({ title: "Comment updated" });
        })
        .catch((error: any) => {
          toast({ title: "Error", description: error.message || "Failed to update comment", variant: "destructive" });
        });
    },
    isPending: false,
  };

  const [deleteCommentTrigger, { isLoading: deleteLoading }] = useDeletePodcastCommentMutation();
  const deleteComment = {
    mutate: (commentId: string) => {
      deleteCommentTrigger({ podcastId, commentId: parseInt(commentId) }).unwrap()
        .then(() => { toast({ title: "Comment deleted" }); })
        .catch(() => {});
    },
    isPending: deleteLoading,
  };

  const [addReplyTrigger, { isLoading: replyLoading }] = useCreatePodcastCommentMutation();
  const addReply = {
    mutate: ({ content, parentCommentId }: { content: string; parentCommentId: string }) => {
      addReplyTrigger({ podcastId, body: { content, parentCommentId } }).unwrap()
        .then(() => {
          setReplyContent("");
          onCancelReply();
          toast({ title: "Reply posted!" });
        })
        .catch((error: any) => {
          toast({ title: "Error", description: error.message || "Failed to post reply", variant: "destructive" });
        });
    },
    isPending: replyLoading,
  };

  const handleEditSubmit = () => {
    if (!editContent.trim()) return;
    editComment.mutate({ id: comment.id, content: editContent.trim() });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    addReply.mutate({ content: replyContent.trim(), parentCommentId: comment.id });
  };

  const formatEditTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <Card data-testid={`card-podcast-comment-${comment.id}`}>
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
                <span className="font-medium" data-testid={`text-podcast-comment-author-${comment.id}`}>
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
                    data-testid={`input-edit-podcast-comment-${comment.id}`}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleEditSubmit}
                      disabled={editComment.isPending}
                      data-testid={`button-save-edit-podcast-${comment.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                      data-testid={`button-cancel-edit-podcast-${comment.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={`text-foreground ${isRemoved ? "italic text-muted-foreground" : ""}`} data-testid={`text-podcast-comment-content-${comment.id}`}>
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
                    data-testid={`button-edit-podcast-comment-${comment.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {isAuthenticated && !isRemoved && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onReply(comment.id)}
                    data-testid={`button-reply-podcast-comment-${comment.id}`}
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                )}
                {currentUserId === comment.userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteComment.mutate(comment.id)}
                    disabled={deleteComment.isPending}
                    data-testid={`button-delete-podcast-comment-${comment.id}`}
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
              data-testid={`input-reply-podcast-${comment.id}`}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={addReply.isPending || !replyContent.trim()} data-testid={`button-submit-reply-podcast-${comment.id}`}>
                <Send className="h-4 w-4 mr-1" />
                {addReply.isPending ? "Posting..." : "Reply"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onCancelReply} data-testid={`button-cancel-reply-podcast-${comment.id}`}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-8 space-y-3 border-l-2 border-muted pl-4">
          {replies.map((reply) => (
            <PodcastCommentItem
              key={reply.id}
              comment={reply}
              podcastId={podcastId}
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

export default function PodcastDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthenticated = !!user;
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: podcast, isLoading } = useGetPodcastBySlugQuery(slug!, { skip: !slug });

  const { data: comments = [] } = useGetPodcastCommentsQuery(String(podcast?.id), { skip: !podcast?.id });

  const { data: likesData } = useGetPodcastLikesQuery(String(podcast?.id), { skip: !podcast?.id });

  const { data: likedData } = useGetPodcastLikedQuery(String(podcast?.id), { skip: !podcast?.id || !user });

  const [likePodcastTrigger] = useLikePodcastMutation();
  const toggleLike = {
    mutate: () => {
      likePodcastTrigger(String(podcast?.id)).unwrap()
        .catch(() => { toast({ title: "Error", description: "Failed to update like", variant: "destructive" }); });
    },
    isPending: false,
  };

  const [addCommentTrigger, { isLoading: addCommentLoading }] = useCreatePodcastCommentMutation();
  const addComment = {
    mutate: (content: string) => {
      addCommentTrigger({ podcastId: String(podcast?.id), body: { content } }).unwrap()
        .then(() => {
          setCommentText("");
          toast({ title: "Comment posted!" });
        })
        .catch((error: any) => {
          toast({ title: "Error", description: error.message || "Failed to post comment", variant: "destructive" });
        });
    },
    isPending: addCommentLoading,
  };

  const handleLikeClick = () => {
    if (!user) {
      toast({ title: "Please sign in to like podcasts", variant: "destructive" });
      return;
    }
    toggleLike.mutate();
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate(commentText.trim());
  };

  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentCommentId === parentId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="aspect-video w-full rounded-lg mb-6" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Headphones className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Podcast Not Found</h1>
        <p className="text-muted-foreground mb-4">This podcast may have been removed or doesn't exist.</p>
        <Link href="/podcasts">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Podcasts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={podcast.title}
        description={podcast.excerpt}
        ogImage={podcast.heroImageUrl || undefined}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/podcasts">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-podcasts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Podcasts
          </Button>
        </Link>

        {podcast.heroImageUrl && (
          <div className="aspect-video rounded-lg overflow-hidden mb-6">
            <img
              src={podcast.heroImageUrl}
              alt={podcast.title}
              className="w-full h-full object-cover"
              data-testid="img-podcast-hero"
            />
          </div>
        )}

        <h1 className="text-3xl font-bold mb-3" data-testid="text-podcast-title">{podcast.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {podcast.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(podcast.publishedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {podcast.mediaUrl && (
          <div className="mb-8" data-testid="section-media">
            <MediaEmbed url={podcast.mediaUrl} />
          </div>
        )}

        <div
          className="prose dark:prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: podcast.content }}
          data-testid="text-podcast-content"
        />

        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Button
              variant={likedData?.liked ? "default" : "outline"}
              onClick={handleLikeClick}
              disabled={toggleLike.isPending}
              data-testid="button-like-podcast"
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
                title={podcast.title}
                url={`/podcasts/${podcast.slug}`}
                description={podcast.excerpt}
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
                  data-testid="input-podcast-comment"
                />
                <Button type="submit" disabled={addComment.isPending || !commentText.trim()} data-testid="button-submit-podcast-comment">
                  <Send className="h-4 w-4 mr-2" />
                  {addComment.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </form>
            ) : (
              <Card>
                <CardContent className="py-4">
                  <p className="text-muted-foreground">
                    <a href="/signin" className="text-primary hover:underline" data-testid="link-signin-podcast-comment">
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
                topLevelComments.map((comment) => (
                  <PodcastCommentItem
                    key={comment.id}
                    comment={comment}
                    podcastId={podcast.id}
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
          <Link href="/podcasts">
            <Button variant="outline" data-testid="button-more-podcasts">
              More Podcasts
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
