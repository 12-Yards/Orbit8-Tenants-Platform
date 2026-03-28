"use client";

import Link from "@/components/tenant-link";
import { Bell, UserPlus, UserCheck, UserX, MessageCircle, Trophy, Users, Swords, Gamepad2, HandshakeIcon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetSiteSettingsQuery, useGetNotificationCountsQuery, useGetNotificationsQuery, useMarkNotificationsReadMutation } from "@/store/api";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

type NotificationType = "incoming_request" | "request_accepted" | "request_declined" | "new_message" | "competition_entry" | "competition_added" | "competition_removed" | "competition_winner" | "team_confirmed" | "first_match" | "match_result_submitted" | "play_request" | "play_request_offer" | "play_request_offer_withdrawn" | "play_request_offer_accepted" | "play_request_offer_rejected" | "group_membership_approved" | "tee_time_reservation" | "tee_time_accepted" | "tee_time_declined";

interface NotificationFromUser {
  id: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
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
  teeTimeOfferId?: number;
  winnerNames?: string;
  loserNames?: string;
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

interface NotificationCounts {
  incomingRequests: number;
  acceptedRequests: number;
  declinedRequests: number;
  newMessages: number;
  total: number;
}

interface SiteSettingsLocal {
  logoUrl: string | null;
  platformName: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: siteSettings } = useGetSiteSettingsQuery();

  const { data: counts } = useGetNotificationCountsQuery(undefined, { pollingInterval: 30000 });

  const { data: notifications = [], isLoading } = useGetNotificationsQuery(undefined, { skip: !open });

  const isSystemNotification = (type: NotificationType) => {
    return ["competition_entry", "competition_added", "competition_removed", "competition_winner", "team_confirmed", "first_match", "match_result_submitted"].includes(type);
  };

  const [markAllRead] = useMarkNotificationsReadMutation();

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    } catch {}
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
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "request_accepted":
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case "request_declined":
        return <UserX className="h-4 w-4 text-red-500" />;
      case "new_message":
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case "competition_entry":
        return <Trophy className="h-4 w-4 text-amber-500" />;
      case "competition_added":
        return <Trophy className="h-4 w-4 text-green-500" />;
      case "competition_removed":
        return <Trophy className="h-4 w-4 text-red-500" />;
      case "competition_winner":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "team_confirmed":
        return <Users className="h-4 w-4 text-cyan-500" />;
      case "first_match":
        return <Swords className="h-4 w-4 text-orange-500" />;
      case "match_result_submitted":
        return <Swords className="h-4 w-4 text-amber-500" />;
      case "play_request":
        return <Gamepad2 className="h-4 w-4 text-green-500" />;
      case "play_request_offer":
        return <HandshakeIcon className="h-4 w-4 text-green-500" />;
      case "play_request_offer_withdrawn":
        return <HandshakeIcon className="h-4 w-4 text-orange-500" />;
      case "play_request_offer_accepted":
        return <HandshakeIcon className="h-4 w-4 text-green-600" />;
      case "play_request_offer_rejected":
        return <HandshakeIcon className="h-4 w-4 text-red-500" />;
      case "group_membership_approved":
        return <Users className="h-4 w-4 text-green-500" />;
      case "tee_time_reservation":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "tee_time_accepted":
        return <Calendar className="h-4 w-4 text-green-600" />;
      case "tee_time_declined":
        return <Calendar className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
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
        return `${(meta as any).submitterName || "A player"} has submitted a match result in ${meta.eventName || "the competition"} — please confirm or dispute`;
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
      case "tee_time_reservation":
        return `${name} requested to join your tee time`;
      case "tee_time_accepted":
        return `Your tee time request has been accepted by ${name}`;
      case "tee_time_declined":
        return `Your tee time request was declined by ${name}`;
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
      case "tee_time_reservation":
      case "tee_time_accepted":
      case "tee_time_declined":
        return meta.teeTimeOfferId ? `/tee-time-offers/${meta.teeTimeOfferId}` : "/play";
      default:
        return "/members";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setOpen(false);
  };

  const unreadCount = counts?.total || 0;
  const unreadNotifications = notifications.filter((n: Notification) => !n.isRead);
  const recentNotifications = notifications.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-1 right-1 h-3.5 w-3.5 flex items-center justify-center p-0 text-[9px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => markAllRead()}
              data-testid="button-mark-all-read"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification: Notification) => (
                <Link
                  key={notification.id}
                  href={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={`flex items-start gap-3 p-3 hover-elevate cursor-pointer ${
                      !notification.isRead ? "bg-accent/30" : ""
                    }`}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={isSystemNotification(notification.type) 
                          ? (siteSettings?.logoUrl || undefined)
                          : (notification.fromUser?.profileImageUrl || undefined)
                        }
                      />
                      <AvatarFallback className="text-xs">
                        {isSystemNotification(notification.type)
                          ? (siteSettings?.platformName?.charAt(0) || "S")
                          : (notification.fromUser?.mumblesVibeName?.charAt(0) || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm line-clamp-2">
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
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            <Button
              variant="ghost"
              className="w-full text-sm"
              data-testid="button-view-all-notifications"
            >
              View all notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
