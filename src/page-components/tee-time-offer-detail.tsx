"use client";

import { useParams, usePathname } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, Clock, Users, MessageSquare, ArrowLeft, Pencil, Trash2, MapPin, Coins, X, Check } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";
import {
  useGetTeeTimeOfferByIdQuery,
  useGetProfileFieldDefinitionsQuery,
  useGetProfileFieldOptionsQuery,
  useGetTeeTimeOfferReservationsQuery,
  useGetMyTeeTimeReservationQuery,
  useUpdateTeeTimeOfferMutation,
  useDeleteTeeTimeOfferMutation,
  useReserveTeeTimeMutation,
  useRespondToTeeTimeReservationMutation,
  useCancelTeeTimeReservationMutation,
} from "@/store/api";

const editOfferSchema = z.object({
  dateTime: z.string().min(1, "Date and time is required"),
  homeClub: z.string().min(1, "Home club is required"),
  pricePerPerson: z.string(),
  availableSpots: z.string(),
  message: z.string().max(500, "Message must be under 500 characters").optional(),
});

type EditOfferFormValues = z.infer<typeof editOfferSchema>;

interface TeeTimeOfferCriteria {
  id: number;
  teeTimeOfferId: number;
  fieldId: number;
  value: string;
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
  creator: {
    id: string;
    mumblesVibeName: string;
    profileImageUrl: string | null;
  } | null;
  criteria: TeeTimeOfferCriteria[];
}

interface ProfileFieldDefinition {
  id: number;
  label: string;
  slug: string;
  fieldType: string;
  options?: { id: number; value: string; label?: string }[];
}

interface ProfileFieldOption {
  id: number;
  fieldId: number;
  value: string;
  label?: string;
}

interface TeeTimeReservation {
  id: number;
  teeTimeOfferId: number;
  userId: string;
  spotsRequested: number;
  guestNames: string[] | null;
  status: string;
  responseNote: string | null;
  createdAt: string;
  user?: {
    mumblesVibeName: string;
    profileImageUrl: string | null;
  };
}

