// @ts-nocheck
"use client";

import { usePathname } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { Bell, UserPlus, UserCheck, UserX, MessageCircle, Trophy, Users, Swords, Check, Gamepad2, HandshakeIcon } from "lucide-react";
import {
  useGetSiteSettingsQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} from "@/store/api";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type NotificationType = "incoming_request" | "request_accepted" | "request_declined" | "new_message" | "competition_entry" | "competition_added" | "competition_removed" | "competition_winner" | "team_confirmed" | "first_match" | "match_result_submitted" | "play_request" | "play_request_offer" | "play_request_offer_withdrawn" | "play_request_offer_accepted" | "play_request_offer_rejected" | "group_membership_approved";

interface SiteSettings {
  logoUrl: string | null;
  platformName: string;
}

interface NotificationMetadata {
  eventName?: string;
  eventSlug?: string;
  teamName?: string;
  opponentName?: string;
  matchNumber?: number;
  playRequestId?: number;
  requesterName?: string;
  startDate?: string;
  startTime?: string;
  message?: string;
  offerUserName?: string;
  withdrawUserName?: string;
  requestOwnerName?: string;
  note?: string;
  responseNote?: string;
  groupId?: string;
  groupName?: string;
  groupSlug?: string;
  eventDate?: string;
  eventTime?: string;
  winnerNames?: string;
  loserNames?: string;
}

interface NotificationFromUser {
  id: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
}

interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  connectionId: number | null;
  messageId: number | null;
  fromUserId: string | null;
  eventId: string | null;
  teamId: string | null;
  matchId: string | null;
  playRequestId: number | null;
  metadata: string | null;
  isRead: boolean;
  createdAt: string;
  fromUser: NotificationFromUser | null;
}

