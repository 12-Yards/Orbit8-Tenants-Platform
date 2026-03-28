import Link from "@/components/tenant-link";
import { MapPin, Clock, Ticket, Calendar, Trophy, Users, User, PoundSterling } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event } from "@shared/schema";
import { format, parseISO, isToday, isWithinInterval } from "date-fns";

interface EventCardProps {
  event: Event;
  variant?: "default" | "featured" | "thumbnail";
}

function isEventLive(event: Event): boolean {
  const now = new Date();
  const startDate = parseISO(event.startDate);
  
  if (event.endDate) {
    const endDate = parseISO(event.endDate);
    return isWithinInterval(now, { start: startDate, end: endDate });
  } else {
    return isToday(startDate);
  }
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
      </span>
      LIVE
    </div>
  );
}

function KnockoutCompetitionBadge() {
  return (
    <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
      <Trophy className="h-3 w-3 mr-1" />
      Knockout Competition
    </Badge>
  );
}

function IndividualCompetitionBadge() {
  return (
    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30">
      <User className="h-3 w-3 mr-1" />
      Individual Competition
    </Badge>
  );
}

function isCompetitionFull(event: Event): boolean {
  if (!event.maxEntries) return false;
  const currentEntries = (event as any).currentEntries;
  if (currentEntries === undefined || currentEntries === null) return false;
  return currentEntries >= event.maxEntries;
}

function CompetitionFullBadge() {
  return (
    <Badge className="bg-red-500 text-white border-red-500 no-default-hover-elevate no-default-active-elevate">
      Competition Full
    </Badge>
  );
}

