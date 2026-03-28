// @ts-nocheck
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import {
  useGetPlayRequestsQuery,
  useGetProfileFieldDefinitionsQuery,
  useGetProfileFieldOptionsQuery,
  useGetMyPlayRequestOffersQuery,
  useGetMyPlayRequestOfferCountsQuery,
  useGetMyGamesQuery,
  useGetTeeTimeOffersQuery,
  useGetMyTeeTimeOffersQuery,
  useGetMyTeeTimeReservationsQuery,
  useGetMyTeeTimeAcceptedGuestsQuery,
  useGetProfileCustomFieldsQuery,
  useCreatePlayRequestMutation,
  useDeletePlayRequestMutation,
  useCreateTeeTimeOfferMutation,
  useDeleteTeeTimeOfferMutation,
} from "@/store/api";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, Clock, Users, Send, Trash2, Plus, X, ArrowRight, HandshakeIcon, MapPin, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";

interface ProfileFieldDefinition {
  id: number;
  label: string;
  slug: string;
  fieldType: string;
}

interface ProfileFieldOption {
  id: number;
  fieldId: number;
  label: string;
  value: string;
}

interface PlayRequestCriteria {
  id: number;
  playRequestId: number;
  fieldId: number;
  value: string;
  fieldLabel: string;
}

interface UserProfile {
  userId: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
}

interface Game {
  id: number;
  playRequestId: number;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  isRequestOwner: boolean;
  otherPlayer: {
    id: string;
    mumblesVibeName: string | null;
    profileImageUrl: string | null;
  } | null;
  clubName: string | null;
  acceptedAt: string;
}

interface PlayRequest {
  id: number;
  userId: string;
  guests: string[] | null;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  requesterProfile: UserProfile | null;
  criteria: PlayRequestCriteria[];
}

interface PlayRequestOffer {
  id: number;
  playRequestId: number;
  userId: string;
  note: string | null;
  status: string;
  responseNote: string | null;
  createdAt: string;
}

interface TeeTimeOfferCriteria {
  id: number;
  teeTimeOfferId: number;
  fieldId: number;
  value: string;
}

interface TeeTimeReservation {
  id: number;
  teeTimeOfferId: number;
  userId: string;
  spotsRequested: number;
  status: string;
  responseNote: string | null;
  createdAt: string;
  offer?: {
    id: number;
    dateTime: string;
    homeClub: string;
    pricePerPerson: number;
    message: string | null;
  } | null;
  host?: {
    id: string;
    mumblesVibeName: string | null;
    profileImageUrl: string | null;
  } | null;
}

interface TeeTimeOffer {
  id: number;
  userId: string;
  dateTime: string;
  homeClub: string;
  pricePerPerson: number;
  availableSpots: number;
  message: string | null;
  status: string;
  createdAt: string;
  pendingReservations?: number;
  creator?: {
    id: string;
    mumblesVibeName: string | null;
    profileImageUrl: string | null;
  } | null;
  criteria: TeeTimeOfferCriteria[];
}

const playRequestSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  message: z.string().max(500, "Message must be under 500 characters").optional(),
});

const teeTimeOfferSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  homeClub: z.string().min(1, "Home club is required"),
  pricePerPerson: z.string().min(1, "Price is required"),
  availableSpots: z.string().min(1, "Available spots is required"),
  message: z.string().max(500, "Message must be under 500 characters").optional(),
});

type PlayRequestFormValues = z.infer<typeof playRequestSchema>;
type TeeTimeOfferFormValues = z.infer<typeof teeTimeOfferSchema>;

