"use client";

import { useParams } from "next/navigation";
import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo";
import { ArrowLeft, Lock, Calendar, User as UserIcon, X, ChevronLeft, ChevronRight, Image as ImageIcon, Users, UserPlus, UserCheck, Clock, MessageCircle, UserX, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetUserProfileByIdQuery,
  useGetConnectionStatusQuery,
  useSendConnectionRequestMutation,
  useRemoveConnectionMutation,
} from "@/store/api";
import { useToast } from "@/hooks/use-toast";
import { ChatDialog } from "@/components/chat-dialog";

type ProfilePicture = {
  id: number;
  imageUrl: string;
  caption: string | null;
};

type CustomField = {
  label: string;
  value: string;
};

type UserGroup = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  role: string;
};

type PublicProfile = {
  id: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
  aboutMe: string | null;
  gender: string | null;
  ageGroup: string | null;
  profilePictures: ProfilePicture[] | string[];
  customFields: CustomField[];
  isProfilePublic: boolean;
  createdAt: string;
  groups?: UserGroup[];
};

function ImageLightbox({ 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}: { 
  images: ProfilePicture[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const currentImage = images[currentIndex];
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95"
      onClick={onClose}
    >
      <div className="absolute inset-0 flex">
        {images.length > 1 && (
          <button
            className="w-20 sm:w-24 flex-shrink-0 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            data-testid="button-prev-image"
          >
            <ChevronLeft className="h-12 w-12" />
          </button>
        )}
        
        <div 
          className="flex-1 flex flex-col items-center justify-center py-16 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={currentImage.imageUrl}
            alt={currentImage.caption || "Photo"}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
          {currentImage.caption && (
            <p className="mt-4 text-white text-center text-lg">{currentImage.caption}</p>
          )}
          <div className="mt-3 flex items-center gap-4">
            <p className="text-white/80 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
              {currentIndex + 1} of {images.length}
            </p>
          </div>
          <p className="mt-2 text-white/50 text-xs">
            Click outside image to close, or use arrow keys
          </p>
        </div>
        
        {images.length > 1 && (
          <button
            className="w-20 sm:w-24 flex-shrink-0 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            data-testid="button-next-image"
          >
            <ChevronRight className="h-12 w-12" />
          </button>
        )}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 bg-white/10 border-white/30 text-white hover:bg-white/20 h-12 w-12"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        data-testid="button-close-lightbox"
      >
        <X className="h-6 w-6" />
      </Button>
    </div>
  );
}

type ConnectionStatus = {
  status: "none" | "connected" | "pending_sent" | "pending_received";
  connectionId?: number;
};

export default function UserProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [userId]);

  const isOwnProfile = user?.id === userId;

  const { data: profile, isLoading, error } = useGetUserProfileByIdQuery(userId!, { skip: !userId }) as {
    data: PublicProfile | undefined;
    isLoading: boolean;
    error: any;
  };

  const isPrivate = error?.data?.isPrivate || (error?.status === 403);

  const { data: connectionStatus } = useGetConnectionStatusQuery(userId!, {
    skip: !userId || !isAuthenticated || isOwnProfile,
  }) as { data: ConnectionStatus | undefined };

  const [sendConnectionRequest, { isLoading: isSendingConnection }] = useSendConnectionRequestMutation();
  const [removeConnectionTrigger, { isLoading: isRemovingConnection }] = useRemoveConnectionMutation();

  const handleSendConnectionRequest = (message?: string) => {
    sendConnectionRequest({ 
      receiverId: userId,
      message: message || undefined
    })
      .unwrap()
      .then(() => {
        setShowConnectDialog(false);
        setConnectMessage("");
        toast({ title: "Connection request sent" });
      })
      .catch(() => {
        toast({ title: "Failed to send request", variant: "destructive" });
      });
  };

  const handleRemoveConnection = () => {
    if (connectionStatus?.connectionId) {
      removeConnectionTrigger(connectionStatus.connectionId)
        .unwrap()
        .then(() => {
          toast({ title: "Connection removed" });
        })
        .catch(() => {
          toast({ title: "Failed to remove connection", variant: "destructive" });
        });
    }
  };

  const normalizedPictures: ProfilePicture[] = profile?.profilePictures 
    ? profile.profilePictures.map((pic, i) => 
        typeof pic === 'string' 
          ? { id: i, imageUrl: pic, caption: null }
          : pic
      )
    : [];

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % normalizedPictures.length);
    }
  };
  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + normalizedPictures.length) % normalizedPictures.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 md:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen py-8 md:py-12">
        <SEO 
          title="Private Profile"
          description="This user's profile is private."
          noIndex={true}
        />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => window.history.back()} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Private Profile</h2>
              <p className="text-muted-foreground">
                This user has set their profile to private.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen py-8 md:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => window.history.back()} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <UserIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground">
                This user profile could not be found.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const initials = profile.mumblesVibeName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="min-h-screen py-8 md:py-12">
      <SEO 
        title={`${profile.mumblesVibeName}'s Profile`}
        description={profile.aboutMe || `View ${profile.mumblesVibeName}'s profile on MumblesVibe.`}
        noIndex={true}
      />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-6">
        <Button variant="ghost" className="mb-2" onClick={() => window.history.back()} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-28 w-28 ring-4 ring-background shadow-lg">
                {profile.profileImageUrl && (
                  <AvatarImage src={profile.profileImageUrl} alt={profile.mumblesVibeName} />
                )}
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="mt-4 flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.mumblesVibeName}</h1>
                {isAuthenticated && !isOwnProfile && connectionStatus?.status === "connected" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-connection-menu">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleRemoveConnection()}
                        disabled={isRemovingConnection}
                        className="text-destructive focus:text-destructive"
                        data-testid="button-remove-connection"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remove Connection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {profile.gender && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {profile.gender}
                  </Badge>
                )}
                {profile.ageGroup && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {profile.ageGroup}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">
                Member since {new Date(profile.createdAt).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>

              {isAuthenticated && !isOwnProfile && (
                <div className="mt-4 flex flex-col items-center gap-3">
                  {connectionStatus?.status === "connected" && (
                    <>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        Connected
                      </Badge>
                      <Button onClick={() => setShowChat(true)} data-testid="button-chat">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </>
                  )}
                  {connectionStatus?.status === "pending_sent" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Request Sent
                    </Badge>
                  )}
                  {connectionStatus?.status === "pending_received" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      Wants to connect with you
                    </Badge>
                  )}
                  {(!connectionStatus || connectionStatus.status === "none") && (
                    <Button
                      onClick={() => setShowConnectDialog(true)}
                      disabled={isSendingConnection}
                      data-testid="button-connect"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              )}
              
              {profile.aboutMe && (
                <div className="mt-6 w-full">
                  <p className="text-muted-foreground leading-relaxed">{profile.aboutMe}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {profile.customFields && profile.customFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About {profile.mumblesVibeName}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {profile.customFields.map((field, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:gap-4">
                    <dt className="font-medium text-sm sm:w-1/3">{field.label}</dt>
                    <dd className="text-muted-foreground sm:w-2/3">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {normalizedPictures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5" />
                Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {normalizedPictures.map((pic, index) => (
                  <button
                    key={pic.id}
                    className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg"
                    onClick={() => openLightbox(index)}
                    data-testid={`photo-${index}`}
                  >
                    <img
                      src={pic.imageUrl}
                      alt={pic.caption || `Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    {pic.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-white text-sm truncate">{pic.caption}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {profile.groups && profile.groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.groups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.slug}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer" data-testid={`group-${group.id}`}>
                      <Avatar className="h-10 w-10">
                        {group.imageUrl && <AvatarImage src={group.imageUrl} alt={group.name} />}
                        <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        {group.role === "admin" && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={normalizedPictures}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}

      {userId && (
        <ChatDialog 
          recipientId={showChat ? userId : null} 
          onClose={() => setShowChat(false)} 
        />
      )}

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Connection Request</DialogTitle>
            <DialogDescription>
              Connect with {profile?.mumblesVibeName || "this user"}. You can add an optional message to introduce yourself.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connect-message">Message (optional)</Label>
              <Textarea
                id="connect-message"
                placeholder="Hi! I'd like to connect with you..."
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
                maxLength={500}
                className="resize-none"
                rows={4}
                data-testid="input-connect-message"
              />
              <p className="text-xs text-muted-foreground text-right">
                {connectMessage.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConnectDialog(false);
                setConnectMessage("");
              }}
              data-testid="button-cancel-connect"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleSendConnectionRequest(connectMessage || undefined)}
              disabled={isSendingConnection}
              data-testid="button-send-connect"
            >
              {isSendingConnection ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
