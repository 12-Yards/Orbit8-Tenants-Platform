"use client";

import { useParams, usePathname } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import {
  api,
  useGetPlayRequestByIdQuery,
  useGetProfileFieldDefinitionsQuery,
  useGetProfileFieldOptionsQuery,
  useGetProfileCustomFieldsQuery,
  useGetPlayRequestOffersQuery,
  useGetMyPlayRequestOfferQuery,
  useUpdatePlayRequestMutation,
  useDeletePlayRequestMutation,
} from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isPast, parseISO } from "date-fns";
import { Calendar, Clock, Users, MessageSquare, ArrowLeft, User, Pencil, X, Trash2, Send, HandshakeIcon, Eye, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";

interface ProfileFieldDefinition {
  id: number;
  label: string;
  slug: string;
  fieldType: string;
  useOnPlayRequestOffers?: boolean;
  options?: { id: number; label: string; value: string }[];
}

interface PlayRequestOfferCriteria {
  id: number;
  playRequestOfferId: number;
  fieldId: number;
  fieldLabel: string;
  value: string;
}

interface ProfileFieldOption {
  id: number;
  fieldId: number;
  label: string;
  value: string;
}

const editRequestSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  message: z.string().max(500, "Message must be under 500 characters").optional(),
});

type EditRequestFormValues = z.infer<typeof editRequestSchema>;

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
  aboutMe?: string | null;
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
  clubName: string | null;
  status: string;
  responseNote: string | null;
  createdAt: string;
  offerUser: {
    id: string;
    mumblesVibeName: string;
    profileImageUrl: string | null;
  } | null;
  criteria?: PlayRequestOfferCriteria[];
}

