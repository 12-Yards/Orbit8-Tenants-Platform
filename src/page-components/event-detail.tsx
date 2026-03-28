"use client";

import { useParams, usePathname } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useEffect, useMemo } from "react";
import {
  useGetEventBySlugQuery,
  useGetEventResultsQuery,
  useGetEventBracketQuery,
  useGetEventTeamsQuery,
  useGetEventEntriesQuery,
  useGetBatchUserProfilesQuery,
  useGetMyEventEntryQuery,
  useGetEventEntryCountQuery,
  useGetGroupByIdQuery,
  useGetEventAttendanceQuery,
  useGetMyEventAttendanceQuery,
  useGetEventMembershipQuery,
  useEnterEventMutation,
  api,
} from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import type { Event, EventEntry } from "@shared/schema";
import { ArrowLeft, MapPin, Calendar, Clock, Ticket, ExternalLink, Share2, Users, Loader2, UserCheck, Trophy, CreditCard, AlertCircle, CheckCircle, CalendarCheck, Download, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SEO } from "@/components/seo";
import { format, parseISO } from "date-fns";
import { ShareButtons } from "@/components/share-buttons";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function EventDetail() {
  const params = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const router = useTenantRouter();
  const dispatch = useAppDispatch();
  const [showEntryConfirmation, setShowEntryConfirmation] = useState(false);
  const [showEntrySuccess, setShowEntrySuccess] = useState(false);
  const [entryResult, setEntryResult] = useState<{
    placesReserved: number;
    joinedGroup: { id: string; name: string; slug: string } | null;
  } | null>(null);
  const [entrantName, setEntrantName] = useState("");
  const [signupType, setSignupType] = useState<"team" | "individual">("team");
  const [playerCount, setPlayerCount] = useState(1);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFailed, setShowPaymentFailed] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  const { data: event, isLoading, error } = useGetEventBySlugQuery(params.slug as string, { skip: !params.slug });

  const { data: resultsData, isLoading: resultsLoading } = useGetEventResultsQuery(event?.id as string, {
    skip: !showResultsDialog || !event?.id,
  });

  const { data: bracketData } = useGetEventBracketQuery(event?.id as string, {
    skip: !showResultsDialog || !event?.id || event?.eventType !== "knockout",
  });

  const { data: competitionTeams = [] } = useGetEventTeamsQuery(event?.id as string, {
    skip: !showResultsDialog || !event?.id || event?.eventType !== "knockout",
  });

  const { data: competitionEntries = [] } = useGetEventEntriesQuery(event?.id as string, {
    skip: !showResultsDialog || !event?.id || event?.eventType !== "knockout",
  });

  const bracketPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    competitionEntries.forEach((entry: any) => {
      if (entry.userId) ids.add(entry.userId);
      if (entry.assignedPlayerIds) {
        entry.assignedPlayerIds.forEach((id: string) => {
          if (id && !id.startsWith("guest:")) ids.add(id);
        });
      }
    });
    return Array.from(ids);
  }, [competitionEntries]);

  const { data: bracketProfiles = [] } = useGetBatchUserProfilesQuery(bracketPlayerIds.join(','), {
    skip: !showResultsDialog || bracketPlayerIds.length === 0,
  });

  const getTeamPlayerNames = (team: any) => {
    if (!team) return [];
    const slots = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
    return slots.map((slotId: string) => {
      if (!slotId) return null;
      const [entryId, slotIndexStr] = slotId.split(':');
      const slotIndex = parseInt(slotIndexStr, 10);
      const entry = competitionEntries.find((e: any) => e.id === entryId);
      if (!entry) return null;
      if (slotIndex === 0) {
        const profile = bracketProfiles?.find((p: any) => p.id === entry.userId);
        return profile?.mumblesVibeName || entry.playerNames?.[0] || entry.teamName || "Player";
      } else {
        const assignedUserId = entry.assignedPlayerIds?.[slotIndex - 1];
        if (assignedUserId) {
          if (assignedUserId.startsWith("guest:")) return assignedUserId.replace("guest:", "");
          const profile = bracketProfiles?.find((p: any) => p.id === assignedUserId);
          return profile?.mumblesVibeName || entry.playerNames?.[slotIndex] || "Player";
        }
        return entry.playerNames?.[slotIndex] || "Player";
      }
    }).filter(Boolean);
  };

  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const sessionId = urlParams.get("session_id");
    if (paymentStatus === "success") {
      setShowPaymentSuccess(true);
      if (sessionId) {
        setPendingSessionId(sessionId);
      }
      dispatch(api.util.invalidateTags(["Events"]));
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paymentStatus === "canceled") {
      setShowPaymentFailed(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [params.slug]);

  useEffect(() => {
    if (pendingSessionId && event?.id) {
      apiRequest("POST", `/api/events/${event.id}/verify-payment`, { sessionId: pendingSessionId })
        .then(() => {
          dispatch(api.util.invalidateTags(["Events", "EventEntries"]));
        })
        .catch((err: any) => console.error("Payment verification:", err))
        .finally(() => setPendingSessionId(null));
    }
  }, [pendingSessionId, event?.id]);

  const { data: membershipData } = useGetEventMembershipQuery(event?.id as string, {
    skip: !event?.id || !event?.isEventGroup || !isAuthenticated,
  });

  // Competition entry queries (knockout, team_competition, or individual_competition)
  const isCompetition = event?.eventType === "knockout" || event?.eventType === "team_competition" || event?.eventType === "individual_competition";
  
  const { data: entryStatus } = useGetMyEventEntryQuery(event?.id as string, {
    skip: !event?.id || !isCompetition || !isAuthenticated,
  });

  const { data: entryCountData } = useGetEventEntryCountQuery(event?.id as string, {
    skip: !event?.id || !isCompetition,
  });

  const { data: linkedGroup } = useGetGroupByIdQuery(event?.linkedGroupId as string, {
    skip: !event?.linkedGroupId || !isCompetition,
  });

  const isSocialOrStandard = event?.eventType === "standard" || event?.eventType === "social";

  const { data: attendanceData } = useGetEventAttendanceQuery(event?.id as string, {
    skip: !event?.id || !isSocialOrStandard,
  });

  const { data: myAttendance } = useGetMyEventAttendanceQuery(event?.id as string, {
    skip: !event?.id || !isSocialOrStandard || !isAuthenticated,
  });

  const [setAttendanceLoading, setSetAttendanceLoading] = useState(false);

  const handleSetAttendance = async (status: string) => {
    setSetAttendanceLoading(true);
    try {
      const res = await apiRequest("POST", `/api/events/${event!.id}/set-attendance`, { status });
      dispatch(api.util.invalidateTags(["EventAttendance", "Calendar"]));
      const messages: Record<string, { title: string; description: string }> = {
        attending: { title: "You're attending!", description: "This event has been added to your calendar." },
        maybe: { title: "Marked as maybe", description: "This event has been added to your calendar as tentative." },
        not_attending: { title: "Attendance removed", description: "This event has been removed from your calendar." },
      };
      const data = res?.data || { status };
      const msg = messages[data.status] || messages[status] || messages.not_attending;
      toast(msg);
    } catch {
      toast({ title: "Failed to update attendance", variant: "destructive" });
    } finally {
      setSetAttendanceLoading(false);
    }
  };

  const downloadTicket = () => {
    if (!event || !myAttendance?.ticketNumber || !user) return;
    const canvas = document.createElement("canvas");
    const scale = 2;
    const cw = 420;
    const ch = 320;
    canvas.width = cw * scale;
    canvas.height = ch * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    const r = 16;
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(cw - r, 0);
    ctx.quadraticCurveTo(cw, 0, cw, r);
    ctx.lineTo(cw, ch - r);
    ctx.quadraticCurveTo(cw, ch, cw - r, ch);
    ctx.lineTo(r, ch);
    ctx.quadraticCurveTo(0, ch, 0, ch - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(event.name, 24, 42);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`At ${event.venueName || "TBC"}`, 24, 78);

    const eventDate = new Date(event.startDate);
    const dateStr = eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.fillText("Date:", 24, 112);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "15px sans-serif";
    ctx.fillText(dateStr, 68, 112);

    const displayName = user.mumblesVibeName || user.email;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.fillText("Name:", 24, 148);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "15px sans-serif";
    ctx.fillText(displayName, 74, 148);
    const nameW = ctx.measureText(displayName).width;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.fillText("Places: 1", 74 + nameW + 16, 148);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.fillText("Ticket No:", 24, 184);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(String(myAttendance.ticketNumber), 102, 184);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(24, 210);
    ctx.lineTo(cw - 24, 210);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#93c5fd";
    ctx.font = "italic 14px sans-serif";
    ctx.fillText("Admit holder only  -  Keep this stub", 24, 250);

    ctx.fillStyle = "#475569";
    ctx.font = "11px sans-serif";
    ctx.fillText("Golf Junkies", 24, 290);

    const link = document.createElement("a");
    link.download = `ticket-${myAttendance.ticketNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const [enterEventTrigger, { isLoading: enterEventLoading }] = useEnterEventMutation();

  const handleEnterEvent = (data: { name: string; signupType: "team" | "individual"; playerCount: number }) => {
    enterEventTrigger({
      eventId: event!.id,
      body: {
        teamName: data.name,
        signupType: data.signupType,
        playerCount: data.playerCount,
      },
    })
      .unwrap()
      .then((result: any) => {
        setShowEntryConfirmation(false);
        
        if (result.paymentRequired && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
          return;
        }
        
        setEntryResult({
          placesReserved: result.placesReserved || 1,
          joinedGroup: result.joinedGroup || null,
        });
        setShowEntrySuccess(true);
        setEntrantName("");
        setSignupType("team");
        setPlayerCount(1);
      })
      .catch((error: any) => {
        toast({
          title: "Entry Failed",
          description: error?.data?.message || "Failed to enter competition",
          variant: "destructive",
        });
      });
  };

  const [joinEventGroupLoading, setJoinEventGroupLoading] = useState(false);

  const handleJoinEventGroup = async () => {
    setJoinEventGroupLoading(true);
    try {
      const res = await apiRequest("POST", `/api/events/${event!.id}/join-group`, {});
      toast({ title: "Joined!", description: "You've joined the event community." });
      dispatch(api.util.invalidateTags(["Events", "Groups", "GroupMembers"]));
      if (res?.data?.groupSlug) {
        router.push(`/groups/${res.data.groupSlug}`);
      }
    } catch {
      toast({ title: "Failed to join", variant: "destructive" });
    } finally {
      setJoinEventGroupLoading(false);
    }
  };

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

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/events">
          <Button data-testid="button-back-events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  const startDate = parseISO(event.startDate);
  const endDate = event.endDate ? parseISO(event.endDate) : null;

  const formatEventDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const formatEventTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  return (
    <FeatureGate feature="featureEventsStandard" featureName="Events">
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <SEO 
          title={event.name}
          description={event.summary}
          canonicalUrl={`/events/${event.slug}`}
          ogType="article"
          ogImage={event.imageUrl}
        />
        <Link href="/events">
          <Button variant="ghost" className="mb-6" data-testid="button-back-events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </Link>

      <div className="relative mb-8 rounded-lg overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="w-full h-64 md:h-96 object-cover"
          data-testid="img-event-hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {isCompetition && event.maxEntries && entryCountData && entryCountData.count >= event.maxEntries && (
          <div className="absolute top-4 right-4" data-testid="badge-detail-competition-full">
            <Badge className="bg-red-500 text-white border-red-500 text-sm px-4 py-1.5 no-default-hover-elevate no-default-active-elevate">
              Competition Full
            </Badge>
          </div>
        )}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {(event.tags as string[])?.map((tag) => (
              <Badge key={tag} variant="secondary" data-testid={`badge-tag-${tag}`}>
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white" data-testid="text-event-name">
            {event.name}
          </h1>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">About This Event</h2>
            <p className="text-muted-foreground mb-4" data-testid="text-event-summary">
              {event.summary}
            </p>
            <div className="whitespace-pre-wrap" data-testid="text-event-description">
              {event.description}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium" data-testid="text-event-date">
                    {formatEventDate(startDate)}
                  </div>
                  {endDate && (
                    <div className="text-sm text-muted-foreground">
                      to {formatEventDate(endDate)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium" data-testid="text-event-time">
                    {formatEventTime(startDate)}
                  </div>
                  {endDate && (
                    <div className="text-sm text-muted-foreground">
                      until {formatEventTime(endDate)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium" data-testid="text-event-venue">
                    {event.venueName}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="text-event-address">
                    {event.address}
                  </div>
                </div>
              </div>

              {event.ticketUrl && (
                <Button className="w-full" asChild data-testid="button-get-tickets">
                  <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                    <Ticket className="h-4 w-4 mr-2" />
                    Get Tickets
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              )}

              {event.isEventGroup && !isCompetition && (
                membershipData?.isMember ? (
                  <Button className="w-full" asChild data-testid="button-view-community">
                    <Link href={`/groups/${membershipData.groupSlug}`}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      View Community
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast({ description: "Please sign in to join event communities" });
                        return;
                      }
                      handleJoinEventGroup();
                    }}
                    disabled={joinEventGroupLoading}
                    data-testid="button-join-event-group"
                  >
                    {joinEventGroupLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Join Event Community
                  </Button>
                )
              )}

              {isSocialOrStandard && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Are you going?</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant={myAttendance?.status === "attending" ? "default" : "outline"}
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast({ description: "Please sign in to mark attendance" });
                          return;
                        }
                        handleSetAttendance(myAttendance?.status === "attending" ? "not_attending" : "attending");
                      }}
                      disabled={setAttendanceLoading}
                      data-testid="button-attending"
                    >
                      Yes
                    </Button>
                    <Button 
                      variant={myAttendance?.status === "maybe" ? "secondary" : "outline"}
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast({ description: "Please sign in to mark attendance" });
                          return;
                        }
                        handleSetAttendance(myAttendance?.status === "maybe" ? "not_attending" : "maybe");
                      }}
                      disabled={setAttendanceLoading}
                      data-testid="button-maybe"
                    >
                      Maybe
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast({ description: "Please sign in to mark attendance" });
                          return;
                        }
                        handleSetAttendance("not_attending");
                      }}
                      disabled={setAttendanceLoading || !myAttendance?.status || myAttendance.status === "not_attending"}
                      data-testid="button-not-attending"
                    >
                      No
                    </Button>
                  </div>
                  {(attendanceData && (attendanceData.attending > 0 || attendanceData.maybe > 0)) && (
                    <div className="text-sm text-muted-foreground text-center space-y-0.5" data-testid="text-attendance-count">
                      {attendanceData.attending > 0 && (
                        <p>{attendanceData.attending} {attendanceData.attending === 1 ? "person" : "people"} attending</p>
                      )}
                      {attendanceData.maybe > 0 && (
                        <p>{attendanceData.maybe} {attendanceData.maybe === 1 ? "person" : "people"} interested</p>
                      )}
                    </div>
                  )}
                  {myAttendance?.status === "attending" && myAttendance.ticketNumber && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={downloadTicket}
                      data-testid="button-download-ticket"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Ticket
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isCompetition && (() => {
            const currentEntries = entryCountData?.count || 0;
            const remainingSpaces = event.maxEntries ? event.maxEntries - currentEntries : null;
            const isFull = event.maxEntries ? currentEntries >= event.maxEntries : false;
            const hasEntered = entryStatus?.hasEntered || false;
            const deadlinePassed = event.signupDeadline ? new Date() > new Date(event.signupDeadline) : false;
            const formatLabels: Record<string, string> = {
              team_stableford: "Team Stableford",
              texas_scramble: "Texas Scramble",
              florida_scramble: "Florida Scramble",
              foursomes: "Foursomes",
              "4bbb": "4BBB",
              greensomes: "Greensomes",
              gruesomes: "Gruesomes",
              pinehurst_foursomes: "Pinehurst Foursomes",
              "2_person_scramble": "2-Person Scramble",
              foursomes_alternate: "Foursomes/Alternate",
              scramble: "Scramble",
              best_ball: "Best Ball",
              stableford: "Stableford",
              stroke_play: "Stroke Play",
              fourball: "Fourball",
              alternate_shot: "Alternate Shot",
              matchplay: "Matchplay",
              other: "Other"
            };
            const competitionFormat = (event as any).competitionFormat;

            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {event.eventType === "knockout" ? (
                      <Trophy className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Users className="h-5 w-5 text-green-500" />
                    )}
                    {event.eventType === "team_competition" && event.teamSize && event.teamSize > 1 ? "Team Competition Details" : "Competition Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(event.eventType === "team_competition" || event.eventType === "individual_competition" || event.eventType === "knockout") && competitionFormat && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Format</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {competitionFormat === "team_stableford" && (!event.teamSize || event.teamSize <= 1) ? "Stableford" : (formatLabels[competitionFormat] || competitionFormat)}
                      </Badge>
                    </div>
                  )}
                  {event.maxEntries && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Entries</span>
                      <span className={`font-medium ${isFull ? 'text-green-600' : ''}`} data-testid="text-entries">
                        {currentEntries} / {event.maxEntries}
                      </span>
                    </div>
                  )}
                  {event.teamSize && event.eventType !== "individual_competition" && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Team Size</span>
                      <span className="font-medium" data-testid="text-team-size">{event.teamSize} players</span>
                    </div>
                  )}
                  {event.entryFee && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Entry Fee per Person</span>
                      <span className="font-semibold text-lg" data-testid="text-entry-fee">£{Number(event.entryFee).toFixed(2)}</span>
                    </div>
                  )}
                  {event.signupDeadline && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className={`font-medium ${deadlinePassed ? 'text-destructive' : ''}`} data-testid="text-signup-deadline">
                        {format(parseISO(event.signupDeadline), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  <div className="pt-2">
                    {hasEntered ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-green-700 dark:text-green-300" data-testid="text-already-entered">
                            You're Entered!
                          </span>
                        </div>
                        {linkedGroup && (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => router.push(`/groups/${linkedGroup.slug}`)}
                            data-testid="button-competition-group"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Competition Group
                          </Button>
                        )}
                      </div>
                    ) : isFull ? (
                      <Button className="w-full" size="lg" disabled data-testid="button-event-full">
                        <Users className="h-4 w-4 mr-2" />
                        Competition Full
                      </Button>
                    ) : deadlinePassed ? (
                      <Button className="w-full" size="lg" disabled data-testid="button-deadline-passed">
                        <Clock className="h-4 w-4 mr-2" />
                        Entry Closed
                      </Button>
                    ) : !isAuthenticated ? (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => toast({ description: "Please sign in to enter this competition" })}
                        data-testid="button-enter-event-login"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Sign In to Enter
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => setShowEntryConfirmation(true)}
                        data-testid="button-enter-event"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Enter Event
                      </Button>
                    )}
                  </div>
                  {linkedGroup && (
                    <div className="pt-3 border-t mt-3">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => setShowResultsDialog(true)}
                        data-testid="button-view-results"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        {event.eventType === "knockout" ? "View Results" : "View Table"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>

      <div className="mt-12 pt-8 border-t flex flex-wrap items-center justify-between gap-4">
        <Link href="/events">
          <Button variant="outline" data-testid="button-more-events">
            View More Events
          </Button>
        </Link>
        <ShareButtons 
          title={event.name} 
          url={`/events/${event.slug}`}
          description={event.summary}
        />
      </div>

      <Dialog open={showEntryConfirmation} onOpenChange={setShowEntryConfirmation}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Confirm Entry
            </DialogTitle>
            <DialogDescription>
              You are about to enter this competition. Please review the details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-semibold text-lg" data-testid="text-confirm-event-name">{event.name}</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Date</span>
                  <span>{format(startDate, "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Venue</span>
                  <span>{event.venueName}</span>
                </div>
                {event.teamSize && event.eventType !== "individual_competition" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team Size</span>
                    <span>{event.teamSize} players</span>
                  </div>
                )}
                {event.signupDeadline && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Closes</span>
                    <span>{format(parseISO(event.signupDeadline), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            </div>

            {event.teamSize && event.teamSize > 1 && (() => {
              const remaining = event.maxEntries && entryCountData ? event.maxEntries - entryCountData.count : (event.teamSize || 99);
              const canSignupFullTeam = remaining >= (event.teamSize || 1);
              return (
              <div className="space-y-3">
                <Label>How are you signing up?</Label>
                <RadioGroup 
                  value={!canSignupFullTeam && signupType === "team" ? "individual" : signupType} 
                  onValueChange={(val) => {
                    setSignupType(val as "team" | "individual");
                    if (val === "team") {
                      setPlayerCount(event.teamSize || 1);
                    } else {
                      setPlayerCount(1);
                    }
                  }}
                  className="flex flex-col gap-2"
                >
                  <div className={`flex items-center space-x-3 p-3 border rounded-lg ${canSignupFullTeam ? 'hover-elevate cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} onClick={() => {
                    if (!canSignupFullTeam) return;
                    setSignupType("team");
                    setPlayerCount(event.teamSize || 1);
                  }}>
                    <RadioGroupItem value="team" id="signup-team" data-testid="radio-signup-team" disabled={!canSignupFullTeam} />
                    <Label htmlFor="signup-team" className="flex-1 cursor-pointer">
                      <div className="font-medium">Full Team</div>
                      <div className="text-sm text-muted-foreground">
                        Sign up as a complete team of {event.teamSize} players
                        {!canSignupFullTeam && ` (only ${remaining} ${remaining === 1 ? 'place' : 'places'} remaining)`}
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover-elevate cursor-pointer" onClick={() => {
                    setSignupType("individual");
                    setPlayerCount(1);
                  }}>
                    <RadioGroupItem value="individual" id="signup-individual" data-testid="radio-signup-individual" />
                    <Label htmlFor="signup-individual" className="flex-1 cursor-pointer">
                      <div className="font-medium">Individual(s)</div>
                      <div className="text-sm text-muted-foreground">
                        Sign up 1-{Math.min((event.teamSize || 2) - 1, remaining)} player(s) to be matched with others
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {signupType === "team" && (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <Label htmlFor="entrant-name">Team Name</Label>
                    <Input
                      id="entrant-name"
                      placeholder="Enter your team name"
                      value={entrantName}
                      onChange={(e) => setEntrantName(e.target.value)}
                      data-testid="input-entrant-name"
                    />
                  </div>
                )}

                {signupType === "individual" && (() => {
                  const maxAllowed = (event.teamSize || 2) - 1;
                  const remainingPlaces = event.maxEntries && entryCountData ? event.maxEntries - entryCountData.count : maxAllowed;
                  const cappedMax = Math.min(maxAllowed, Math.max(1, remainingPlaces));
                  return (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <Label>Number of Players</Label>
                      <Select 
                        value={Math.min(playerCount, cappedMax).toString()} 
                        onValueChange={(val) => setPlayerCount(Number(val))}
                      >
                        <SelectTrigger data-testid="select-player-count">
                          <SelectValue placeholder="Select number of players" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: cappedMax }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} player{num > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {remainingPlaces < maxAllowed && (
                        <p className="text-xs text-muted-foreground">Only {remainingPlaces} {remainingPlaces === 1 ? 'place' : 'places'} remaining</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              );
            })()}

            {event.entryFee && (
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <span className="font-medium">Total Entry Fee</span>
                  <div className="text-sm text-muted-foreground">
                    £{Number(event.entryFee).toFixed(2)} x {signupType === "team" ? (event.teamSize || 1) : playerCount} player{(signupType === "team" ? (event.teamSize || 1) : playerCount) > 1 ? 's' : ''}
                  </div>
                </div>
                <span className="text-2xl font-bold text-primary" data-testid="text-confirm-entry-fee">
                  £{(Number(event.entryFee) * (signupType === "team" ? (event.teamSize || 1) : playerCount)).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-800 dark:text-amber-200">
                By clicking "Confirm Entry", you agree to enter this competition.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEntryConfirmation(false)}
              disabled={enterEventLoading}
              data-testid="button-cancel-entry"
            >
              Cancel
            </Button>
            <Button 
              size="lg"
              onClick={() => handleEnterEvent({ 
                name: entrantName.trim(), 
                signupType, 
                playerCount: signupType === "team" ? (event.teamSize || 1) : playerCount 
              })}
              disabled={enterEventLoading || (signupType === "team" && event.teamSize && event.teamSize > 1 && !entrantName.trim())}
              data-testid="button-confirm-entry"
            >
              {enterEventLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEntrySuccess} onOpenChange={setShowEntrySuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
              Entry Confirmed!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 font-medium">
                You have successfully reserved {entryResult?.placesReserved || 1} place{(entryResult?.placesReserved || 1) > 1 ? 's' : ''} in this competition.
              </p>
            </div>
            
            {entryResult?.joinedGroup && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">You are now part of the {entryResult.joinedGroup.name} community</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Connect with other participants and stay updated on competition news
                </p>
                <Button 
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    setShowEntrySuccess(false);
                    router.push(`/groups/${entryResult?.joinedGroup?.slug}`);
                  }}
                  data-testid="button-go-to-group"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Go to Community
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEntrySuccess(false)}
              data-testid="button-close-success"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
              Payment Successful
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 font-medium">
                Your payment has been processed successfully. Your competition entry is being confirmed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentSuccess(false)}
              data-testid="button-close-payment-success"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentFailed} onOpenChange={setShowPaymentFailed}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              Payment Failed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200 font-medium">
                Your payment was not completed. No entry has been made. Please try again if you would like to enter this competition.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentFailed(false)}
              data-testid="button-close-payment-failed"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-[56rem] max-h-[80vh] overflow-y-auto" data-testid="dialog-results">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {event?.eventType === "knockout" ? "Competition Results" : "League Table"}
            </DialogTitle>
            <DialogDescription>
              {event?.name}
            </DialogDescription>
          </DialogHeader>
          {resultsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !resultsData ? (
            <div className="text-center py-8 text-muted-foreground">No results available.</div>
          ) : resultsData.eventType === "knockout" ? (
            <Tabs defaultValue="results" className="w-full overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="results" data-testid="tab-knockout-results">
                  <Trophy className="h-4 w-4 mr-1" /> Results
                </TabsTrigger>
                <TabsTrigger value="bracket" data-testid="tab-knockout-bracket">
                  <GitBranch className="h-4 w-4 mr-1" /> Bracket
                </TabsTrigger>
              </TabsList>
              <TabsContent value="results">
                {!resultsData.hasResults ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                    <p className="text-muted-foreground">No matches have been completed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {resultsData.rounds.map((round: any, ri: number) => (
                      <div key={ri}>
                        <h3 className="font-semibold text-sm mb-3">{round.roundName}</h3>
                        <div className="space-y-3">
                          {round.matches.map((match: any, mi: number) => (
                            <div key={mi} className="border rounded-lg p-3" data-testid={`result-match-${ri}-${mi}`}>
                              <Badge variant="secondary" className="text-xs mb-2">Match {match.matchNumber}</Badge>
                              <div className="flex items-center gap-3">
                                <div className={`flex-1 text-center p-2 rounded-md ${match.team1IsWinner ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30'}`}>
                                  {match.team1IsWinner && (
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <Trophy className="h-3 w-3 text-amber-500" />
                                      <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Winner</span>
                                    </div>
                                  )}
                                  <p className={`text-sm ${match.team1IsWinner ? 'font-semibold' : 'font-medium'}`}>{match.team1Name}</p>
                                </div>
                                <span className="text-sm font-bold text-muted-foreground">VS</span>
                                <div className={`flex-1 text-center p-2 rounded-md ${match.team2IsWinner ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30'}`}>
                                  {match.team2IsWinner && (
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <Trophy className="h-3 w-3 text-amber-500" />
                                      <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Winner</span>
                                    </div>
                                  )}
                                  <p className={`text-sm ${match.team2IsWinner ? 'font-semibold' : 'font-medium'}`}>{match.team2Name}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="bracket">
                {!bracketData?.bracket ? (
                  <div className="text-center py-8">
                    <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Bracket Yet</h3>
                    <p className="text-muted-foreground">The competition bracket hasn't been created yet.</p>
                  </div>
                ) : (
                  <div className="overflow-auto border rounded-lg bg-muted/20" style={{ maxHeight: '60vh' }}>
                    <div className="flex gap-8 min-w-max p-6">
                      {bracketData.rounds.map((round, roundIndex) => {
                        const roundMatches = bracketData.matches
                          .filter(m => m.roundId === round.id)
                          .sort((a, b) => a.matchNumber - b.matchNumber);
                        const matchHeight = 200;
                        const gap = 24;
                        const baseUnit = matchHeight + gap;
                        const spacing = baseUnit * Math.pow(2, roundIndex);
                        const topOffset = roundIndex === 0 ? 0 : (baseUnit * (Math.pow(2, roundIndex) - 1)) / 2;
                        return (
                          <div key={round.id} className="flex flex-col">
                            <h4 className="font-semibold text-sm text-center mb-4 whitespace-nowrap sticky top-0 bg-muted/80 py-2 px-3 rounded">
                              {round.roundName}
                            </h4>
                            <div className="flex flex-col" style={{ gap: `${spacing - matchHeight}px`, marginTop: `${topOffset}px` }}>
                              {roundMatches.map(match => {
                                const team1 = competitionTeams.find(t => t.id === match.team1Id);
                                const team2 = competitionTeams.find(t => t.id === match.team2Id);
                                const team1Players = getTeamPlayerNames(team1);
                                const team2Players = getTeamPlayerNames(team2);
                                return (
                                  <div key={match.id} className="border rounded-lg p-3 w-56 bg-card" style={{ minHeight: `${matchHeight}px` }} data-testid={`bracket-match-${match.id}`}>
                                    <div className="mb-2">
                                      <span className="text-xs text-muted-foreground font-medium">Match {match.matchNumber}</span>
                                    </div>
                                    <div className={`p-2 rounded mb-1 ${match.winnerId === match.team1Id ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30'}`}>
                                      {team1 ? (
                                        <div className="space-y-0.5">
                                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Team {team1.teamNumber}</div>
                                          {team1Players.map((name: string, i: number) => (
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
                                          {team2Players.map((name: string, i: number) => (
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
                )}
              </TabsContent>
            </Tabs>
          ) : resultsData.eventType === "team_competition" ? (
            <div className="space-y-4">
              {resultsData.allowIndividualStableford ? (
                <Tabs defaultValue="team" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="team" data-testid="tab-results-team">Team</TabsTrigger>
                    <TabsTrigger value="individual" data-testid="tab-results-individual">Individual</TabsTrigger>
                  </TabsList>
                  <TabsContent value="team">
                    <ResultsTeamTable results={resultsData.teamResults} hasHandicap={resultsData.hasTeamHandicap} />
                  </TabsContent>
                  <TabsContent value="individual">
                    <ResultsIndividualTable results={resultsData.individualResults} />
                  </TabsContent>
                </Tabs>
              ) : (
                <ResultsTeamTable results={resultsData.teamResults} hasHandicap={resultsData.hasTeamHandicap} />
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">{resultsData.message || "No results available."}</div>
          )}
        </DialogContent>
      </Dialog>
      </article>
    </FeatureGate>
  );
}

function getResultPosition(index: number, scores: number[]): { position: number; isJoint: boolean } {
  if (index === 0) return { position: 1, isJoint: scores.length > 1 && scores[0] === scores[1] };
  const currentScore = scores[index];
  const prevScore = scores[index - 1];
  if (currentScore === prevScore) {
    const firstPos = getResultPosition(index - 1, scores);
    return { position: firstPos.position, isJoint: true };
  }
  const isJoint = index < scores.length - 1 && currentScore === scores[index + 1];
  return { position: index + 1, isJoint };
}

function PositionBadge({ index, scores }: { index: number; scores: number[] }) {
  const { position, isJoint } = getResultPosition(index, scores);
  return (
    <span className="text-sm">
      {isJoint ? `=${position}` : position}
    </span>
  );
}

function ResultsTeamTable({ results, hasHandicap }: { results: any[]; hasHandicap: boolean }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No team scores submitted yet.</p>
      </div>
    );
  }
  const scores = results.map(r => r.score);
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full" data-testid="table-results-team">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium">Pos</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Team</th>
            {hasHandicap ? (
              <>
                <th className="px-3 py-2 text-right text-xs font-medium">Gross</th>
                <th className="px-3 py-2 text-right text-xs font-medium">Hcp</th>
                <th className="px-3 py-2 text-right text-xs font-medium">Net</th>
              </>
            ) : (
              <th className="px-3 py-2 text-right text-xs font-medium">Score</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y">
          {results.map((team, index) => {
            const { position, isJoint } = getResultPosition(index, scores);
            return (
              <tr key={index} className={position === 1 && !isJoint ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} data-testid={`result-team-row-${index}`}>
                <td className="px-3 py-2 text-sm">
                  <PositionBadge index={index} scores={scores} />
                </td>
                <td className="px-3 py-2">
                  <span className={`text-sm ${position === 1 && !isJoint ? 'font-semibold' : ''}`}>{team.teamName}</span>
                </td>
                {hasHandicap ? (
                  <>
                    <td className="px-3 py-2 text-right text-sm text-muted-foreground">{team.gross}</td>
                    <td className="px-3 py-2 text-right text-sm text-muted-foreground">{team.handicap ?? '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`text-sm font-medium ${position === 1 && !isJoint ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{team.net}</span>
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-2 text-right">
                    <span className={`text-sm font-medium ${position === 1 && !isJoint ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{team.score}</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ResultsIndividualTable({ results }: { results: any[] }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No individual scores submitted yet.</p>
      </div>
    );
  }
  const scores = results.map(r => r.score);
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full" data-testid="table-results-individual">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium">Pos</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Player</th>
            <th className="px-3 py-2 text-right text-xs font-medium">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {results.map((player, index) => {
            const { position, isJoint } = getResultPosition(index, scores);
            return (
              <tr key={index} className={position === 1 && !isJoint ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} data-testid={`result-individual-row-${index}`}>
                <td className="px-3 py-2 text-sm">
                  <PositionBadge index={index} scores={scores} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {player.profileImage && <AvatarImage src={player.profileImage} />}
                      <AvatarFallback className="text-xs">{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className={`text-sm ${position === 1 && !isJoint ? 'font-semibold' : ''}`}>{player.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`text-sm font-medium ${position === 1 && !isJoint ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{player.score}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
