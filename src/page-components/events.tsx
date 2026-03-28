"use client";

import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import {
  useGetEventsQuery,
  useGetEventCategoriesQuery,
  useGetSiteSettingsQuery,
  useGetMyCalendarQuery,
  useCreateEventSuggestionMutation,
} from "@/store/api";
import { isEventUpcoming } from "@/lib/utils";
import { SectionHeader } from "@/components/section-header";
import { EventCard, EventCardSkeleton } from "@/components/event-card";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FeatureGate } from "@/components/feature-gate";
import { Plus, Calendar, ChevronRight, CalendarCheck, Clock, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/image-upload";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Event, EventCategoryRecord, SiteSettings } from "@shared/schema";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

function MiuraGolfAd() {
  return (
    <Link 
      href="/articles/miura-forged-irons"
      className="block"
    >
      <Card
        className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer h-full"
        data-testid="card-ad-miura-golf"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-white font-bold text-3xl tracking-widest mb-1">MIURA</div>
              <div className="text-slate-400 text-sm tracking-[0.3em]">GOLF</div>
              <div className="text-slate-500 text-xs mt-2 tracking-wider">FORGED IN JAPAN</div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge 
              variant="outline" 
              className="text-[10px] bg-background/80 backdrop-blur-sm"
            >
              Sponsored
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              The Art of Forged Irons
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Handcrafted excellence since 1957. Experience the feel of true Japanese craftsmanship.
            </p>
          </div>
          <div className="flex items-center justify-end pt-2 border-t border-border mt-auto">
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              Read More <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const suggestEventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  venueName: z.string().min(2, "Venue name is required"),
  address: z.string().min(5, "Address is required"),
  summary: z.string().min(10, "Summary must be at least 10 characters").max(200, "Summary must be less than 200 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  imageUrl: z.string().refine((val) => !val || val.startsWith("/") || val.startsWith("http"), "Must be a valid URL or uploaded image").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  ticketUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
  }
  return true;
}, {
  message: "End date and time must be after start date and time",
  path: ["endDate"],
});

type SuggestEventForm = z.infer<typeof suggestEventSchema>;

export default function EventsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { isAuthenticated, featureSuggestEvent } = useAuth();
  const { toast } = useToast();

  const { data: events, isLoading } = useGetEventsQuery();

  const { data: eventCategories = [] } = useGetEventCategoriesQuery();

  const { data: siteSettings } = useGetSiteSettingsQuery();

  const { data: calendarEvents = [], isLoading: calendarLoading } = useGetMyCalendarQuery(undefined, {
    skip: !isAuthenticated || !calendarOpen,
  });

  const form = useForm<SuggestEventForm>({
    resolver: zodResolver(suggestEventSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      venueName: "",
      address: "",
      summary: "",
      description: "",
      imageUrl: "",
      tags: [],
      ticketUrl: "",
    },
  });

  const [suggestEvent, { isLoading: suggestLoading }] = useCreateEventSuggestionMutation();

  const onSubmit = (data: SuggestEventForm) => {
    const cleanedData = {
      ...data,
      imageUrl: data.imageUrl || null,
      endDate: data.endDate || null,
      ticketUrl: data.ticketUrl || null,
      tags: data.tags || [],
    };
    suggestEvent(cleanedData)
      .unwrap()
      .then(() => {
        toast({
          title: "Event Submitted",
          description: "Your event suggestion has been submitted for review. We'll notify you once it's approved.",
        });
        setDialogOpen(false);
        form.reset();
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to submit event suggestion. Please try again.",
          variant: "destructive",
        });
      });
  };

  const upcomingEvents = events?.filter((e) => isEventUpcoming(e)) || [];
  const carouselEvents = upcomingEvents.filter((e) => e.isCarousel);
  const featuredEvents = upcomingEvents.filter((e) => e.isFeatured);
  const allEvents = upcomingEvents;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);


  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <FeatureGate feature="featureEventsStandard" featureName="Events">
    <div className="min-h-screen py-8 md:py-12">
      <SEO 
        title="Events & What's On"
        description="Find upcoming events in Mumbles. From live music and festivals to community gatherings and markets, discover what's happening in this vibrant Welsh coastal village."
        canonicalUrl="/events"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <SectionHeader
            title="Upcoming Events"
            description={`Take a look at the ${siteSettings?.platformName || "Mumbles Vibe"} events`}
          />
          
          <div className="flex flex-wrap gap-2">
          {isAuthenticated && (
            <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-my-calendar">
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  My Calendar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>My Calendar</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="upcoming" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="upcoming" className="flex-1" data-testid="tab-calendar-upcoming">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Upcoming
                    </TabsTrigger>
                    <TabsTrigger value="past" className="flex-1" data-testid="tab-calendar-past">
                      <Clock className="h-4 w-4 mr-2" />
                      Past
                    </TabsTrigger>
                  </TabsList>
                  {["upcoming", "past"].map((tab) => {
                    const now = new Date();
                    const filtered = calendarEvents.filter((evt) => {
                      const eventDate = new Date(evt.startDate);
                      return tab === "upcoming" ? eventDate >= now : eventDate < now;
                    });
                    const grouped: Record<string, typeof filtered> = {};
                    filtered.forEach((evt) => {
                      const d = new Date(evt.startDate);
                      const key = `${d.toLocaleString("en-GB", { month: "long" })} ${d.getFullYear()}`;
                      if (!grouped[key]) grouped[key] = [];
                      grouped[key].push(evt);
                    });
                    const sortedMonths = Object.keys(grouped).sort((a, b) => {
                      const da = new Date(grouped[a][0].startDate);
                      const db = new Date(grouped[b][0].startDate);
                      return tab === "upcoming" ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
                    });

                    return (
                      <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                        {calendarLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                            ))}
                          </div>
                        ) : sortedMonths.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p>{tab === "upcoming" ? "No upcoming events in your calendar." : "No past events."}</p>
                            {tab === "upcoming" && (
                              <p className="text-sm mt-1">Enter competitions or mark events as attending to see them here.</p>
                            )}
                          </div>
                        ) : (
                          sortedMonths.map((month) => (
                            <div key={month}>
                              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2" data-testid={`text-calendar-month-${month.replace(/\s/g, "-")}`}>
                                <CalendarDays className="h-4 w-4" />
                                {month}
                              </h3>
                              <div className="space-y-2">
                                {grouped[month].map((evt) => {
                                  const eventTypeLabel = evt.eventType === "team_competition" ? "Team Comp" 
                                    : evt.eventType === "individual_competition" ? "Individual Comp" 
                                    : evt.eventType === "knockout" ? "Knockout"
                                    : "Social";

                                  const isMaybe = evt.attendanceType === "maybe";

                                  return (
                                    <Link key={evt.id} href={`/events/${evt.slug}`} onClick={() => setCalendarOpen(false)}>
                                      <Card className={`cursor-pointer hover-elevate ${isMaybe ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" : ""}`} data-testid={`card-calendar-event-${evt.id}`}>
                                        <CardContent className="p-3 flex items-center gap-3">
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate text-sm" data-testid={`text-calendar-event-name-${evt.id}`}>{evt.name}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                              <Calendar className="h-3 w-3" />
                                              <span data-testid={`text-calendar-event-date-${evt.id}`}>
                                                {new Date(evt.startDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                              <Badge 
                                                variant="outline" 
                                                className={`text-xs ${isMaybe ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700" : ""}`}
                                                data-testid={`badge-calendar-type-${evt.id}`}
                                              >
                                                {evt.attendanceType === "entered" ? "Entered" : isMaybe ? "May attend?" : "Attending"}
                                              </Badge>
                                              <Badge variant="secondary" className="text-xs" data-testid={`badge-calendar-format-${evt.id}`}>
                                                {eventTypeLabel}
                                              </Badge>
                                            </div>
                                          </div>
                                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        </CardContent>
                                      </Card>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
          {isAuthenticated && featureSuggestEvent ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-suggest-event">
                  <Plus className="h-4 w-4 mr-2" />
                  Suggest an Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Suggest an Event</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-event-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date & Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} data-testid="input-event-start" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date & Time (Optional)</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} data-testid="input-event-end" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="venueName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-venue-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-event-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Summary</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="A brief description of the event (max 200 characters)" 
                              className="resize-none" 
                              {...field} 
                              data-testid="input-event-summary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed information about the event" 
                              className="resize-none min-h-[100px]" 
                              {...field}
                              data-testid="input-event-description" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Category</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange([value])}
                            value={field.value?.[0] || ""}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-event-tags">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {eventCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.name}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Image (Optional)</FormLabel>
                          <FormControl>
                            <ImageUpload 
                              value={field.value || ""} 
                              onChange={field.onChange}
                              testId="event-image"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ticketUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket/Booking URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/tickets" {...field} data-testid="input-ticket-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-suggest">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={suggestLoading} data-testid="button-submit-suggest">
                        {suggestLoading ? "Submitting..." : "Submit for Review"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : !isAuthenticated ? (
            <Button variant="outline" asChild>
              <a href="/signin" data-testid="link-signin-suggest">
                <Calendar className="h-4 w-4 mr-2" />
                Sign in to suggest an event
              </a>
            </Button>
          ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-64 bg-muted rounded-md animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {carouselEvents.length > 0 && (
              <div>
                <div className="relative">
                  <div className="overflow-hidden rounded-lg" ref={emblaRef}>
                    <div className="flex">
                      {carouselEvents.map((event) => (
                        <div key={event.id} className="flex-[0_0_100%] min-w-0">
                          <EventCard event={event} variant="featured" />
                        </div>
                      ))}
                    </div>
                  </div>
                  {carouselEvents.length > 1 && (
                    <div className="flex justify-center gap-2 mt-3">
                      {carouselEvents.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                          onClick={() => emblaApi?.scrollTo(index)}
                          data-testid={`dot-events-carousel-${index}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {featuredEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Featured Event{featuredEvents.length > 1 ? "s" : ""}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredEvents.map((event) => (
                    <EventCard key={event.id} event={event} variant="thumbnail" />
                  ))}
                  <MiuraGolfAd />
                </div>
              </div>
            )}

            {allEvents && allEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">All Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {!events?.length && (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">
                  No upcoming events at the moment.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back soon for updates!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </FeatureGate>
  );
}