export default function PlayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useTenantRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editGuests, setEditGuests] = useState<string[]>([]);
  const [newEditGuest, setNewEditGuest] = useState("");
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isWithdrawingOffer, setIsWithdrawingOffer] = useState(false);
  const [isRespondingToOffer, setIsRespondingToOffer] = useState(false);
  const [editCriteria, setEditCriteria] = useState<{ fieldId: number; value: string }[]>([]);

  const { data: request, isLoading, error } = useGetPlayRequestByIdQuery(id!, { skip: !id });

  const { data: fieldDefinitions = [] } = useGetProfileFieldDefinitionsQuery();

  const { data: fieldOptions = [] } = useGetProfileFieldOptionsQuery();

  const getOptionLabel = (fieldId: number, value: string) => {
    const option = fieldOptions.find(opt => opt.fieldId === fieldId && opt.value === value);
    return option?.label || value;
  };

  // Get user's club membership from profile
  const { data: userProfileFields = [] } = useGetProfileCustomFieldsQuery(undefined, { skip: !user });

  // Find Club Membership field value
  const clubMembershipField = fieldDefinitions.find(f => 
    f.label.toLowerCase().includes('club membership') || 
    f.slug.includes('club_membership')
  );
  const userClubMembership = clubMembershipField 
    ? userProfileFields.find(pf => pf.fieldId === clubMembershipField.id)?.value 
    : null;

  const selectableFields = fieldDefinitions.filter(f => f.fieldType === "select" || f.fieldType === "selector");
  
  const getOptionsForField = (fieldId: number) => fieldOptions.filter(o => o.fieldId === fieldId);

  const addEditCriterion = (fieldId: number, value: string) => {
    // Replace any existing criterion for this field (only one value per field allowed)
    const filtered = editCriteria.filter(c => c.fieldId !== fieldId);
    setEditCriteria([...filtered, { fieldId, value }]);
  };

  const removeEditCriterion = (index: number) => {
    setEditCriteria(editCriteria.filter((_, i) => i !== index));
  };

  const isOwner = user?.id === request?.userId;

  // Check if the request date/time is in the past
  const isRequestPast = request ? (() => {
    const dateTimeStr = `${request.startDate.split('T')[0]}T${request.startTime}`;
    return isPast(new Date(dateTimeStr));
  })() : false;

  // Check if request is completed
  const isRequestCompleted = request?.status === "completed";

  const editForm = useForm<EditRequestFormValues>({
    resolver: zodResolver(editRequestSchema),
    defaultValues: {
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      message: "",
    },
  });

  const [updateRequestTrigger, { isLoading: updateRequestLoading }] = useUpdatePlayRequestMutation();
  const updateRequest = {
    mutate: (data: EditRequestFormValues) => {
      updateRequestTrigger({ id: id!, body: { ...data, guests: editGuests, criteria: editCriteria } }).unwrap()
        .then(() => {
          setIsEditModalOpen(false);
          toast({ title: "Play request updated!" });
        })
        .catch(() => {
          toast({ title: "Failed to update request", variant: "destructive" });
        });
    },
    isPending: updateRequestLoading,
  };

  const [deleteRequestTrigger, { isLoading: deleteRequestLoading }] = useDeletePlayRequestMutation();
  const deleteRequest = {
    mutate: () => {
      deleteRequestTrigger(id!).unwrap()
        .then(() => {
          toast({ title: "Play request deleted!" });
          router.push("/play?tab=play-requests&requests=my");
        })
        .catch(() => {
          toast({ title: "Failed to delete request", variant: "destructive" });
        });
    },
    isPending: deleteRequestLoading,
  };

  const openEditModal = () => {
    if (request) {
      editForm.reset({
        startDate: request.startDate.split("T")[0],
        startTime: request.startTime,
        endDate: request.endDate?.split("T")[0] || "",
        endTime: request.endTime || "",
        message: request.message || "",
      });
      setEditGuests(request.guests || []);
      setEditCriteria(request.criteria?.map(c => ({ fieldId: c.fieldId, value: c.value })) || []);
      setIsEditModalOpen(true);
    }
  };

  const addEditGuest = () => {
    if (newEditGuest.trim() && editGuests.length < 7) {
      setEditGuests([...editGuests, newEditGuest.trim()]);
      setNewEditGuest("");
    }
  };

  const removeEditGuest = (index: number) => {
    setEditGuests(editGuests.filter((_, i) => i !== index));
  };

  const onEditSubmit = (data: EditRequestFormValues) => {
    updateRequest.mutate(data);
  };

  // Offer functionality
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isViewOfferModalOpen, setIsViewOfferModalOpen] = useState(false);
  const [offerNote, setOfferNote] = useState("");
  const [offerClubName, setOfferClubName] = useState("");
  const [useProfileHomeClub, setUseProfileHomeClub] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<PlayRequestOffer | null>(null);
  const [isOfferDetailModalOpen, setIsOfferDetailModalOpen] = useState(false);
  const [responseNote, setResponseNote] = useState("");
  const [offerCriteria, setOfferCriteria] = useState<{ fieldId: number; fieldLabel: string; value: string }[]>([]);

  // Get profile fields enabled for play request offers
  const offerProfileFields = fieldDefinitions.filter(f => f.useOnPlayRequestOffers);

  // Sync offerClubName with profile home club when checkbox is toggled
  useEffect(() => {
    if (useProfileHomeClub && userClubMembership) {
      setOfferClubName(userClubMembership);
    } else if (!useProfileHomeClub) {
      setOfferClubName("");
    }
  }, [userClubMembership, useProfileHomeClub]);

  const { data: offers = [] } = useGetPlayRequestOffersQuery(id!, { skip: !id || !isOwner });

  const hasAcceptedOffer = offers.some(offer => offer.status === "accepted");

  const { data: myOffer } = useGetMyPlayRequestOfferQuery(id!, { skip: !id || isOwner || !user });

  // Check if request should be closed (past date, completed, or has accepted offer)
  // For owners: check the offers array; for non-owners: check if their offer was accepted or request status
  const isRequestClosed = isRequestPast || isRequestCompleted || hasAcceptedOffer || (myOffer?.status === "accepted");

  const handleMakeOffer = async () => {
    setIsCreatingOffer(true);
    try {
      await apiRequest("POST", `/api/play-requests/${id}/offers`, {
        note: offerNote || null,
        clubName: offerClubName || null,
        criteria: offerCriteria.filter(c => c.value)
      });
      dispatch(api.util.invalidateTags(["PlayRequests", "PlayRequestOffers"]));
      setIsOfferModalOpen(false);
      setOfferNote("");
      setOfferClubName("");
      setUseProfileHomeClub(true);
      setOfferCriteria([]);
      toast({ title: "Offer sent successfully!" });
      router.push("/play?tab=play-requests");
    } catch {
      toast({ title: "Failed to send offer", variant: "destructive" });
    } finally {
      setIsCreatingOffer(false);
    }
  };

  const handleWithdrawOffer = async () => {
    if (!myOffer) return;
    setIsWithdrawingOffer(true);
    try {
      await apiRequest("DELETE", `/api/play-request-offers/${myOffer.id}`);
      dispatch(api.util.invalidateTags(["PlayRequests", "PlayRequestOffers"]));
      setIsViewOfferModalOpen(false);
      toast({ title: "Offer withdrawn successfully" });
      router.push("/play?tab=play-requests");
    } catch {
      toast({ title: "Failed to withdraw offer", variant: "destructive" });
    } finally {
      setIsWithdrawingOffer(false);
    }
  };

  const handleRespondToOffer = async (offerId: number, status: string, note?: string) => {
    setIsRespondingToOffer(true);
    try {
      await apiRequest("PATCH", `/api/play-request-offers/${offerId}/respond`, {
        status,
        responseNote: note
      });
      dispatch(api.util.invalidateTags(["PlayRequests", "PlayRequestOffers"]));
      setIsOfferDetailModalOpen(false);
      setSelectedOffer(null);
      setResponseNote("");
      toast({ title: "Response sent successfully" });
    } catch {
      toast({ title: "Failed to respond to offer", variant: "destructive" });
    } finally {
      setIsRespondingToOffer(false);
    }
  };

  const handleAcceptOffer = () => {
    if (selectedOffer) {
      handleRespondToOffer(selectedOffer.id, "accepted", responseNote || undefined);
    }
  };

  const handleDeclineOffer = () => {
    if (selectedOffer) {
      handleRespondToOffer(selectedOffer.id, "rejected", responseNote || undefined);
    }
  };

  const openOfferDetail = (offer: PlayRequestOffer) => {
    setSelectedOffer(offer);
    setResponseNote("");
    setIsOfferDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Play request not found</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FeatureGate feature="featurePlay" featureName="Play">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-4" data-testid="button-back" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{isOwner ? "Responses to My Request" : "Play Request Details"}</CardTitle>
          {isOwner && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openEditModal} data-testid="button-edit-request">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                data-testid="button-delete-request"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href={`/user/${request.userId}`}>
              <Avatar className="h-16 w-16 cursor-pointer hover-elevate">
                <AvatarImage src={request.requesterProfile?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xl">
                  {request.requesterProfile?.mumblesVibeName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/user/${request.userId}`}>
                  <h2 className="text-xl font-semibold hover:underline cursor-pointer" data-testid="text-requester-name">
                    {request.requesterProfile?.mumblesVibeName || "Unknown Member"}
                  </h2>
                </Link>
                {isRequestClosed && (
                  <Badge variant="secondary" data-testid="badge-closed">Closed</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Posted {format(new Date(request.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium" data-testid="text-start-date">
                  {format(new Date(request.startDate), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Start Time</p>
                <p className="font-medium" data-testid="text-start-time">{request.startTime}</p>
              </div>
            </div>
            {request.endDate && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {format(new Date(request.endDate), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
            {request.endTime && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <p className="font-medium">{request.endTime}</p>
                </div>
              </div>
            )}
          </div>

          {request.guests && request.guests.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 font-medium mb-3">
                <Users className="h-4 w-4" />
                Guests ({request.guests.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {request.guests.map((guest, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1">
                    <User className="h-3 w-3 mr-1" />
                    {guest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {request.criteria.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Looking For</h3>
              <div className="flex flex-wrap gap-2">
                {request.criteria.map((crit, i) => (
                  <Badge key={i} variant="outline" className="px-3 py-1">
                    {crit.fieldLabel}: {getOptionLabel(crit.fieldId, crit.value)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {request.message && (
            <div>
              <h3 className="flex items-center gap-2 font-medium mb-3">
                <MessageSquare className="h-4 w-4" />
                Message
              </h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="whitespace-pre-wrap" data-testid="text-message">{request.message}</p>
              </div>
            </div>
          )}

          {isOwner ? (
            <>
              {offers.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="flex items-center gap-2 font-medium mb-3">
                    <HandshakeIcon className="h-4 w-4" />
                    Offers Received ({offers.length})
                  </h3>
                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <div 
                        key={offer.id} 
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover-elevate cursor-pointer"
                        onClick={() => openOfferDetail(offer)}
                        data-testid={`offer-item-${offer.id}`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={offer.offerUser?.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {offer.offerUser?.mumblesVibeName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {offer.offerUser?.mumblesVibeName || "Unknown"}
                            </p>
                            {offer.status === "pending" && (
                              <Badge className="bg-amber-500 text-xs">Pending</Badge>
                            )}
                            {offer.status === "accepted" && (
                              <Badge className="bg-green-600 text-xs">Accepted</Badge>
                            )}
                            {offer.status === "rejected" && (
                              <Badge className="bg-red-500 text-xs">Declined</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(offer.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          {offer.note && (
                            <p className="text-sm mt-1 text-muted-foreground line-clamp-1">{offer.note}</p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          data-testid={`button-chat-offer-${offer.id}`}
                          asChild
                        >
                          <Link href={`/chat/${offer.userId}`}>
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                          </>
          ) : (
            <div className="pt-4 border-t space-y-3">
              {myOffer && myOffer.status !== "pending" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  {myOffer.status === "accepted" ? (
                    <>
                      <Badge className="bg-green-600">Accepted</Badge>
                      <span className="text-sm text-muted-foreground">Your offer has been accepted!</span>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-red-500">Declined</Badge>
                      <span className="text-sm text-muted-foreground">Your offer was declined</span>
                    </>
                  )}
                </div>
              )}
              {myOffer?.responseNote && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Response from {request.requesterProfile?.mumblesVibeName || "requester"}:</p>
                  <p className="text-sm">{myOffer.responseNote}</p>
                </div>
              )}
              {isRequestClosed && !myOffer && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mb-3">
                  <Badge variant="secondary">Closed</Badge>
                  <span className="text-sm text-muted-foreground">
                    {isRequestPast ? "This play request date has passed" : "This play request is complete"}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                {myOffer ? (
                  <Button className="flex-1" variant="secondary" onClick={() => setIsViewOfferModalOpen(true)} data-testid="button-view-offer">
                    <Eye className="h-4 w-4 mr-2" />
                    View Offer
                  </Button>
                ) : !isRequestClosed ? (
                  <Button className="flex-1" onClick={() => setIsOfferModalOpen(true)} data-testid="button-make-offer">
                    <HandshakeIcon className="h-4 w-4 mr-2" />
                    Make Offer
                  </Button>
                ) : null}
                <Link href={`/chat/${request.userId}?context=play_request&requestId=${request.id}&date=${encodeURIComponent(format(parseISO(request.startDate), "MMMM d, yyyy"))}&time=${encodeURIComponent(request.startTime)}${request.criteria?.length ? `&criteria=${encodeURIComponent(request.criteria.map(c => `${c.fieldLabel}: ${getOptionLabel(c.fieldId, c.value)}`).join(', '))}` : ''}`} className={myOffer || !isRequestClosed ? "flex-1" : "w-full"}>
                  <Button variant="outline" className="w-full" data-testid="button-contact">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Play Request</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-edit-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-edit-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-edit-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-edit-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label>Guests (max 7)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Guest name"
                    value={newEditGuest}
                    onChange={(e) => setNewEditGuest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEditGuest();
                      }
                    }}
                    disabled={editGuests.length >= 7}
                    data-testid="input-edit-guest"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addEditGuest}
                    disabled={editGuests.length >= 7}
                    data-testid="button-add-edit-guest"
                  >
                    Add
                  </Button>
                </div>
                {editGuests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editGuests.map((guest, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {guest}
                        <button
                          type="button"
                          onClick={() => removeEditGuest(i)}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-edit-guest-${i}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {selectableFields.length > 0 && (
                <div>
                  <Label className="mb-2 block">Filter by Member Criteria</Label>
                  <div className="space-y-3">
                    {selectableFields.map((field) => {
                      const options = getOptionsForField(field.id);
                      const selectedValue = editCriteria.find(c => c.fieldId === field.id)?.value || "";
                      const criterionIndex = editCriteria.findIndex(c => c.fieldId === field.id);
                      return (
                        <div key={field.id} className="flex gap-2 items-center">
                          <Label className="w-24 text-sm text-muted-foreground shrink-0">{field.label}</Label>
                          <div className="flex-1 flex items-center gap-2">
                            <Select 
                              onValueChange={(value) => {
                                if (value === "__clear__") {
                                  if (criterionIndex >= 0) removeEditCriterion(criterionIndex);
                                } else {
                                  addEditCriterion(field.id, value);
                                }
                              }}
                              value={selectedValue}
                            >
                              <SelectTrigger className="flex-1" data-testid={`select-edit-criteria-${field.slug}`}>
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
                                onClick={() => removeEditCriterion(criterionIndex)}
                                className="shrink-0"
                                data-testid={`button-clear-edit-criteria-${field.slug}`}
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
                control={editForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (max 500 characters)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add details about your request..."
                        className="resize-none"
                        rows={3}
                        maxLength={500}
                        {...field}
                        data-testid="input-edit-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={updateRequest.isPending}
                data-testid="button-save-edit"
              >
                {updateRequest.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{request && format(new Date(request.startDate), "EEEE, MMMM d, yyyy")}</span>
                <Clock className="h-4 w-4 text-primary ml-2" />
                <span>{request?.startTime}</span>
              </div>
              {request?.endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(request.endDate), "EEEE, MMMM d, yyyy")}</span>
                  {request.endTime && (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{request.endTime}</span>
                    </>
                  )}
                </div>
              )}
              {request?.guests && request.guests.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{request.guests.length} guest{request.guests.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <div>
              <Label>Club Name</Label>
              {useProfileHomeClub && userClubMembership ? (
                <Input 
                  value={userClubMembership} 
                  disabled 
                  className="mt-1 bg-muted" 
                  data-testid="input-offer-club" 
                />
              ) : (
                <Input 
                  value={offerClubName}
                  onChange={(e) => setOfferClubName(e.target.value)}
                  placeholder="Enter Golf Club" 
                  className="mt-1"
                  data-testid="input-offer-club" 
                />
              )}
              {userClubMembership && (
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="useProfileHomeClubOffer"
                    checked={useProfileHomeClub}
                    onCheckedChange={(checked) => setUseProfileHomeClub(!!checked)}
                    data-testid="checkbox-use-profile-club-offer"
                  />
                  <label
                    htmlFor="useProfileHomeClubOffer"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Use Profile Home Club
                  </label>
                </div>
              )}
            </div>

            {offerProfileFields.map((field) => {
              const options = getOptionsForField(field.id);
              const isDropdown = (field.fieldType === "select" || field.fieldType === "selector") && options.length > 0;
              return (
                <div key={field.id}>
                  <Label>{field.label}</Label>
                  {isDropdown ? (
                    <Select
                      value={offerCriteria.find(c => c.fieldId === field.id)?.value || ""}
                      onValueChange={(value) => {
                        if (value === "__clear__") {
                          setOfferCriteria(prev => prev.filter(c => c.fieldId !== field.id));
                        } else {
                          setOfferCriteria(prev => {
                            const existing = prev.filter(c => c.fieldId !== field.id);
                            return [...existing, { fieldId: field.id, fieldLabel: field.label, value }];
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1" data-testid={`select-offer-${field.slug}`}>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {offerCriteria.find(c => c.fieldId === field.id)?.value && (
                          <SelectItem value="__clear__" className="text-muted-foreground italic">
                            Clear selection
                          </SelectItem>
                        )}
                        {options.map((opt) => (
                          <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      className="mt-1"
                      placeholder={`Enter ${field.label}`}
                      value={offerCriteria.find(c => c.fieldId === field.id)?.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setOfferCriteria(prev => {
                          const existing = prev.filter(c => c.fieldId !== field.id);
                          if (value) {
                            return [...existing, { fieldId: field.id, fieldLabel: field.label, value }];
                          }
                          return existing;
                        });
                      }}
                      data-testid={`input-offer-${field.slug}`}
                    />
                  )}
                </div>
              );
            })}

            <div>
              <Label>Add a Note (optional)</Label>
              <Textarea
                placeholder="Enter any other information or use chat to plan."
                className="mt-1 resize-none"
                rows={3}
                maxLength={500}
                value={offerNote}
                onChange={(e) => setOfferNote(e.target.value)}
                data-testid="input-offer-note"
              />
              <p className="text-xs text-muted-foreground mt-1">{offerNote.length}/500 characters</p>
            </div>

            <Button
              className="w-full"
              onClick={handleMakeOffer}
              disabled={isCreatingOffer}
              data-testid="button-confirm-offer"
            >
              {isCreatingOffer ? "Sending..." : "Confirm Offer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOfferModalOpen} onOpenChange={setIsViewOfferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{request && format(new Date(request.startDate), "EEEE, MMMM d, yyyy")}</span>
                <Clock className="h-4 w-4 text-primary ml-2" />
                <span>{request?.startTime}</span>
              </div>
              {request?.endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(request.endDate), "EEEE, MMMM d, yyyy")}</span>
                  {request.endTime && (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{request.endTime}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {myOffer && myOffer.status !== "pending" && (
              <div className="flex items-center gap-2">
                {myOffer.status === "accepted" ? (
                  <Badge className="bg-green-600">Accepted</Badge>
                ) : (
                  <Badge className="bg-red-500">Declined</Badge>
                )}
              </div>
            )}

            {myOffer?.note && (
              <div>
                <Label className="text-muted-foreground text-sm">Your Note</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm">{myOffer.note}</p>
                </div>
              </div>
            )}

            {myOffer?.responseNote && (
              <div>
                <Label className="text-muted-foreground text-sm">Their Response</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm">{myOffer.responseNote}</p>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Sent on {myOffer && format(new Date(myOffer.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>

            <div className="flex gap-2">
              <Link href={`/chat/${request?.userId}`} className="flex-1">
                <Button variant="outline" className="w-full" data-testid="button-chat-from-offer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>
              {myOffer?.status === "pending" && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleWithdrawOffer}
                  disabled={isWithdrawingOffer}
                  data-testid="button-withdraw-offer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isWithdrawingOffer ? "Withdrawing..." : "Withdraw Offer"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOfferDetailModalOpen} onOpenChange={setIsOfferDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Offer Details</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link href={`/user/${selectedOffer.userId}`}>
                  <Avatar className="h-12 w-12 cursor-pointer hover-elevate">
                    <AvatarImage src={selectedOffer.offerUser?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {selectedOffer.offerUser?.mumblesVibeName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/user/${selectedOffer.userId}`}>
                    <p className="font-semibold hover:underline cursor-pointer">
                      {selectedOffer.offerUser?.mumblesVibeName || "Unknown"}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    {selectedOffer.status === "pending" && (
                      <Badge className="bg-amber-500 text-xs">Pending</Badge>
                    )}
                    {selectedOffer.status === "accepted" && (
                      <Badge className="bg-green-600 text-xs">Accepted</Badge>
                    )}
                    {selectedOffer.status === "rejected" && (
                      <Badge className="bg-red-500 text-xs">Declined</Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Offer received on {format(new Date(selectedOffer.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>

              {selectedOffer.clubName && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedOffer.clubName}</span>
                </div>
              )}

              {selectedOffer.criteria && selectedOffer.criteria.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Additional Details</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedOffer.criteria.map((crit) => (
                      <Badge key={crit.id} variant="secondary" className="text-xs">
                        {crit.fieldLabel}: {getOptionLabel(crit.fieldId, crit.value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedOffer.note && (
                <div>
                  <Label className="text-muted-foreground text-sm">Their Note</Label>
                  <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm">{selectedOffer.note}</p>
                  </div>
                </div>
              )}

              {selectedOffer.status === "pending" ? (
                <>
                  <div>
                    <Label className="text-sm">Response Note (optional)</Label>
                    <Textarea
                      placeholder="Add a note to your response..."
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      className="mt-1 resize-none"
                      rows={3}
                      maxLength={500}
                      data-testid="textarea-response-note"
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">{responseNote.length}/500</p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/chat/${selectedOffer.userId}`} className="flex-1">
                      <Button variant="outline" className="w-full" data-testid="button-chat-offer-detail">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </Link>
                  </div>
                  {hasAcceptedOffer && selectedOffer?.status === "pending" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        You have already accepted an offer. You can still decline other offers politely.
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDeclineOffer}
                      disabled={isRespondingToOffer}
                      data-testid="button-decline-offer"
                    >
                      {isRespondingToOffer ? "..." : "Decline"}
                    </Button>
                    <Button
                      className="flex-1 bg-green-600"
                      onClick={handleAcceptOffer}
                      disabled={isRespondingToOffer || hasAcceptedOffer}
                      data-testid="button-accept-offer"
                    >
                      {isRespondingToOffer ? "..." : "Accept"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {selectedOffer.responseNote && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Your Response</Label>
                      <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">{selectedOffer.responseNote}</p>
                      </div>
                    </div>
                  )}
                  <Link href={`/chat/${selectedOffer.userId}`}>
                    <Button variant="outline" className="w-full" data-testid="button-chat-responded-offer">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat with {selectedOffer.offerUser?.mumblesVibeName || "Player"}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Play Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this play request? This action cannot be undone and any offers you've received will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRequest.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </FeatureGate>
  );
}
