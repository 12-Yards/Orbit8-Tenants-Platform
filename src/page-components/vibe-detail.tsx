"use client";

import { useParams } from "next/navigation";
import Link from "@/components/tenant-link";
import { tenantHref } from "@/lib/tenant-link";
import { useState, useEffect } from "react";
import { useGetVibesQuery, useDeleteVibeMutation, useReactToVibeMutation, useCreateVibeCommentMutation, useDeleteVibeCommentMutation } from "@/store/api";
import { apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Send, MessageSquare, Hand, Heart, Laugh, Flame, Trophy, ArrowLeft, Reply, X, Lightbulb, HelpCircle, Pencil, Check, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Vibe, VibeReaction, VibeCategory, VibeComment, VibeType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { ImageUpload } from "@/components/image-upload";

type VibeCommentWithMeta = VibeComment & {
  authorName: string;
  authorProfileImageUrl: string | null;
  replies?: VibeCommentWithMeta[];
};

type VibeWithMeta = Vibe & {
  authorName: string;
  authorProfileImageUrl: string | null;
  reactions: VibeReaction[];
  comments: VibeCommentWithMeta[];
  commentCount: number;
};

const reactionConfig = [
  { type: "wave", Icon: Hand, label: "Wave" },
  { type: "heart", Icon: Heart, label: "Love" },
  { type: "laugh", Icon: Laugh, label: "Laugh" },
  { type: "fire", Icon: Flame, label: "Fire" },
  { type: "clap", Icon: Trophy, label: "Celebrate" },
];

const categoryColors: Record<VibeCategory, string> = {
  "Social": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Food": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "Beach": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "Music": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "Sports": "bg-green-500/10 text-green-600 dark:text-green-400",
  "Events": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Lost & Found": "bg-red-500/10 text-red-600 dark:text-red-400",
  "Other": "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const vibeTypeConfig: Record<VibeType, { icon: React.ComponentType<{ className?: string }>; label: string; badgeClass: string }> = {
  post: { 
    icon: Plus, 
    label: "", 
    badgeClass: ""
  },
  recommendation: { 
    icon: Lightbulb, 
    label: "Recommendation", 
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
  },
  ask: { 
    icon: HelpCircle, 
    label: "Looking for Recommendations", 
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
  },
};

function ReactionButton({ 
  type, 
  count, 
  isActive, 
  onClick, 
  disabled,
  Icon
}: { 
  type: string; 
  count: number; 
  isActive: boolean; 
  onClick: () => void; 
  disabled: boolean;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`gap-1 ${isActive ? 'bg-accent' : ''}`}
      data-testid={`button-reaction-${type}`}
    >
      <Icon className="h-4 w-4" />
      {count > 0 && <span className="text-xs">{count}</span>}
    </Button>
  );
}

