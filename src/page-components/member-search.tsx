// @ts-nocheck
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import {
  useGetProfileFieldsQuery,
  useSearchUsersQuery,
  useGetConnectionsQuery,
  useGetIncomingRequestsQuery,
  useGetOutgoingRequestsQuery,
  useGetNotificationCountsQuery,
  useRemoveConnectionMutation,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
  useMarkConnectionNotificationsReadMutation,
} from "@/store/api";
import { apiRequest } from "@/lib/queryClient";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/seo";
import { Search, User as UserIcon, X, UserPlus, UserCheck, UserX, Clock, Check, MessageCircle, Users, Filter, Sparkles, Heart, Send } from "lucide-react";
import { ChatDialog } from "@/components/chat-dialog";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";
import { genderOptions, ageGroupOptions } from "@shared/models/auth";
import { useToast } from "@/hooks/use-toast";

type ProfileFieldDefinition = {
  id: number;
  label: string;
  slug: string;
  fieldType: 'text' | 'select';
  description: string | null;
  options: { id: number; label: string; value: string }[];
};

type SearchResult = {
  id: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
  gender: string | null;
  ageGroup: string | null;
  aboutMe: string | null;
  connectionStatus?: "connected" | "pending_sent" | "pending_received" | "none";
};

type ConnectionUser = {
  id: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
  gender: string | null;
  ageGroup: string | null;
  aboutMe: string | null;
};

type Connection = {
  id: number;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  connectedUser: ConnectionUser;
};

type IncomingRequest = {
  id: number;
  requesterId: string;
  receiverId: string;
  status: string;
  message: string | null;
  createdAt: string;
  requester: ConnectionUser;
};