export default function TeeTimeOfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useTenantRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [spotsRequired, setSpotsRequired] = useState("1");
  const [guestNames, setGuestNames] = useState<string[]>([]);

  const { data: offer, isLoading, error } = useGetTeeTimeOfferByIdQuery(id!, { skip: !id }) as {
    data: TeeTimeOffer | undefined;
    isLoading: boolean;
    error: any;
  };

  const { data: fieldDefinitions = [] } = useGetProfileFieldDefinitionsQuery() as {
    data: ProfileFieldDefinition[] | undefined;
  };

  const { data: fieldOptions = [] } = useGetProfileFieldOptionsQuery() as {
    data: ProfileFieldOption[] | undefined;
  };

  const getOptionLabel = (fieldId: number, value: string) => {
    const option = (fieldOptions as ProfileFieldOption[]).find(opt => opt.fieldId === fieldId && opt.value === value);
    return option?.label || value;
  };

  const isOwner = user?.id === offer?.userId;

  const { data: reservations = [] } = useGetTeeTimeOfferReservationsQuery(id!, {
    skip: !id || !isOwner,
  }) as { data: TeeTimeReservation[] | undefined };

  const { data: myReservation } = useGetMyTeeTimeReservationQuery(id!, {
    skip: !id || !user || isOwner,
  }) as { data: TeeTimeReservation | null | undefined };

  const [editCriteria, setEditCriteria] = useState<{ fieldId: number; value: string }[]>([]);

  const selectableFields = (fieldDefinitions as ProfileFieldDefinition[]).filter(f => f.fieldType === "select" || f.fieldType === "selector");
  
  const getOptionsForField = (fieldId: number) => (fieldOptions as ProfileFieldOption[]).filter(o => o.fieldId === fieldId);

  const addEditCriterion = (fieldId: number, value: string) => {
    const filtered = editCriteria.filter(c => c.fieldId !== fieldId);
    setEditCriteria([...filtered, { fieldId, value }]);
  };

  const removeEditCriterion = (index: number) => {
    setEditCriteria(editCriteria.filter((_, i) => i !== index));
  };

  const editForm = useForm<EditOfferFormValues>({
    resolver: zodResolver(editOfferSchema),
    defaultValues: {
      dateTime: "",
      homeClub: "",
      pricePerPerson: "",
      availableSpots: "1",
      message: "",
    },
  });

  const [updateOfferTrigger, { isLoading: isUpdating }] = useUpdateTeeTimeOfferMutation();
  const [deleteOfferTrigger, { isLoading: isDeleting }] = useDeleteTeeTimeOfferMutation();
  const [reserveSpotTrigger, { isLoading: isReserving }] = useReserveTeeTimeMutation();
  const [respondToReservationTrigger, { isLoading: isResponding }] = useRespondToTeeTimeReservationMutation();
  const [cancelReservationTrigger, { isLoading: isCancelling }] = useCancelTeeTimeReservationMutation();

  const handleUpdateOffer = (data: EditOfferFormValues) => {
    updateOfferTrigger({
      id: id!,
      body: {
        dateTime: data.dateTime,
        homeClub: data.homeClub,
        pricePerPerson: Number(data.pricePerPerson) || 0,
        availableSpots: Number(data.availableSpots) || 1,
        message: data.message || null,
        criteria: editCriteria,
      },
    })
      .unwrap()
      .then(() => {
        setIsEditModalOpen(false);
        toast({ title: "Tee time offer updated!" });
      })
      .catch(() => {
        toast({ title: "Failed to update offer", variant: "destructive" });
      });
  };

  const handleDeleteOffer = () => {
    deleteOfferTrigger(id!)
      .unwrap()
      .then(() => {
        toast({ title: "Tee time offer deleted" });
        router.push("/play?tab=tee-times-offered&teetimes=my");
      })
      .catch(() => {
        toast({ title: "Failed to delete offer", variant: "destructive" });
      });
  };

  const handleReserveSpot = () => {
    const spots = parseInt(spotsRequired);
    reserveSpotTrigger({
      id: id!,
      body: {
        spotsRequested: spots,
        guestNames: guestNames.slice(0, spots - 1),
      },
    })
      .unwrap()
      .then(() => {
        toast({ title: "Reservation request sent!", description: "The host will be notified of your request." });
      })
      .catch(() => {
        toast({ title: "Failed to send reservation request", variant: "destructive" });
      });
  };

  const handleRespondToReservation = (reservationId: number, status: string) => {
    respondToReservationTrigger({ reservationId, body: { status } })
      .unwrap()
      .then(() => {
        toast({ 
          title: status === "accepted" ? "Reservation accepted!" : "Reservation declined",
          description: status === "accepted" ? "The user has been notified." : "The user has been notified."
        });
      })
      .catch(() => {
        toast({ title: "Failed to respond to reservation", variant: "destructive" });
      });
  };

  const handleCancelReservation = (reservationId: number) => {
    cancelReservationTrigger(reservationId)
      .unwrap()
      .then(() => {
        toast({ title: "Reservation cancelled", description: "Your request has been cancelled." });
      })
      .catch(() => {
        toast({ title: "Failed to cancel reservation", variant: "destructive" });
      });
  };
  
  const handleSpotsChange = (value: string) => {
    setSpotsRequired(value);
    const newSpots = parseInt(value);
    const requiredGuests = Math.max(0, newSpots - 1);
    if (guestNames.length > requiredGuests) {
      setGuestNames(guestNames.slice(0, requiredGuests));
    } else if (guestNames.length < requiredGuests) {
      setGuestNames([...guestNames, ...Array(requiredGuests - guestNames.length).fill("")]);
    }
  };
  
  const updateGuestName = (index: number, name: string) => {
    const updated = [...guestNames];
    updated[index] = name;
    setGuestNames(updated);
  };

  const openEditModal = () => {
    if (offer) {
      const offerDate = new Date(offer.dateTime);
      const localDateTime = new Date(offerDate.getTime() - offerDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      editForm.reset({
        dateTime: localDateTime,
        homeClub: offer.homeClub,
        pricePerPerson: offer.pricePerPerson.toString(),
        availableSpots: offer.availableSpots.toString(),
        message: offer.message || "",
      });
      
      if (offer.criteria && offer.criteria.length > 0) {
        setEditCriteria(offer.criteria.map(c => ({ fieldId: c.fieldId, value: c.value })));
      } else {
        setEditCriteria([]);
      }
      
      setIsEditModalOpen(true);
    }
  };

  const onEditSubmit = (data: EditOfferFormValues) => {
    handleUpdateOffer(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
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

  if (error || !offer) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Tee time offer not found</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const offerDate = new Date(offer.dateTime);

  return (
    <FeatureGate feature="featurePlay" featureName="Play">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-4" data-testid="button-back" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Tee Time Offer Details</CardTitle>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openEditModal} data-testid="button-edit-offer">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  data-testid="button-delete-offer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!isOwner && offer.creator && (
              <div className="flex items-center gap-4">
                <Link href={`/user/${offer.userId}`}>
                  <Avatar className="h-16 w-16 cursor-pointer hover-elevate">
                    <AvatarImage src={offer.creator.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xl">
                      {offer.creator.mumblesVibeName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/user/${offer.userId}`}>
                    <h2 className="text-xl font-semibold hover:underline cursor-pointer" data-testid="text-host-name">
                      {offer.creator.mumblesVibeName || "Unknown Member"}
                    </h2>
                  </Link>
                  <p className="text-sm text-muted-foreground">Host</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium" data-testid="text-date">
                    {format(offerDate, "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tee Time</p>
                  <p className="font-medium" data-testid="text-time">{format(offerDate, "h:mm a")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Home Club</p>
                  <p className="font-medium" data-testid="text-home-club">{offer.homeClub}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Spots</p>
                  <p className="font-medium" data-testid="text-spots">
                    {offer.availableSpots} spot{offer.availableSpots > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg sm:col-span-2">
                <Coins className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Price per Person</p>
                  <p className="font-medium text-primary" data-testid="text-price">
                    {offer.pricePerPerson === 0 ? "Free" : `£${offer.pricePerPerson}`}
                  </p>
                </div>
              </div>
            </div>

            {offer.criteria && offer.criteria.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Guest Criteria</h3>
                <div className="flex flex-wrap gap-2">
                  {offer.criteria.map((crit) => {
                    const field = (fieldDefinitions as ProfileFieldDefinition[]).find(f => f.id === crit.fieldId);
                    return (
                      <Badge key={crit.id} variant="outline" className="px-3 py-1">
                        {field?.label || "Unknown"}: {getOptionLabel(crit.fieldId, crit.value)}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {offer.message && (
              <div>
                <h3 className="flex items-center gap-2 font-medium mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="whitespace-pre-wrap" data-testid="text-message">{offer.message}</p>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Posted {format(new Date(offer.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </div>

            {!isOwner && (
              <div className="space-y-4 pt-4 border-t">
                {(!myReservation || myReservation.status === "declined") && (
                  <div className="space-y-3">
                    <div>
                      <Label>Spots Required</Label>
                      <Select value={spotsRequired} onValueChange={handleSpotsChange}>
                        <SelectTrigger className="mt-1" data-testid="select-spots-required">
                          <SelectValue placeholder="Select spots" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: offer.availableSpots }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} spot{num > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {parseInt(spotsRequired) > 1 && (
                      <div className="space-y-2">
                        <Label>Guest Names</Label>
                        <p className="text-xs text-muted-foreground">Please enter the names of the other players</p>
                        {Array.from({ length: parseInt(spotsRequired) - 1 }, (_, i) => (
                          <Input
                            key={i}
                            placeholder={`Guest ${i + 1} name`}
                            value={guestNames[i] || ""}
                            onChange={(e) => updateGuestName(i, e.target.value)}
                            data-testid={`input-guest-name-${i}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {myReservation ? (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Your Reservation Request</p>
                        <p className="text-sm text-muted-foreground">
                          {myReservation.spotsRequested} spot{myReservation.spotsRequested > 1 ? "s" : ""} requested
                        </p>
                      </div>
                      <Badge 
                        variant={myReservation.status === "accepted" ? "default" : myReservation.status === "declined" ? "destructive" : "secondary"}
                        data-testid="badge-reservation-status"
                      >
                        {myReservation.status === "pending" ? "Pending" : myReservation.status === "accepted" ? "Accepted" : "Declined"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/chat/${offer.userId}?context=tee_time_offer&offerId=${offer.id}&offerDateTime=${encodeURIComponent(format(new Date(offer.dateTime), "MMMM d, yyyy 'at' h:mm a"))}`} className="flex-1">
                        <Button variant="outline" className="w-full" data-testid="button-chat">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat with Host
                        </Button>
                      </Link>
                      {myReservation.status === "pending" && (
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleCancelReservation(myReservation.id)}
                          disabled={isCancelling}
                          data-testid="button-cancel-reservation"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {isCancelling ? "Cancelling..." : "Cancel Request"}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href={`/chat/${offer.userId}?context=tee_time_offer&offerId=${offer.id}&offerDateTime=${encodeURIComponent(format(new Date(offer.dateTime), "MMMM d, yyyy 'at' h:mm a"))}`} className="flex-1">
                      <Button variant="outline" className="w-full" data-testid="button-chat">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat with Host
                      </Button>
                    </Link>
                    <Button 
                      className="flex-1" 
                      onClick={handleReserveSpot}
                      disabled={isReserving}
                      data-testid="button-reserve-spot"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {isReserving ? "Sending..." : "Reserve Spot"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isOwner && (reservations as TeeTimeReservation[]).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reservation Requests ({(reservations as TeeTimeReservation[]).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(reservations as TeeTimeReservation[]).map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`reservation-${reservation.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Link href={`/user/${reservation.userId}`}>
                        <Avatar className="h-10 w-10 cursor-pointer hover-elevate">
                          <AvatarImage src={reservation.user?.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {reservation.user?.mumblesVibeName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link href={`/user/${reservation.userId}`}>
                          <p className="font-medium hover:underline cursor-pointer">
                            {reservation.user?.mumblesVibeName || "Unknown"}
                          </p>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {reservation.spotsRequested} spot{reservation.spotsRequested > 1 ? "s" : ""} requested
                        </p>
                        {reservation.guestNames && reservation.guestNames.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Guests: {reservation.guestNames.filter(n => n).join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(reservation.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    {reservation.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                          onClick={() => handleRespondToReservation(reservation.id, "accepted")}
                          disabled={isResponding}
                          data-testid={`button-accept-${reservation.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRespondToReservation(reservation.id, "declined")}
                          disabled={isResponding}
                          data-testid={`button-decline-${reservation.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={reservation.status === "accepted" ? "default" : "secondary"}>
                        {reservation.status === "accepted" ? "Accepted" : "Declined"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tee Time Offer</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="dateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-edit-datetime" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="homeClub"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Club</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Langland Bay Golf Club" {...field} data-testid="input-edit-homeclub" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel>Guest Criteria (Optional)</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Select profile attributes you're looking for in potential guests
                  </p>
                  
                  <div className="space-y-2">
                    {selectableFields.map(fieldDef => {
                      const options = getOptionsForField(fieldDef.id);
                      if (options.length === 0) return null;
                      const selectedValue = editCriteria.find(c => c.fieldId === fieldDef.id)?.value || "";
                      return (
                        <div key={fieldDef.id} className="flex gap-2 items-center">
                          <Label className="w-24 text-sm text-muted-foreground shrink-0">{fieldDef.label}</Label>
                          <Select
                            onValueChange={(value) => addEditCriterion(fieldDef.id, value)}
                            value={selectedValue}
                          >
                            <SelectTrigger className="flex-1 text-xs h-8">
                              <SelectValue placeholder={`Select ${fieldDef.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map(opt => (
                                <SelectItem key={opt.id} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <FormField
                  control={editForm.control}
                  name="pricePerPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Person (£)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0 for free" {...field} data-testid="input-edit-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="availableSpots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Spots</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-spots">
                            <SelectValue placeholder="Select spots" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 spot</SelectItem>
                          <SelectItem value="2">2 spots</SelectItem>
                          <SelectItem value="3">3 spots</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional details..."
                          className="resize-none"
                          {...field}
                          data-testid="input-edit-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating} data-testid="button-save-edit">
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tee Time Offer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this tee time offer? This action cannot be undone and any pending reservation requests will also be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteOffer()}
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