export default function NotificationsPage() {
  const router = useTenantRouter();

  const { data: siteSettings } = useGetSiteSettingsQuery();

  const { data: notifications = [], isLoading } = useGetNotificationsQuery();

  const isSystemNotification = (type: NotificationType) => {
    return ["competition_entry", "competition_added", "competition_removed", "competition_winner", "team_confirmed", "first_match", "match_result_submitted"].includes(type);
  };

  const [markAllReadTrigger] = useMarkNotificationsReadMutation();

  const markAllRead = {
    mutate: () => { markAllReadTrigger().unwrap().catch(() => {}); },
    isPending: false,
  };

  const markAsRead = {
    mutate: (id: number) => { apiRequest("POST", `/api/notifications/${id}/read`).catch(() => {}); },
  };

  const parseMetadata = (metadata: string | null): NotificationMetadata => {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "incoming_request":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "request_accepted":
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case "request_declined":
        return <UserX className="h-5 w-5 text-red-500" />;
      case "new_message":
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      case "competition_entry":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case "competition_added":
        return <Trophy className="h-5 w-5 text-green-500" />;
      case "competition_removed":
        return <Trophy className="h-5 w-5 text-red-500" />;
      case "competition_winner":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case "team_confirmed":
        return <Users className="h-5 w-5 text-cyan-500" />;
      case "first_match":
        return <Swords className="h-5 w-5 text-orange-500" />;
      case "match_result_submitted":
        return <Swords className="h-5 w-5 text-amber-500" />;
      case "play_request":
        return <Gamepad2 className="h-5 w-5 text-green-500" />;
      case "play_request_offer":
        return <HandshakeIcon className="h-5 w-5 text-green-500" />;
      case "play_request_offer_withdrawn":
        return <HandshakeIcon className="h-5 w-5 text-orange-500" />;
      case "play_request_offer_accepted":
        return <HandshakeIcon className="h-5 w-5 text-green-600" />;
      case "play_request_offer_rejected":
        return <HandshakeIcon className="h-5 w-5 text-red-500" />;
      case "group_membership_approved":
        return <Users className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const name = notification.fromUser?.mumblesVibeName || "Someone";
    const meta = parseMetadata(notification.metadata);
    switch (notification.type) {
      case "incoming_request":
        return `${name} sent you a connection request`;
      case "request_accepted":
        return `${name} accepted your connection request`;
      case "request_declined":
        return `${name} declined your connection request`;
      case "new_message":
        return `${name} sent you a message`;
      case "competition_entry":
        return `You've entered ${meta.eventName || "the competition"}`;
      case "competition_added":
        return `You've been added to ${meta.eventName || "a competition"}${meta.eventDate ? ` on ${meta.eventDate}` : ""}${meta.eventTime ? ` at ${meta.eventTime}` : ""}`;
      case "competition_removed":
        return `You've been removed from ${meta.eventName || "a competition"}`;
      case "competition_winner":
        return `Congratulations! ${meta.winnerNames || "The winners"} won their final against ${meta.loserNames || "their opponents"}`;
      case "team_confirmed":
        return `Your team "${meta.teamName || "Team"}" has been confirmed for ${meta.eventName || "the competition"}`;
      case "first_match":
        return `Your first match is against ${meta.opponentName || "your opponent"} in ${meta.eventName || "the competition"}`;
      case "match_result_submitted":
        return `${meta.submitterName || "A player"} has submitted a match result in ${meta.eventName || "the competition"} — please confirm or dispute`;
      case "play_request":
        return `${meta.requesterName || name} is looking for a match`;
      case "play_request_offer":
        return `${meta.offerUserName || name} made an offer on your play request`;
      case "play_request_offer_withdrawn":
        return `${meta.withdrawUserName || name} withdrew their offer on your play request`;
      case "play_request_offer_accepted":
        return `${meta.requestOwnerName || name} accepted your offer to play`;
      case "play_request_offer_rejected":
        return `${meta.requestOwnerName || name} declined your offer to play`;
      case "group_membership_approved":
        return `You are now a member of ${meta.groupName || "the group"}`;
      default:
        return "You have a new notification";
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const meta = parseMetadata(notification.metadata);
    switch (notification.type) {
      case "incoming_request":
        return "/members?tab=requests";
      case "request_accepted":
      case "request_declined":
        return "/members?tab=connections";
      case "new_message":
        return notification.fromUserId ? `/members?chat=${notification.fromUserId}` : "/members";
      case "competition_added":
        return meta.groupSlug ? `/groups/${meta.groupSlug}` : (meta.eventSlug ? `/events/${meta.eventSlug}` : "/events");
      case "competition_removed":
        return meta.eventSlug ? `/events/${meta.eventSlug}` : "/events";
      case "competition_winner":
        return meta.eventSlug ? `/events/${meta.eventSlug}` : "/events";
      case "competition_entry":
      case "team_confirmed":
      case "first_match":
        return meta.eventSlug ? `/events/${meta.eventSlug}` : "/events";
      case "match_result_submitted":
        return meta.groupSlug ? `/groups/${meta.groupSlug}?tab=next-match` : (meta.eventSlug ? `/events/${meta.eventSlug}` : "/events");
      case "play_request":
        return (notification.playRequestId || meta.playRequestId) ? `/play/${notification.playRequestId || meta.playRequestId}` : "/play";
      case "play_request_offer":
      case "play_request_offer_withdrawn":
      case "play_request_offer_accepted":
      case "play_request_offer_rejected":
        return (notification.playRequestId || meta.playRequestId) ? `/play/${notification.playRequestId || meta.playRequestId}` : "/play";
      case "group_membership_approved":
        return meta.groupId ? `/groups/${meta.groupId}` : "/community";
      default:
        return "/members";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    router.push(getNotificationLink(notification));
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <CardTitle>Notifications</CardTitle>
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              data-testid="button-mark-all-read"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No notifications yet</p>
              <p className="text-sm mt-1">You'll see notifications here when there's activity</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-4 p-4 hover-elevate cursor-pointer ${
                    !notification.isRead ? "bg-accent/30" : ""
                  }`}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={isSystemNotification(notification.type) 
                        ? (siteSettings?.logoUrl || undefined)
                        : (notification.fromUser?.profileImageUrl || undefined)
                      }
                    />
                    <AvatarFallback>
                      {isSystemNotification(notification.type)
                        ? (siteSettings?.platformName?.charAt(0) || "S")
                        : (notification.fromUser?.mumblesVibeName?.charAt(0) || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <p className="text-sm">
                        {getNotificationMessage(notification)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