type OutgoingRequest = {
  id: number;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  receiver: ConnectionUser;
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function UserCard({ user, children, variant = "default", connectionStatus }: { user: ConnectionUser; children?: React.ReactNode; variant?: "default" | "compact"; connectionStatus?: "connected" | "pending_sent" | "pending_received" | "none" }) {
  const router = useTenantRouter();
  
  const handleCardClick = () => {
    router.push(`/user/${user.id}`);
  };

  const getConnectionBadge = () => {
    if (!connectionStatus || connectionStatus === "none") return null;
    
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
            <UserCheck className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case "pending_sent":
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Request Sent
          </Badge>
        );
      case "pending_received":
        return (
          <Badge variant="outline" className="text-xs border-primary text-primary">
            <UserPlus className="h-3 w-3 mr-1" />
            Wants to Connect
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      className="hover-elevate cursor-pointer group overflow-visible transition-all duration-200" 
      data-testid={`card-user-${user.id}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.mumblesVibeName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {getInitials(user.mumblesVibeName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" title="Member" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {user.mumblesVibeName}
              </h3>
              {getConnectionBadge()}
            </div>
            {(user.gender || user.ageGroup) && (
              <div className="flex items-center gap-2 mt-1">
                {user.gender && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {user.gender}
                  </Badge>
                )}
                {user.ageGroup && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {user.ageGroup}
                  </Badge>
                )}
              </div>
            )}
            {user.aboutMe && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{user.aboutMe}</p>
            )}
            {children && (
              <div className="mt-4 flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {children}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SearchTab() {
  const { isAuthenticated } = useAuth();
  const router = useTenantRouter();
  const location = usePathname();
  
  const searchParamsHook = useSearchParams();
  const initialName = searchParamsHook.get("name") || "";
  const initialGender = searchParamsHook.get("gender") || "";
  const initialAgeGroup = searchParamsHook.get("ageGroup") || "";
  
  const initialCustomFilters: Record<number, string> = {};
  searchParamsHook.forEach((value, key) => {
    if (key.startsWith("field_")) {
      const fieldId = parseInt(key.replace("field_", ""));
      if (!isNaN(fieldId)) {
        initialCustomFilters[fieldId] = value;
      }
    }
  });
  
  const hasInitialSearch = searchParamsHook.get("searched") === "true" || initialName || initialGender || initialAgeGroup || Object.keys(initialCustomFilters).length > 0;
  
  const [searchName, setSearchName] = useState(initialName);
  const [searchGender, setSearchGender] = useState<string>(initialGender);
  const [searchAgeGroup, setSearchAgeGroup] = useState<string>(initialAgeGroup);
  const [customFieldFilters, setCustomFieldFilters] = useState<Record<number, string>>(initialCustomFilters);
  const [hasSearched, setHasSearched] = useState(hasInitialSearch);
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(hasInitialSearch ? searchParamsHook : null);

  const { data: profileFields } = useGetProfileFieldsQuery(undefined, { skip: !isAuthenticated });

  const dropdownFields = profileFields?.filter(f => f.fieldType === 'select') || [];

  const searchParamsString = searchParams?.toString() || "";
  const { data: searchResults, isLoading: isSearching } = useSearchUsersQuery(searchParamsString, { skip: !searchParams || !isAuthenticated });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchName.trim()) params.set("name", searchName.trim());
    if (searchGender) params.set("gender", searchGender);
    if (searchAgeGroup) params.set("ageGroup", searchAgeGroup);
    Object.entries(customFieldFilters).forEach(([fieldId, value]) => {
      if (value) params.set(`field_${fieldId}`, value);
    });
    params.set("searched", "true");
    params.set("tab", "search");
    setSearchParams(params);
    setHasSearched(true);
    
    const urlParams = new URLSearchParams(params.toString());
    const currentParams = new URLSearchParams(window.location.search);
    const tenantId = currentParams.get("_tenantId");
    if (tenantId) urlParams.set("_tenantId", tenantId);
    window.history.replaceState({}, '', `/members?${urlParams.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchName("");
    setSearchGender("");
    setSearchAgeGroup("");
    setCustomFieldFilters({});
    setSearchParams(null);
    setHasSearched(false);
    
    const currentParams = new URLSearchParams(window.location.search);
    const tenantId = currentParams.get("_tenantId");
    const clearUrl = tenantId ? `/members?tab=search&_tenantId=${encodeURIComponent(tenantId)}` : '/members?tab=search';
    window.history.replaceState({}, '', clearUrl);
  };

  const hasFilters = searchName || searchGender || searchAgeGroup || 
    Object.values(customFieldFilters).some(v => v);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/30 to-muted/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-primary" />
            Find Members
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Search by name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                    data-testid="input-search-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={searchGender || "__all__"}
                      onValueChange={(v) => setSearchGender(v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger id="gender" data-testid="select-search-gender">
                        <SelectValue placeholder="Any gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Any gender</SelectItem>
                        {genderOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {searchGender && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchGender("")}
                      data-testid="button-clear-gender"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageGroup" className="text-sm font-medium">Age Group</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={searchAgeGroup || "__all__"}
                      onValueChange={(v) => setSearchAgeGroup(v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger id="ageGroup" data-testid="select-search-age-group">
                        <SelectValue placeholder="Any age group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Any age group</SelectItem>
                        {ageGroupOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {searchAgeGroup && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchAgeGroup("")}
                      data-testid="button-clear-age-group"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {dropdownFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`} className="text-sm font-medium">{field.label}</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={customFieldFilters[field.id] || "__all__"}
                        onValueChange={(v) => setCustomFieldFilters(prev => ({
                          ...prev,
                          [field.id]: v === "__all__" ? "" : v
                        }))}
                      >
                        <SelectTrigger id={`field-${field.id}`} data-testid={`select-search-field-${field.slug}`}>
                          <SelectValue placeholder={`Any ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Any {field.label.toLowerCase()}</SelectItem>
                          {field.options.map((option) => (
                            <SelectItem key={option.id} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {customFieldFilters[field.id] && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCustomFieldFilters(prev => ({
                          ...prev,
                          [field.id]: ""
                        }))}
                        data-testid={`button-clear-field-${field.slug}`}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSearch} disabled={isSearching} size="lg" data-testid="button-search">
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Searching..." : "Search Members"}
              </Button>
              {hasFilters && (
                <Button variant="outline" size="lg" onClick={handleClearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {isSearching ? "Searching..." : 
                !searchResults || searchResults.length === 0 ? "No members found" :
                `${searchResults.length} member${searchResults.length === 1 ? '' : 's'} found`}
            </h2>
          </div>

          {searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {searchResults.map((result) => (
                <UserCard key={result.id} user={result} connectionStatus={result.connectionStatus} />
              ))}
            </div>
          )}
          
          {searchResults?.length === 0 && (
            <Card className="bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <UserIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No matches found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Try adjusting your search filters to find more members
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!hasSearched && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Discover Community Members</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Use the filters above to search for members who share your interests and connect with like-minded people
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Find members</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>Connect</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConnectionsTab({ onOpenChat }: { onOpenChat: (userId: string) => void }) {
  const { toast } = useToast();
  
  const { data: connections, isLoading } = useGetConnectionsQuery();

  const [removeConnectionTrigger, { isLoading: removeLoading }] = useRemoveConnectionMutation();
  const removeConnection = {
    mutate: (connectionId: number) => {
      removeConnectionTrigger(connectionId).unwrap()
        .then(() => { toast({ title: "Connection removed" }); })
        .catch(() => { toast({ title: "Failed to remove connection", variant: "destructive" }); });
    },
    isPending: removeLoading,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Connections Yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Start building your network by searching for members and sending connection requests
          </p>
          <Button variant="default" onClick={() => {}} data-testid="button-find-members">
            <Search className="h-4 w-4 mr-2" />
            Find Members
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">Your Connections</h3>
            <p className="text-sm text-muted-foreground">
              {connections.length} connection{connections.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {connections.map((conn) => (
          <UserCard key={conn.id} user={conn.connectedUser}>
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenChat(conn.connectedUser.id)}
              data-testid={`button-chat-${conn.connectedUser.id}`}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </Button>
          </UserCard>
        ))}
      </div>
    </div>
  );
}

function ConnectRequestsTab({ isActive }: { isActive: boolean }) {
  const { toast } = useToast();
  const [hasMarkedRead, setHasMarkedRead] = useState(false);

  const { data: incomingRequests, isLoading: loadingIncoming } = useGetIncomingRequestsQuery();

  const { data: outgoingRequests, isLoading: loadingOutgoing } = useGetOutgoingRequestsQuery();

  const [markConnectionNotificationsRead] = useMarkConnectionNotificationsReadMutation();

  useEffect(() => {
    if (isActive && incomingRequests && incomingRequests.length > 0 && !hasMarkedRead) {
      setHasMarkedRead(true);
      markConnectionNotificationsRead({ type: "incoming_request" }).catch(() => {});
    }
  }, [isActive, incomingRequests, hasMarkedRead]);

  const [acceptConnectionTrigger, { isLoading: acceptLoading }] = useAcceptConnectionMutation();
  const acceptRequest = {
    mutate: (connectionId: number) => {
      acceptConnectionTrigger(connectionId).unwrap()
        .then(() => { toast({ title: "Connection request accepted" }); })
        .catch(() => { toast({ title: "Failed to accept request", variant: "destructive" }); });
    },
    isPending: acceptLoading,
  };

  const [declineConnectionTrigger, { isLoading: declineLoading }] = useDeclineConnectionMutation();
  const rejectRequest = {
    mutate: (connectionId: number) => {
      declineConnectionTrigger(connectionId).unwrap()
        .then(() => { toast({ title: "Connection request declined" }); })
        .catch(() => { toast({ title: "Failed to decline request", variant: "destructive" }); });
    },
    isPending: declineLoading,
  };

  const [removeConnectionTrigger2, { isLoading: cancelLoading }] = useRemoveConnectionMutation();
  const cancelRequest = {
    mutate: (connectionId: number) => {
      removeConnectionTrigger2(connectionId).unwrap()
        .then(() => { toast({ title: "Connection request cancelled" }); })
        .catch(() => { toast({ title: "Failed to cancel request", variant: "destructive" }); });
    },
    isPending: cancelLoading,
  };

  const isLoading = loadingIncoming || loadingOutgoing;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  const hasIncoming = incomingRequests && incomingRequests.length > 0;
  const hasOutgoing = outgoingRequests && outgoingRequests.length > 0;

  if (!hasIncoming && !hasOutgoing) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Clock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
          <p className="text-muted-foreground max-w-md">
            When someone sends you a connection request, it will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {hasIncoming && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Friends Requests</h3>
              <p className="text-sm text-muted-foreground">
                {incomingRequests.length} pending request{incomingRequests.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {incomingRequests.map((req) => (
              <UserCard key={req.id} user={req.requester}>
                {req.message && (
                  <div className="col-span-full mb-2 p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground italic">"{req.message}"</p>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => acceptRequest.mutate(req.id)}
                  disabled={acceptRequest.isPending || rejectRequest.isPending}
                  data-testid={`button-accept-request-${req.id}`}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rejectRequest.mutate(req.id)}
                  disabled={acceptRequest.isPending || rejectRequest.isPending}
                  data-testid={`button-reject-request-${req.id}`}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </UserCard>
            ))}
          </div>
        </div>
      )}

      {hasOutgoing && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Send className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold">Sent Requests</h3>
              <p className="text-sm text-muted-foreground">
                {outgoingRequests.length} awaiting response{outgoingRequests.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {outgoingRequests.map((req) => (
              <UserCard key={req.id} user={req.receiver}>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelRequest.mutate(req.id)}
                  disabled={cancelRequest.isPending}
                  data-testid={`button-cancel-request-${req.id}`}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </UserCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type NotificationCounts = {
  incomingRequests: number;
  acceptedRequests: number;
  unreadMessages: number;
  total: number;
};

export default function MemberSearchPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useTenantRouter();
  const memberSearchParams = useSearchParams();
  
  const tabFromUrl = memberSearchParams.get('tab');
  const chatFromUrl = memberSearchParams.get('chat');
  const defaultTab = tabFromUrl && ['search', 'connections', 'requests'].includes(tabFromUrl) ? tabFromUrl : 'search';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [chatRecipientId, setChatRecipientId] = useState<string | null>(chatFromUrl);

  // Open chat from URL parameter and switch to connections tab
  useEffect(() => {
    if (chatFromUrl) {
      setChatRecipientId(chatFromUrl);
      setActiveTab('connections');
      // Clear the chat param from URL to avoid reopening on refresh
      const params = new URLSearchParams(window.location.search);
      params.delete('chat');
      params.set('tab', 'connections');
      window.history.replaceState({}, '', `/members?${params.toString()}`);
    }
  }, [chatFromUrl]);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    // Clear search-related params when switching away from search tab
    if (newTab !== 'search') {
      params.delete('searched');
      params.delete('name');
      params.delete('gender');
      params.delete('ageGroup');
      // Remove custom field params
      Array.from(params.keys()).filter(k => k.startsWith('field_')).forEach(k => params.delete(k));
    }
    window.history.replaceState({}, '', `/members?${params.toString()}`);
  };

  // Fetch notification counts
  const { data: notificationCounts } = useGetNotificationCountsQuery(undefined, {
    skip: !isAuthenticated || authLoading,
    pollingInterval: 30000,
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen py-8 md:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/signin");
    return null;
  }

  return (
    <FeatureGate feature="featureConnections" featureName="Connections">
    <div className="min-h-screen">
      <SEO 
        title="Connections"
        description="Connect with other members in our community."
        canonicalUrl="/members"
        noIndex={true}
      />
      
      <div className="bg-gradient-to-b from-primary/5 via-primary/5 to-transparent py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
              <p className="text-muted-foreground mt-1">Search for members and manage your network</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="search" className="text-sm" data-testid="tab-search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="connections" className="relative text-sm" data-testid="tab-connections">
              <UserCheck className="h-4 w-4 mr-2" />
              Connections
              {(notificationCounts?.unreadMessages || 0) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center px-1">
                  {notificationCounts!.unreadMessages > 99 ? "99+" : notificationCounts!.unreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative text-sm" data-testid="tab-requests">
              <UserPlus className="h-4 w-4 mr-2" />
              Requests
              {(notificationCounts?.incomingRequests || 0) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center px-1">
                  {notificationCounts!.incomingRequests > 99 ? "99+" : notificationCounts!.incomingRequests}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-8">
            <SearchTab />
          </TabsContent>

          <TabsContent value="connections" className="mt-8">
            <ConnectionsTab onOpenChat={(userId) => setChatRecipientId(userId)} />
          </TabsContent>

          <TabsContent value="requests" className="mt-8">
            <ConnectRequestsTab isActive={activeTab === "requests"} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="pb-12" />

      <ChatDialog 
        recipientId={chatRecipientId} 
        onClose={() => {
          setChatRecipientId(null);
        }} 
      />
    </div>
    </FeatureGate>
  );
}
