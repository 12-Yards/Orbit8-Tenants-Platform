// @ts-nocheck
"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useEffect, useMemo } from "react";
import {
  api as rtkApi,
  useGetGroupPostCommentsQuery,
  useDeleteGroupPostCommentMutation,
  useCreateGroupPostCommentMutation,
  useDeleteGroupPostMutation,
  useReactToGroupPostMutation,
  useCreateGroupPostMutation,
  useGetEventCategoriesQuery,
  useCreateGroupEventMutation,
  useGetGroupEventCommentsQuery,
  useGetGroupEventQuery,
  useReactToGroupEventMutation,
  useCreateGroupEventCommentMutation,
  useGetArticleCategoriesQuery,
  useGetSiteSettingsQuery,
  useGetGroupBySlugQuery,
  useGetGroupMembershipQuery,
  useGetGroupPostsQuery,
  useGetGroupEventsQuery,
  useGetEventByIdQuery,
  useGetMyEventMatchQuery,
  useGetEventBracketQuery,
  useGetEventTeamsQuery,
  useGetEventEntriesQuery,
  useGetBatchUserProfilesQuery,
  useGetGroupMembersQuery,
  useGetGroupAllMembersQuery,
  useGetConnectionsQuery,
  useGetOutgoingRequestsQuery,
  useGetIncomingRequestsQuery,
  useSendConnectionRequestMutation,
  useAcceptConnectionMutation,
  useApproveGroupMemberMutation,
  useRejectGroupMemberMutation,
  useJoinGroupMutation,
  useLeaveGroupMutation,
} from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { isEventUpcoming } from "@/lib/utils";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Lock, Globe, ArrowLeft, MessageCircle, Clock, Send, User, 
  Hand, Heart, Laugh, Flame, Trophy, Loader2, Trash2, 
  ImagePlus, X, ChevronDown, ChevronUp, Reply, Plus, 
  Lightbulb, HelpCircle, Pencil, Check, Calendar, MapPin, Ticket, Megaphone, UserPlus, UserCheck,
  Info, Crown, Target, GitBranch, Eye, AlertCircle, Minus, Maximize2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ImageUpload } from "@/components/image-upload";
import type { Group, GroupMembership, GroupPostReaction, EventTag, Event } from "@shared/schema";

type PostType = "post" | "recommendation" | "ask" | "announcement";

interface ArticleCategory {
  id: number;
  name: string;
  icon: string;
  orderIndex: number;
}

interface EventCategory {
  id: number;
  name: string;
  icon: string | null;
  orderIndex: number;
}

const categoryColorPalette = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "bg-green-500/10 text-green-600 dark:text-green-400",
  "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "bg-red-500/10 text-red-600 dark:text-red-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400",
];

function getJointPosition(index: number, scores: number[]): { position: number; isJoint: boolean } {
  if (index === 0) return { position: 1, isJoint: scores.length > 1 && scores[0] === scores[1] };
  if (scores[index] === scores[index - 1]) {
    const firstOfGroup = scores.indexOf(scores[index]);
    return { position: firstOfGroup + 1, isJoint: true };
  }
  return { position: index + 1, isJoint: index < scores.length - 1 && scores[index] === scores[index + 1] };
}

function PositionCell({ index, scores }: { index: number; scores: number[] }) {
  const { position, isJoint } = getJointPosition(index, scores);
  const label = isJoint ? `=${position}` : `${position}`;
  if (position === 1 && !isJoint) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        {label}
      </Badge>
    );
  }
  return <span className="text-muted-foreground">{label}</span>;
}

function getCategoryColor(categoryName: string, categories: ArticleCategory[]): string {
  const index = categories.findIndex(c => c.name === categoryName);
  if (index >= 0) {
    return categoryColorPalette[index % categoryColorPalette.length];
  }
  return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
}

interface GroupEvent {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  venueName: string;
  address: string;
  summary: string;
  description: string;
  imageUrl: string | null;
  tags: EventTag[];
  ticketUrl: string | null;
  showOnPublic: boolean;
  createdAt: string;
  authorName: string;
  authorProfileImageUrl: string | null;
}

interface GroupPostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  authorName: string;
  authorProfileImageUrl: string | null;
  replies?: GroupPostComment[];
}

interface GroupPost {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  category: string;
  postType: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string | null;
  edited: boolean;
  authorName: string;
  authorProfileImageUrl: string | null;
  reactions: GroupPostReaction[];
  commentCount: number;
  comments?: GroupPostComment[];
}

interface MembershipResponse {
  membership: GroupMembership | null;
}

interface GroupMember {
  id: string;
  userId: string;
  joinedAt: string;
  name: string;
  profileImageUrl: string | null;
  isCreator: boolean;
}

const reactionConfig = [
  { type: "wave", Icon: Hand, label: "Wave" },
  { type: "heart", Icon: Heart, label: "Love" },
  { type: "laugh", Icon: Laugh, label: "Laugh" },
  { type: "fire", Icon: Flame, label: "Fire" },
  { type: "clap", Icon: Trophy, label: "Celebrate" },
];

const vibeTypeConfig: Record<PostType, { icon: React.ComponentType<{ className?: string }>; label: string; badgeClass: string }> = {
  post: { icon: Plus, label: "", badgeClass: "" },
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
  announcement: {
    icon: Megaphone,
    label: "Competition Update",
    badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
  },
};

const postTypeConfig: Record<PostType, { icon: React.ComponentType<{ className?: string }>; label: string; placeholder: string; defaultCategory: string }> = {
  post: { 
    icon: Plus, 
    label: "Create Post", 
    placeholder: "What's on your mind?",
    defaultCategory: ""
  },
  recommendation: { 
    icon: Lightbulb, 
    label: "Make a Recommendation", 
    placeholder: "Share your recommendation with the group...",
    defaultCategory: ""
  },
  ask: { 
    icon: HelpCircle, 
    label: "Ask for Recommendations", 
    placeholder: "What would you like recommendations for?",
    defaultCategory: ""
  },
  announcement: {
    icon: Megaphone,
    label: "Competition Update",
    placeholder: "Share a competition update...",
    defaultCategory: "Competition"
  },
};