function CompetitionInfo({ event }: { event: Event }) {
  if (event.eventType !== "knockout" && event.eventType !== "team_competition" && event.eventType !== "individual_competition" && event.eventType !== "social") return null;
  
  if (event.eventType === "social") {
    return (
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-xs bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/30">
          Social
        </Badge>
      </div>
    );
  }

  const formatLabels: Record<string, string> = {
    team_stableford: "Team Stableford",
    team_scramble: "Team Scramble",
    texas_scramble: "Texas Scramble",
    florida_scramble: "Florida Scramble",
    foursomes: "Foursomes",
    "4bbb": "4BBB",
    greensomes: "Greensomes",
    gruesomes: "Gruesomes",
    pinehurst_foursomes: "Pinehurst Foursomes",
    "2_person_scramble": "2-Person Scramble",
    scramble: "Scramble",
    best_ball: "Best Ball",
    stableford: "Stableford",
    stroke_play: "Stroke Play",
    fourball: "Fourball",
    alternate_shot: "Alternate Shot",
    matchplay: "Matchplay",
    other: "Other"
  };
  const format = (event as any).competitionFormat;
  
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      {format && formatLabels[format] && (
        <Badge variant="outline" className="text-xs bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/30">
          {format === "team_stableford" && (!event.teamSize || event.teamSize <= 1) ? "Stableford" : formatLabels[format]}
        </Badge>
      )}
      {event.maxEntries && (() => {
        const currentEntries = (event as any).currentEntries || 0;
        const remaining = event.maxEntries - currentEntries;
        const isFull = remaining <= 0;
        return (
          <span className={`flex items-center gap-1 ${isFull ? "text-red-500 dark:text-red-400 font-medium" : remaining <= 3 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}>
            <Users className="h-3 w-3" />
            {isFull ? "Full" : `Entries ${currentEntries} / ${event.maxEntries}`}
          </span>
        );
      })()}
      {event.teamSize && event.eventType !== "individual_competition" && (
        <span className="flex items-center gap-1">
          Team of {event.teamSize}
        </span>
      )}
    </div>
  );
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const startDate = parseISO(event.startDate);
  const day = format(startDate, "d");
  const month = format(startDate, "MMM");
  const time = format(startDate, "h:mm a");
  const tags = (event.tags || []) as string[];
  const isLive = isEventLive(event);
  const isFull = isCompetitionFull(event);

  if (variant === "featured") {
    return (
      <Link href={`/events/${event.slug}`}>
        <Card
          className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
          data-testid={`card-event-featured-${event.slug}`}
        >
          <div className="relative aspect-[21/9] overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            {isLive && (
              <div className="absolute top-4 right-4">
                <LiveIndicator />
              </div>
            )}
            {!isLive && isFull && (
              <div className="absolute top-4 right-4" data-testid={`badge-competition-full-feat-${event.slug}`}>
                <CompetitionFullBadge />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-md p-3 text-center min-w-[60px]">
                  <div className="text-2xl font-bold">{day}</div>
                  <div className="text-xs uppercase">{month}</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    {event.name}
                  </h3>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.venueName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {time}
                    </span>
                    {event.entryFee && (
                      <span className="flex items-center gap-1 font-medium text-white">
                        £{Number(event.entryFee).toFixed(2)} per person
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "thumbnail") {
    return (
      <Link href={`/events/${event.slug}`}>
        <Card
          className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer h-full"
          data-testid={`card-event-thumbnail-${event.slug}`}
        >
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3">
              <div className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-center">
                <div className="text-lg font-bold leading-tight">{day}</div>
                <div className="text-xs uppercase">{month}</div>
              </div>
            </div>
            {isLive && (
              <div className="absolute top-3 right-3">
                <LiveIndicator />
              </div>
            )}
            {!isLive && isFull && (
              <div className="absolute top-3 right-3" data-testid={`badge-competition-full-thumb-${event.slug}`}>
                <CompetitionFullBadge />
              </div>
            )}
          </div>
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex-1">
              {(event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition" || event.eventType === "social" || event.eventType === "standard") && (
                <div className="mb-2">
                  {event.eventType === "knockout" ? <KnockoutCompetitionBadge /> : 
                   event.eventType === "individual_competition" ? <IndividualCompetitionBadge /> :
                   (event.eventType === "social" || event.eventType === "standard") ? (
                    <Badge className="bg-blue-600 text-white border-blue-600">
                      Social
                    </Badge>
                   ) : (
                    <Badge className={event.teamSize && event.teamSize > 1 ? "bg-green-600 text-white border-green-600" : "bg-purple-600 text-white border-purple-600"}>
                      <Users className="h-3 w-3 mr-1" />
                      {event.teamSize && event.teamSize > 1 ? "Team Competition" : "Competition"}
                    </Badge>
                  )}
                </div>
              )}
              <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {event.name}
              </h3>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {format(startDate, "EEE, MMM d, yyyy")} at {time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{event.venueName}</span>
                </span>
                {event.entryFee && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    £{Number(event.entryFee).toFixed(2)} per person
                  </span>
                )}
              </div>
              {(event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition") && (
                <div className="mb-2 p-2 bg-muted/50 rounded-md">
                  <CompetitionInfo event={event} />
                </div>
              )}
              {event.ticketUrl && (
                <div className="mb-2">
                  <span className="inline-flex items-center text-sm text-primary">
                    <Ticket className="h-3 w-3 mr-1" />
                    Tickets available
                  </span>
                </div>
              )}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2 border-t border-border mt-auto">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.slug}`} className="h-full">
      <Card
        className="group hover-elevate active-elevate-2 cursor-pointer relative h-full"
        data-testid={`card-event-${event.slug}`}
      >
        {isLive && (
          <div className="absolute top-3 right-3">
            <LiveIndicator />
          </div>
        )}
        {!isLive && isFull && (
          <div className="absolute top-3 right-3" data-testid={`badge-competition-full-${event.slug}`}>
            <CompetitionFullBadge />
          </div>
        )}
        <CardContent className="p-4 h-full">
          <div className="flex gap-4 h-full">
            <div className="bg-primary/10 text-primary rounded-md p-3 text-center min-w-[56px] shrink-0 flex flex-col justify-center">
              <div className="text-xl font-bold">{day}</div>
              <div className="text-xs uppercase font-medium">{month}</div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex-1">
                {(event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition" || event.eventType === "social" || event.eventType === "standard") && (
                  <div className="mb-1">
                    {event.eventType === "knockout" ? <KnockoutCompetitionBadge /> : 
                     event.eventType === "individual_competition" ? <IndividualCompetitionBadge /> :
                     (event.eventType === "social" || event.eventType === "standard") ? (
                      <Badge className="bg-blue-600 text-white border-blue-600">
                        Social
                      </Badge>
                     ) : (
                      <Badge className={event.teamSize && event.teamSize > 1 ? "bg-green-600 text-white border-green-600" : "bg-purple-600 text-white border-purple-600"}>
                        <Users className="h-3 w-3 mr-1" />
                        {event.teamSize && event.teamSize > 1 ? "Team Competition" : "Competition"}
                      </Badge>
                    )}
                  </div>
                )}
                <h3 className="font-semibold text-base mb-1 truncate group-hover:text-primary transition-colors pr-16">
                  {event.name}
                </h3>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {format(startDate, "EEE, MMM d, yyyy")} at {time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{event.venueName}</span>
                  </span>
                  {event.entryFee && (
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      £{Number(event.entryFee).toFixed(2)} per person
                    </span>
                  )}
                </div>
                {(event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition") && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md">
                    <CompetitionInfo event={event} />
                  </div>
                )}
                {event.ticketUrl && (
                  <div className="mt-2">
                    <span className="inline-flex items-center text-sm text-primary">
                      <Ticket className="h-3 w-3 mr-1" />
                      Tickets available
                    </span>
                  </div>
                )}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border">
                  {tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-14 h-16 bg-muted rounded animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-1">
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-5 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