export default function PlayPage() {
  const { user, featurePlayAddRequest } = useAuth();
  const { toast } = useToast();
  const router = useTenantRouter();
  const searchParamsHook = useSearchParams();
  const searchString = searchParamsHook.toString();
  const searchParams = new URLSearchParams(searchString);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeeTimeModalOpen, setIsTeeTimeModalOpen] = useState(false);
  
  // Read tab state from URL params
  const mainTab = searchParams.get("tab") || "tee-times-offered";
  const showMyRequestsOnly = searchParams.get("requests") === "my";
  const showMyTeeTimesOnly = searchParams.get("teetimes") === "my";
  
  const setMainTab = (value: string) => {
    const params = new URLSearchParams(searchString);
    if (value === "tee-times-offered") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/play${params.toString() ? `?${params.toString()}` : ""}`, { replace: true });
  };
  
  const setShowMyRequestsOnly = (value: boolean) => {
    const params = new URLSearchParams(searchString);
    if (value) {
      params.set("requests", "my");
    } else {
      params.delete("requests");
    }
    router.push(`/play${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  const setShowMyTeeTimesOnly = (value: boolean) => {
    const params = new URLSearchParams(searchString);
    if (value) {
      params.set("teetimes", "my");
    } else {
      params.delete("teetimes");
    }
    router.push(`/play${params.toString() ? `?${params.toString()}` : ""}`);
  };
  const [guests, setGuests] = useState<string[]>([]);
  const [newGuest, setNewGuest] = useState("");
  const [selectedCriteria, setSelectedCriteria] = useState<{ fieldId: number; value: string }[]>([]);
  const [teeTimeCriteria, setTeeTimeCriteria] = useState<{ fieldId: number; value: string }[]>([]);
  const [useProfileHomeClub, setUseProfileHomeClub] = useState(true);
  const [gamesSubTab, setGamesSubTab] = useState<"upcoming" | "past">("upcoming");
  
  // Date and time range filters
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");

  const { data: playRequests = [], isLoading } = useGetPlayRequestsQuery();

  const { data: fieldDefinitions = [] } = useGetProfileFieldDefinitionsQuery();

  const { data: allFieldOptions = [] } = useGetProfileFieldOptionsQuery();

  const { data: myOffers = [] } = useGetMyPlayRequestOffersQuery(undefined, { skip: !user });

  const offeredRequestIds = new Set(myOffers.map(o => o.playRequestId));

  const { data: offerCounts = {} } = useGetMyPlayRequestOfferCountsQuery(undefined, { skip: !user });

  const { data: games = [], isLoading: isGamesLoading } = useGetMyGamesQuery(undefined, { skip: !user });

  const { data: teeTimeOffers = [], isLoading: isTeeTimeOffersLoading } = useGetTeeTimeOffersQuery();

  const { data: myTeeTimeOffers = [] } = useGetMyTeeTimeOffersQuery(undefined, { skip: !user });

  const { data: myTeeTimeReservations = [] } = useGetMyTeeTimeReservationsQuery(undefined, { skip: !user });

  const { data: myAcceptedGuests = [] } = useGetMyTeeTimeAcceptedGuestsQuery(undefined, { skip: !user });

  const { data: userProfileFields = [] } = useGetProfileCustomFieldsQuery(undefined, { skip: !user });

  // Find Club Membership field value
  const clubMembershipField = fieldDefinitions.find(f => 
    f.label.toLowerCase().includes('club membership') || 
    f.slug.includes('club_membership')
  );
  const userClubMembership = clubMembershipField 
    ? userProfileFields.find(pf => pf.fieldId === clubMembershipField.id)?.value 
    : null;

  const form = useForm<PlayRequestFormValues>({
    resolver: zodResolver(playRequestSchema),
    defaultValues: {
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      message: "",
    },
  });

  const [createRequestTrigger, { isLoading: createRequestLoading }] = useCreatePlayRequestMutation();
  const createRequest = {
    mutate: (data: PlayRequestFormValues) => {
      createRequestTrigger({ ...data, guests, criteria: selectedCriteria }).unwrap()
        .then((result: any) => {
          form.reset();
          setGuests([]);
          setSelectedCriteria([]);
          setIsModalOpen(false);
          toast({
            title: "Request Created",
            description: `Your play request has been sent to ${result.notifiedCount} matching members.`,
          });
        })
        .catch((error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to create play request",
            variant: "destructive",
          });
        });
    },
    isPending: createRequestLoading,
  };

  const [deleteRequestTrigger] = useDeletePlayRequestMutation();
  const deleteRequest = {
    mutate: (id: number) => {
      deleteRequestTrigger(String(id)).unwrap()
        .then(() => {
          toast({
            title: "Request Deleted",
            description: "Your play request has been removed.",
          });
        })
        .catch(() => {});
    },
    isPending: false,
  };

  const teeTimeForm = useForm<TeeTimeOfferFormValues>({
    resolver: zodResolver(teeTimeOfferSchema),
    defaultValues: {
      date: "",
      time: "",
      homeClub: userClubMembership || "",
      pricePerPerson: "",
      availableSpots: "1",
      message: "",
    },
  });

  // Sync homeClub whenever userClubMembership changes or checkbox is toggled
  useEffect(() => {
    if (useProfileHomeClub && userClubMembership) {
      teeTimeForm.setValue("homeClub", userClubMembership);
    } else if (!useProfileHomeClub) {
      teeTimeForm.setValue("homeClub", "");
    }
  }, [userClubMembership, useProfileHomeClub, teeTimeForm]);

  // Update homeClub when modal opens and club membership is available
  const handleOpenTeeTimeModal = () => {
    setUseProfileHomeClub(true);
    if (userClubMembership) {
      teeTimeForm.setValue("homeClub", userClubMembership);
    }
    // Reset time field so minutes default to 00 when hour is selected
    teeTimeForm.setValue("time", "");
    setIsTeeTimeModalOpen(true);
  };

  const [createTeeTimeOfferTrigger, { isLoading: createTeeTimeLoading }] = useCreateTeeTimeOfferMutation();
  const createTeeTimeOffer = {
    mutate: (data: TeeTimeOfferFormValues) => {
      const dateTime = `${data.date}T${data.time}`;
      createTeeTimeOfferTrigger({
        dateTime,
        homeClub: data.homeClub,
        pricePerPerson: parseInt(data.pricePerPerson),
        availableSpots: parseInt(data.availableSpots),
        message: data.message || null,
        criteria: teeTimeCriteria,
      }).unwrap()
        .then(() => {
          teeTimeForm.reset();
          setTeeTimeCriteria([]);
          setIsTeeTimeModalOpen(false);
          toast({
            title: "Tee Time Offer Created",
            description: "Your tee time has been added.",
          });
        })
        .catch((error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to create tee time offer",
            variant: "destructive",
          });
        });
    },
    isPending: createTeeTimeLoading,
  };

  const [deleteTeeTimeOfferTrigger] = useDeleteTeeTimeOfferMutation();
  const deleteTeeTimeOffer = {
    mutate: (id: number) => {
      deleteTeeTimeOfferTrigger(String(id)).unwrap()
        .then(() => {
          toast({
            title: "Tee Time Deleted",
            description: "Your tee time offer has been removed.",
          });
        })
        .catch(() => {});
    },
    isPending: false,
  };

  const addTeeTimeCriterion = (fieldId: number, value: string) => {
    // Replace any existing criterion for this field (only one value per field allowed)
    const filtered = teeTimeCriteria.filter(c => c.fieldId !== fieldId);
    setTeeTimeCriteria([...filtered, { fieldId, value }]);
  };

  const removeTeeTimeCriterion = (index: number) => {
    setTeeTimeCriteria(teeTimeCriteria.filter((_, i) => i !== index));
  };

  const addGuest = () => {
    if (newGuest.trim() && guests.length < 2) {
      setGuests([...guests, newGuest.trim()]);
      setNewGuest("");
    }
  };

  const removeGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const addCriterion = (fieldId: number, value: string) => {
    // Replace any existing criterion for this field (only one value per field allowed)
    const filtered = selectedCriteria.filter(c => c.fieldId !== fieldId);
    setSelectedCriteria([...filtered, { fieldId, value }]);
  };

  const removeCriterion = (index: number) => {
    setSelectedCriteria(selectedCriteria.filter((_, i) => i !== index));
  };

  const getOptionsForField = (fieldId: number) => {
    return allFieldOptions.filter(opt => opt.fieldId === fieldId);
  };

  const getOptionLabel = (fieldId: number, value: string) => {
    const option = allFieldOptions.find(opt => opt.fieldId === fieldId && opt.value === value);
    return option?.label || value;
  };

  const onSubmit = (data: PlayRequestFormValues) => {
    createRequest.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      form.reset();
      setGuests([]);
      setSelectedCriteria([]);
    }
  };

  // Filter fields for Play Requests (only show if useOnPlayRequests is true)
  const playRequestFields = fieldDefinitions.filter(f => 
    (f.fieldType === "select" || f.fieldType === "selector") && 
    (f.useOnPlayRequests ?? true)
  );
  
  // Filter fields for Tee Times (only show if useOnTeeTimes is true)
  const teeTimeFields = fieldDefinitions.filter(f => 
    (f.fieldType === "select" || f.fieldType === "selector") && 
    (f.useOnTeeTimes ?? true)
  );

  return (
    <FeatureGate feature="featurePlay" featureName="Play">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Find a Match</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Browse active play requests or create your own to find members who match your criteria.
        </p>
      </div>

      {user && featurePlayAddRequest && (
        <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Create Play Request
                </DialogTitle>
                <DialogDescription>
                  Fill in your availability and preferences to find matching players
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-start-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => {
                        const [hour, minute] = field.value ? field.value.split(':') : ['', '00'];
                        return (
                          <FormItem>
                            <FormLabel>Start Time (optional)</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Select
                                  value={hour}
                                  onValueChange={(h) => field.onChange(`${h}:${minute || '00'}`)}
                                >
                                  <SelectTrigger className="w-20" data-testid="select-start-time-hour">
                                    <SelectValue placeholder="HH" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => (
                                      <SelectItem key={i} value={String(i).padStart(2, '0')}>
                                        {String(i).padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="flex items-center text-muted-foreground">:</span>
                                <Select
                                  value={minute || '00'}
                                  onValueChange={(m) => field.onChange(`${hour}:${m}`)}
                                >
                                  <SelectTrigger className="w-20" data-testid="select-start-time-minute">
                                    <SelectValue placeholder="MM" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 60 }, (_, i) => (
                                      <SelectItem key={i} value={String(i).padStart(2, '0')}>
                                        {String(i).padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-end-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => {
                        const [hour, minute] = field.value ? field.value.split(':') : ['', '00'];
                        return (
                          <FormItem>
                            <FormLabel>End Time (Optional)</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Select
                                  value={hour}
                                  onValueChange={(h) => field.onChange(`${h}:${minute || '00'}`)}
                                >
                                  <SelectTrigger className="w-20" data-testid="select-end-time-hour">
                                    <SelectValue placeholder="HH" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => (
                                      <SelectItem key={i} value={String(i).padStart(2, '0')}>
                                        {String(i).padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="flex items-center text-muted-foreground">:</span>
                                <Select
                                  value={minute || '00'}
                                  onValueChange={(m) => field.onChange(`${hour}:${m}`)}
                                >
                                  <SelectTrigger className="w-20" data-testid="select-end-time-minute">
                                    <SelectValue placeholder="MM" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 60 }, (_, i) => (
                                      <SelectItem key={i} value={String(i).padStart(2, '0')}>
                                        {String(i).padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Guests (Max 2)</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newGuest}
                        onChange={(e) => setNewGuest(e.target.value)}
                        placeholder="Guest username"
                        disabled={guests.length >= 2}
                        data-testid="input-guest"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addGuest}
                        disabled={guests.length >= 2 || !newGuest.trim()}
                        data-testid="button-add-guest"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {guests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {guests.map((guest, i) => (
                          <Badge key={i} variant="secondary" className="pr-1">
                            {guest}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1"
                              onClick={() => removeGuest(i)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {playRequestFields.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Filter by Member Criteria</Label>
                      <div className="space-y-3">
                        {playRequestFields.map((field) => {
                          const options = getOptionsForField(field.id);
                          const selectedValue = selectedCriteria.find(c => c.fieldId === field.id)?.value || "";
                          const criterionIndex = selectedCriteria.findIndex(c => c.fieldId === field.id);
                          return (
                            <div key={field.id} className="flex gap-2 items-center">
                              <Label className="w-24 text-sm text-muted-foreground shrink-0">{field.label}</Label>
                              <div className="flex-1 flex items-center gap-2">
                                <Select 
                                  onValueChange={(value) => {
                                    if (value === "__clear__") {
                                      if (criterionIndex >= 0) removeCriterion(criterionIndex);
                                    } else {
                                      addCriterion(field.id, value);
                                    }
                                  }}
                                  value={selectedValue}
                                >
                                  <SelectTrigger className="flex-1" data-testid={`select-criteria-${field.slug}`}>
                                    <SelectValue placeholder={`Select ${field.label}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedValue && (
                                      <SelectItem value="__clear__" className="text-muted-foreground italic">
                                        Clear selection
                                      </SelectItem>
                                    )}
                                    {options.map((opt) => (
                                      <SelectItem key={opt.id} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {selectedValue && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCriterion(criterionIndex)}
                                    className="shrink-0"
                                    data-testid={`button-clear-criteria-${field.slug}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Hi, I am looking for a game..."
                            className="resize-none"
                            rows={3}
                            data-testid="input-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createRequest.isPending}
                    data-testid="button-submit-request"
                  >
                    {createRequest.isPending ? "Creating..." : "Send Play Request"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
        </Dialog>
      )}

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="tee-times-offered" className="text-xs sm:text-sm px-1 sm:px-3 py-2 whitespace-normal leading-tight" data-testid="tab-tee-times-offered">
            <span className="sm:hidden">Tee Times</span>
            <span className="hidden sm:inline">Tee Times Offered</span>
          </TabsTrigger>
          <TabsTrigger value="play-requests" className="text-xs sm:text-sm px-1 sm:px-3 py-2 whitespace-normal leading-tight" data-testid="tab-play-requests">
            <span className="sm:hidden">Requests</span>
            <span className="hidden sm:inline">Requests to Play</span>
          </TabsTrigger>
          <TabsTrigger value="games" className="text-xs sm:text-sm px-1 sm:px-3 py-2 whitespace-normal leading-tight" data-testid="tab-games">
            <span className="sm:hidden">Confirmed</span>
            <span className="hidden sm:inline">Confirmed Tee Times</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tee-times-offered" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            {user && (
              <Tabs value={showMyTeeTimesOnly ? "my-offers" : "all-offers"} onValueChange={(v) => setShowMyTeeTimesOnly(v === "my-offers")}>
                <TabsList className="h-auto">
                  <TabsTrigger value="all-offers" className="text-xs sm:text-sm" data-testid="tab-all-tee-times">
                    <span className="sm:hidden">All Offers</span>
                    <span className="hidden sm:inline">Tee Times Offered</span>
                  </TabsTrigger>
                  <TabsTrigger value="my-offers" className="text-xs sm:text-sm" data-testid="tab-my-tee-times">
                    <span className="sm:hidden">My Offers</span>
                    <span className="hidden sm:inline">My Tee Times Offered</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {user && featurePlayAddRequest && (
              <Dialog open={isTeeTimeModalOpen} onOpenChange={setIsTeeTimeModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-tee-time-offer">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Offer of Tee Time
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Offer a Tee Time</DialogTitle>
                    <DialogDescription>
                      Share your tee time with other members
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...teeTimeForm}>
                    <form onSubmit={teeTimeForm.handleSubmit((data) => createTeeTimeOffer.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={teeTimeForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-tee-time-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={teeTimeForm.control}
                          name="time"
                          render={({ field }) => {
                            const [hour, minute] = field.value ? field.value.split(':') : ['', '00'];
                            return (
                              <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                  <div className="flex gap-2">
                                    <Select
                                      value={hour}
                                      onValueChange={(h) => field.onChange(`${h}:${minute || '00'}`)}
                                    >
                                      <SelectTrigger className="w-20" data-testid="select-tee-time-hour">
                                        <SelectValue placeholder="HH" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                                            {String(i).padStart(2, '0')}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <span className="flex items-center text-muted-foreground">:</span>
                                    <Select
                                      value={minute || '00'}
                                      onValueChange={(m) => field.onChange(`${hour}:${m}`)}
                                    >
                                      <SelectTrigger className="w-20" data-testid="select-tee-time-minute">
                                        <SelectValue placeholder="MM" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 60 }, (_, i) => (
                                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                                            {String(i).padStart(2, '0')}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      <FormField
                        control={teeTimeForm.control}
                        name="homeClub"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Home Club</FormLabel>
                            <FormControl>
                              {useProfileHomeClub && userClubMembership ? (
                                <Input {...field} value={userClubMembership} disabled className="bg-muted" data-testid="input-tee-time-club" />
                              ) : (
                                <Input {...field} placeholder="Enter Golf Club" data-testid="input-tee-time-club" />
                              )}
                            </FormControl>
                            {userClubMembership && (
                              <div className="flex items-center gap-2 pt-1">
                                <Checkbox
                                  id="useProfileHomeClub"
                                  checked={useProfileHomeClub}
                                  onCheckedChange={(checked) => setUseProfileHomeClub(!!checked)}
                                  data-testid="checkbox-use-profile-club"
                                />
                                <label
                                  htmlFor="useProfileHomeClub"
                                  className="text-sm text-muted-foreground cursor-pointer"
                                >
                                  Use Profile Home Club
                                </label>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={teeTimeForm.control}
                        name="pricePerPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Person (GBP)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} placeholder="0" data-testid="input-tee-time-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={teeTimeForm.control}
                        name="availableSpots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Available Spots</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-tee-time-spots">
                                  <SelectValue placeholder="Select spots" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {teeTimeFields.length > 0 && (
                        <div>
                          <Label className="mb-2 block">Guest Criteria</Label>
                          <div className="space-y-3">
                            {teeTimeFields.map((field) => {
                              const options = getOptionsForField(field.id);
                              const selectedValue = teeTimeCriteria.find(c => c.fieldId === field.id)?.value || "";
                              const criterionIndex = teeTimeCriteria.findIndex(c => c.fieldId === field.id);
                              return (
                                <div key={field.id} className="flex gap-2 items-center">
                                  <Label className="w-24 text-sm text-muted-foreground shrink-0">{field.label}</Label>
                                  <div className="flex-1 flex items-center gap-2">
                                    <Select 
                                      onValueChange={(value) => {
                                        if (value === "__clear__") {
                                          if (criterionIndex >= 0) removeTeeTimeCriterion(criterionIndex);
                                        } else {
                                          addTeeTimeCriterion(field.id, value);
                                        }
                                      }}
                                      value={selectedValue}
                                    >
                                      <SelectTrigger className="flex-1" data-testid={`select-tee-criteria-${field.slug}`}>
                                        <SelectValue placeholder={`Select ${field.label}`} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {selectedValue && (
                                          <SelectItem value="__clear__" className="text-muted-foreground italic">
                                            Clear selection
                                          </SelectItem>
                                        )}
                                        {options.map((opt) => (
                                          <SelectItem key={opt.id} value={opt.value}>
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {selectedValue && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTeeTimeCriterion(criterionIndex)}
                                        className="shrink-0"
                                        data-testid={`button-clear-tee-criteria-${field.slug}`}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <FormField
                        control={teeTimeForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Any additional details..."
                                className="resize-none"
                                rows={3}
                                data-testid="input-tee-time-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="text-sm text-muted-foreground">
                        Host/Organiser: <strong>{user?.mumblesVibeName || user?.email}</strong>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createTeeTimeOffer.isPending}
                        data-testid="button-submit-tee-time"
                      >
                        {createTeeTimeOffer.isPending ? "Creating..." : "Add Tee Time Offer"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Date and Time Range Filters */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground mb-1 block">From Date</Label>
                  <Input
                    type="date"
                    className="text-sm"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    data-testid="input-filter-start-date"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground mb-1 block">To Date</Label>
                  <Input
                    type="date"
                    className="text-sm"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    data-testid="input-filter-end-date"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground mb-1 block">From Time</Label>
                  <div className="flex gap-1 sm:gap-2">
                    <Select
                      value={filterStartTime ? filterStartTime.split(':')[0] : ''}
                      onValueChange={(h) => setFilterStartTime(`${h}:${filterStartTime ? filterStartTime.split(':')[1] || '00' : '00'}`)}
                    >
                      <SelectTrigger className="w-16 sm:w-20" data-testid="select-filter-start-hour">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="flex items-center text-muted-foreground">:</span>
                    <Select
                      value={filterStartTime ? filterStartTime.split(':')[1] || '00' : ''}
                      onValueChange={(m) => setFilterStartTime(`${filterStartTime ? filterStartTime.split(':')[0] : '00'}:${m}`)}
                    >
                      <SelectTrigger className="w-16 sm:w-20" data-testid="select-filter-start-minute">
                        <SelectValue placeholder="00" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground mb-1 block">To Time</Label>
                  <div className="flex gap-1 sm:gap-2">
                    <Select
                      value={filterEndTime ? filterEndTime.split(':')[0] : ''}
                      onValueChange={(h) => setFilterEndTime(`${h}:${filterEndTime ? filterEndTime.split(':')[1] || '00' : '00'}`)}
                    >
                      <SelectTrigger className="w-16 sm:w-20" data-testid="select-filter-end-hour">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="flex items-center text-muted-foreground">:</span>
                    <Select
                      value={filterEndTime ? filterEndTime.split(':')[1] || '00' : ''}
                      onValueChange={(m) => setFilterEndTime(`${filterEndTime ? filterEndTime.split(':')[0] : '00'}:${m}`)}
                    >
                      <SelectTrigger className="w-16 sm:w-20" data-testid="select-filter-end-minute">
                        <SelectValue placeholder="00" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {(filterStartDate || filterEndDate || filterStartTime || filterEndTime) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3" 
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setFilterStartTime("");
                    setFilterEndTime("");
                  }}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Tee Times Offered content */}
          {(() => {
            // When viewing "all", show only OTHER people's offers (exclude user's own) that still have available spots
            // When viewing "my offers", show only the user's own offers (regardless of spots)
            const othersTeeTimeOffers = user 
              ? teeTimeOffers.filter(offer => offer.userId !== user.id && offer.availableSpots > 0) 
              : teeTimeOffers.filter(offer => offer.availableSpots > 0);
            
            // Apply date and time range filters
            const applyFilters = (offers: TeeTimeOffer[]) => {
              return offers.filter(offer => {
                const offerDate = new Date(offer.dateTime);
                const offerDateStr = format(offerDate, "yyyy-MM-dd");
                const offerTimeStr = format(offerDate, "HH:mm");
                
                // Date range filter
                const dateMatch = (!filterStartDate && !filterEndDate) || 
                  (filterStartDate && filterEndDate ? offerDateStr >= filterStartDate && offerDateStr <= filterEndDate :
                   filterStartDate ? offerDateStr >= filterStartDate :
                   filterEndDate ? offerDateStr <= filterEndDate : true);
                
                // Time range filter
                const timeMatch = (!filterStartTime && !filterEndTime) || 
                  (filterStartTime && filterEndTime ? offerTimeStr >= filterStartTime && offerTimeStr <= filterEndTime :
                   filterStartTime ? offerTimeStr >= filterStartTime :
                   filterEndTime ? offerTimeStr <= filterEndTime : true);
                
                // If both date and time filters are set, both must match
                // If only one type is set, only that one must match
                return dateMatch && timeMatch;
              });
            };
            
            const filteredOffers = applyFilters(showMyTeeTimesOnly ? myTeeTimeOffers : othersTeeTimeOffers);
            const displayedOffers = filteredOffers
              .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
            
            if (isTeeTimeOffersLoading) {
              return (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            }
            
            if (displayedOffers.length === 0) {
              return (
                <Card className="border-dashed border-2 bg-muted/30">
                  <CardContent className="py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      {showMyTeeTimesOnly ? <Send className="h-8 w-8 text-primary" /> : <Calendar className="h-8 w-8 text-primary" />}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      {showMyTeeTimesOnly ? "You haven't offered any tee times" : "No tee times available"}
                    </h3>
                    <p className="text-muted-foreground">
                      {showMyTeeTimesOnly ? "Create an offer to share your tee time!" : "Check back later for available tee times"}
                    </p>
                    {showMyTeeTimesOnly && user && featurePlayAddRequest && (
                      <Button onClick={handleOpenTeeTimeModal} className="mt-4" data-testid="button-empty-tee-time-offer">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Offer of Tee Time
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            }
            
            return (
              <div className="grid gap-4">
                {displayedOffers.map((offer) => {
                  const isOwner = user?.id === offer.userId;
                  const offerDate = new Date(offer.dateTime);
                  const myReservation = myTeeTimeReservations.find(r => r.teeTimeOfferId === offer.id);
                  
                  const cardContent = (
                    <Card className="hover-elevate border-l-4 border-l-green-600 overflow-hidden cursor-pointer" data-testid={`tee-time-offer-${offer.id}`}>
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="bg-green-600 text-white p-3 sm:p-4 flex flex-col items-center justify-center min-w-[64px] sm:min-w-[80px]">
                            <span className="text-xl sm:text-2xl font-bold">{format(offerDate, "d")}</span>
                            <span className="text-xs uppercase">{format(offerDate, "MMM")}</span>
                            <span className="text-[10px] sm:text-xs mt-1">{format(offerDate, "h:mm a")}</span>
                          </div>
                          <div className="flex-1 min-w-0 p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2 sm:gap-4">
                              {!showMyTeeTimesOnly && (
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 ring-2 ring-green-600/20">
                                    <AvatarImage src={offer.creator?.profileImageUrl || undefined} />
                                    <AvatarFallback className="bg-green-600/10 text-green-700 text-xs sm:text-sm">{offer.creator?.mumblesVibeName?.[0] || "?"}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-sm sm:text-base truncate">{offer.creator?.mumblesVibeName || "Unknown"}</p>
                                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{offer.homeClub}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {showMyTeeTimesOnly && (
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                                    <p className="font-semibold text-sm sm:text-base truncate">{offer.homeClub}</p>
                                  </div>
                                </div>
                              )}
                              <div className="text-right shrink-0">
                                <Badge variant={offer.pricePerPerson === 0 ? "default" : "secondary"} className={offer.pricePerPerson === 0 ? "bg-green-600" : ""}>
                                  {offer.pricePerPerson === 0 ? "Free" : `£${offer.pricePerPerson} pp`}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                {offer.availableSpots} spot{offer.availableSpots > 1 ? "s" : ""} available
                              </Badge>
                              {myReservation && (
                                <Badge 
                                  variant={myReservation.status === "accepted" ? "default" : myReservation.status === "declined" ? "destructive" : "secondary"}
                                  data-testid={`reservation-status-${offer.id}`}
                                >
                                  {myReservation.status === "pending" ? "Pending" : myReservation.status === "accepted" ? "Accepted" : "Declined"}
                                </Badge>
                              )}
                              {offer.criteria && offer.criteria.length > 0 && offer.criteria.map((crit) => {
                                const field = fieldDefinitions.find(f => f.id === crit.fieldId);
                                return (
                                  <Badge key={crit.id} variant="secondary" className="text-xs">
                                    {field?.label}: {getOptionLabel(crit.fieldId, crit.value)}
                                  </Badge>
                                );
                              })}
                            </div>
                            
                            {offer.message && (
                              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{offer.message}</p>
                            )}
                            
                            {/* View Responses button for My Tee Times with pending reservations */}
                            {showMyTeeTimesOnly && (offer.pendingReservations ?? 0) > 0 && (
                              <div className="mt-3 flex items-center justify-between">
                                <Badge className="gap-1 bg-amber-500">
                                  <HandshakeIcon className="h-3 w-3" />
                                  {offer.pendingReservations} Pending
                                </Badge>
                                <Badge variant="outline" className="gap-1 text-green-600 border-green-600 px-3 py-1.5 text-sm font-medium cursor-pointer">
                                  View Responses
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  
                  // Make all tee time offers clickable to view details
                  return (
                    <Link key={offer.id} href={`/tee-time-offers/${offer.id}`} data-testid={`link-tee-time-offer-${offer.id}`}>
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="play-requests" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            {user && (
              <Tabs value={showMyRequestsOnly ? "my-requests" : "all-requests"} onValueChange={(v) => setShowMyRequestsOnly(v === "my-requests")}>
                <TabsList className="h-auto">
                  <TabsTrigger value="all-requests" className="text-xs sm:text-sm" data-testid="tab-all-requests">
                    <span className="sm:hidden">All Requests</span>
                    <span className="hidden sm:inline">Requests to Play</span>
                  </TabsTrigger>
                  <TabsTrigger value="my-requests" className="text-xs sm:text-sm" data-testid="tab-my-requests">
                    <span className="sm:hidden">My Requests</span>
                    <span className="hidden sm:inline">My Requests to Play</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {user && featurePlayAddRequest && (
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-add-play-request">
                <Plus className="h-4 w-4 mr-2" />
                Add Play Request
              </Button>
            )}
          </div>
          
          {/* Date and Time Range Filters */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground mb-1 block">From Date</Label>
                  <Input
                    type="date"
                    className="text-sm"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    data-testid="input-filter-start-date-requests"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground mb-1 block">To Date</Label>
                  <Input
                    type="date"
                    className="text-sm"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    data-testid="input-filter-end-date-requests"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground mb-1 block">From Time</Label>
                  <div className="flex gap-1 sm:gap-2">
                    <Select
                      value={filterStartTime ? filterStartTime.split(':')[0] : ''}
                      onValueChange={(h) => setFilterStartTime(`${h}:${filterStartTime ? filterStartTime.split(':')[1] || '00' : '00'}`)}
                    >
                      <SelectTrigger className="w-16 sm:w-20" data-testid="select-filter-start-hour-requests">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="flex items-center text-muted-foreground">:</span>
                    <Select
                      value={filterStartTime ? filterStartTime.split(':')[1] || '00' : ''}
                      onValueChange={(m) => setFilterStartTime(`${filterStartTime ? filterStartTime.split(':')[0] : '00'}:${m}`)}
                    >
                      <SelectTrigger className="w-16 sm:w-20" data-testid="select-filter-start-minute-requests">
                        <SelectValue placeholder="00" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground mb-1 block">To Time</Label>
                  <div className="flex gap-1 sm:gap-2">
                    <Select
                      value={filterEndTime ? filterEndTime.split(':')[0] : ''}
                      onValueChange={(h) => setFilterEndTime(`${h}:${filterEndTime ? filterEndTime.split(':')[1] || '00' : '00'}`)}
                    >
                      <SelectTrigger className="w-16 sm:w-20" data-testid="select-filter-end-hour-requests">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="flex items-center text-muted-foreground">:</span>
                    <Select
                      value={filterEndTime ? filterEndTime.split(':')[1] || '00' : ''}
                      onValueChange={(m) => setFilterEndTime(`${filterEndTime ? filterEndTime.split(':')[0] : '00'}:${m}`)}
                    >
                      <SelectTrigger className="w-16 sm:w-20" data-testid="select-filter-end-minute-requests">
                        <SelectValue placeholder="00" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {(filterStartDate || filterEndDate || filterStartTime || filterEndTime) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3" 
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setFilterStartTime("");
                    setFilterEndTime("");
                  }}
                  data-testid="button-clear-filters-requests"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
          
          {(() => {
            // Filter out requests where the user has an accepted offer - they should only show in Matches tab
            const acceptedOfferRequestIds = new Set(
              myOffers.filter(o => o.status === "accepted").map(o => o.playRequestId)
            );
            const activeRequests = playRequests.filter(r => 
              r.status !== "accepted" && !acceptedOfferRequestIds.has(r.id)
            );
            
            // Apply date and time range filters
            const applyRequestFilters = (requests: PlayRequest[]) => {
              return requests.filter(request => {
                const requestDateStr = request.startDate;
                const requestTimeStr = request.startTime || "00:00";
                
                // Date range filter
                const dateMatch = (!filterStartDate && !filterEndDate) || 
                  (filterStartDate && filterEndDate ? requestDateStr >= filterStartDate && requestDateStr <= filterEndDate :
                   filterStartDate ? requestDateStr >= filterStartDate :
                   filterEndDate ? requestDateStr <= filterEndDate : true);
                
                // Time range filter
                const timeMatch = (!filterStartTime && !filterEndTime) || 
                  (filterStartTime && filterEndTime ? requestTimeStr >= filterStartTime && requestTimeStr <= filterEndTime :
                   filterStartTime ? requestTimeStr >= filterStartTime :
                   filterEndTime ? requestTimeStr <= filterEndTime : true);
                
                return dateMatch && timeMatch;
              });
            };
            
            const ownerFilteredRequests = showMyRequestsOnly 
              ? activeRequests.filter(r => r.userId === user?.id)
              : activeRequests.filter(r => r.userId !== user?.id);
            
            const filteredRequests = applyRequestFilters(ownerFilteredRequests).sort((a, b) => {
              const dateA = new Date(a.startDate).getTime();
              const dateB = new Date(b.startDate).getTime();
              if (dateA !== dateB) return dateA - dateB;
              const timeA = a.startTime || "00:00";
              const timeB = b.startTime || "00:00";
              return timeA.localeCompare(timeB);
            });
            return isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="border-dashed border-2 bg-muted/30">
                <CardContent className="py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    {showMyRequestsOnly ? <Send className="h-8 w-8 text-primary" /> : <Users className="h-8 w-8 text-primary" />}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">
                    {showMyRequestsOnly ? "You haven't made any play requests" : "No play requests from others yet"}
                  </h3>
                  <p className="text-muted-foreground">
                    {showMyRequestsOnly ? "Create a request to find a match!" : "Check back later for new requests!"}
                  </p>
                  {showMyRequestsOnly && featurePlayAddRequest && (
                    <Button onClick={() => setIsModalOpen(true)} className="mt-4" data-testid="button-empty-add-request">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Play Request
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => {
                  const requestDate = new Date(request.startDate);
                  
                  return (
                    <Link key={request.id} href={`/play/${request.id}`}>
                      <Card className="hover-elevate cursor-pointer border-l-4 border-l-green-600 overflow-hidden transition-all">
                        <CardContent className="p-0">
                          <div className="flex">
                            <div className="bg-green-600 text-white p-3 sm:p-4 flex flex-col items-center justify-center min-w-[64px] sm:min-w-[80px]">
                              <span className="text-xl sm:text-2xl font-bold">{format(requestDate, "d")}</span>
                              <span className="text-xs uppercase">{format(requestDate, "MMM")}</span>
                              {request.startTime && (
                                <span className="text-[10px] sm:text-xs mt-1">{request.startTime}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-2 sm:gap-4">
                                {!showMyRequestsOnly && (
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 ring-2 ring-green-600/20">
                                      <AvatarImage src={request.requesterProfile?.profileImageUrl || undefined} />
                                      <AvatarFallback className="bg-green-600/10 text-green-700 text-xs sm:text-sm">
                                        {request.requesterProfile?.mumblesVibeName?.charAt(0) || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm sm:text-base truncate">{request.requesterProfile?.mumblesVibeName || "Unknown"}</p>
                                      {request.requesterProfile?.homeClub && (
                                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                          <MapPin className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{request.requesterProfile.homeClub}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {showMyRequestsOnly && (
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs sm:text-sm text-muted-foreground truncate">
                                      {request.endDate ? (
                                        <>Available until {format(new Date(request.endDate), "MMM d")}{request.endTime && ` at ${request.endTime}`}</>
                                      ) : (
                                        "Single day request"
                                      )}
                                    </p>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2 justify-end">
                                  {showMyRequestsOnly ? (
                                    <>
                                      {offerCounts[request.id]?.pending > 0 && (
                                        <Badge className="gap-1 bg-amber-500">
                                          <HandshakeIcon className="h-3 w-3" />
                                          {offerCounts[request.id].pending} Pending
                                        </Badge>
                                      )}
                                      {offerCounts[request.id]?.accepted > 0 && (
                                        <Badge className="gap-1 bg-green-600">
                                          <HandshakeIcon className="h-3 w-3" />
                                          {offerCounts[request.id].accepted} Accepted
                                        </Badge>
                                      )}
                                      {offerCounts[request.id]?.rejected > 0 && (
                                        <Badge className="gap-1 bg-red-500">
                                          <HandshakeIcon className="h-3 w-3" />
                                          {offerCounts[request.id].rejected} Rejected
                                        </Badge>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {(() => {
                                        const offer = myOffers.find(o => o.playRequestId === request.id);
                                        if (!offer) return null;
                                        if (offer.status === "accepted") {
                                          return (
                                            <>
                                              <Badge className="gap-1 bg-green-600">
                                                <HandshakeIcon className="h-3 w-3" />
                                                Accepted
                                              </Badge>
                                              <Badge variant="secondary">Closed</Badge>
                                            </>
                                          );
                                        }
                                        if (offer.status === "rejected") {
                                          return (
                                            <Badge className="gap-1 bg-red-500">
                                              <HandshakeIcon className="h-3 w-3" />
                                              Declined
                                            </Badge>
                                          );
                                        }
                                        return (
                                          <Badge className="gap-1 bg-amber-500">
                                            <HandshakeIcon className="h-3 w-3" />
                                            Offer Made
                                          </Badge>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline" className="gap-1">
                                  <Users className="h-3 w-3" />
                                  {request.guests && request.guests.length > 0 
                                    ? `${request.guests.length} guest${request.guests.length > 1 ? 's' : ''}`
                                    : 'Solo player'}
                                </Badge>
                                {request.endDate && (
                                  <Badge variant="outline" className="gap-1">
                                    <ArrowRight className="h-3 w-3" />
                                    Until {format(new Date(request.endDate), "MMM d")}
                                  </Badge>
                                )}
                                {request.criteria && request.criteria.length > 0 && request.criteria.map((crit, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {crit.fieldLabel}: {getOptionLabel(crit.fieldId, crit.value)}
                                  </Badge>
                                ))}
                              </div>
                              
                              {request.message && (
                                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{request.message}</p>
                              )}
                              
                              {/* View Responses button for My Requests with pending offers */}
                              {showMyRequestsOnly && offerCounts[request.id]?.pending > 0 && (
                                <div className="mt-3 flex justify-end">
                                  <Badge variant="outline" className="gap-1 text-green-600 border-green-600 px-3 py-1.5 text-sm font-medium cursor-pointer">
                                    View Responses
                                  </Badge>
                                </div>
                              )}
                              {showMyRequestsOnly && offerCounts[request.id]?.accepted > 0 && (
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    size="sm"
                                    className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      router.push(`/play/${request.id}`);
                                    }}
                                    data-testid={`button-confirmed-tee-time-${request.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Confirmed Tee Time
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          {(() => {
            const confirmedTeeTimeReservations = myTeeTimeReservations
              .filter(r => r.status === "accepted" && r.offer);
            const acceptedGuests = [...myAcceptedGuests];
            const now = new Date();
            
            // Combine all confirmed items into a single sorted array
            type ConfirmedItem = 
              | { type: 'reservation'; data: typeof confirmedTeeTimeReservations[0]; dateTime: Date }
              | { type: 'guest'; data: typeof acceptedGuests[0]; dateTime: Date }
              | { type: 'game'; data: typeof games[0]; dateTime: Date };
            
            const allConfirmedItems: ConfirmedItem[] = [
              ...confirmedTeeTimeReservations.map(r => ({
                type: 'reservation' as const,
                data: r,
                dateTime: new Date(r.offer!.dateTime)
              })),
              ...acceptedGuests.map(g => ({
                type: 'guest' as const,
                data: g,
                dateTime: new Date(g.offer?.dateTime || 0)
              })),
              ...games.map(g => ({
                type: 'game' as const,
                data: g,
                dateTime: new Date(g.startDate)
              }))
            ];
            
            // Split into upcoming and past
            const upcomingItems = allConfirmedItems
              .filter(item => item.dateTime >= now)
              .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
            const pastItems = allConfirmedItems
              .filter(item => item.dateTime < now)
              .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime()); // Most recent first for past
            
            const displayedItems = gamesSubTab === "upcoming" ? upcomingItems : pastItems;
            const hasAnyItems = allConfirmedItems.length > 0;
            
            if (isGamesLoading) {
              return (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-l-4 border-l-green-600/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            }
            
            return (
              <>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={gamesSubTab === "upcoming" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGamesSubTab("upcoming")}
                    data-testid="tab-upcoming-tee-times"
                  >
                    Upcoming Tee Times ({upcomingItems.length})
                  </Button>
                  <Button
                    variant={gamesSubTab === "past" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGamesSubTab("past")}
                    data-testid="tab-past-tee-times"
                  >
                    Past Tee Times ({pastItems.length})
                  </Button>
                </div>
                
                {displayedItems.length === 0 ? (
                  <Card className="border-dashed border-2 bg-muted/30">
                    <CardContent className="py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-green-600/10 flex items-center justify-center mx-auto mb-4">
                        <HandshakeIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {gamesSubTab === "upcoming" ? "No Upcoming Tee Times" : "No Past Tee Times"}
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        {gamesSubTab === "upcoming" 
                          ? "When you accept an offer or your offer is accepted, upcoming matches will appear here."
                          : "Your completed tee times will appear here."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {displayedItems.map((item) => {
                  if (item.type === 'reservation') {
                    const reservation = item.data;
                    const offerDate = item.dateTime;
                    
                    return (
                      <Link href={`/tee-time-offers/${reservation.teeTimeOfferId}`} key={`reservation-${reservation.id}`}>
                        <Card className="hover-elevate cursor-pointer border-l-4 border-l-green-600 overflow-hidden" data-testid={`confirmed-tee-time-${reservation.id}`}>
                          <CardContent className="p-0">
                            <div className="flex">
                              <div className="bg-green-600 text-white p-3 sm:p-4 flex flex-col items-center justify-center min-w-[64px] sm:min-w-[80px]">
                                <span className="text-xl sm:text-2xl font-bold">{format(offerDate, "d")}</span>
                                <span className="text-xs uppercase">{format(offerDate, "MMM")}</span>
                                <span className="text-[10px] sm:text-xs mt-1">{format(offerDate, "h:mm a")}</span>
                              </div>
                              <div className="flex-1 min-w-0 p-3 sm:p-4">
                                <div className="flex items-start justify-between gap-2 sm:gap-4">
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 ring-2 ring-green-600/20">
                                      <AvatarImage src={reservation.host?.profileImageUrl || undefined} />
                                      <AvatarFallback className="bg-green-600/10 text-green-700 text-xs sm:text-sm">
                                        {reservation.host?.mumblesVibeName?.charAt(0) || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm sm:text-base truncate">{reservation.host?.mumblesVibeName || "Unknown Host"}</p>
                                      <p className="text-xs sm:text-sm text-muted-foreground">Host</p>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-600 shrink-0">Confirmed</Badge>
                                </div>
                                
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {reservation.offer?.homeClub && (
                                    <Badge variant="outline" className="gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {reservation.offer.homeClub}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="gap-1">
                                    <Users className="h-3 w-3" />
                                    {reservation.spotsRequested} spot{reservation.spotsRequested > 1 ? "s" : ""}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  }
                  
                  if (item.type === 'guest') {
                    const guest = item.data;
                    const offerDate = item.dateTime;
                    
                    return (
                      <Link href={`/tee-time-offers/${guest.teeTimeOfferId}`} key={`guest-${guest.id}`}>
                        <Card className="hover-elevate cursor-pointer border-l-4 border-l-green-600 overflow-hidden" data-testid={`confirmed-guest-${guest.id}`}>
                          <CardContent className="p-0">
                            <div className="flex">
                              <div className="bg-green-600 text-white p-3 sm:p-4 flex flex-col items-center justify-center min-w-[64px] sm:min-w-[80px]">
                                <span className="text-xl sm:text-2xl font-bold">{format(offerDate, "d")}</span>
                                <span className="text-xs uppercase">{format(offerDate, "MMM")}</span>
                                <span className="text-[10px] sm:text-xs mt-1">{format(offerDate, "h:mm a")}</span>
                              </div>
                              <div className="flex-1 min-w-0 p-3 sm:p-4">
                                <div className="flex items-start justify-between gap-2 sm:gap-4">
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 ring-2 ring-green-600/20">
                                      <AvatarImage src={guest.guest?.profileImageUrl || undefined} />
                                      <AvatarFallback className="bg-green-600/10 text-green-700 text-xs sm:text-sm">
                                        {guest.guest?.mumblesVibeName?.charAt(0) || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm sm:text-base truncate">{guest.guest?.mumblesVibeName || "Unknown Guest"}</p>
                                      <p className="text-xs sm:text-sm text-muted-foreground">Guest</p>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-600 shrink-0">Confirmed</Badge>
                                </div>
                                
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {guest.offer?.homeClub && (
                                    <Badge variant="outline" className="gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {guest.offer.homeClub}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="gap-1">
                                    <Users className="h-3 w-3" />
                                    {guest.spotsRequested} spot{guest.spotsRequested > 1 ? "s" : ""}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  }
                  
                  // type === 'game'
                  const game = item.data;
                  const gameDate = item.dateTime;
                  
                  return (
                    <Link href={`/play/${game.playRequestId}`} key={game.id}>
                      <Card className="hover-elevate cursor-pointer border-l-4 border-l-green-600 overflow-hidden" data-testid={`game-card-${game.id}`}>
                        <CardContent className="p-0">
                          <div className="flex">
                            <div className="bg-green-600 text-white p-3 sm:p-4 flex flex-col items-center justify-center min-w-[64px] sm:min-w-[80px]">
                              <span className="text-xl sm:text-2xl font-bold">{format(gameDate, "d")}</span>
                              <span className="text-xs uppercase">{format(gameDate, "MMM")}</span>
                              {game.startTime && (
                                <span className="text-[10px] sm:text-xs mt-1">{game.startTime}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-2 sm:gap-4">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 ring-2 ring-green-600/20">
                                    <AvatarImage src={game.otherPlayer?.profileImageUrl || undefined} />
                                    <AvatarFallback className="bg-green-600/10 text-green-700 text-xs sm:text-sm">
                                      {game.otherPlayer?.mumblesVibeName?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-sm sm:text-base truncate">{game.otherPlayer?.mumblesVibeName || "Unknown Player"}</p>
                                  </div>
                                </div>
                                <Badge className="bg-green-600 shrink-0">Confirmed</Badge>
                              </div>
                              
                              <div className="mt-3 flex flex-wrap gap-2">
                                {game.clubName && (
                                  <Badge variant="outline" className="gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {game.clubName}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="gap-1">
                                  <HandshakeIcon className="h-3 w-3" />
                                  Match arranged
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
                  </div>
                )}
              </>
            );
          })()}
        </TabsContent>
      </Tabs>
      </div>
    </FeatureGate>
  );
}