function ReactionButton({ 
  type, count, isActive, onClick, disabled, Icon
}: { 
  type: string; count: number; isActive: boolean; onClick: () => void; disabled: boolean;
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
  comment, postId, groupId, currentUserId, onReply, depth = 0
}: { 
  comment: GroupPostComment; postId: string; groupId: string;
  currentUserId: string | null; onReply: (parentId: string) => void; depth?: number;
}) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const initials = comment.authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const [deleteComment, { isLoading: deleteLoading }] = useDeleteGroupPostCommentMutation();

  const isOwner = currentUserId === comment.userId;
  const maxDepth = 2;

  return (
    <div className={`py-2 ${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`} data-testid={`comment-${comment.id}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          {comment.authorProfileImageUrl && (
            <AvatarImage src={comment.authorProfileImageUrl} alt={comment.authorName} />
          )}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "Just now"}
            </span>
          </div>
          <p className="text-sm mt-0.5">{comment.content}</p>
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
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => deleteComment({ postId, commentId: comment.id }).unwrap().then(() => { dispatch(rtkApi.util.invalidateTags(["GroupPosts"])); toast({ title: "Comment deleted" }); }).catch(() => { toast({ title: "Failed to delete comment", variant: "destructive" }); })}
            disabled={deleteLoading}
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
              postId={postId}
              groupId={groupId}
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

function CommentsSection({ post, currentUserId }: { post: GroupPost; currentUserId: string | null }) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: comments = [] } = useGetGroupPostCommentsQuery(post.id, { skip: !showComments }) as { data: GroupPostComment[] };

  const [createComment, { isLoading: createCommentLoading }] = useCreateGroupPostCommentMutation();

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createComment({ postId: post.id, body: { content: newComment, parentCommentId: replyingTo } }).unwrap().then(() => {
      setNewComment("");
      setReplyingTo(null);
      dispatch(rtkApi.util.invalidateTags(["GroupPosts"]));
      toast({ title: replyingTo ? "Reply added" : "Comment added" });
    }).catch(() => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    });
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setShowComments(true);
  };

  const cancelReply = () => setReplyingTo(null);

  const organizeComments = (comments: GroupPostComment[]): GroupPostComment[] => {
    const topLevel: GroupPostComment[] = [];
    const replyMap: Record<string, GroupPostComment[]> = {};

    comments.forEach(comment => {
      if (comment.parentCommentId) {
        if (!replyMap[comment.parentCommentId]) replyMap[comment.parentCommentId] = [];
        replyMap[comment.parentCommentId].push(comment);
      } else {
        topLevel.push(comment);
      }
    });

    const attachReplies = (comment: GroupPostComment): GroupPostComment => {
      const replies = replyMap[comment.id] || [];
      return { ...comment, replies: replies.map(attachReplies) };
    };

    return topLevel.map(attachReplies);
  };

  const organizedComments = organizeComments(comments);
  const replyingToComment = replyingTo ? comments.find(c => c.id === replyingTo) : null;

  return (
    <div className="border-t pt-3 w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="gap-2"
        data-testid={`button-toggle-comments-${post.id}`}
      >
        <MessageCircle className="h-4 w-4" />
        <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
        {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showComments && (
        <div className="mt-3">
          {organizedComments.length > 0 && (
            <div className="space-y-1 mb-4">
              {organizedComments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  postId={post.id}
                  groupId={post.groupId}
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
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={cancelReply}>
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
                  data-testid={`input-comment-${post.id}`}
                />
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!newComment.trim() || createCommentLoading}
                  data-testid={`button-submit-comment-${post.id}`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, userId, categories, siteSettings }: { post: GroupPost; userId?: string; categories: ArticleCategory[]; siteSettings?: { platformName?: string; logoUrl?: string } }) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImages, setEditImages] = useState<string[]>(post.imageUrls || []);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const EDIT_WINDOW_MINUTES = 5;

  useEffect(() => {
    if (!post.createdAt || userId !== post.userId) return;

    const updateTimeRemaining = () => {
      const createdAt = new Date(post.createdAt!).getTime();
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
  }, [post.createdAt, post.userId, userId]);

  const [deletePost, { isLoading: deleteLoading }] = useDeleteGroupPostMutation();
  const [reactToPost, { isLoading: reactLoading }] = useReactToGroupPostMutation();

  const handleEdit = async () => {
    setEditLoading(true);
    try {
      await apiRequest("PATCH", `/api/group-posts/${post.id}`, { content: editContent, imageUrls: editImages });
      dispatch(rtkApi.util.invalidateTags(["GroupPosts"]));
      toast({ title: "Post updated" });
      setIsEditing(false);
    } catch {
      toast({ title: "Failed to update post", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  };

  const getReactionCount = (type: string) => post.reactions.filter(r => r.reactionType === type).length;
  const hasUserReacted = (type: string) => userId ? post.reactions.some(r => r.reactionType === type && r.userId === userId) : false;

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOwner = userId === post.userId;
  const canEdit = isOwner && timeRemaining !== null && timeRemaining > 0 && !post.edited;
  const initials = post.authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const imageUrls = post.imageUrls || [];
  const postType = (post.postType || "post") as PostType;
  const typeConfig = vibeTypeConfig[postType];
  const TypeIcon = typeConfig.icon;
  const isAnnouncement = postType === "announcement";
  const displayName = isAnnouncement ? "Admin" : post.authorName;
  const displayAvatar = isAnnouncement ? siteSettings?.logoUrl : post.authorProfileImageUrl;
  const displayInitials = isAnnouncement ? "A" : initials;

  return (
    <Card data-testid={`card-group-post-${post.id}`}>
      {postType !== "post" && (
        <div className={`px-4 py-2 border-b flex items-center gap-2 ${typeConfig.badgeClass}`}>
          <TypeIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{typeConfig.label}</span>
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-center gap-3">
          {isAnnouncement ? (
            <Avatar className="h-10 w-10">
              {displayAvatar && (
                <AvatarImage src={displayAvatar} alt={displayName} />
              )}
              <AvatarFallback>{displayInitials}</AvatarFallback>
            </Avatar>
          ) : (
            <Link href={`/user/${post.userId}`} className="shrink-0">
              <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                {displayAvatar && (
                  <AvatarImage src={displayAvatar} alt={displayName} />
                )}
                <AvatarFallback>{displayInitials}</AvatarFallback>
              </Avatar>
            </Link>
          )}
          <div>
            <div className="flex items-center gap-2">
              {isAnnouncement ? (
                <p className="font-medium" data-testid={`text-post-author-${post.id}`}>{displayName}</p>
              ) : (
                <Link href={`/user/${post.userId}`} className="hover:underline">
                  <p className="font-medium" data-testid={`text-post-author-${post.id}`}>{displayName}</p>
                </Link>
              )}
              {post.edited && <span className="text-xs text-muted-foreground">(edited)</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "Just now"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isAnnouncement && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditContent(post.content);
                setEditImages(post.imageUrls || []);
                setIsEditing(true);
              }}
              data-testid={`button-edit-post-${post.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {isOwner && !isAnnouncement && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteLoading}
              data-testid={`button-delete-post-${post.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid={`input-edit-post-${post.id}`}
            />
            {editImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {editImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Image ${index + 1}`} className="h-20 w-20 object-cover rounded-md" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setEditImages(prev => prev.filter((_, i) => i !== index))}
                      data-testid={`button-remove-edit-image-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {editImages.length < 4 && (
              <ImageUpload value="" onChange={(url) => setEditImages(prev => [...prev, url])} testId="edit-post-image" />
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Time remaining: {timeRemaining ? formatTimeRemaining(timeRemaining) : '0:00'}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} data-testid={`button-cancel-edit-${post.id}`}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleEdit()}
                  disabled={!editContent.trim() || editLoading}
                  data-testid={`button-save-edit-${post.id}`}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>{post.content}</p>
        )}
        {!isEditing && imageUrls.length > 0 && (
          <div className={`grid gap-2 ${imageUrls.length === 1 ? 'grid-cols-1' : imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
            {imageUrls.map((url, index) => (
              <img 
                key={index}
                src={url} 
                alt={`Post image ${index + 1}`} 
                className="rounded-md max-h-96 object-contain"
                data-testid={`img-post-${post.id}-${index}`}
              />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 pt-0">
        <div className="flex flex-wrap gap-1">
          {reactionConfig.map(({ type, Icon }) => (
            <ReactionButton
              key={type}
              type={type}
              Icon={Icon}
              count={getReactionCount(type)}
              isActive={hasUserReacted(type)}
              onClick={() => reactToPost({ postId: post.id, groupId: post.groupId, body: { reactionType: type } }).unwrap().catch(() => { toast({ title: "Failed to react", variant: "destructive" }); })}
              disabled={reactLoading || !userId}
            />
          ))}
        </div>
        <CommentsSection post={post} currentUserId={userId || null} />
      </CardFooter>
      
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deletePost({ groupId: post.groupId, postId: post.id }).unwrap().then(() => { toast({ title: "Post deleted" }); }).catch(() => { toast({ title: "Failed to delete post", variant: "destructive" }); })}
      />
    </Card>
  );
}

function CreatePostDialog({ postType, groupId, categories, onClose }: { postType: PostType; groupId: string; categories: ArticleCategory[]; onClose: () => void }) {
  const { toast } = useToast();
  const config = postTypeConfig[postType];
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const [createPost, { isLoading: createPostLoading }] = useCreateGroupPostMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPost({ groupId, body: { content, imageUrls, postType } }).unwrap().then(() => {
      toast({ title: "Posted successfully" });
      onClose();
    }).catch(() => {
      toast({ title: "Failed to post", variant: "destructive" });
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const PostTypeIcon = config.icon;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PostTypeIcon className="h-5 w-5" />
            {config.label}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={config.placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
            data-testid="input-new-post-content"
          />

          {imageUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt={`Image ${index + 1}`} className="h-20 w-20 object-cover rounded-md" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                    data-testid={`button-remove-image-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showImageUpload && imageUrls.length < 4 && (
            <ImageUpload
              value=""
              onChange={(url) => {
                setImageUrls(prev => [...prev, url]);
                setShowImageUpload(false);
              }}
              testId="new-post-image"
            />
          )}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUpload(!showImageUpload)}
              disabled={imageUrls.length >= 4}
              data-testid="button-add-image"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Add Image {imageUrls.length > 0 && `(${imageUrls.length}/4)`}
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || createPostLoading}
              data-testid="button-submit-post"
            >
              {createPostLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateEventDialog({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [showOnPublic, setShowOnPublic] = useState(false);

  const { data: eventCategories = [] } = useGetEventCategoriesQuery() as { data: EventCategory[] };

  const [createGroupEvent, { isLoading: createEventLoading }] = useCreateGroupEventMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !venueName.trim() || !address.trim() || !summary.trim() || !description.trim()) return;
    createGroupEvent({ groupId, body: { 
      name, startDate, endDate: endDate || null, venueName, address, summary, description,
      imageUrl: imageUrl || null, tags: selectedCategory ? [selectedCategory] : [],
      ticketUrl: ticketUrl || null, showOnPublic
    } }).unwrap().then(() => {
      toast({ title: "Event created!", description: showOnPublic ? "Your event has also been submitted for public listing." : undefined });
      onClose();
    }).catch(() => {
      toast({ title: "Failed to create event", variant: "destructive" });
    });
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Group Event
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="event-name">Event Name *</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-group-event-name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-start">Start Date & Time *</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-group-event-start"
              />
            </div>
            <div>
              <Label htmlFor="event-end">End Date & Time</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-group-event-end"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="venue-name">Venue Name *</Label>
            <Input
              id="venue-name"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              data-testid="input-group-event-venue"
            />
          </div>

          <div>
            <Label htmlFor="event-address">Address *</Label>
            <Input
              id="event-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-testid="input-group-event-address"
            />
          </div>

          <div>
            <Label htmlFor="event-summary">Short Summary *</Label>
            <Textarea
              id="event-summary"
              placeholder="A brief description of the event (max 200 characters)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="resize-none"
              data-testid="input-group-event-summary"
            />
          </div>

          <div>
            <Label htmlFor="event-description">Full Description *</Label>
            <Textarea
              id="event-description"
              placeholder="Detailed information about the event"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[100px]"
              data-testid="input-group-event-description"
            />
          </div>

          <div>
            <Label>Event Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-group-event-tags">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {eventCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Event Image (Optional)</Label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              testId="group-event-image"
            />
          </div>

          <div>
            <Label htmlFor="event-ticket">Ticket URL (Optional)</Label>
            <Input
              id="event-ticket"
              placeholder="https://tickets.example.com/event"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              data-testid="input-group-event-ticket"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="show-public" className="text-base font-medium">Show on public events?</Label>
              <p className="text-sm text-muted-foreground">
                If enabled, this event will also be submitted for review to appear on the public Events page.
              </p>
            </div>
            <Switch
              id="show-public"
              checked={showOnPublic}
              onCheckedChange={setShowOnPublic}
              data-testid="switch-show-on-public"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-event">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !startDate || !venueName.trim() || !address.trim() || !summary.trim() || !description.trim() || createEventLoading}
              data-testid="button-submit-event"
            >
              {createEventLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditEventDialog({ event, groupId, onClose }: { event: GroupEvent; groupId: string; onClose: () => void }) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [name, setName] = useState(event.name);
  const [startDate, setStartDate] = useState(event.startDate);
  const [endDate, setEndDate] = useState(event.endDate || "");
  const [venueName, setVenueName] = useState(event.venueName);
  const [address, setAddress] = useState(event.address);
  const [summary, setSummary] = useState(event.summary);
  const [description, setDescription] = useState(event.description);
  const [imageUrl, setImageUrl] = useState(event.imageUrl || "");
  const [selectedCategory, setSelectedCategory] = useState(event.tags?.[0] || "");
  const [ticketUrl, setTicketUrl] = useState(event.ticketUrl || "");
  const [showOnPublic, setShowOnPublic] = useState(event.showOnPublic);
  const [updateLoading, setUpdateLoading] = useState(false);

  const { data: eventCategories = [] } = useGetEventCategoriesQuery() as { data: EventCategory[] };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !venueName.trim() || !address.trim() || !summary.trim() || !description.trim()) return;
    setUpdateLoading(true);
    try {
      await apiRequest("PUT", `/api/group-events/${event.id}`, { 
        name, startDate, endDate: endDate || null, venueName, address, summary, description,
        imageUrl: imageUrl || null, tags: selectedCategory ? [selectedCategory] : [],
        ticketUrl: ticketUrl || null, showOnPublic
      });
      dispatch(rtkApi.util.invalidateTags(["GroupEvents", "GroupPosts"]));
      toast({ title: "Event updated!" });
      onClose();
    } catch {
      toast({ title: "Failed to update event", variant: "destructive" });
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Event
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-event-name">Event Name *</Label>
            <Input
              id="edit-event-name"
              placeholder="e.g., Mumbles Beach Cleanup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-edit-event-name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-event-start">Start Date & Time *</Label>
              <Input
                id="edit-event-start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-edit-event-start"
              />
            </div>
            <div>
              <Label htmlFor="edit-event-end">End Date & Time</Label>
              <Input
                id="edit-event-end"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-edit-event-end"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-venue-name">Venue Name *</Label>
            <Input
              id="edit-venue-name"
              placeholder="e.g., Bracelet Bay"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              data-testid="input-edit-event-venue"
            />
          </div>

          <div>
            <Label htmlFor="edit-event-address">Address *</Label>
            <Input
              id="edit-event-address"
              placeholder="e.g., Bracelet Bay, Mumbles, SA3 4JT"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-testid="input-edit-event-address"
            />
          </div>

          <div>
            <Label htmlFor="edit-event-summary">Short Summary *</Label>
            <Textarea
              id="edit-event-summary"
              placeholder="A brief description of the event (max 200 characters)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="resize-none"
              data-testid="input-edit-event-summary"
            />
          </div>

          <div>
            <Label htmlFor="edit-event-description">Full Description *</Label>
            <Textarea
              id="edit-event-description"
              placeholder="Detailed information about the event"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[100px]"
              data-testid="input-edit-event-description"
            />
          </div>

          <div>
            <Label>Event Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-edit-event-tags">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {eventCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Event Image (Optional)</Label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              testId="edit-event-image"
            />
          </div>

          <div>
            <Label htmlFor="edit-event-ticket">Ticket URL (Optional)</Label>
            <Input
              id="edit-event-ticket"
              placeholder="https://tickets.example.com/event"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              data-testid="input-edit-event-ticket"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="edit-show-public" className="text-base font-medium">Show on public events?</Label>
              <p className="text-sm text-muted-foreground">
                If enabled, this event will also be submitted for review to appear on the public Events page.
              </p>
            </div>
            <Switch
              id="edit-show-public"
              checked={showOnPublic}
              onCheckedChange={setShowOnPublic}
              data-testid="switch-edit-show-on-public"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-edit-event">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !startDate || !venueName.trim() || !address.trim() || !summary.trim() || !description.trim() || updateLoading}
              data-testid="button-save-event"
            >
              {updateLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type GroupEventWithDetails = GroupEvent & { 
  authorName?: string; 
  authorProfileImageUrl?: string | null;
  reactions?: Array<{ id: string; eventId: string; userId: string; reactionType: string }>;
  commentCount?: number;
};

function EventDetailDialog({ event, userId, groupId, onClose }: { event: GroupEventWithDetails; userId?: string; groupId: string; onClose: () => void }) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [deleteCommentLoading, setDeleteCommentLoading] = useState(false);

  const eventDate = new Date(event.startDate);
  const formattedDate = eventDate.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const { data: comments = [], isLoading: commentsLoading } = useGetGroupEventCommentsQuery(event.id) as { data: Array<{ id: string; eventId: string; userId: string; parentCommentId?: string | null; content: string; createdAt: Date | string; authorName: string; authorProfileImageUrl?: string | null }>; isLoading: boolean };

  const { data: eventData } = useGetGroupEventQuery(event.id) as { data: GroupEventWithDetails | undefined };

  const currentReactions = eventData?.reactions || event.reactions || [];
  const hasLiked = userId ? currentReactions.some(r => r.userId === userId && r.reactionType === "like") : false;

  const [reactToEvent, { isLoading: likeLoading }] = useReactToGroupEventMutation();
  const [createEventComment, { isLoading: commentLoading }] = useCreateGroupEventCommentMutation();

  const handleDeleteComment = async (commentId: string) => {
    setDeleteCommentLoading(true);
    try {
      await apiRequest("DELETE", `/api/group-event-comments/${commentId}`, undefined);
      dispatch(rtkApi.util.invalidateTags(["GroupEventComments", "GroupEvents"]));
      toast({ title: "Comment deleted" });
    } catch {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    } finally {
      setDeleteCommentLoading(false);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createEventComment({ eventId: event.id, body: { content: newComment.trim() } }).unwrap().then(() => {
      setNewComment("");
      dispatch(rtkApi.util.invalidateTags(["GroupEvents"]));
    }).catch(() => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    });
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    createEventComment({ eventId: event.id, body: { content: replyContent.trim(), parentCommentId: parentId } }).unwrap().then(() => {
      setReplyingTo(null);
      setReplyContent("");
      dispatch(rtkApi.util.invalidateTags(["GroupEvents"]));
    }).catch(() => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    });
  };

  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentCommentId === parentId);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.name}</DialogTitle>
        </DialogHeader>
        
        {event.imageUrl && (
          <div className="relative h-64 -mx-6 -mt-2">
            <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">{event.venueName}</span>
            <span className="text-muted-foreground">• {event.address}</span>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">About this event</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </div>

          {event.ticketUrl && (
            <Button asChild className="w-full">
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                <Ticket className="h-4 w-4 mr-2" />
                Get Tickets
              </a>
            </Button>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant={hasLiked ? "default" : "outline"}
                size="sm"
                onClick={() => reactToEvent({ eventId: event.id, body: { reactionType: "like" } }).unwrap().then(() => { dispatch(rtkApi.util.invalidateTags(["GroupEvents"])); })}
                disabled={!userId || likeLoading}
                data-testid={`button-like-event-${event.id}`}
              >
                <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                {currentReactions.length} {currentReactions.length === 1 ? "Like" : "Likes"}
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</span>
              </div>
            </div>

            {userId && (
              <form onSubmit={handleSubmitComment} className="mb-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none min-h-[60px]"
                    data-testid="input-event-comment"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || commentLoading}
                    data-testid="button-submit-event-comment"
                  >
                    {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            )}

            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : topLevelComments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-4">
                {topLevelComments.map(comment => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.authorProfileImageUrl || undefined} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {userId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs"
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            >
                              Reply
                            </Button>
                          )}
                          {comment.userId === userId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs text-destructive"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>

                        {replyingTo === comment.id && (
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Write a reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="text-sm"
                              data-testid={`input-event-reply-${comment.id}`}
                            />
                            <Button 
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyContent.trim() || commentLoading}
                              data-testid={`button-submit-event-reply-${comment.id}`}
                            >
                              Reply
                            </Button>
                          </div>
                        )}

                        {getReplies(comment.id).map(reply => (
                          <div key={reply.id} className="flex gap-3 mt-2 ml-4">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.authorProfileImageUrl || undefined} />
                              <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="border border-dashed rounded-lg p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-xs">{reply.authorName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.content}</p>
                              </div>
                              {reply.userId === userId && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 text-xs text-destructive mt-1"
                                  onClick={() => handleDeleteComment(reply.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EventCard({ event, userId, groupId }: { event: GroupEventWithDetails; userId?: string; groupId: string }) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEventLoading, setDeleteEventLoading] = useState(false);
  const eventDate = new Date(event.startDate);
  const formattedDate = eventDate.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const dayOfMonth = eventDate.getDate();
  const monthShort = eventDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

  const isCreator = userId === event.userId;
  const likeCount = event.reactions?.length || 0;
  const commentCount = event.commentCount || 0;
  const hasUserLiked = event.reactions?.some(r => r.userId === userId) || false;

  const [reactToEvent, { isLoading: likeLoading }] = useReactToGroupEventMutation();

  const handleDeleteEvent = async () => {
    setDeleteEventLoading(true);
    try {
      await apiRequest("DELETE", `/api/group-events/${event.id}`, undefined);
      dispatch(rtkApi.util.invalidateTags(["GroupEvents"]));
      toast({ title: "Event deleted" });
    } catch {
      toast({ title: "Failed to delete event", variant: "destructive" });
    } finally {
      setDeleteEventLoading(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 cursor-pointer hover-elevate" onClick={() => setShowDetailDialog(true)} data-testid={`event-card-${event.id}`}>
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-80 flex-shrink-0">
            {event.imageUrl ? (
              <div className="h-48 md:h-full relative">
                <img 
                  src={event.imageUrl} 
                  alt={event.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 md:bg-gradient-to-t md:from-black/40 md:via-transparent md:to-transparent" />
              </div>
            ) : (
              <div className="h-48 md:h-full relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 flex items-center justify-center">
                <Calendar className="h-20 w-20 text-primary/30" />
              </div>
            )}
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-xl border border-primary/20">
              <div className="text-3xl font-bold text-primary leading-none">{dayOfMonth}</div>
              <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">{monthShort}</div>
            </div>
            {event.tags && event.tags.length > 0 && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground shadow-lg">{event.tags[0]}</Badge>
            )}
          </div>
          
          <div className="flex-1 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="cursor-pointer" onClick={() => setShowDetailDialog(true)}>
                <h3 className="font-bold text-xl leading-tight">{event.name}</h3>
              </div>
              {isCreator && (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); setShowEditDialog(true); }}
                    data-testid={`button-edit-event-${event.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    disabled={deleteEventLoading}
                    data-testid={`button-delete-event-${event.id}`}
                  >
                    {deleteEventLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-3 mb-4 cursor-pointer" onClick={() => setShowDetailDialog(true)}>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{formattedTime}</span>
                </div>
                <span className="text-muted-foreground">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{event.venueName}</span>
                <span className="text-muted-foreground">• {event.address}</span>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-4 line-clamp-2 cursor-pointer" onClick={() => setShowDetailDialog(true)}>{event.summary}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 ${hasUserLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!userId) {
                      toast({ title: "Please sign in to like events", variant: "destructive" });
                      return;
                    }
                    reactToEvent({ eventId: event.id, body: { reactionType: "like" } }).unwrap().then(() => { dispatch(rtkApi.util.invalidateTags(["GroupEvents"])); }).catch(() => { toast({ title: "Failed to like event", variant: "destructive" }); });
                  }}
                  disabled={likeLoading}
                  data-testid={`button-like-event-${event.id}`}
                >
                  <Heart className={`h-4 w-4 ${hasUserLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailDialog(true);
                  }}
                  data-testid={`button-comments-event-${event.id}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{commentCount}</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailDialog(true);
                  }}
                  data-testid={`button-read-more-event-${event.id}`}
                >
                  Read More
                </Button>
                {event.ticketUrl && (
                  <Button asChild size="sm" onClick={(e) => e.stopPropagation()}>
                    <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                      <Ticket className="h-4 w-4 mr-2" />
                      Get Tickets
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {showEditDialog && (
        <EditEventDialog event={event} groupId={groupId} onClose={() => setShowEditDialog(false)} />
      )}
      
      {showDetailDialog && (
        <EventDetailDialog event={event} userId={userId} groupId={groupId} onClose={() => setShowDetailDialog(false)} />
      )}
      
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => handleDeleteEvent()}
      />
    </>
  );
}

export default function GroupDetail() {
  const { slug } = useParams<{ slug: string }>();
  const router = useTenantRouter();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activePostType, setActivePostType] = useState<PostType | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "events">("feed");
  const groupSearchParams = useSearchParams();
  const [competitionTab, setCompetitionTab] = useState<"post" | "my-entry" | "next-match" | "tee-times" | "results" | "bracket">(() => {
    const tab = typeof window !== 'undefined' ? groupSearchParams.get("tab") : null;
    if (tab === "results" || tab === "bracket" || tab === "next-match" || tab === "my-entry" || tab === "tee-times") return tab as any;
    return "post";
  });
  const [bracketZoom, setBracketZoom] = useState(1);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningPlaceIndex, setAssigningPlaceIndex] = useState<number | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [assignMode, setAssignMode] = useState<"connection" | "guest">("connection");
  const [guestName, setGuestName] = useState("");
  const [pendingSentUserIds, setPendingSentUserIds] = useState<Set<string>>(new Set());
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreValue, setScoreValue] = useState("");
  const [scoreEntryId, setScoreEntryId] = useState<string | null>(null);
  const [scoreSlotIndex, setScoreSlotIndex] = useState<number>(0);
  const [scorePlayerName, setScorePlayerName] = useState<string>("");
  const [showTeamStablefordDialog, setShowTeamStablefordDialog] = useState(false);
  const [teamStablefordValue, setTeamStablefordValue] = useState("");
  const [teamHandicapValue, setTeamHandicapValue] = useState("");
  const [teamStablefordTeamId, setTeamStablefordTeamId] = useState<string | null>(null);

  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const { data: articleCategories = [] } = useGetArticleCategoriesQuery() as { data: ArticleCategory[] };

  const { data: eventCategories = [] } = useGetEventCategoriesQuery() as { data: EventCategory[] };

  const { data: siteSettings } = useGetSiteSettingsQuery() as { data: { platformName?: string; logoUrl?: string } | undefined };

  const { data: group, isLoading: groupLoading } = useGetGroupBySlugQuery(slug!, { skip: !slug }) as { data: (Group & { isCompetitionGroup?: boolean; hasEventEntry?: boolean }) | undefined; isLoading: boolean };

  const { data: membershipData, isLoading: membershipLoading } = useGetGroupMembershipQuery(group?.id!, { skip: !user || !group?.id }) as { data: MembershipResponse | undefined; isLoading: boolean };

  const canViewContent = !!group?.id && (group?.isPublic || membershipData?.membership?.status === "approved" || user?.id === group?.createdBy);

  const { data: posts = [], isLoading: postsLoading } = useGetGroupPostsQuery(group?.id!, { skip: !canViewContent }) as { data: GroupPost[]; isLoading: boolean };

  const { data: groupEvents = [], isLoading: eventsLoading } = useGetGroupEventsQuery(group?.id!, { skip: !canViewContent }) as { data: GroupEvent[]; isLoading: boolean };

  const { data: linkedEvent } = useGetEventByIdQuery(group?.eventId!, { skip: !group?.eventId }) as { data: Event | undefined };

  const competitionStarted = linkedEvent?.startDate ? new Date() > new Date(linkedEvent.startDate) : false;

  const isCompetitionType = linkedEvent?.eventType === "knockout" || linkedEvent?.eventType === "team_competition";

  const { data: myMatchData } = useGetMyEventMatchQuery(group?.eventId!, { skip: !group?.eventId || !user || !isCompetitionType }) as { data: {
    match: {
      id: string;
      matchNumber: number;
      roundName: string;
      roundNumber: number;
      deadline: string | null;
      yourTeam: {
        id: string;
        teamNumber: number;
        player1: string;
        player2: string;
        player1Image?: string;
        player2Image?: string;
      };
      opponentTeam: {
        id: string;
        teamNumber: number;
        player1: string;
        player2: string;
        player1Image?: string;
        player2Image?: string;
      } | null;
      waitingForOpponent: boolean;
      resultSubmission?: {
        proposedWinnerId: string;
        proposedWinnerIsYourTeam: boolean;
        submittedByYourTeam: boolean;
        awaitingYourConfirmation: boolean;
      } | null;
    } | null;
    eliminated?: boolean;
    champion?: boolean;
    message?: string;
  } | undefined };

  const { data: bracketData } = useGetEventBracketQuery(group?.eventId!, { skip: !group?.eventId || !isCompetitionType }) as { data: {
    bracket: { id: string; totalRounds: number } | null;
    rounds: { id: string; roundNumber: number; roundName: string; deadline: string | null }[];
    matches: { id: string; roundId: string; matchNumber: number; team1Id: string | null; team2Id: string | null; winnerId: string | null }[];
  } | undefined };

  const { data: competitionTeams = [] } = useGetEventTeamsQuery(group?.eventId!, { skip: !group?.eventId || !isCompetitionType }) as { data: {
    id: string;
    teamNumber: number;
    player1EntryId: string | null;
    player2EntryId: string | null;
    player3EntryId: string | null;
    player4EntryId: string | null;
    player5EntryId: string | null;
    player6EntryId: string | null;
  }[] };

  const { data: competitionEntries = [] } = useGetEventEntriesQuery(group?.eventId!, { skip: !group?.eventId || !isCompetitionType }) as { data: {
    id: string;
    userId: string;
    teamName: string | null;
    playerNames: string[] | null;
    playerCount: number | null;
    assignedPlayerIds: string[] | null;
    score: number | null;
  }[] };

  // Find current user's entry for managing assigned players
  const myEntry = competitionEntries.find(e => e.userId === user?.id);

  // Find if the user has been added to someone else's entry as an assigned player
  const addedToEntry = useMemo(() => {
    if (!user || myEntry) return null;
    for (const entry of competitionEntries) {
      if (entry.assignedPlayerIds) {
        const slotIndex = entry.assignedPlayerIds.indexOf(user.id);
        if (slotIndex !== -1) {
          return { entry, slotIndex: slotIndex + 1 };
        }
      }
    }
    return null;
  }, [user, myEntry, competitionEntries]);

  // Find if the user is allocated to a team (either as entry owner at slot 0, or as assigned player)
  const myTeam = useMemo(() => {
    if (!user || competitionTeams.length === 0) return null;
    
    // Build list of specific slots where the user is the actual player
    const userSlotIds: string[] = [];
    
    // User's own entry at slot 0 (user is playing in their own entry)
    if (myEntry) {
      userSlotIds.push(`${myEntry.id}:0`);
    }
    
    // Also check if user is an assigned player in any entry (slot 1+)
    competitionEntries.forEach(entry => {
      if (entry.assignedPlayerIds) {
        entry.assignedPlayerIds.forEach((assignedId, idx) => {
          if (assignedId === user.id) {
            // idx 0 in assignedPlayerIds = slot 1
            userSlotIds.push(`${entry.id}:${idx + 1}`);
          }
        });
      }
    });
    
    // Find team containing the user's specific slot
    for (const team of competitionTeams) {
      const playerSlots = [
        team.player1EntryId, team.player2EntryId, team.player3EntryId,
        team.player4EntryId, team.player5EntryId, team.player6EntryId
      ].filter(Boolean);
      
      for (const slotId of playerSlots) {
        if (slotId && userSlotIds.includes(slotId)) {
          return team;
        }
      }
    }
    
    return null;
  }, [user, myEntry, competitionTeams, competitionEntries]);

  // Get teammate info for display
  const myTeamInfo = useMemo(() => {
    if (!myTeam || !user) return null;
    
    const getPlayerInfo = (entryIdWithSlot: string | null) => {
      if (!entryIdWithSlot) return null;
      const [entryId, slotIndexStr] = entryIdWithSlot.split(':');
      const slotIndex = slotIndexStr ? parseInt(slotIndexStr, 10) : 0;
      const entry = competitionEntries.find(e => e.id === entryId);
      if (!entry) return null;
      
      if (slotIndex === 0) {
        // Entry owner
        return {
          entryId,
          slotIndex,
          isOwner: true,
          userId: entry.userId,
          name: entry.playerNames?.[0] || entry.teamName || 'Player',
        };
      } else {
        const assignedUserId = entry.assignedPlayerIds?.[slotIndex - 1];
        const isGuest = assignedUserId?.startsWith("guest:");
        return {
          entryId,
          slotIndex,
          isOwner: false,
          userId: isGuest ? null : assignedUserId,
          name: isGuest ? assignedUserId!.replace("guest:", "") : (entry.playerNames?.[slotIndex] || `Player ${slotIndex + 1}`),
        };
      }
    };
    
    // Get all players in the team
    const allPlayerSlots = [
      myTeam.player1EntryId, myTeam.player2EntryId, myTeam.player3EntryId,
      myTeam.player4EntryId, myTeam.player5EntryId, myTeam.player6EntryId
    ];
    
    const allPlayers = allPlayerSlots
      .map(slot => getPlayerInfo(slot))
      .filter((p): p is NonNullable<typeof p> => p !== null);
    
    // Find which player is "me" and which are teammates
    const meIndex = allPlayers.findIndex(p => p.userId === user.id);
    const teammates = allPlayers.filter(p => p.userId !== user.id);
    
    return {
      teamNumber: myTeam.teamNumber,
      allPlayers,
      me: meIndex >= 0 ? allPlayers[meIndex] : null,
      teammates,
    };
  }, [myTeam, user, competitionEntries]);

  // Fetch user info for team players
  const teamPlayerIds = useMemo(() => {
    if (!myTeamInfo) return [];
    return myTeamInfo.teammates
      .map(t => t.userId)
      .filter((id): id is string => !!id && id !== user?.id && !id.startsWith("guest:"));
  }, [myTeamInfo, user?.id]);

  const { data: teamPlayerProfiles = [] } = useGetBatchUserProfilesQuery(teamPlayerIds.join(','), { skip: teamPlayerIds.length === 0 }) as { data: {
    id: string;
    mumblesVibeName: string;
    profileImageUrl: string | null;
  }[] };

  // Fetch user info for ALL team players (for Teams tab display)
  const allTeamPlayerIds = useMemo(() => {
    const playerIds = new Set<string>();
    
    // Collect all user IDs from all entries
    competitionEntries.forEach(entry => {
      // Entry owner
      if (entry.userId) {
        playerIds.add(entry.userId);
      }
      if (entry.assignedPlayerIds) {
        entry.assignedPlayerIds.forEach(id => {
          if (id && !id.startsWith("guest:")) playerIds.add(id);
        });
      }
    });
    
    return Array.from(playerIds);
  }, [competitionEntries]);

  const { data: allTeamPlayerProfiles = [] } = useGetBatchUserProfilesQuery(allTeamPlayerIds.join(','), { skip: allTeamPlayerIds.length === 0 }) as { data: {
    id: string;
    mumblesVibeName: string;
    profileImageUrl: string | null;
  }[] };

  const { data: groupMembers = [] } = useGetGroupMembersQuery(group?.id!, { skip: !group?.id || !!group?.isPublic }) as { data: GroupMember[] };

  // For group creators: fetch all members including pending
  interface MembershipWithUser {
    id: string;
    userId: string;
    groupId: string;
    status: string;
    userName: string;
    userEmail: string;
    profileImageUrl?: string | null;
  }
  
  const [showManageMembersDialog, setShowManageMembersDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const isCreatorForQuery = user?.id === group?.createdBy || user?.isAdmin === true;
  
  const { data: allMembersForCreator = [] } = useGetGroupAllMembersQuery(group?.id!, { skip: !group?.id || !isCreatorForQuery || !showManageMembersDialog }) as { data: MembershipWithUser[] };
  
  const approvedMembersForCreator = allMembersForCreator.filter(m => m.status === "approved");
  const pendingMembersForCreator = allMembersForCreator.filter(m => m.status === "pending");
  
  const [approveMemberTrigger, { isLoading: isApprovingMember }] = useApproveGroupMemberMutation();
  const [rejectMemberTrigger, { isLoading: isRejectingMember }] = useRejectGroupMemberMutation();
  const [removeMemberLoading, setRemoveMemberLoading] = useState(false);

  const approveMembership = {
    mutate: (memberId: string) => {
      approveMemberTrigger({ groupId: String(group?.id), userId: memberId }).unwrap()
        .then(() => toast({ title: "Member approved" }))
        .catch(() => toast({ title: "Failed to approve member", variant: "destructive" }));
    },
    isPending: isApprovingMember,
  };

  const rejectMembership = {
    mutate: (memberId: string) => {
      rejectMemberTrigger({ groupId: String(group?.id), userId: memberId }).unwrap()
        .then(() => toast({ title: "Member request declined" }))
        .catch(() => toast({ title: "Failed to decline request", variant: "destructive" }));
    },
    isPending: isRejectingMember,
  };

  const removeMembership = {
    mutate: async (memberId: string) => {
      setRemoveMemberLoading(true);
      try {
        await apiRequest("DELETE", `/api/groups/${group?.id}/members/${memberId}`);
        dispatch(rtkApi.util.invalidateTags(["GroupMembers", "Groups"]));
        toast({ title: "Member removed from group" });
      } catch {
        toast({ title: "Failed to remove member", variant: "destructive" });
      } finally {
        setRemoveMemberLoading(false);
      }
    },
    isPending: removeMemberLoading,
  };

  const { data: userConnections = [] } = useGetConnectionsQuery(undefined, { skip: !user });
  const { data: outgoingRequests = [] } = useGetOutgoingRequestsQuery(undefined, { skip: !user });
  const { data: incomingRequests = [] } = useGetIncomingRequestsQuery(undefined, { skip: !user });

  // Create a set of connected user IDs for quick lookup
  const connectedUserIds = useMemo(() => 
    new Set(userConnections.map(c => c.connectedUser.id)), 
    [userConnections]
  );

  // Create a set of pending outgoing request user IDs
  const pendingOutgoingUserIds = useMemo(() => 
    new Set(outgoingRequests.map(r => r.receiverId)), 
    [outgoingRequests]
  );

  // Create a map of incoming request sender IDs to connection IDs
  const incomingRequestMap = useMemo(() => 
    new Map(incomingRequests.map(r => [r.requesterId, r.id])), 
    [incomingRequests]
  );

  const [sendConnReqTrigger, { isLoading: isSendingConnReq }] = useSendConnectionRequestMutation();
  const [acceptConnTrigger, { isLoading: isAcceptingConn }] = useAcceptConnectionMutation();
  const [declineConnLoading, setDeclineConnLoading] = useState(false);

  const sendConnectionRequest = {
    mutate: (receiverId: string) => {
      sendConnReqTrigger({ receiverId }).unwrap()
        .then(() => {
          setPendingSentUserIds(prev => new Set(prev).add(receiverId));
          toast({ title: "Friends request sent!" });
        })
        .catch((error: any) => {
          const errorMessage = error?.data?.message === "Connection already exists"
            ? "You already have a pending or existing connection with this user"
            : error?.data?.message || "Failed to send connection request";
          toast({ title: errorMessage, variant: "destructive" });
        });
    },
    isPending: isSendingConnReq,
  };

  const acceptConnectionRequest = {
    mutate: (connectionId: number) => {
      acceptConnTrigger(connectionId).unwrap()
        .then(() => toast({ title: "Connection accepted!" }))
        .catch((error: any) => toast({ title: error?.data?.message || "Failed to accept request", variant: "destructive" }));
    },
    isPending: isAcceptingConn,
  };

  const declineConnectionRequest = {
    mutate: async (connectionId: number) => {
      setDeclineConnLoading(true);
      try {
        await apiRequest("POST", `/api/connections/${connectionId}/reject`);
        dispatch(rtkApi.util.invalidateTags(["Connections"]));
        toast({ title: "Request declined" });
      } catch (error: any) {
        toast({ title: error?.message || "Failed to decline request", variant: "destructive" });
      } finally {
        setDeclineConnLoading(false);
      }
    },
    isPending: declineConnLoading,
  };

  const isEventGroup = !!group?.eventId;

  const [joinGroupTrigger, { isLoading: isJoiningGroup }] = useJoinGroupMutation();
  const [leaveGroupTrigger, { isLoading: isLeavingGroup }] = useLeaveGroupMutation();

  const joinMutation = {
    mutate: () => {
      joinGroupTrigger(String(group!.id)).unwrap()
        .then(() => toast({ title: "Join request sent!", description: "You'll be notified when approved." }))
        .catch(() => toast({ title: "Failed to request membership", variant: "destructive" }));
    },
    isPending: isJoiningGroup,
  };

  const leaveMutation = {
    mutate: () => {
      leaveGroupTrigger(String(group!.id)).unwrap()
        .then(() => {
          toast({ title: "You've left the group" });
          router.push("/groups");
        })
        .catch(() => toast({ title: "Failed to leave group", variant: "destructive" }));
    },
    isPending: isLeavingGroup,
  };

  const [assignPlayerLoading, setAssignPlayerLoading] = useState(false);
  const [submitScoreLoading, setSubmitScoreLoading] = useState(false);
  const [submitTeamStablefordLoading, setSubmitTeamStablefordLoading] = useState(false);
  const [submitResultLoading, setSubmitResultLoading] = useState(false);
  const [confirmResultLoading, setConfirmResultLoading] = useState(false);

  const assignPlayerMutation = {
    mutate: async ({ entryId, placeIndex, assignedUserId }: { entryId: string; placeIndex: number; assignedUserId: string }) => {
      setAssignPlayerLoading(true);
      try {
        await apiRequest("PATCH", `/api/events/${group!.eventId}/entries/${entryId}/assign-player`, { placeIndex, assignedUserId });
        dispatch(rtkApi.util.invalidateTags(["EventEntries", "GroupMembers"]));
        toast({ title: "Player assigned successfully" });
        setGuestName("");
        setAssignDialogOpen(false);
        setAssigningPlaceIndex(null);
        setMemberSearchQuery("");
      } catch {
        toast({ title: "Failed to assign player", variant: "destructive" });
      } finally {
        setAssignPlayerLoading(false);
      }
    },
    isPending: assignPlayerLoading,
  };

  const submitScoreMutation = {
    mutate: async ({ entryId, score, slotIndex }: { entryId: string; score: number; slotIndex?: number }) => {
      setSubmitScoreLoading(true);
      try {
        await apiRequest("PATCH", `/api/events/${group!.eventId}/entries/${entryId}/score`, { score, slotIndex });
        dispatch(rtkApi.util.invalidateTags(["EventEntries"]));
        toast({ title: "Score submitted successfully" });
        setShowScoreDialog(false);
        setScoreValue("");
      } catch {
        toast({ title: "Failed to submit score", variant: "destructive" });
      } finally {
        setSubmitScoreLoading(false);
      }
    },
    isPending: submitScoreLoading,
  };

  const submitTeamStablefordMutation = {
    mutate: async ({ teamId, teamStableford, teamHandicap }: { teamId: string; teamStableford: number; teamHandicap?: number | null }) => {
      setSubmitTeamStablefordLoading(true);
      try {
        await apiRequest("PATCH", `/api/events/${group!.eventId}/teams/${teamId}/stableford`, {
          teamStableford,
          ...(teamHandicap !== undefined && teamHandicap !== null ? { teamHandicap } : {})
        });
        dispatch(rtkApi.util.invalidateTags(["EventTeams"]));
        toast({ title: "Team score submitted successfully" });
        setShowTeamStablefordDialog(false);
        setTeamStablefordValue("");
        setTeamHandicapValue("");
        setTeamStablefordTeamId(null);
      } catch {
        toast({ title: "Failed to submit team stableford", variant: "destructive" });
      } finally {
        setSubmitTeamStablefordLoading(false);
      }
    },
    isPending: submitTeamStablefordLoading,
  };

  const submitResultMutation = {
    mutate: async ({ matchId, proposedWinnerId }: { matchId: string; proposedWinnerId: string }) => {
      setSubmitResultLoading(true);
      try {
        await apiRequest("POST", `/api/events/${group!.eventId}/matches/${matchId}/submit-result`, { proposedWinnerId });
        dispatch(rtkApi.util.invalidateTags(["EventBracket"]));
        toast({ title: "Result submitted", description: "Waiting for opponent to confirm." });
      } catch {
        toast({ title: "Failed to submit result", variant: "destructive" });
      } finally {
        setSubmitResultLoading(false);
      }
    },
    isPending: submitResultLoading,
  };

  const confirmResultMutation = {
    mutate: async ({ matchId, confirmed }: { matchId: string; confirmed: boolean }) => {
      setConfirmResultLoading(true);
      try {
        await apiRequest("POST", `/api/events/${group!.eventId}/matches/${matchId}/confirm-result`, { confirmed });
        dispatch(rtkApi.util.invalidateTags(["EventBracket"]));
        if (confirmed) {
          toast({ title: "Result confirmed", description: "The match result has been recorded." });
        } else {
          toast({ title: "Result disputed", description: "The submitted result has been cleared." });
        }
      } catch {
        toast({ title: "Failed to process result", variant: "destructive" });
      } finally {
        setConfirmResultLoading(false);
      }
    },
    isPending: confirmResultLoading,
  };

  // Filter user's connections for player assignment search
  const filteredConnections = userConnections.filter(conn => 
    conn.connectedUser.mumblesVibeName.toLowerCase().includes(memberSearchQuery.toLowerCase())
  ).sort((a, b) => (a.connectedUser.mumblesVibeName || "").localeCompare(b.connectedUser.mumblesVibeName || ""));

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-4xl text-center">
          <h1 className="text-2xl font-semibold">Group Not Found</h1>
          <p className="text-muted-foreground mt-2">This group doesn't exist or has been removed.</p>
          <Button asChild className="mt-4">
            <Link href="/groups">Back to Groups</Link>
          </Button>
        </main>
      </div>
    );
  }

  const membership = membershipData?.membership;
  const isCreator = user?.id === group.createdBy || user?.isAdmin === true;
  const isMember = membership?.status === "approved" || isCreator;
  const isPending = membership?.status === "pending";

  // Redirect pending members - they cannot access the group until approved
  if (isPending && !group.isPublic) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-4xl text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold">Request Pending</h1>
          <p className="text-muted-foreground mt-2">
            Your request to join "{group.name}" is awaiting approval. 
            You'll be able to access this group once your membership is approved.
          </p>
          <Button asChild className="mt-4">
            <Link href="/groups">Back to Groups</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <FeatureGate feature="featureCommunities" featureName="Communities">
      <div className="min-h-screen bg-background">
        <SEO 
          title={group.name}
          description={group.description || `Join the ${group.name} community group in Mumbles`}
          canonicalUrl={`/groups/${group.slug}`}
        />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/groups" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Link>

        <div className="mb-8">
          {group.imageUrl && (
            <img 
              src={group.imageUrl} 
              alt={group.name}
              className="w-full aspect-[3/1] object-cover rounded-lg mb-4"
            />
          )}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{group.name}</h1>
                <Badge variant="outline" className="flex items-center gap-1">
                  {group.isPublic ? (
                    <>
                      <Globe className="h-3 w-3" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Private
                    </>
                  )}
                </Badge>
                {(linkedEvent?.eventType === "team_competition" || linkedEvent?.eventType === "knockout") && linkedEvent.competitionFormat && (
                  <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-competition-format">
                    <Trophy className="h-3 w-3" />
                    {linkedEvent.competitionFormat === "scramble" ? "Texas Scramble" :
                     linkedEvent.competitionFormat === "best_ball" ? "Best Ball" :
                     linkedEvent.competitionFormat === "team_stableford" ? (linkedEvent.teamSize && linkedEvent.teamSize > 1 ? "Team Stableford" : "Stableford") :
                     linkedEvent.competitionFormat === "fourball" ? "Fourball" :
                     linkedEvent.competitionFormat === "alternate_shot" ? "Alternate Shot" :
                     linkedEvent.competitionFormat === "foursomes_alternate" ? "Foursomes/Alternate" :
                     linkedEvent.competitionFormat === "matchplay" ? "Matchplay" :
                     linkedEvent.competitionFormat === "other" ? "Other Format" :
                     linkedEvent.competitionFormat}
                  </Badge>
                )}
              </div>
              {group.description && (
                <p className="text-muted-foreground mt-2">{group.description}</p>
              )}
            </div>
            <div>
              {!user ? (
                !group.isPublic && !group.isCompetitionGroup && (
                  <Button asChild data-testid="button-signin-to-join">
                    <Link href="/signin">Sign in to join</Link>
                  </Button>
                )
              ) : isMember && !group.isPublic && !group.isCompetitionGroup ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowLeaveConfirm(true)}
                  disabled={leaveMutation.isPending}
                  data-testid="button-leave-group"
                >
                  Leave Group
                </Button>
              ) : !group.isPublic && !group.isCompetitionGroup ? (
                <Button 
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  data-testid="button-join-group"
                >
                  {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                  Request to Join
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {((!group.isPublic && isMember && groupMembers.length > 0) || groupEvents.length > 0) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {!group.isPublic && isMember && groupMembers.length > 0 && (
              isCreator ? (
                <>
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={() => setShowManageMembersDialog(true)}
                    data-testid="button-manage-members"
                  >
                    <Users className="h-4 w-4" />
                    Manage Members ({groupMembers.length})
                    {pendingMembersForCreator.length > 0 && (
                      <Badge variant="destructive" className="ml-1">{pendingMembersForCreator.length}</Badge>
                    )}
                  </Button>
                  
                  <Dialog open={showManageMembersDialog} onOpenChange={setShowManageMembersDialog}>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {group.name} - Members
                        </DialogTitle>
                      </DialogHeader>
                      
                      {pendingMembersForCreator.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Badge variant="destructive">{pendingMembersForCreator.length}</Badge>
                            Pending Requests
                          </h4>
                          <div className="space-y-3">
                            {pendingMembersForCreator.map((m) => (
                              <div key={m.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg" data-testid={`membership-pending-${m.id}`}>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={m.profileImageUrl || undefined} />
                                    <AvatarFallback>{m.userName.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{m.userName}</p>
                                    <p className="text-sm text-muted-foreground">{m.userEmail}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => approveMembership.mutate(m.id)} disabled={approveMembership.isPending} data-testid={`button-approve-${m.id}`}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => rejectMembership.mutate(m.id)} disabled={rejectMembership.isPending} data-testid={`button-reject-${m.id}`}>
                                    <X className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium mb-3">
                          Members ({approvedMembersForCreator.length})
                        </h4>
                        {approvedMembersForCreator.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No members in this group yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {approvedMembersForCreator.map((m) => (
                              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`membership-approved-${m.id}`}>
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={m.profileImageUrl || undefined} />
                                  <AvatarFallback>{m.userName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">{m.userName}</p>
                                  <p className="text-sm text-muted-foreground">{m.userEmail}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">Member</Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => setMemberToRemove({ id: m.id, name: m.userName })}
                                    disabled={removeMembership.isPending}
                                    data-testid={`button-remove-member-${m.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={!!memberToRemove} onOpenChange={(open) => { if (!open) setMemberToRemove(null); }}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          Remove Member
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from this group? They will need to rejoin or be re-added.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => setMemberToRemove(null)}
                          data-testid="button-cancel-remove-member"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (memberToRemove) {
                              removeMembership.mutate(memberToRemove.id);
                              setMemberToRemove(null);
                            }
                          }}
                          data-testid="button-confirm-remove-member"
                        >
                          Remove Member
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2" data-testid="button-view-members">
                      <Users className="h-4 w-4" />
                      View Members ({groupMembers.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Members ({groupMembers.length})
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 mt-4">
                      {groupMembers.map((member) => {
                        const isOwnProfile = user?.id === member.userId;
                        const isConnected = connectedUserIds.has(member.userId);
                        const isPending = pendingSentUserIds.has(member.userId) || pendingOutgoingUserIds.has(member.userId);
                        const hasIncomingRequest = incomingRequestMap.has(member.userId);
                        const incomingConnectionId = incomingRequestMap.get(member.userId);
                        // Check if this is a real user (valid UUID format) vs placeholder
                        const isRealUser = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(member.userId);
                        return (
                          <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors" data-testid={`member-${member.userId}`}>
                            {isRealUser ? (
                              <Link href={`/user/${member.userId}`}>
                                <Avatar className="h-10 w-10 cursor-pointer">
                                  <AvatarImage src={member.profileImageUrl || undefined} />
                                  <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </Link>
                            ) : (
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1">
                              {isRealUser ? (
                                <Link href={`/user/${member.userId}`}>
                                  <div className="flex items-center gap-2 cursor-pointer">
                                    <span className="font-medium hover:underline">{member.name}</span>
                                    {member.isCreator && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <Crown className="h-3 w-3 text-amber-500" />
                                        Creator
                                      </Badge>
                                    )}
                                  </div>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{member.name}</span>
                                  {member.isCreator && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <Crown className="h-3 w-3 text-amber-500" />
                                      Creator
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {!isOwnProfile && isRealUser && (
                                <div className="mt-1">
                                  {isConnected ? (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                      <UserCheck className="h-3 w-3" />
                                      Connected
                                    </span>
                                  ) : hasIncomingRequest && incomingConnectionId ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          acceptConnectionRequest.mutate(incomingConnectionId);
                                        }}
                                        disabled={acceptConnectionRequest.isPending}
                                        data-testid={`button-accept-${member.userId}`}
                                      >
                                        <Check className="h-3 w-3" />
                                        Accept
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          declineConnectionRequest.mutate(incomingConnectionId);
                                        }}
                                        disabled={declineConnectionRequest.isPending}
                                        data-testid={`button-decline-${member.userId}`}
                                      >
                                        <X className="h-3 w-3" />
                                        Decline
                                      </Button>
                                    </div>
                                  ) : isPending ? (
                                    <span className="text-xs text-amber-600 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Pending
                                    </span>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        sendConnectionRequest.mutate(member.userId);
                                      }}
                                      disabled={sendConnectionRequest.isPending}
                                      data-testid={`button-connect-${member.userId}`}
                                    >
                                      <UserPlus className="h-3 w-3" />
                                      Connect
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              )
            )}
            {groupEvents.filter(e => new Date(e.startDate) >= new Date()).length > 0 && (
              <Button 
                variant={viewMode === "events" ? "default" : "outline"} 
                className="gap-2" 
                onClick={() => setViewMode(viewMode === "events" ? "feed" : "events")}
                data-testid="button-view-events"
              >
                <Calendar className="h-4 w-4" />
                {viewMode === "events" ? "View All" : `View Events (${groupEvents.filter(e => new Date(e.startDate) >= new Date()).length})`}
              </Button>
            )}
          </div>
        )}

        {!group.isPublic && (!user || !isMember || (group.isCompetitionGroup && !group.hasEventEntry && !user?.isAdmin)) ? (
          <div className="text-center py-16">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {group.isCompetitionGroup ? "Entrants Only" : "Members Only"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {group.isCompetitionGroup 
                ? !user 
                  ? "Sign in and enter the competition to access this community."
                  : "This community is exclusive to competition entrants. Enter the competition to join."
                : !user 
                  ? "Sign in and request to join this group to see posts and participate in discussions."
                  : isPending
                    ? "Your membership request is pending approval. You'll be able to see posts once approved."
                    : "Request to join this group to see posts and participate in discussions."
              }
            </p>
            {group.isCompetitionGroup && linkedEvent && (
              <Button asChild className="mt-4">
                <Link href={`/events/${linkedEvent.slug}`}>
                  <Trophy className="h-4 w-4 mr-2" />
                  View Competition
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={competitionTab} onValueChange={(v) => { setCompetitionTab(v as any); if (v === "post") setActivePostType("post"); }} className="w-full overflow-hidden">
              <TabsList className="flex w-full mb-4 overflow-x-auto">
                <TabsTrigger 
                  value="post" 
                  className="flex-1 min-w-0 gap-1 text-xs px-2"
                  data-testid="tab-create-post"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Post</span>
                </TabsTrigger>
                {isEventGroup && linkedEvent ? (
                  <>
                    <TabsTrigger 
                      value="event-info" 
                      asChild
                      className="flex-1 min-w-0 gap-1 text-xs px-2"
                      data-testid="tab-event-info"
                    >
                      <Link href={`/events/${linkedEvent.slug}`} onClick={() => window.scrollTo(0, 0)}>
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Info</span>
                      </Link>
                    </TabsTrigger>
                    {(linkedEvent.eventType === "knockout" || linkedEvent.eventType === "team_competition") && (
                      <>
                        <TabsTrigger 
                          value="my-entry"
                          onClick={() => setCompetitionTab("my-entry")}
                          className="flex-1 min-w-0 gap-1 text-xs px-2"
                          data-testid="tab-my-entry"
                        >
                          <Ticket className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Entry</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="next-match"
                          onClick={() => setCompetitionTab("next-match")}
                          className="flex-1 min-w-0 gap-1 text-xs px-2"
                          data-testid="tab-next-match"
                        >
                          {linkedEvent.eventType === "team_competition" ? (
                            <>
                              <Users className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">Teams</span>
                            </>
                          ) : (
                            <>
                              <Target className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">Match</span>
                            </>
                          )}
                        </TabsTrigger>
                        {competitionTeams.some((t: any) => t.teeTime) && (
                          <TabsTrigger 
                            value="tee-times"
                            onClick={() => setCompetitionTab("tee-times")}
                            className="flex-1 min-w-0 gap-1 text-xs px-2"
                            data-testid="tab-tee-times"
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Tee Times</span>
                          </TabsTrigger>
                        )}
                        {(linkedEvent as any).leagueTableSortOrder !== "none" && (
                          <TabsTrigger 
                            value="results"
                            onClick={() => setCompetitionTab("results")}
                            className="flex-1 min-w-0 gap-1 text-xs px-2"
                            data-testid="tab-results"
                          >
                            <Trophy className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{linkedEvent.eventType === "team_competition" ? "Table" : "Results"}</span>
                          </TabsTrigger>
                        )}
                        {linkedEvent.eventType === "knockout" && (
                          <TabsTrigger 
                            value="bracket"
                            onClick={() => setCompetitionTab("bracket")}
                            className="flex-1 min-w-0 gap-1 text-xs px-2"
                            data-testid="tab-bracket"
                          >
                            <GitBranch className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Bracket</span>
                          </TabsTrigger>
                        )}
                      </>
                    )}
                  </>
                ) : !isEventGroup && (
                  <>
                    <TabsTrigger 
                      value="recommendation" 
                      onClick={() => setActivePostType("recommendation")}
                      className="flex-1 min-w-0 gap-1 text-xs px-2"
                      data-testid="tab-create-recommendation"
                    >
                      <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Recommend</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ask" 
                      onClick={() => setActivePostType("ask")}
                      className="flex-1 min-w-0 gap-1 text-xs px-2"
                      data-testid="tab-create-ask"
                    >
                      <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Ask</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="events" 
                      onClick={() => setShowEventDialog(true)}
                      className="flex-1 min-w-0 gap-1 text-xs px-2"
                      data-testid="tab-create-event"
                    >
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Events</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              {(linkedEvent?.eventType === "knockout" || linkedEvent?.eventType === "team_competition") && (
                <>
                  <TabsContent value="my-entry" className="mt-0">
                    <Card>
                      <CardContent className="pt-6">
                        {!myEntry && !addedToEntry ? (
                          <div className="text-center py-8">
                            <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Entry Found</h3>
                            <p className="text-muted-foreground">You haven't entered this competition yet.</p>
                          </div>
                        ) : !myEntry && addedToEntry ? (
                          <div className="space-y-4">
                            {myTeamInfo && (
                              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <Users className="h-5 w-5 text-primary" />
                                  <h3 className="font-semibold text-lg">Your Team</h3>
                                  <Badge variant="secondary">Team {myTeamInfo.teamNumber}</Badge>
                                  <Badge variant="outline">{myTeamInfo.allPlayers.length} players</Badge>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {myTeamInfo.allPlayers.map((player, idx) => (
                                    <div key={player.entryId + ':' + idx} className="flex items-center gap-2">
                                      {idx > 0 && <span className="text-muted-foreground">&</span>}
                                      {player.userId ? (
                                        <Link href={`/user/${player.userId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={allTeamPlayerProfiles.find(p => p.id === player.userId)?.profileImageUrl || undefined} />
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium hover:underline">
                                            {allTeamPlayerProfiles.find(p => p.id === player.userId)?.mumblesVibeName || player.name}
                                          </span>
                                        </Link>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium text-muted-foreground">{player.name}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">Your Entry</h3>
                            </div>

                            {(() => {
                              const ownerProfile = allTeamPlayerProfiles.find(p => p.id === addedToEntry.entry.userId);
                              const ownerName = ownerProfile?.mumblesVibeName || addedToEntry.entry.teamName || "the entry owner";
                              return (
                                <p className="text-sm text-muted-foreground">
                                  You have been added to this competition by <span className="font-medium text-foreground">{ownerName}</span>.
                                </p>
                              );
                            })()}

                            <div className="space-y-3">
                              {Array.from({ length: addedToEntry.entry.playerCount || 1 }).map((_, index) => {
                                const isOwner = index === 0;
                                const isCurrentUser = index === addedToEntry.slotIndex;
                                const assignedUserId = !isOwner && addedToEntry.entry.assignedPlayerIds ? addedToEntry.entry.assignedPlayerIds[index - 1] : null;
                                const isGuestSlot = assignedUserId?.startsWith("guest:");
                                const guestSlotName = isGuestSlot ? assignedUserId!.replace("guest:", "") : null;
                                const assignedProfile = assignedUserId && !isGuestSlot ? allTeamPlayerProfiles.find(p => p.id === assignedUserId) : null;
                                const ownerProfile = allTeamPlayerProfiles.find(p => p.id === addedToEntry.entry.userId);

                                return (
                                  <div key={index} className={`flex items-center gap-3 p-3 border rounded-lg ${isCurrentUser ? 'border-primary/30 bg-primary/5' : ''}`}>
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                                      {index + 1}
                                    </div>

                                    {isOwner ? (
                                      <Link href={`/user/${addedToEntry.entry.userId}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                                        <Avatar className="h-10 w-10">
                                          <AvatarImage src={ownerProfile?.profileImageUrl || undefined} />
                                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium hover:underline">{ownerProfile?.mumblesVibeName || 'Entry Owner'}</p>
                                          <p className="text-xs text-muted-foreground">Entry owner</p>
                                        </div>
                                      </Link>
                                    ) : isCurrentUser ? (
                                      <div className="flex items-center gap-3 flex-1">
                                        <Avatar className="h-10 w-10">
                                          <AvatarImage src={user?.profileImageUrl || undefined} />
                                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">{user?.mumblesVibeName || 'You'}</p>
                                          <p className="text-xs text-muted-foreground">Added by {ownerProfile?.mumblesVibeName || 'entry owner'}</p>
                                        </div>
                                      </div>
                                    ) : isGuestSlot ? (
                                      <div className="flex items-center gap-3 flex-1">
                                        <Avatar className="h-10 w-10">
                                          <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                            {guestSlotName?.charAt(0).toUpperCase() || "G"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">{guestSlotName}</p>
                                          <p className="text-xs text-muted-foreground">Guest player</p>
                                        </div>
                                      </div>
                                    ) : assignedProfile ? (
                                      <Link href={`/user/${assignedUserId}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                                        <Avatar className="h-10 w-10">
                                          <AvatarImage src={assignedProfile.profileImageUrl || undefined} />
                                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium hover:underline">{assignedProfile.mumblesVibeName || 'Player'}</p>
                                          <p className="text-xs text-muted-foreground">Added by {ownerProfile?.mumblesVibeName || 'entry owner'}</p>
                                        </div>
                                      </Link>
                                    ) : assignedUserId ? (
                                      <div className="flex items-center gap-3 flex-1">
                                        <Avatar className="h-10 w-10">
                                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">Player Assigned</p>
                                          <p className="text-xs text-muted-foreground">Added by {ownerProfile?.mumblesVibeName || 'entry owner'}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                          <User className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Not yet assigned</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {myTeamInfo && (
                              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <Users className="h-5 w-5 text-primary" />
                                  <h3 className="font-semibold text-lg">Your Team</h3>
                                  <Badge variant="secondary">Team {myTeamInfo.teamNumber}</Badge>
                                  <Badge variant="outline">{myTeamInfo.allPlayers.length} players</Badge>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Current user (me) */}
                                  <Link href={`/user/${user?.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={user?.profileImageUrl || undefined} />
                                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium hover:underline">{user?.mumblesVibeName || 'You'}</span>
                                  </Link>
                                  {/* Teammates */}
                                  {myTeamInfo.teammates.map((teammate, idx) => (
                                    <div key={teammate.entryId + ':' + teammate.slotIndex} className="flex items-center gap-2">
                                      <span className="text-muted-foreground">&</span>
                                      {teammate.userId ? (
                                        <Link href={`/user/${teammate.userId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={allTeamPlayerProfiles.find(p => p.id === teammate.userId)?.profileImageUrl || undefined} />
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium hover:underline">
                                            {allTeamPlayerProfiles.find(p => p.id === teammate.userId)?.mumblesVibeName || teammate.name}
                                          </span>
                                        </Link>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium text-muted-foreground">
                                            {teammate.name}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {myTeamInfo.teammates.length === 0 && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">&</span>
                                      <span className="text-sm text-muted-foreground">Awaiting teammates</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">Your Entry</h3>
                              {myEntry.teamName && (
                                <Badge variant="secondary">{myEntry.teamName}</Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              You have reserved {myEntry.playerCount || 1} {(myEntry.playerCount || 1) === 1 ? 'place' : 'places'} in this competition.
                            </p>

                            <div className="space-y-3">
                              {Array.from({ length: myEntry.playerCount || 1 }).map((_, index) => {
                                const isOwner = index === 0;
                                const assignedUserId = !isOwner && myEntry.assignedPlayerIds ? myEntry.assignedPlayerIds[index - 1] : null;
                                const isGuestPlayer = assignedUserId?.startsWith("guest:");
                                const guestPlayerName = isGuestPlayer ? assignedUserId.replace("guest:", "") : null;
                                const assignedConnection = assignedUserId && !isGuestPlayer ? userConnections.find(c => c.connectedUser.id === assignedUserId) : null;

                                return (
                                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                                      {index + 1}
                                    </div>
                                    
                                    {isOwner ? (
                                      <Link href={`/user/${user?.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                                        <Avatar className="h-10 w-10">
                                          <AvatarImage src={user?.profileImageUrl || undefined} />
                                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium hover:underline">{user?.mumblesVibeName || 'You'}</p>
                                          <p className="text-xs text-muted-foreground">Entry owner</p>
                                        </div>
                                      </Link>
                                    ) : isGuestPlayer ? (
                                      <div className="flex items-center gap-3 flex-1">
                                        <Avatar className="h-10 w-10">
                                          <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                            {guestPlayerName?.charAt(0).toUpperCase() || "G"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <p className="font-medium">{guestPlayerName}</p>
                                          <p className="text-xs text-muted-foreground">Guest player</p>
                                        </div>
                                        {!competitionStarted && (
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              setAssigningPlaceIndex(index);
                                              setAssignDialogOpen(true);
                                            }}
                                            data-testid={`button-change-player-${index}`}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ) : assignedConnection ? (
                                      <div className="flex items-center gap-3 flex-1">
                                        <Link href={`/user/${assignedConnection.connectedUser.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                                          <Avatar className="h-10 w-10">
                                            <AvatarImage src={assignedConnection.connectedUser.profileImageUrl || undefined} />
                                            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <p className="font-medium hover:underline">{assignedConnection.connectedUser.mumblesVibeName}</p>
                                            <p className="text-xs text-muted-foreground">Assigned player</p>
                                          </div>
                                        </Link>
                                        {!competitionStarted && (
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              setAssigningPlaceIndex(index);
                                              setAssignDialogOpen(true);
                                            }}
                                            data-testid={`button-change-player-${index}`}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ) : assignedUserId ? (
                                      <div className="flex items-center gap-3 flex-1">
                                        <Link href={`/user/${assignedUserId}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                                          <Avatar className="h-10 w-10">
                                            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <p className="font-medium hover:underline">Player Assigned</p>
                                            <p className="text-xs text-muted-foreground">Not in your connections</p>
                                          </div>
                                        </Link>
                                        {!competitionStarted && (
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              setAssigningPlaceIndex(index);
                                              setAssignDialogOpen(true);
                                            }}
                                            data-testid={`button-change-player-${index}`}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                          <User className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-muted-foreground">{competitionStarted ? "No player assigned" : "Not assigned"}</p>
                                          {!competitionStarted && (
                                            <p className="text-xs text-muted-foreground">Click to add a player</p>
                                          )}
                                        </div>
                                        {!competitionStarted && (
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => {
                                              setAssigningPlaceIndex(index);
                                              setAssignDialogOpen(true);
                                            }}
                                            data-testid={`button-add-player-${index}`}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {competitionStarted && (
                              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                                <Lock className="h-4 w-4 shrink-0" />
                                <span>Player selections are locked as the competition has started.</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="next-match" className="mt-0">
                    <Card>
                      <CardContent className="pt-6">
                        {linkedEvent.eventType === "team_competition" ? (
                          /* Teams list for team competitions */
                          competitionTeams.length === 0 ? (
                            <div className="text-center py-8">
                              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                              <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
                              <p className="text-muted-foreground">Teams haven't been generated for this competition yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-center mb-4">
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  {competitionTeams.length} Teams
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {competitionTeams.map((team) => {
                                  const slots = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
                                  const players = slots.map(slotId => {
                                    if (!slotId) return null;
                                    const [entryId, slotIndexStr] = slotId.split(':');
                                    const slotIndex = parseInt(slotIndexStr, 10);
                                    const entry = competitionEntries.find(e => e.id === entryId);
                                    if (!entry) return null;
                                    
                                    // Get per-player score from playerScores
                                    const playerScoresObj = (entry.playerScores as Record<number, number>) || {};
                                    const slotScore = playerScoresObj[slotIndex] ?? (slotIndex === 0 ? entry.score : null);
                                    
                                    // Slot 0 = entry owner, slots 1+ = assigned players
                                    if (slotIndex === 0) {
                                      const profile = allTeamPlayerProfiles.find(p => p.id === entry.userId);
                                      return { 
                                        name: profile?.mumblesVibeName || entry.playerNames?.[0] || entry.teamName || "Player", 
                                        userId: entry.userId,
                                        profileImage: profile?.profileImageUrl,
                                        entryId: entry.id,
                                        slotIndex: slotIndex,
                                        isEntryOwner: true,
                                        ownerUserId: entry.userId,
                                        score: slotScore
                                      };
                                    } else {
                                      const assignedUserId = entry.assignedPlayerIds?.[slotIndex - 1];
                                      if (assignedUserId) {
                                        const isGuest = assignedUserId.startsWith("guest:");
                                        if (isGuest) {
                                          return {
                                            name: assignedUserId.replace("guest:", ""),
                                            userId: null,
                                            profileImage: null,
                                            entryId: entry.id,
                                            slotIndex: slotIndex,
                                            isEntryOwner: false,
                                            ownerUserId: entry.userId,
                                            score: slotScore,
                                            isGuest: true
                                          };
                                        }
                                        const profile = allTeamPlayerProfiles.find(p => p.id === assignedUserId);
                                        return { 
                                          name: profile?.mumblesVibeName || entry.playerNames?.[slotIndex] || "Player", 
                                          userId: assignedUserId,
                                          profileImage: profile?.profileImageUrl,
                                          entryId: entry.id,
                                          slotIndex: slotIndex,
                                          isEntryOwner: false,
                                          ownerUserId: entry.userId,
                                          score: slotScore
                                        };
                                      }
                                      return { 
                                        name: entry.playerNames?.[slotIndex] || "TBD", 
                                        userId: null,
                                        profileImage: null,
                                        entryId: null,
                                        slotIndex: slotIndex,
                                        isEntryOwner: false,
                                        ownerUserId: entry.userId,
                                        score: null
                                      };
                                    }
                                  }).filter(Boolean);

                                  return (
                                    <div key={team.id} className="border rounded-lg p-4 bg-card">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20" data-testid={`badge-team-${team.id}`}>
                                            Team {team.teamNumber}
                                          </Badge>
                                          {team.teeTime && (
                                            <Badge variant="secondary" className="text-xs" data-testid={`text-teetime-${team.id}`}>
                                              {team.teeTime}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        {(() => {
                                          const userIsOnThisTeam = players.some((p: any) => p.userId === user?.id);
                                          return players.map((player: any, idx: number) => {
                                            const isCurrentUser = player.userId === user?.id;
                                            const canSubmitScore = (userIsOnThisTeam || isCreator) && player.entryId;
                                            const hasScore = player.score != null && player.score > 0;
                                            const format = (linkedEvent as any)?.competitionFormat;
                                            const isTeamOnlyFormat = format === "scramble" || format === "team_scramble" || format === "foursomes" || format === "foursomes_alternate";
                                            
                                            return (
                                              <div key={idx} className={`flex items-center justify-between gap-2 ${isCurrentUser ? 'bg-primary/10 -mx-2 px-2 py-1 rounded-md' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                  <Avatar className="h-6 w-6">
                                                    {player.profileImage && <AvatarImage src={player.profileImage} />}
                                                    <AvatarFallback className="text-xs">{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                  </Avatar>
                                                  {player.userId ? (
                                                    <Link href={`/user/${player.userId}`}>
                                                      <span className={`text-sm hover:text-primary cursor-pointer ${isCurrentUser ? 'font-semibold text-primary' : ''}`}>{player.name}</span>
                                                    </Link>
                                                  ) : (
                                                    <span className="text-sm text-muted-foreground">{player.name}</span>
                                                  )}
                                                </div>
                                                {/* Show individual stableford: for team members or admin, when enabled and not a team-only format */}
                                                {!isTeamOnlyFormat && canSubmitScore && linkedEvent.allowIndividualStableford && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto px-2 py-0 text-xs text-primary"
                                                    onClick={() => {
                                                      setScoreEntryId(player.entryId);
                                                      setScoreSlotIndex(player.slotIndex);
                                                      setScorePlayerName(player.name);
                                                      setScoreValue(hasScore ? player.score.toString() : "");
                                                      setShowScoreDialog(true);
                                                    }}
                                                    data-testid={`button-add-score-${player.slotIndex}`}
                                                  >
                                                    {hasScore ? `Stableford: ${player.score}` : "Add Stableford"}
                                                  </Button>
                                                )}
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                      {/* Team Score - visible for your own team or admin, hidden for matchplay/fourball/foursomes */}
                                      {(() => {
                                        const userIsOnThisTeam = players.some((p: any) => p.userId === user?.id);
                                        if (!userIsOnThisTeam && !isCreator) return null;
                                        const format = (linkedEvent as any)?.competitionFormat;
                                        if (format === "matchplay" || format === "fourball" || format === "foursomes_alternate") return null;
                                        const hasTeamScore = team.teamStableford != null && team.teamStableford > 0;
                                        const teamScoreLabel = format === "team_scramble" ? "Team Scramble Score" :
                                          format === "team_stableford" ? "Team Stableford" :
                                          format === "foursomes" ? "Foursomes Score" :
                                          format === "other" ? "Team Score" : "Team Score";
                                        return (
                                          <div className="mt-4 pt-3 border-t">
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-medium text-green-700 dark:text-green-400">{teamScoreLabel}</span>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => {
                                                  setTeamStablefordTeamId(team.id);
                                                  setTeamStablefordValue(hasTeamScore ? team.teamStableford!.toString() : "");
                                                  setTeamHandicapValue(team.teamHandicap != null ? team.teamHandicap.toString() : "");
                                                  setShowTeamStablefordDialog(true);
                                                }}
                                                data-testid={`button-team-stableford-${team.id}`}
                                              >
                                                {hasTeamScore ? team.teamStableford : "Enter"}
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        ) : !user ? (
                          <div className="text-center py-8">
                            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
                            <p className="text-muted-foreground">Sign in to view your match details.</p>
                          </div>
                        ) : myMatchData?.champion ? (
                          <div className="text-center py-8">
                            <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
                            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2">Champion!</h3>
                            <p className="text-muted-foreground">Congratulations! You won the competition!</p>
                          </div>
                        ) : myMatchData?.eliminated ? (
                          <div className="text-center py-8">
                            <X className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">Eliminated</h3>
                            <p className="text-muted-foreground">Better luck next time!</p>
                          </div>
                        ) : !myMatchData?.match ? (
                          <div className="text-center py-8">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Upcoming Match</h3>
                            <p className="text-muted-foreground">{myMatchData?.message || "The competition bracket hasn't been created yet."}</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="text-center">
                              <Badge variant="secondary" className="mb-2">
                                {myMatchData.match.roundName} - Match {myMatchData.match.matchNumber}
                              </Badge>
                              {myMatchData.match.deadline && (
                                <p className="text-sm text-muted-foreground">
                                  Deadline: {new Date(myMatchData.match.deadline).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-center gap-4">
                              <div className="flex-1 text-center p-4 border rounded-lg bg-primary/5">
                                <p className="text-xs text-muted-foreground mb-2">Your Team</p>
                                <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
                                  {myMatchData.match.yourTeam.players?.map((player: any, idx: number) => (
                                    player.userId ? (
                                      <Link key={idx} href={`/user/${player.userId}`}>
                                        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                          <AvatarImage src={player.image} />
                                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                      </Link>
                                    ) : (
                                      <Avatar key={idx} className="h-8 w-8">
                                        <AvatarImage src={player.image} />
                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                      </Avatar>
                                    )
                                  ))}
                                </div>
                                <div className="space-y-0.5">
                                  {myMatchData.match.yourTeam.players?.map((player: any, idx: number) => (
                                    player.userId ? (
                                      <Link key={idx} href={`/user/${player.userId}`} className="block">
                                        <p className="font-medium text-sm hover:text-primary cursor-pointer transition-colors">{player.name}</p>
                                      </Link>
                                    ) : (
                                      <p key={idx} className="font-medium text-sm">{player.name}</p>
                                    )
                                  ))}
                                </div>
                              </div>

                              <div className="text-2xl font-bold text-muted-foreground">VS</div>

                              <div className="flex-1 text-center p-4 border rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">Opponent</p>
                                {myMatchData.match.waitingForOpponent ? (
                                  <div className="py-4">
                                    <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                    <p className="text-sm text-muted-foreground">Waiting for opponent...</p>
                                  </div>
                                ) : myMatchData.match.opponentTeam ? (
                                  <>
                                    <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
                                      {myMatchData.match.opponentTeam.players?.map((player: any, idx: number) => (
                                        player.userId ? (
                                          <Link key={idx} href={`/user/${player.userId}`}>
                                            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                              <AvatarImage src={player.image} />
                                              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                            </Avatar>
                                          </Link>
                                        ) : (
                                          <Avatar key={idx} className="h-8 w-8">
                                            <AvatarImage src={player.image} />
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                          </Avatar>
                                        )
                                      ))}
                                    </div>
                                    <div className="space-y-0.5">
                                      {myMatchData.match.opponentTeam.players?.map((player: any, idx: number) => (
                                        player.userId ? (
                                          <Link key={idx} href={`/user/${player.userId}`} className="block">
                                            <p className="font-medium text-sm hover:text-primary cursor-pointer transition-colors">{player.name}</p>
                                          </Link>
                                        ) : (
                                          <p key={idx} className="font-medium text-sm">{player.name}</p>
                                        )
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-muted-foreground py-4">TBD</p>
                                )}
                              </div>
                            </div>

                            {/* Result Submission Section */}
                            {!myMatchData.match.waitingForOpponent && myMatchData.match.opponentTeam && (
                              <div className="border-t pt-6">
                                {myMatchData.match.resultSubmission ? (
                                  <div className="text-center space-y-4">
                                    {myMatchData.match.resultSubmission.submittedByYourTeam ? (
                                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                        <Clock className="h-8 w-8 mx-auto text-amber-600 dark:text-amber-400 mb-2" />
                                        <h4 className="font-medium text-amber-800 dark:text-amber-200">Awaiting Confirmation</h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                          You submitted that {myMatchData.match.resultSubmission.proposedWinnerIsYourTeam ? "your team" : "the opponent"} won.
                                          Waiting for opponent to confirm.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <AlertCircle className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                                        <h4 className="font-medium text-blue-800 dark:text-blue-200">Confirm Result</h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 mb-4">
                                          Opponent claims {myMatchData.match.resultSubmission.proposedWinnerIsYourTeam ? "your team" : "they"} won this match.
                                        </p>
                                        <div className="flex justify-center gap-3">
                                          <Button
                                            onClick={() => confirmResultMutation.mutate({ 
                                              matchId: myMatchData.match!.id, 
                                              confirmed: true 
                                            })}
                                            disabled={confirmResultMutation.isPending}
                                            data-testid="button-confirm-result"
                                          >
                                            {confirmResultMutation.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <Check className="h-4 w-4 mr-2" />
                                            )}
                                            Confirm Result
                                          </Button>
                                          <Button
                                            variant="outline"
                                            onClick={() => confirmResultMutation.mutate({ 
                                              matchId: myMatchData.match!.id, 
                                              confirmed: false 
                                            })}
                                            disabled={confirmResultMutation.isPending}
                                            data-testid="button-dispute-result"
                                          >
                                            <X className="h-4 w-4 mr-2" />
                                            Dispute
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center space-y-4">
                                    <h4 className="font-medium">Report Match Result</h4>
                                    <p className="text-sm text-muted-foreground">Who won this match?</p>
                                    <div className="flex justify-center gap-3">
                                      <Button
                                        onClick={() => submitResultMutation.mutate({ 
                                          matchId: myMatchData.match!.id, 
                                          proposedWinnerId: myMatchData.match!.yourTeam.id 
                                        })}
                                        disabled={submitResultMutation.isPending}
                                        data-testid="button-we-won"
                                      >
                                        {submitResultMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <Trophy className="h-4 w-4 mr-2" />
                                        )}
                                        We Won
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => submitResultMutation.mutate({ 
                                          matchId: myMatchData.match!.id, 
                                          proposedWinnerId: myMatchData.match!.opponentTeam!.id 
                                        })}
                                        disabled={submitResultMutation.isPending}
                                        data-testid="button-they-won"
                                      >
                                        They Won
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tee-times" className="mt-0">
                    <Card>
                      <CardContent className="pt-6">
                        {(() => {
                          const teamsWithTimes = competitionTeams
                            .filter((t: any) => t.teeTime)
                            .sort((a: any, b: any) => (a.teeTime || "").localeCompare(b.teeTime || ""));
                          
                          if (teamsWithTimes.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">No Tee Times Set</h3>
                                <p className="text-muted-foreground">Tee times haven't been assigned yet.</p>
                              </div>
                            );
                          }

                          const grouped: Record<string, typeof teamsWithTimes> = {};
                          for (const team of teamsWithTimes) {
                            const time = (team as any).teeTime;
                            if (!grouped[time]) grouped[time] = [];
                            grouped[time].push(team);
                          }

                          const sortedTimes = Object.keys(grouped).sort();

                          return (
                            <div className="space-y-4">
                              {sortedTimes.map((time) => {
                                const teams = grouped[time];
                                return (
                                <div key={time} className="border rounded-lg overflow-hidden" data-testid={`tee-time-group-${time}`}>
                                  <div className="bg-green-50 dark:bg-green-950/30 px-4 py-2 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-green-700 dark:text-green-400" />
                                    <span className="font-semibold text-green-800 dark:text-green-300" data-testid={`text-tee-time-${time}`}>{time}</span>
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                      {teams.reduce((count: number, team: any) => {
                                        const slots = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
                                        return count + slots.length;
                                      }, 0)} players
                                    </Badge>
                                  </div>
                                  <div className="divide-y">
                                    {teams.map((team: any) => {
                                      const slots = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
                                      const players = slots.map((slotId: string) => {
                                        if (!slotId) return null;
                                        const [entryId, slotIndexStr] = slotId.split(':');
                                        const slotIndex = parseInt(slotIndexStr, 10);
                                        const entry = competitionEntries.find((e: any) => e.id === entryId);
                                        if (!entry) return null;
                                        if (slotIndex === 0) {
                                          const profile = allTeamPlayerProfiles.find((p: any) => p.id === entry.userId);
                                          return { name: profile?.mumblesVibeName || entry.playerNames?.[0] || entry.teamName || "Player", profileImage: profile?.profileImageUrl, userId: entry.userId, isGuest: false };
                                        } else {
                                          const assignedUserId = entry.assignedPlayerIds?.[slotIndex - 1];
                                          if (assignedUserId) {
                                            const isGuest = assignedUserId.startsWith("guest:");
                                            if (isGuest) return { name: assignedUserId.replace("guest:", ""), profileImage: null, userId: null, isGuest: true };
                                            const profile = allTeamPlayerProfiles.find((p: any) => p.id === assignedUserId);
                                            return { name: profile?.mumblesVibeName || entry.playerNames?.[slotIndex] || "Player", profileImage: profile?.profileImageUrl, userId: assignedUserId, isGuest: false };
                                          }
                                          return { name: entry.playerNames?.[slotIndex] || "TBD", profileImage: null, userId: null, isGuest: false };
                                        }
                                      }).filter(Boolean);

                                      return (
                                        <div key={team.id} className="px-4 py-3">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20" data-testid={`tee-badge-team-${team.id}`}>
                                              Team {team.teamNumber}
                                            </Badge>
                                          </div>
                                          <div className="flex flex-wrap gap-3">
                                            {players.map((player: any, idx: number) => (
                                              <div key={idx} className="flex items-center gap-1.5">
                                                <Avatar className="h-6 w-6">
                                                  {player.profileImage && <AvatarImage src={player.profileImage} />}
                                                  <AvatarFallback className="text-xs">{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                {player.userId ? (
                                                  <Link href={`/user/${player.userId}`}>
                                                    <span className={`text-sm hover:text-primary cursor-pointer ${player.userId === user?.id ? 'font-semibold text-primary' : ''}`}>{player.name}</span>
                                                  </Link>
                                                ) : (
                                                  <span className={`text-sm ${player.isGuest ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>{player.name}</span>
                                                )}
                                                {idx < players.length - 1 && <span className="text-muted-foreground mx-0.5">&</span>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                              })}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="results" className="mt-0">
                    <Card>
                      <CardContent className="pt-6">
                        {linkedEvent.eventType === "team_competition" ? (
                          (() => {
                            // Get all players with scores from playerScores (per-player) or legacy score field
                            const playersWithScores: Array<{
                              entryId: string;
                              slotIndex: number;
                              userId: string;
                              name: string;
                              teamName: string | null;
                              profileImage: string | null;
                              score: number;
                            }> = [];
                            
                            competitionEntries.forEach(entry => {
                              const playerScoresObj = (entry.playerScores as Record<number, number>) || {};
                              
                              // Slot 0: entry owner
                              const ownerScore = playerScoresObj[0] ?? entry.score;
                              if (ownerScore != null && ownerScore > 0) {
                                const profile = allTeamPlayerProfiles.find(p => p.id === entry.userId);
                                playersWithScores.push({
                                  entryId: entry.id,
                                  slotIndex: 0,
                                  userId: entry.userId,
                                  name: profile?.mumblesVibeName || entry.playerNames?.[0] || entry.teamName || "Player",
                                  teamName: entry.teamName,
                                  profileImage: profile?.profileImageUrl || null,
                                  score: ownerScore
                                });
                              }
                              
                              if (entry.assignedPlayerIds && entry.assignedPlayerIds.length > 0) {
                                entry.assignedPlayerIds.forEach((assignedId, idx) => {
                                  if (assignedId) {
                                    const slotIdx = idx + 1;
                                    const slotScore = playerScoresObj[slotIdx];
                                    if (slotScore != null && slotScore > 0) {
                                      const isGuestEntry = assignedId.startsWith("guest:");
                                      const profile = !isGuestEntry ? allTeamPlayerProfiles.find(p => p.id === assignedId) : null;
                                      playersWithScores.push({
                                        entryId: entry.id,
                                        slotIndex: slotIdx,
                                        userId: isGuestEntry ? "" : assignedId,
                                        name: isGuestEntry ? assignedId.replace("guest:", "") : (profile?.mumblesVibeName || entry.playerNames?.[slotIdx] || "Player"),
                                        teamName: entry.teamName,
                                        profileImage: isGuestEntry ? null : (profile?.profileImageUrl || null),
                                        score: slotScore
                                      });
                                    }
                                  }
                                });
                              }
                            });
                            
                            const sortOrder = (linkedEvent as any).leagueTableSortOrder || "highest_first";
                            const sortMultiplier = sortOrder === "lowest_first" ? 1 : -1;
                            playersWithScores.sort((a, b) => sortMultiplier * (a.score - b.score));
                            
                            const hasTeamHandicap = linkedEvent.allowTeamHandicap;
                            const getNetScore = (t: any) => {
                              const gross = t.teamStableford || 0;
                              const handicap = t.teamHandicap || 0;
                              return gross - handicap;
                            };
                            const teamsSortedByStableford = [...competitionTeams].sort((a, b) => {
                              if (hasTeamHandicap) {
                                return sortMultiplier * (getNetScore(a) - getNetScore(b));
                              }
                              return sortMultiplier * ((a.teamStableford || 0) - (b.teamStableford || 0));
                            });
                            const teamsWithScores = teamsSortedByStableford.filter(t => t.teamStableford != null && t.teamStableford > 0);
                            
                            // Check if allowIndividualStableford is enabled
                            if (linkedEvent.allowIndividualStableford) {
                              // Show tabs for Team and Individual
                              return (
                                <Tabs defaultValue="team-leaderboard" className="w-full">
                                  <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="team-leaderboard" data-testid="tab-team-leaderboard">Team</TabsTrigger>
                                    <TabsTrigger value="individual-leaderboard" data-testid="tab-individual-leaderboard">Individual</TabsTrigger>
                                  </TabsList>
                                  
                                  {/* Team Leaderboard */}
                                  <TabsContent value="team-leaderboard">
                                    {teamsWithScores.length === 0 ? (
                                      <div className="text-center py-8">
                                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Team Scores Yet</h3>
                                        <p className="text-muted-foreground">No teams have submitted their scores yet.</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Team Leaderboard</h3>
                                        <div className="border rounded-lg overflow-hidden">
                                          <table className="w-full">
                                            <thead className="bg-muted/50">
                                              <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">Team</th>
                                                {hasTeamHandicap ? (
                                                  <>
                                                    <th className="px-4 py-3 text-right text-sm font-medium">Gross</th>
                                                    <th className="px-4 py-3 text-right text-sm font-medium">Handicap</th>
                                                    <th className="px-4 py-3 text-right text-sm font-medium">Net</th>
                                                  </>
                                                ) : (
                                                  <th className="px-4 py-3 text-right text-sm font-medium">Stableford</th>
                                                )}
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                              {(() => {
                                                const teamScores = teamsWithScores.map(t => hasTeamHandicap ? (t.teamStableford || 0) - (t.teamHandicap || 0) : (t.teamStableford || 0));
                                                return teamsWithScores.map((team, index) => {
                                                const slotIds = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
                                                const playerNames: string[] = [];
                                                slotIds.forEach((slotId: string) => {
                                                  const parts = slotId.includes(':') ? slotId.split(':') : [slotId, '0'];
                                                  const baseEntryId = parts[0];
                                                  const slotIndex = parseInt(parts[1], 10);
                                                  const entry = competitionEntries?.find(e => e.id === baseEntryId);
                                                  if (entry) {
                                                    if (slotIndex === 0) {
                                                      const profile = allTeamPlayerProfiles.find(p => p.id === entry.userId);
                                                      playerNames.push(profile?.mumblesVibeName || entry.playerNames?.[0] || entry.teamName || "Player");
                                                    } else {
                                                      const assignedPlayerIds = entry.assignedPlayerIds || [];
                                                      const assignedUserId = assignedPlayerIds[slotIndex - 1];
                                                      if (assignedUserId) {
                                                        if (assignedUserId.startsWith("guest:")) {
                                                          playerNames.push(assignedUserId.replace("guest:", ""));
                                                        } else {
                                                          const profile = allTeamPlayerProfiles.find(p => p.id === assignedUserId);
                                                          playerNames.push(profile?.mumblesVibeName || entry.playerNames?.[slotIndex] || `Player ${slotIndex + 1}`);
                                                        }
                                                      } else {
                                                        const pNames = entry.playerNames || [];
                                                        playerNames.push(pNames[slotIndex] || `Player ${slotIndex + 1}`);
                                                      }
                                                    }
                                                  }
                                                });
                                                const teamDisplayName = playerNames.length > 0 ? playerNames.join(" & ") : `Team ${team.teamNumber}`;
                                                const pos = getJointPosition(index, teamScores);
                                                
                                                return (
                                                  <tr key={team.id} className={pos.position === 1 && !pos.isJoint ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                                                    <td className="px-4 py-3 text-sm">
                                                      <PositionCell index={index} scores={teamScores} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                      <span className={`text-sm ${pos.position === 1 && !pos.isJoint ? 'font-semibold' : ''}`}>
                                                        {teamDisplayName}
                                                      </span>
                                                    </td>
                                                    {hasTeamHandicap ? (
                                                      <>
                                                        <td className="px-4 py-3 text-right">
                                                          <span className="text-sm text-muted-foreground">{team.teamStableford}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                          <span className="text-sm text-muted-foreground">{team.teamHandicap ?? '-'}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                          <span className={`text-sm font-medium ${pos.position === 1 && !pos.isJoint ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                                                            {(team.teamStableford || 0) - (team.teamHandicap || 0)}
                                                          </span>
                                                        </td>
                                                      </>
                                                    ) : (
                                                      <td className="px-4 py-3 text-right">
                                                        <span className={`text-sm font-medium ${pos.position === 1 && !pos.isJoint ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                                                          {team.teamStableford}
                                                        </span>
                                                      </td>
                                                    )}
                                                  </tr>
                                                );
                                              });
                                              })()}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </TabsContent>
                                  
                                  {/* Individual Leaderboard */}
                                  <TabsContent value="individual-leaderboard">
                                    {playersWithScores.length === 0 ? (
                                      <div className="text-center py-8">
                                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Scores Yet</h3>
                                        <p className="text-muted-foreground">No players have submitted their scores yet.</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Individual Leaderboard</h3>
                                        <div className="border rounded-lg overflow-hidden">
                                          <table className="w-full">
                                            <thead className="bg-muted/50">
                                              <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">Player</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">Stableford</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                              {(() => {
                                                const individualScores = playersWithScores.map(p => p.score);
                                                return playersWithScores.map((player, index) => {
                                                  const pos = getJointPosition(index, individualScores);
                                                  return (
                                                <tr key={`${player.entryId}:${player.slotIndex}`} className={pos.position === 1 && !pos.isJoint ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                                                  <td className="px-4 py-3 text-sm">
                                                    <PositionCell index={index} scores={individualScores} />
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                      <Avatar className="h-6 w-6">
                                                        {player.profileImage && <AvatarImage src={player.profileImage} />}
                                                        <AvatarFallback className="text-xs">{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                      </Avatar>
                                                      <Link href={`/user/${player.userId}`}>
                                                        <span className={`text-sm hover:text-primary cursor-pointer ${pos.position === 1 && !pos.isJoint ? 'font-semibold' : ''}`}>
                                                          {player.name}
                                                        </span>
                                                      </Link>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-right">
                                                    <span className={`text-sm font-medium ${pos.position === 1 && !pos.isJoint ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                                                      {player.score}
                                                    </span>
                                                  </td>
                                                </tr>
                                                );
                                              });
                                              })()}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              );
                            }
                            
                            // When allowIndividualStableford is NOT enabled, show Team Leaderboard only
                            if (teamsWithScores.length === 0) {
                              return (
                                <div className="text-center py-8">
                                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                  <h3 className="text-lg font-medium mb-2">No Team Scores Yet</h3>
                                  <p className="text-muted-foreground">No teams have submitted their scores yet.</p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Team Leaderboard</h3>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-muted/50">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Team</th>
                                        {hasTeamHandicap ? (
                                          <>
                                            <th className="px-4 py-3 text-right text-sm font-medium">Gross</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">Handicap</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">Net</th>
                                          </>
                                        ) : (
                                          <th className="px-4 py-3 text-right text-sm font-medium">Stableford</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {(() => {
                                        const teamScores2 = teamsWithScores.map(t => hasTeamHandicap ? (t.teamStableford || 0) - (t.teamHandicap || 0) : (t.teamStableford || 0));
                                        return teamsWithScores.map((team, index) => {
                                        const slotIds2 = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
                                        const playerNames: string[] = [];
                                        slotIds2.forEach((slotId: string) => {
                                          const parts = slotId.includes(':') ? slotId.split(':') : [slotId, '0'];
                                          const baseEntryId = parts[0];
                                          const slotIndex = parseInt(parts[1], 10);
                                          const entry = competitionEntries?.find(e => e.id === baseEntryId);
                                          if (entry) {
                                            if (slotIndex === 0) {
                                              const profile = allTeamPlayerProfiles.find(p => p.id === entry.userId);
                                              playerNames.push(profile?.mumblesVibeName || entry.playerNames?.[0] || entry.teamName || "Player");
                                            } else {
                                              const assignedPlayerIds = entry.assignedPlayerIds || [];
                                              const assignedUserId = assignedPlayerIds[slotIndex - 1];
                                              if (assignedUserId) {
                                                const profile = allTeamPlayerProfiles.find(p => p.id === assignedUserId);
                                                playerNames.push(profile?.mumblesVibeName || entry.playerNames?.[slotIndex] || `Player ${slotIndex + 1}`);
                                              } else {
                                                const pNames = entry.playerNames || [];
                                                playerNames.push(pNames[slotIndex] || `Player ${slotIndex + 1}`);
                                              }
                                            }
                                          }
                                        });
                                        const teamDisplayName = playerNames.length > 0 ? playerNames.join(" & ") : `Team ${team.teamNumber}`;
                                        const pos = getJointPosition(index, teamScores2);
                                        
                                        return (
                                          <tr key={team.id} className={pos.position === 1 && !pos.isJoint ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                                            <td className="px-4 py-3 text-sm">
                                              <PositionCell index={index} scores={teamScores2} />
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className={`text-sm ${pos.position === 1 && !pos.isJoint ? 'font-semibold' : ''}`}>
                                                {teamDisplayName}
                                              </span>
                                            </td>
                                            {hasTeamHandicap ? (
                                              <>
                                                <td className="px-4 py-3 text-right">
                                                  <span className="text-sm text-muted-foreground">{team.teamStableford}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <span className="text-sm text-muted-foreground">{team.teamHandicap ?? '-'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <span className={`text-sm font-medium ${pos.position === 1 && !pos.isJoint ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                                                    {(team.teamStableford || 0) - (team.teamHandicap || 0)}
                                                  </span>
                                                </td>
                                              </>
                                            ) : (
                                              <td className="px-4 py-3 text-right">
                                                <span className={`text-sm font-medium ${pos.position === 1 && !pos.isJoint ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                                                  {team.teamStableford}
                                                </span>
                                              </td>
                                            )}
                                          </tr>
                                        );
                                      });
                                      })()}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()
                        ) : !bracketData?.bracket ? (
                          <div className="text-center py-8">
                            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                            <p className="text-muted-foreground">The competition bracket hasn't been created yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {bracketData.rounds.map(round => {
                              const roundMatches = bracketData.matches.filter(m => m.roundId === round.id);
                              const completedMatches = roundMatches.filter(m => m.winnerId);
                              if (completedMatches.length === 0) return null;
                              
                              return (
                                <div key={round.id}>
                                  <h3 className="font-semibold mb-4">{round.roundName}</h3>
                                  <div className="space-y-4">
                                    {completedMatches.map(match => {
                                      const team1 = competitionTeams.find(t => t.id === match.team1Id);
                                      const team2 = competitionTeams.find(t => t.id === match.team2Id);
                                      const team1IsWinner = match.winnerId === match.team1Id;
                                      const team2IsWinner = match.winnerId === match.team2Id;
                                      
                                      const getTeamPlayers = (team: typeof team1) => {
                                        if (!team) return [];
                                        const slots = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
                                        return slots.map(slotId => {
                                          if (!slotId) return null;
                                          const [entryId, slotIndexStr] = slotId.split(':');
                                          const slotIndex = parseInt(slotIndexStr, 10);
                                          const entry = competitionEntries.find(e => e.id === entryId);
                                          if (!entry) return null;
                                          
                                          if (slotIndex === 0) {
                                            const member = groupMembers?.find(m => m.userId === entry.userId);
                                            return {
                                              userId: entry.userId,
                                              name: member?.name || entry.playerNames?.[0] || entry.teamName || "Player",
                                              image: member?.profileImageUrl || null
                                            };
                                          } else {
                                            const assignedUserId = entry.assignedPlayerIds?.[slotIndex - 1];
                                            if (assignedUserId) {
                                              const member = groupMembers?.find(m => m.userId === assignedUserId);
                                              return {
                                                userId: assignedUserId,
                                                name: member?.name || entry.playerNames?.[slotIndex] || "Player",
                                                image: member?.profileImageUrl || null
                                              };
                                            }
                                            return { userId: null, name: entry.playerNames?.[slotIndex] || "Player", image: null };
                                          }
                                        }).filter(Boolean);
                                      };
                                      
                                      const team1Players = getTeamPlayers(team1);
                                      const team2Players = getTeamPlayers(team2);
                                      
                                      return (
                                        <div key={match.id} className="border rounded-lg p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <Badge variant="secondary">Match {match.matchNumber}</Badge>
                                            {round.deadline && (
                                              <span className="text-xs text-muted-foreground">
                                                {new Date(round.deadline).toLocaleDateString()}
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="flex items-center justify-center gap-4">
                                            <div className={`flex-1 text-center p-3 border rounded-lg ${team1IsWinner ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30'}`}>
                                              {team1IsWinner && (
                                                <div className="flex items-center justify-center gap-1 mb-2">
                                                  <Trophy className="h-4 w-4 text-amber-500" />
                                                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Winner</span>
                                                </div>
                                              )}
                                              <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
                                                {team1Players.map((player: any, idx: number) => (
                                                  player?.userId ? (
                                                    <Link key={idx} href={`/user/${player.userId}`}>
                                                      <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                                        <AvatarImage src={player.image} />
                                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                      </Avatar>
                                                    </Link>
                                                  ) : (
                                                    <Avatar key={idx} className="h-8 w-8">
                                                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                    </Avatar>
                                                  )
                                                ))}
                                              </div>
                                              <div className="space-y-0.5">
                                                {team1Players.map((player: any, idx: number) => (
                                                  player?.userId ? (
                                                    <Link key={idx} href={`/user/${player.userId}`} className="block">
                                                      <p className={`text-sm hover:text-primary cursor-pointer transition-colors ${team1IsWinner ? 'font-semibold' : 'font-medium'}`}>{player.name}</p>
                                                    </Link>
                                                  ) : (
                                                    <p key={idx} className={`text-sm ${team1IsWinner ? 'font-semibold' : 'font-medium'}`}>{player?.name || "TBD"}</p>
                                                  )
                                                ))}
                                              </div>
                                            </div>

                                            <div className="text-xl font-bold text-muted-foreground">VS</div>

                                            <div className={`flex-1 text-center p-3 border rounded-lg ${team2IsWinner ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30'}`}>
                                              {team2IsWinner && (
                                                <div className="flex items-center justify-center gap-1 mb-2">
                                                  <Trophy className="h-4 w-4 text-amber-500" />
                                                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Winner</span>
                                                </div>
                                              )}
                                              <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
                                                {team2Players.map((player: any, idx: number) => (
                                                  player?.userId ? (
                                                    <Link key={idx} href={`/user/${player.userId}`}>
                                                      <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                                        <AvatarImage src={player.image} />
                                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                      </Avatar>
                                                    </Link>
                                                  ) : (
                                                    <Avatar key={idx} className="h-8 w-8">
                                                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                    </Avatar>
                                                  )
                                                ))}
                                              </div>
                                              <div className="space-y-0.5">
                                                {team2Players.map((player: any, idx: number) => (
                                                  player?.userId ? (
                                                    <Link key={idx} href={`/user/${player.userId}`} className="block">
                                                      <p className={`text-sm hover:text-primary cursor-pointer transition-colors ${team2IsWinner ? 'font-semibold' : 'font-medium'}`}>{player.name}</p>
                                                    </Link>
                                                  ) : (
                                                    <p key={idx} className={`text-sm ${team2IsWinner ? 'font-semibold' : 'font-medium'}`}>{player?.name || "TBD"}</p>
                                                  )
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="bracket" className="mt-0">
                    <Card>
                      <CardContent className="pt-6">
                        {!bracketData?.bracket ? (
                          <div className="text-center py-8">
                            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Bracket Yet</h3>
                            <p className="text-muted-foreground">The competition bracket hasn't been created yet.</p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm text-muted-foreground">Zoom: {Math.round(bracketZoom * 100)}%</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setBracketZoom(z => Math.max(0.25, z - 0.25))}
                                  disabled={bracketZoom <= 0.25}
                                  data-testid="button-bracket-zoom-out"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBracketZoom(1)}
                                  data-testid="button-bracket-zoom-reset"
                                >
                                  Reset
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setBracketZoom(z => Math.min(2, z + 0.25))}
                                  disabled={bracketZoom >= 2}
                                  data-testid="button-bracket-zoom-in"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/bracket/${group?.eventId}`, '_blank', 'noopener,noreferrer')}
                                  data-testid="button-bracket-fullscreen"
                                >
                                  <Maximize2 className="h-4 w-4 mr-2" />
                                  Full Screen
                                </Button>
                              </div>
                            </div>
                            <div className="overflow-auto border rounded-lg bg-muted/20" style={{ maxHeight: '70vh' }}>
                              <div 
                                className="flex gap-8 min-w-max p-4 origin-top-left transition-transform"
                                style={{ transform: `scale(${bracketZoom})` }}
                              >
                                {bracketData.rounds.map((round, roundIndex) => {
                                  const roundMatches = bracketData.matches
                                    .filter(m => m.roundId === round.id)
                                    .sort((a, b) => a.matchNumber - b.matchNumber);
                                  const matchHeight = 240;
                                  const gap = 24;
                                  const baseUnit = matchHeight + gap;
                                  const spacing = baseUnit * Math.pow(2, roundIndex);
                                  // Center each match between its two feeding matches
                                  // For round N, offset = (baseUnit * (2^N - 1)) / 2
                                  const topOffset = roundIndex === 0 ? 0 : (baseUnit * (Math.pow(2, roundIndex) - 1)) / 2;
                                  
                                  const getTeamPlayerNames = (team: any) => {
                                    if (!team) return [];
                                    const slots = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
                                    return slots.map((slotId: string) => {
                                      if (!slotId) return null;
                                      const [entryId, slotIndexStr] = slotId.split(':');
                                      const slotIndex = parseInt(slotIndexStr, 10);
                                      const entry = competitionEntries.find(e => e.id === entryId);
                                      if (!entry) return null;
                                      
                                      if (slotIndex === 0) {
                                        const member = groupMembers?.find(m => m.userId === entry.userId);
                                        return member?.name || entry.playerNames?.[0] || entry.teamName || "Player";
                                      } else {
                                        const assignedUserId = entry.assignedPlayerIds?.[slotIndex - 1];
                                        if (assignedUserId) {
                                          const member = groupMembers?.find(m => m.userId === assignedUserId);
                                          return member?.name || entry.playerNames?.[slotIndex] || "Player";
                                        }
                                        return entry.playerNames?.[slotIndex] || "Player";
                                      }
                                    }).filter(Boolean);
                                  };
                                  
                                  return (
                                    <div key={round.id} className="flex flex-col">
                                      <h4 className="font-semibold text-sm text-center mb-4 whitespace-nowrap sticky top-0 bg-muted/80 py-1 rounded">
                                        {round.roundName}
                                      </h4>
                                      <div 
                                        className="flex flex-col" 
                                        style={{ 
                                          gap: `${spacing - matchHeight}px`,
                                          marginTop: `${topOffset}px`
                                        }}
                                      >
                                        {roundMatches.map(match => {
                                          const team1 = competitionTeams.find(t => t.id === match.team1Id);
                                          const team2 = competitionTeams.find(t => t.id === match.team2Id);
                                          const team1Players = getTeamPlayerNames(team1);
                                          const team2Players = getTeamPlayerNames(team2);
                                          const hasTeams = team1 || team2;
                                          
                                          return (
                                            <div 
                                              key={match.id} 
                                              className="border rounded-lg p-3 w-56 bg-card overflow-hidden"
                                              style={{ height: `${matchHeight}px` }}
                                              data-testid={`bracket-match-${match.id}`}
                                            >
                                              <div className="mb-2">
                                                <span className="text-xs text-muted-foreground font-medium">Match {match.matchNumber}</span>
                                              </div>
                                              <div className={`p-2 rounded mb-1 ${match.winnerId === match.team1Id ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30'}`}>
                                                {team1 ? (
                                                  <div className="space-y-0.5">
                                                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Team {team1.teamNumber}</div>
                                                    {team1Players.map((name, i) => (
                                                      <div key={i} className="text-xs truncate">{name}</div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <span className="text-xs text-muted-foreground italic">TBD</span>
                                                )}
                                              </div>
                                              <div className="text-xs text-center text-muted-foreground font-medium py-1">vs</div>
                                              <div className={`p-2 rounded ${match.winnerId === match.team2Id ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30'}`}>
                                                {team2 ? (
                                                  <div className="space-y-0.5">
                                                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Team {team2.teamNumber}</div>
                                                    {team2Players.map((name, i) => (
                                                      <div key={i} className="text-xs truncate">{name}</div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <span className="text-xs text-muted-foreground italic">TBD</span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </>
              )}
            </Tabs>

            {/* Only show posts when on post tab for competition events */}
            {(!((linkedEvent?.eventType === "knockout" || linkedEvent?.eventType === "team_competition")) || competitionTab === "post") && (
              <>
                {postsLoading && eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : viewMode === "events" ? (
              <div className="space-y-4">
                {(() => {
                  const upcomingEvents = groupEvents
                    .filter(e => isEventUpcoming(e))
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                  
                  if (upcomingEvents.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Upcoming Events</h3>
                        <p className="text-muted-foreground">There are no upcoming events for this group.</p>
                      </div>
                    );
                  }
                  
                  return upcomingEvents.map(event => (
                    <EventCard key={`event-${event.id}`} event={event} userId={user?.id} groupId={group.id} />
                  ));
                })()}
              </div>
            ) : posts.length === 0 && groupEvents.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Posts Yet</h3>
                <p className="text-muted-foreground">Be the first to share something with the group!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  type FeedItem = { type: 'post'; data: GroupPost; createdAt: Date } | { type: 'event'; data: GroupEvent; createdAt: Date };
                  const feedItems: FeedItem[] = [
                    ...posts.map(post => ({ type: 'post' as const, data: post, createdAt: new Date(post.createdAt) })),
                    ...groupEvents.map(event => ({ type: 'event' as const, data: event, createdAt: new Date(event.createdAt) }))
                  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                  
                  return feedItems.map(item => 
                    item.type === 'post' 
                      ? <PostCard key={`post-${item.data.id}`} post={item.data} userId={user?.id} categories={articleCategories} siteSettings={siteSettings} />
                      : <EventCard key={`event-${item.data.id}`} event={item.data} userId={user?.id} groupId={group.id} />
                  );
                })()}
              </div>
            )}
              </>
            )}
          </div>
        )}
      </div>

      {activePostType && group && (
        <CreatePostDialog 
          postType={activePostType} 
          groupId={group.id}
          categories={articleCategories} 
          onClose={() => setActivePostType(null)} 
        />
      )}

      {showEventDialog && group && (
        <CreateEventDialog 
          groupId={group.id} 
          onClose={() => setShowEventDialog(false)} 
        />
      )}

      <ConfirmationDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Leave Group"
        description="Are you sure you want to leave this group? You will need to request to join again."
        confirmText="Leave"
        variant="destructive"
        onConfirm={() => leaveMutation.mutate()}
      />

      <Dialog open={assignDialogOpen} onOpenChange={(open) => {
        setAssignDialogOpen(open);
        if (!open) {
          setMemberSearchQuery("");
          setAssigningPlaceIndex(null);
          setAssignMode("connection");
          setGuestName("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assign Player to Place {assigningPlaceIndex !== null ? assigningPlaceIndex + 1 : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={assignMode === "connection" ? "default" : "outline"}
                size="sm"
                onClick={() => setAssignMode("connection")}
                className="flex-1"
                data-testid="button-assign-connection"
              >
                <Users className="h-4 w-4 mr-1" />
                Connection
              </Button>
              <Button
                variant={assignMode === "guest" ? "default" : "outline"}
                size="sm"
                onClick={() => setAssignMode("guest")}
                className="flex-1"
                data-testid="button-assign-guest"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Guest
              </Button>
            </div>

            {assignMode === "connection" ? (
              <>
                <Input
                  placeholder="Search your connections..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  data-testid="input-search-connections"
                />
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredConnections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {memberSearchQuery ? 'No connections found' : 'Type to search your connections'}
                    </p>
                  ) : (
                    filteredConnections.map(conn => {
                      const isAlreadyOnMyEntry = myEntry?.assignedPlayerIds?.includes(conn.connectedUser.id);
                      const isEntryOwner = competitionEntries.some(e => e.userId === conn.connectedUser.id);
                      const isAssignedElsewhere = competitionEntries.some(e => e.id !== myEntry?.id && e.assignedPlayerIds?.includes(conn.connectedUser.id));
                      const isAlreadyInCompetition = isEntryOwner || isAssignedElsewhere;
                      const isUnavailable = isAlreadyOnMyEntry || isAlreadyInCompetition;
                      return (
                        <div
                          key={conn.connectedUser.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg ${isUnavailable ? 'opacity-60 cursor-not-allowed' : 'hover-elevate cursor-pointer'}`}
                          onClick={() => {
                            if (!isUnavailable && myEntry && assigningPlaceIndex !== null) {
                              assignPlayerMutation.mutate({
                                entryId: myEntry.id,
                                placeIndex: assigningPlaceIndex,
                                assignedUserId: conn.connectedUser.id
                              });
                            }
                          }}
                          data-testid={`connection-option-${conn.connectedUser.id}`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conn.connectedUser.profileImageUrl || undefined} />
                            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{conn.connectedUser.mumblesVibeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {isAlreadyOnMyEntry ? 'Already added to your entry' : isAlreadyInCompetition ? 'Already entered' : 'Connected'}
                            </p>
                          </div>
                          {isAlreadyOnMyEntry ? (
                            <Badge variant="secondary">Added</Badge>
                          ) : isAlreadyInCompetition ? (
                            <Badge variant="secondary">Already Entered</Badge>
                          ) : assignPlayerMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add a guest who is not on the platform. Enter their name below.
                </p>
                <Input
                  placeholder="Guest name..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  data-testid="input-guest-name"
                />
                <Button
                  className="w-full"
                  disabled={!guestName.trim() || assignPlayerMutation.isPending}
                  onClick={() => {
                    if (myEntry && assigningPlaceIndex !== null && guestName.trim()) {
                      assignPlayerMutation.mutate({
                        entryId: myEntry.id,
                        placeIndex: assigningPlaceIndex,
                        assignedUserId: `guest:${guestName.trim()}`
                      });
                    }
                  }}
                  data-testid="button-confirm-guest"
                >
                  {assignPlayerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Assign Guest
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showScoreDialog} onOpenChange={(open) => {
        setShowScoreDialog(open);
        if (!open) {
          setScoreValue("");
          setScoreEntryId(null);
          setScoreSlotIndex(0);
          setScorePlayerName("");
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Enter Stableford{scorePlayerName ? ` for ${scorePlayerName}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {scorePlayerName ? `${scorePlayerName}'s Stableford points` : "Stableford points for this match"}
              </label>
              <Input
                type="number"
                placeholder="e.g., 67"
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
                min="1"
                data-testid="input-score"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowScoreDialog(false)}
                data-testid="button-cancel-score"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const entryId = scoreEntryId || myEntry?.id;
                  const score = parseInt(scoreValue, 10);
                  if (entryId && scoreValue && !isNaN(score) && score > 0) {
                    submitScoreMutation.mutate({
                      entryId,
                      score,
                      slotIndex: scoreSlotIndex
                    });
                  }
                }}
                disabled={!scoreValue || parseInt(scoreValue, 10) <= 0 || isNaN(parseInt(scoreValue, 10)) || submitScoreMutation.isPending}
                data-testid="button-submit-score"
              >
                {submitScoreMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Stableford
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Score Dialog */}
      <Dialog open={showTeamStablefordDialog} onOpenChange={(open) => {
        setShowTeamStablefordDialog(open);
        if (!open) {
          setTeamStablefordValue("");
          setTeamHandicapValue("");
          setTeamStablefordTeamId(null);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              {(linkedEvent as any)?.competitionFormat === "team_scramble" ? "Enter Team Scramble Score" :
               (linkedEvent as any)?.competitionFormat === "team_stableford" ? "Enter Team Stableford" :
               (linkedEvent as any)?.competitionFormat === "foursomes" ? "Enter Foursomes Score" :
               "Enter Team Score"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {(linkedEvent as any)?.competitionFormat === "team_scramble"
                  ? (linkedEvent?.allowTeamHandicap ? "Gross score" : "Total score for the team")
                  : (linkedEvent as any)?.competitionFormat === "foursomes"
                  ? (linkedEvent?.allowTeamHandicap ? "Gross Foursomes score" : "Total Foursomes score for the team")
                  : (linkedEvent?.allowTeamHandicap ? "Gross Stableford points" : "Total Stableford points for the team")}
              </label>
              <Input
                type="number"
                placeholder="e.g., 85"
                value={teamStablefordValue}
                onChange={(e) => setTeamStablefordValue(e.target.value)}
                className="text-lg"
                data-testid="input-team-stableford"
              />
            </div>
            {linkedEvent?.allowTeamHandicap && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Team Handicap
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 12"
                  value={teamHandicapValue}
                  onChange={(e) => setTeamHandicapValue(e.target.value)}
                  className="text-lg"
                  data-testid="input-team-handicap"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowTeamStablefordDialog(false)}
                data-testid="button-cancel-team-stableford"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (teamStablefordTeamId && teamStablefordValue) {
                    const handicapVal = teamHandicapValue ? parseInt(teamHandicapValue, 10) : null;
                    submitTeamStablefordMutation.mutate({
                      teamId: teamStablefordTeamId,
                      teamStableford: parseInt(teamStablefordValue, 10),
                      ...(linkedEvent?.allowTeamHandicap && handicapVal !== null ? { teamHandicap: handicapVal } : {})
                    });
                  }
                }}
                disabled={!teamStablefordValue || parseInt(teamStablefordValue, 10) <= 0 || isNaN(parseInt(teamStablefordValue, 10)) || submitTeamStablefordMutation.isPending}
                data-testid="button-submit-team-stableford"
              >
                {submitTeamStablefordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {(linkedEvent as any)?.competitionFormat === "team_scramble" ? "Submit Team Score" :
                 (linkedEvent as any)?.competitionFormat === "team_stableford" ? "Submit Team Stableford" :
                 (linkedEvent as any)?.competitionFormat === "foursomes" ? "Submit Foursomes Score" :
                 "Submit Team Score"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </FeatureGate>
  );
}