function CommentItem({ 
  comment, 
  vibeId, 
  currentUserId,
  onReply,
  depth = 0
}: { 
  comment: VibeCommentWithMeta; 
  vibeId: string;
  currentUserId: string | null;
  onReply: (parentId: string) => void;
  depth?: number;
}) {
  const { toast } = useToast();
  const maxDepth = 3;
  
  const [deleteCommentTrigger, { isLoading: isDeleting }] = useDeleteVibeCommentMutation();

  const isOwner = currentUserId === comment.userId;
  const initials = comment.authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={`${depth > 0 ? 'ml-4 pl-3 border-l-2 border-muted' : ''}`}>
      <div className="flex items-start gap-2 py-2">
        <Avatar className="h-7 w-7">
          {comment.authorProfileImageUrl && (
            <AvatarImage src={comment.authorProfileImageUrl} alt={comment.authorName} />
          )}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "Just now"}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-9">
        {currentUserId && depth < maxDepth && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => onReply(comment.id)}
            data-testid={`button-reply-${comment.id}`}
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </Button>
        )}
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => deleteCommentTrigger({ vibeId, commentId: Number(comment.id) }).unwrap().then(() => toast({ title: "Comment deleted" })).catch(() => toast({ title: "Failed to delete comment", variant: "destructive" }))}
            disabled={isDeleting}
            data-testid={`button-delete-comment-${comment.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              vibeId={vibeId}
              currentUserId={currentUserId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VibeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const currentUserId = user?.id || null;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const EDIT_WINDOW_MINUTES = 5;

  const { data: vibesData } = useGetVibesQuery();

  const vibe = vibesData?.find(v => v.id === id);

  useEffect(() => {
    if (!vibe?.createdAt || currentUserId !== vibe.userId) return;

    const updateTimeRemaining = () => {
      const createdAt = new Date(vibe.createdAt!).getTime();
      const now = Date.now();
      const elapsed = (now - createdAt) / 1000;
      const remaining = EDIT_WINDOW_MINUTES * 60 - elapsed;
      
      if (remaining <= 0) {
        setTimeRemaining(null);
        setIsEditing(false);
      } else {
        setTimeRemaining(Math.ceil(remaining));
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [vibe?.createdAt, vibe?.userId, currentUserId]);

  const [deleteVibeTrigger, { isLoading: isDeletingVibe }] = useDeleteVibeMutation();
  const [reactTrigger, { isLoading: isReacting }] = useReactToVibeMutation();
  const [createCommentTrigger, { isLoading: isCreatingComment }] = useCreateVibeCommentMutation();

  const handleDelete = () => {
    deleteVibeTrigger(id).unwrap()
      .then(() => { toast({ title: "Post deleted" }); window.location.href = tenantHref("/vibe"); })
      .catch(() => toast({ title: "Failed to delete post", variant: "destructive" }));
  };

  const handleEdit = () => {
    apiRequest("PATCH", `/api/vibes/${id}`, { content: editContent, imageUrls: editImages })
      .then(() => { toast({ title: "Post updated" }); setIsEditing(false); })
      .catch(() => toast({ title: "Failed to update post", variant: "destructive" }));
  };

  const handleReact = (reactionType: string) => {
    reactTrigger({ vibeId: id, body: { reactionType } }).unwrap()
      .catch(() => toast({ title: "Please sign in to react", variant: "destructive" }));
  };

  if (!vibe) {
    return (
      <div className="min-h-screen py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">Post not found.</p>
            <Link href="/vibe">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Vibe
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getReactionCount = (type: string) => {
    return vibe.reactions.filter(r => r.reactionType === type).length;
  };

  const hasUserReacted = (type: string) => {
    return currentUserId ? vibe.reactions.some(r => r.reactionType === type && r.userId === currentUserId) : false;
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOwner = currentUserId === vibe.userId;
  const canEdit = isOwner && timeRemaining !== null && timeRemaining > 0 && !vibe.edited;
  const initials = vibe.authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const imageUrls = vibe.imageUrls || [];
  const vibeType = (vibe.vibeType || "post") as VibeType;
  const typeConfig = vibeTypeConfig[vibeType];
  const TypeIcon = typeConfig.icon;

  const seoTitle = vibeType === "recommendation" 
    ? `${vibe.authorName}'s Recommendation in ${vibe.category}`
    : vibeType === "ask" 
    ? `${vibe.authorName} asks about ${vibe.category}`
    : `${vibe.authorName}'s ${vibe.category} Post`;
  
  const seoDescription = vibe.content.length > 160 
    ? vibe.content.slice(0, 157) + "..."
    : vibe.content;
  
  const seoKeywords = `Mumbles, ${vibe.category}, community, ${vibeType === "recommendation" ? "local recommendations" : vibeType === "ask" ? "local advice" : "local discussion"}, Wales`;
  
  const seoImage = imageUrls.length > 0 ? imageUrls[0] : undefined;

  const organizeComments = (comments: VibeCommentWithMeta[]): VibeCommentWithMeta[] => {
    const topLevel: VibeCommentWithMeta[] = [];
    const replyMap: Record<string, VibeCommentWithMeta[]> = {};

    comments.forEach(comment => {
      if (comment.parentCommentId) {
        if (!replyMap[comment.parentCommentId]) {
          replyMap[comment.parentCommentId] = [];
        }
        replyMap[comment.parentCommentId].push(comment);
      } else {
        topLevel.push(comment);
      }
    });

    const attachReplies = (comment: VibeCommentWithMeta): VibeCommentWithMeta => {
      const replies = replyMap[comment.id] || [];
      return {
        ...comment,
        replies: replies.map(attachReplies)
      };
    };

    return topLevel.map(attachReplies);
  };

  const organizedComments = organizeComments(vibe.comments);
  const replyingToComment = replyingTo ? vibe.comments.find(c => c.id === replyingTo) : null;

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createCommentTrigger({ vibeId: id, body: { content: newComment, parentCommentId: replyingTo } })
      .unwrap()
      .then(() => {
        setNewComment("");
        setReplyingTo(null);
        toast({ title: replyingTo ? "Reply added" : "Comment added" });
      })
      .catch(() => toast({ title: "Failed to add comment", variant: "destructive" }));
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        ogImage={seoImage}
        ogType="article"
        canonicalUrl={`/vibe/${id}`}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/vibe">
          <Button variant="ghost" className="mb-6" data-testid="button-back-to-vibe">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vibe
          </Button>
        </Link>

        <Card data-testid={`card-vibe-detail-${vibe.id}`}>
          {vibeType !== "post" && (
            <div className={`px-4 py-2 border-b flex items-center gap-2 ${typeConfig.badgeClass}`}>
              <TypeIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{typeConfig.label}</span>
            </div>
          )}
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {vibe.authorProfileImageUrl && (
                  <AvatarImage src={vibe.authorProfileImageUrl} alt={vibe.authorName} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-lg">{vibe.authorName}</p>
                  {vibe.edited && <span className="text-sm text-muted-foreground">(edited)</span>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {vibe.createdAt ? formatDistanceToNow(new Date(vibe.createdAt), { addSuffix: true }) : "Just now"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${categoryColors[vibe.category as VibeCategory]} border-0`}>
                {vibe.category}
              </Badge>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditContent(vibe.content);
                    setEditImages(vibe.imageUrls || []);
                    setIsEditing(true);
                  }}
                  data-testid="button-edit-vibe"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeletingVibe}
                  data-testid="button-delete-vibe"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                  data-testid="input-edit-vibe"
                />
                {editImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {editImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Image ${index + 1}`} 
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEditImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {editImages.length < 4 && (
                  <ImageUpload
                    value=""
                    onChange={(url) => setEditImages(prev => [...prev, url])}
                    testId="edit-vibe-image"
                  />
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Time remaining: {timeRemaining ? formatTimeRemaining(timeRemaining) : '0:00'}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      disabled={!editContent.trim()}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-lg">{vibe.content}</p>
            )}
            {!isEditing && imageUrls.length > 0 && (
              <div className={`grid gap-3 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {imageUrls.map((url, index) => (
                  <img 
                    key={index}
                    src={url} 
                    alt={`Post image ${index + 1}`} 
                    className="rounded-md w-full object-contain max-h-[500px]"
                  />
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-4 pt-0">
            <div className="flex flex-wrap gap-1">
              {reactionConfig.map(({ type, Icon }) => (
                <ReactionButton
                  key={type}
                  type={type}
                  Icon={Icon}
                  count={getReactionCount(type)}
                  isActive={hasUserReacted(type)}
                  onClick={() => handleReact(type)}
                  disabled={isReacting || !currentUserId}
                />
              ))}
            </div>

            <div className="border-t pt-4 w-full">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">{vibe.commentCount} {vibe.commentCount === 1 ? 'comment' : 'comments'}</span>
              </div>

              {organizedComments.length > 0 && (
                <div className="space-y-1 mb-4">
                  {organizedComments.map((comment) => (
                    <CommentItem 
                      key={comment.id} 
                      comment={comment} 
                      vibeId={vibe.id}
                      currentUserId={currentUserId}
                      onReply={handleReply}
                    />
                  ))}
                </div>
              )}

              {currentUserId && (
                <div className="space-y-2">
                  {replyingToComment && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                      <Reply className="h-4 w-4" />
                      <span>Replying to {replyingToComment.authorName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-auto"
                        onClick={cancelReply}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <form onSubmit={handleSubmitComment} className="flex gap-2">
                    <Textarea
                      placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 min-h-[80px] resize-none"
                      data-testid="input-comment"
                    />
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={!newComment.trim() || isCreatingComment}
                      data-testid="button-submit-comment"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
