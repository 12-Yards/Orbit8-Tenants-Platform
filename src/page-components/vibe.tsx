"use client";

import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import { useGetVibesQuery, useGetMyGroupsQuery, useCreateVibeMutation, useDeleteVibeMutation, useReactToVibeMutation, useCreateVibeCommentMutation, useDeleteVibeCommentMutation } from "@/store/api";
import { SectionHeader } from "@/components/section-header";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Send, MessageSquare, Hand, Heart, Laugh, Flame, Trophy, ImagePlus, X, ChevronDown, ChevronUp, Reply, Plus, Lightbulb, HelpCircle, Pencil, Check, Expand, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vibe, VibeReaction, VibeCategory, VibeComment, VibeType, Group } from "@shared/schema";
import { vibeCategories } from "@shared/schema";
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

type PostType = "post" | "recommendation" | "ask";

const postTypeConfig: Record<PostType, { icon: React.ComponentType<{ className?: string }>; label: string; placeholder: string; defaultCategory: VibeCategory }> = {
  post: { 
    icon: Plus, 
    label: "Create Post", 
    placeholder: "What's happening in Mumbles today?",
    defaultCategory: "Social"
  },
  recommendation: { 
    icon: Lightbulb, 
    label: "Make a Recommendation", 
    placeholder: "Share your recommendation with the community...\n\nExample: The fish and chips at Joe's Ice Cream are amazing! Best I've ever had in Wales.",
    defaultCategory: "Food"
  },
  ask: { 
    icon: HelpCircle, 
    label: "Ask for Recommendations", 
    placeholder: "What would you like recommendations for?\n\nExample: Looking for the best coffee shop in Mumbles for working remotely. Needs good WiFi!",
    defaultCategory: "Food"
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
  const initials = comment.authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const [deleteCommentTrigger, { isLoading: isDeleting }] = useDeleteVibeCommentMutation();

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

function CommentsSection({ 
  vibe, 
  currentUserId 
}: { 
  vibe: VibeWithMeta; 
  currentUserId: string | null;
}) {
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const [createCommentTrigger, { isLoading: isCreatingComment }] = useCreateVibeCommentMutation();

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createCommentTrigger({ vibeId: vibe.id, body: { content: newComment, parentCommentId: replyingTo } })
      .unwrap()
      .then(() => {
        setNewComment("");
        setReplyingTo(null);
        toast({ title: replyingTo ? "Reply added" : "Comment added" });
      })
      .catch(() => toast({ title: "Failed to add comment", variant: "destructive" }));
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setShowComments(true);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

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

  return (
    <div className="border-t pt-3 w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="gap-2"
        data-testid={`button-toggle-comments-${vibe.id}`}
      >
        <MessageSquare className="h-4 w-4" />
        <span>{vibe.commentCount} {vibe.commentCount === 1 ? 'comment' : 'comments'}</span>
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
                  data-testid={`input-comment-${vibe.id}`}
                />
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!newComment.trim() || isCreatingComment}
                  data-testid={`button-submit-comment-${vibe.id}`}
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

function VibeCard({ vibe, currentUserId }: { vibe: VibeWithMeta; currentUserId: string | null }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(vibe.content);
  const [editImages, setEditImages] = useState<string[]>(vibe.imageUrls || []);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const EDIT_WINDOW_MINUTES = 5;

  useEffect(() => {
    if (!vibe.createdAt || currentUserId !== vibe.userId) return;

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
  }, [vibe.createdAt, vibe.userId, currentUserId]);

  const [deleteVibeTrigger, { isLoading: isDeletingVibe }] = useDeleteVibeMutation();
  const [reactTrigger, { isLoading: isReacting }] = useReactToVibeMutation();

  const handleDelete = () => {
    deleteVibeTrigger(vibe.id).unwrap()
      .then(() => toast({ title: "Vibe deleted" }))
      .catch(() => toast({ title: "Failed to delete vibe", variant: "destructive" }));
  };

  const handleEdit = () => {
    apiRequest("PATCH", `/api/vibes/${vibe.id}`, { content: editContent, imageUrls: editImages })
      .then(() => {
        toast({ title: "Vibe updated" });
        setIsEditing(false);
      })
      .catch(() => toast({ title: "Failed to update vibe", variant: "destructive" }));
  };

  const handleReact = (reactionType: string) => {
    reactTrigger({ vibeId: vibe.id, body: { reactionType } }).unwrap()
      .catch(() => toast({ title: "Please sign in to react", variant: "destructive" }));
  };

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

  return (
    <Card data-testid={`card-vibe-${vibe.id}`}>
      {vibeType !== "post" && (
        <div className={`px-4 py-2 border-b flex items-center gap-2 ${typeConfig.badgeClass}`}>
          <TypeIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{typeConfig.label}</span>
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {vibe.authorProfileImageUrl && (
              <AvatarImage src={vibe.authorProfileImageUrl} alt={vibe.authorName} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium" data-testid={`text-vibe-author-${vibe.id}`}>{vibe.authorName}</p>
              {vibe.edited && <span className="text-xs text-muted-foreground">(edited)</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              {vibe.createdAt ? formatDistanceToNow(new Date(vibe.createdAt), { addSuffix: true }) : "Just now"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${categoryColors[vibe.category as VibeCategory]} border-0`}>
            {vibe.category}
          </Badge>
          <Link href={`/vibe/${vibe.id}`}>
            <Button
              variant="ghost"
              size="icon"
              data-testid={`button-expand-vibe-${vibe.id}`}
            >
              <Expand className="h-4 w-4" />
            </Button>
          </Link>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditContent(vibe.content);
                setEditImages(vibe.imageUrls || []);
                setIsEditing(true);
              }}
              data-testid={`button-edit-vibe-${vibe.id}`}
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
              data-testid={`button-delete-vibe-${vibe.id}`}
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
              data-testid={`input-edit-vibe-${vibe.id}`}
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
                      data-testid={`button-remove-edit-image-${index}`}
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
                  data-testid={`button-cancel-edit-${vibe.id}`}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editContent.trim()}
                  data-testid={`button-save-edit-${vibe.id}`}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap" data-testid={`text-vibe-content-${vibe.id}`}>{vibe.content}</p>
        )}
        {!isEditing && imageUrls.length > 0 && (
          <div className={`grid gap-2 ${imageUrls.length === 1 ? 'grid-cols-1' : imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
            {imageUrls.map((url, index) => (
              <img 
                key={index}
                src={url} 
                alt={`Vibe image ${index + 1}`} 
                className="rounded-md max-h-96 object-contain"
                data-testid={`img-vibe-${vibe.id}-${index}`}
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
              onClick={() => handleReact(type)}
              disabled={isReacting || !currentUserId}
            />
          ))}
        </div>
        <CommentsSection vibe={vibe} currentUserId={currentUserId} />
      </CardFooter>
    </Card>
  );
}

function CreateVibeDialog({ postType, onClose }: { postType: PostType; onClose: () => void }) {
  const { toast } = useToast();
  const config = postTypeConfig[postType];
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<VibeCategory>(config.defaultCategory);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);

  const [createVibeTrigger, { isLoading: isCreatingVibe }] = useCreateVibeMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createVibeTrigger({ content, category, imageUrls, vibeType: postType })
      .unwrap()
      .then(() => {
        setContent("");
        setImageUrls([]);
        setShowImageUpload(false);
        toast({ title: postType === "ask" ? "Question posted!" : postType === "recommendation" ? "Recommendation shared!" : "Vibe posted!" });
        onClose();
      })
      .catch(() => toast({ title: "Failed to post", variant: "destructive" }));
  };

  const handleImageUploaded = (url: string) => {
    setImageUrls(prev => [...prev, url]);
    setCurrentUploadIndex(prev => prev + 1);
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const canAddMoreImages = imageUrls.length < 4;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder={config.placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[120px] resize-none"
        data-testid="input-vibe-content"
      />

      {imageUrls.length > 0 && (
        <div className={`grid gap-2 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {imageUrls.map((url, index) => (
            <div key={index} className="relative">
              <img 
                src={url} 
                alt={`Upload preview ${index + 1}`} 
                className="rounded-md max-h-32 w-full object-cover"
                data-testid={`img-vibe-preview-${index}`}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => removeImage(index)}
                data-testid={`button-remove-image-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showImageUpload && canAddMoreImages && (
        <ImageUpload
          key={currentUploadIndex}
          value=""
          onChange={handleImageUploaded}
          testId="vibe-image"
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={(v) => setCategory(v as VibeCategory)}>
            <SelectTrigger className="w-[180px]" data-testid="select-vibe-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {vibeCategories.map((cat) => (
                <SelectItem key={cat} value={cat} data-testid={`option-category-${cat}`}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canAddMoreImages && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowImageUpload(true)}
              data-testid="button-add-image"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
          )}
          {imageUrls.length > 0 && (
            <span className="text-xs text-muted-foreground">{imageUrls.length}/4 images</span>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={!content.trim() || isCreatingVibe}
          data-testid="button-post-vibe"
        >
          <Send className="h-4 w-4 mr-2" />
          {postType === "ask" ? "Ask" : postType === "recommendation" ? "Share" : "Post"}
        </Button>
      </div>
    </form>
  );
}

export default function VibePage() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activePostType, setActivePostType] = useState<PostType>("post");

  const { data: vibes, isLoading } = useGetVibesQuery();

  const { data: myGroups } = useGetMyGroupsQuery(undefined, { skip: !user });

  const handleOpenDialog = (type: PostType) => {
    setActivePostType(type);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <SEO 
        title="Community Vibe Board"
        description="Join the conversation on the Mumbles community board. Share what's happening, discover local tips, and connect with residents and visitors."
        canonicalUrl="/vibe"
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Share what's happening in Mumbles"
        />

        {user && myGroups && myGroups.length > 0 && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">My Groups:</span>
                </div>
                {myGroups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.slug}`}>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer"
                      data-testid={`badge-group-${group.id}`}
                    >
                      {group.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {user ? (
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-start">
              <Button 
                onClick={() => handleOpenDialog("post")}
                className="gap-2"
                data-testid="button-create-post"
              >
                <Plus className="h-4 w-4" />
                Create Post
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleOpenDialog("recommendation")}
                className="gap-2"
                data-testid="button-create-recommendation"
              >
                <Lightbulb className="h-4 w-4" />
                Make a Recommendation
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleOpenDialog("ask")}
                className="gap-2"
                data-testid="button-ask-recommendation"
              >
                <HelpCircle className="h-4 w-4" />
                Ask for Recommendations
              </Button>
              <Link href="/groups">
                <Button variant="outline" className="gap-2" data-testid="link-browse-groups">
                  <Users className="h-4 w-4" />
                  Browse All Groups
                </Button>
              </Link>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {activePostType === "post" && <Plus className="h-5 w-5" />}
                    {activePostType === "recommendation" && <Lightbulb className="h-5 w-5" />}
                    {activePostType === "ask" && <HelpCircle className="h-5 w-5" />}
                    {postTypeConfig[activePostType].label}
                  </DialogTitle>
                </DialogHeader>
                <Tabs value={activePostType} onValueChange={(v) => setActivePostType(v as PostType)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="post" className="gap-1">
                      <Plus className="h-3 w-3" />
                      <span className="hidden sm:inline">Post</span>
                    </TabsTrigger>
                    <TabsTrigger value="recommendation" className="gap-1">
                      <Lightbulb className="h-3 w-3" />
                      <span className="hidden sm:inline">Recommend</span>
                    </TabsTrigger>
                    <TabsTrigger value="ask" className="gap-1">
                      <HelpCircle className="h-3 w-3" />
                      <span className="hidden sm:inline">Ask</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="post" className="mt-4">
                    <CreateVibeDialog postType="post" onClose={() => setDialogOpen(false)} />
                  </TabsContent>
                  <TabsContent value="recommendation" className="mt-4">
                    <CreateVibeDialog postType="recommendation" onClose={() => setDialogOpen(false)} />
                  </TabsContent>
                  <TabsContent value="ask" className="mt-4">
                    <CreateVibeDialog postType="ask" onClose={() => setDialogOpen(false)} />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="mb-8 space-y-4">
            <Card>
              <CardContent className="py-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Sign in to share your vibes with the community</p>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Link href="/groups">
                <Button variant="outline" className="gap-2" data-testid="link-browse-groups-guest">
                  <Users className="h-4 w-4" />
                  Browse All Groups
                </Button>
              </Link>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-8">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vibes && vibes.length > 0 ? (
          <div className="space-y-4">
            {vibes.map((vibe) => (
              <VibeCard key={vibe.id} vibe={vibe} currentUserId={user?.id || null} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No vibes yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Be the first to share what's happening in Mumbles!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
