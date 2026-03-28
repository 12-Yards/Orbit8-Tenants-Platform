"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SEO } from "@/components/seo";
import { Camera, Save, Mail, User as UserIcon, Trash2, Plus, Lock, Globe, Edit2, Check, X, ZoomIn, ZoomOut, Crown, ArrowUpRight, Users, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionPlan, SiteSettings, Group } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  useGetProfileQuery,
  useGetProfilePicturesQuery,
  useGetProfileFieldsQuery,
  useGetProfileCustomFieldsQuery,
  useGetSiteSettingsQuery,
  useGetUserSubscriptionQuery,
  useGetSubscriptionPlansQuery,
  useGetMyGroupsQuery,
  useCompleteSsoFirstLoginMutation,
  useUpdateProfileMutation,
  useDeleteProfilePictureMutation,
} from "@/store/api";
import { useAuth } from "@/hooks/use-auth";
import { genderOptions, ageGroupOptions } from "@shared/models/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProfilePictureData = {
  id: number;
  imageUrl: string;
  caption: string | null;
  orderIndex: number;
};

type ProfileFieldDefinition = {
  id: number;
  label: string;
  slug: string;
  fieldType: 'text' | 'select' | 'selector';
  description: string | null;
  options: { id: number; label: string; value: string }[];
};

type UserProfileFieldValue = {
  fieldId: number;
  value: string | null;
};

type UserProfile = {
  id: string;
  email: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
  aboutMe: string | null;
  gender: string | null;
  ageGroup: string | null;
  profilePictures: string[];
  isProfilePublic: boolean;
  createdAt: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useTenantRouter();
  const searchParamsRaw = useSearchParams();
  const searchParams = searchParamsRaw.toString();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const [mumblesVibeName, setMumblesVibeName] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [pictureToDelete, setPictureToDelete] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<{ id: number; caption: string } | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});
  const [isEditingCustomFields, setIsEditingCustomFields] = useState(false);
  const [originalCustomFieldValues, setOriginalCustomFieldValues] = useState<Record<number, string>>({});
  const [selectorSuggestions, setSelectorSuggestions] = useState<Record<number, string[]>>({});
  const [showSelectorDropdown, setShowSelectorDropdown] = useState<number | null>(null);
  const [showSsoWelcome, setShowSsoWelcome] = useState(false);
  const [isSsoFirstLogin, setIsSsoFirstLogin] = useState(false);
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  // Check for SSO first login from URL params or user state
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get("sso") === "true" && params.get("first") === "true") {
      setIsSsoFirstLogin(true);
      setShowSsoWelcome(true);
      setIsEditing(true); // Auto-enable editing for first-time SSO users
    }
  }, [searchParams]);

  // Also check user state for SSO first login (in case they refresh)
  useEffect(() => {
    if (user && (user as any).ssoLinked && !(user as any).ssoFirstLoginComplete) {
      setIsSsoFirstLogin(true);
      setShowSsoWelcome(true);
      setIsEditing(true);
    }
  }, [user]);

  const { data: profile, isLoading } = useGetProfileQuery(undefined, { skip: !isAuthenticated });

  const { data: profilePictures } = useGetProfilePicturesQuery(undefined, { skip: !isAuthenticated });

  const { data: profileFields } = useGetProfileFieldsQuery(undefined, { skip: !isAuthenticated });

  const { data: userFieldValues } = useGetProfileCustomFieldsQuery(undefined, { skip: !isAuthenticated });

  useEffect(() => {
    if (userFieldValues) {
      const values: Record<number, string> = {};
      userFieldValues.forEach((fv) => {
        if (fv.value) values[fv.fieldId] = fv.value;
      });
      setCustomFieldValues(values);
      setOriginalCustomFieldValues(values);
    }
  }, [userFieldValues]);

  const { data: siteSettings } = useGetSiteSettingsQuery();
  
  const platformName = siteSettings?.platformName || "MumblesVibe";
  const currency = siteSettings?.currency ?? "$";

  const { data: currentSubscription } = useGetUserSubscriptionQuery(undefined, { skip: !isAuthenticated });

  const { data: allPlans } = useGetSubscriptionPlansQuery(undefined, { skip: !isAuthenticated });

  const currentPlan = currentSubscription?.plan;
  const hasUpgradeOption = allPlans?.some(
    (plan) => plan.isActive && plan.price > (currentPlan?.price || 0)
  );

  const { data: myGroups } = useGetMyGroupsQuery(undefined, { skip: !isAuthenticated });

  const [completeSsoFirstLogin] = useCompleteSsoFirstLoginMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [deleteProfilePicture, { isLoading: isDeletingPicture }] = useDeleteProfilePictureMutation();

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUpdatingCaption, setIsUpdatingCaption] = useState(false);
  const [isSavingCustomFields, setIsSavingCustomFields] = useState(false);

  const handleCompleteSsoFirstLogin = () => {
    completeSsoFirstLogin().unwrap().then(() => {
      setShowSsoWelcome(false);
    }).catch(() => {});
  };

  const handleUpdateProfile = (data: Partial<UserProfile>) => {
    updateProfile(data).unwrap().then(() => {
      setIsEditing(false);
      if (isSsoFirstLogin) {
        handleCompleteSsoFirstLogin();
        setShowSsoWelcome(false);
        setIsSsoFirstLogin(false);
        window.history.replaceState({}, "", "/profile");
        toast({ title: "Welcome! Your profile has been set up." });
      } else {
        toast({ title: "Profile updated" });
      }
    }).catch(() => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    });
  };

  const handleUploadImage = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await api.post("/api/uploads/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { url } = uploadResponse.data;
      await api.post("/api/profile/image", { objectPath: url });
      toast({ title: "Profile picture updated" });
    } catch (error: any) {
      toast({ title: error.message || "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadGalleryPicture = async (file: File) => {
    setIsUploadingGallery(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await api.post("/api/uploads/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { url } = uploadResponse.data;
      await apiRequest("POST", "/api/profile/pictures", { pictureUrl: url });
      toast({ title: "Picture added to gallery" });
    } catch (error: any) {
      toast({ title: error.message || "Failed to upload picture", variant: "destructive" });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleDeleteGalleryPicture = (pictureId: number) => {
    deleteProfilePicture(String(pictureId)).unwrap().then(() => {
      toast({ title: "Picture removed from gallery" });
      setPictureToDelete(null);
    }).catch(() => {
      toast({ title: "Failed to remove picture", variant: "destructive" });
    });
  };

  const handleUpdatePictureCaption = async ({ id, caption }: { id: number; caption: string }) => {
    setIsUpdatingCaption(true);
    try {
      await apiRequest("PUT", `/api/profile/pictures/${id}`, { caption });
      setEditingCaption(null);
      toast({ title: "Caption updated" });
    } catch {
      toast({ title: "Failed to update caption", variant: "destructive" });
    } finally {
      setIsUpdatingCaption(false);
    }
  };

  const handleSaveAllCustomFields = async (fieldsToUpdate: { fieldId: number; value: string | null }[]) => {
    setIsSavingCustomFields(true);
    try {
      await Promise.all(
        fieldsToUpdate.map(({ fieldId, value }) =>
          apiRequest("PUT", `/api/profile/custom-fields/${fieldId}`, { value })
        )
      );
      setIsEditingCustomFields(false);
      toast({ title: "Additional information saved" });
    } catch {
      toast({ title: "Failed to save changes", variant: "destructive" });
    } finally {
      setIsSavingCustomFields(false);
    }
  };

  const handleSaveCustomFields = () => {
    if (!profileFields) return;
    
    const changedFields: { fieldId: number; value: string | null }[] = [];
    profileFields.forEach((field) => {
      const currentValue = customFieldValues[field.id] || "";
      const originalValue = originalCustomFieldValues[field.id] || "";
      if (currentValue !== originalValue) {
        changedFields.push({ fieldId: field.id, value: currentValue || null });
      }
    });
    
    if (changedFields.length === 0) {
      setIsEditingCustomFields(false);
      return;
    }
    
    handleSaveAllCustomFields(changedFields);
  };

  const startEditingCustomFields = () => {
    setOriginalCustomFieldValues({ ...customFieldValues });
    setIsEditingCustomFields(true);
  };

  const cancelEditingCustomFields = () => {
    setCustomFieldValues({ ...originalCustomFieldValues });
    setIsEditingCustomFields(false);
  };

  const searchSelectorValues = async (fieldId: number, query: string) => {
    if (query.length < 1) {
      setSelectorSuggestions((prev) => ({ ...prev, [fieldId]: [] }));
      setShowSelectorDropdown(null);
      return;
    }
    try {
      const response = await api.get(`/api/profile-fields/${fieldId}/selector-values/search?q=${encodeURIComponent(query)}&limit=10`);
      setSelectorSuggestions((prev) => ({ ...prev, [fieldId]: response.data }));
      setShowSelectorDropdown(fieldId);
    } catch (error) {
      console.error("Error searching selector values:", error);
    }
  };

  const selectSelectorValue = (fieldId: number, value: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    setShowSelectorDropdown(null);
    setSelectorSuggestions((prev) => ({ ...prev, [fieldId]: [] }));
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!cropImageSrc || !croppedAreaPixels) return null;

    const image = new Image();
    image.src = cropImageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      400,
      400
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  }, [cropImageSrc, croppedAreaPixels]);

  const handleCropSave = async () => {
    const croppedBlob = await createCroppedImage();
    if (croppedBlob) {
      const file = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
      handleUploadImage(file);
    }
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 400 || img.height < 400) {
          toast({ 
            title: "Image too small", 
            description: "Please upload an image at least 400x400 pixels",
            variant: "destructive" 
          });
          return;
        }
        setCropImageSrc(reader.result as string);
      };
      img.onerror = () => {
        toast({ title: "Invalid image file", variant: "destructive" });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUploadGalleryPicture(file);
  };

  const handleSaveProfile = () => {
    handleUpdateProfile({
      mumblesVibeName: mumblesVibeName.trim(),
      aboutMe: aboutMe.trim() || null,
      gender,
      ageGroup,
      isProfilePublic,
    });
  };

  const startEditing = () => {
    setMumblesVibeName(profile?.mumblesVibeName || "");
    setAboutMe(profile?.aboutMe || "");
    setGender(profile?.gender || null);
    setAgeGroup(profile?.ageGroup || null);
    setIsProfilePublic(profile?.isProfilePublic ?? true);
    setIsEditing(true);
  };

  if (authLoading || isLoading) {
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

  if (!isAuthenticated) {
    router.push("/signin");
    return null;
  }

  const initials = profile?.mumblesVibeName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="min-h-screen py-8 md:py-12">
      <SEO 
        title="Your Profile"
        description={`Manage your ${platformName} account settings, update your profile picture, and customize your ${platformName} Name.`}
        canonicalUrl="/profile"
        noIndex={true}
      />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-6">
        <SectionHeader
          title="Your Profile"
          description="Manage your account settings"
        />

        {showSsoWelcome && (
          <Alert className="border-primary/50 bg-primary/10">
            <PartyPopper className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary font-semibold">Welcome to {platformName}!</AlertTitle>
            <AlertDescription>
              Your account has been created. Please take a moment to set up your profile and choose a display name.
            </AlertDescription>
          </Alert>
        )}

        {currentPlan && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-md">
                    <Crown className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Your Subscription</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                        {currentPlan.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {currentPlan.price === 0 ? "Free" : `${currency}${currentPlan.price}/${currentPlan.billingPeriod}`}
                      </span>
                    </div>
                  </div>
                </div>
                {hasUpgradeOption && (
                  <Link href="/subscription">
                    <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10" data-testid="button-upgrade-plan">
                      <ArrowUpRight className="h-4 w-4" />
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Profile Information</span>
              <div className="flex items-center gap-2 text-sm font-normal">
                {profile?.isProfilePublic ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Globe className="h-4 w-4" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Lock className="h-4 w-4" /> Private
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {profile?.profileImageUrl && (
                    <AvatarImage src={profile.profileImageUrl} alt={profile.mumblesVibeName} />
                  )}
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  data-testid="button-change-avatar"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-avatar-file"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to upload a profile picture (400x400 pixels required)
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted"
                  data-testid="input-email"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {platformName} Name
                </Label>
                {isEditing ? (
                  <Input
                    value={mumblesVibeName}
                    onChange={(e) => setMumblesVibeName(e.target.value)}
                    placeholder="Enter your vibe name"
                    data-testid="input-vibe-name-edit"
                  />
                ) : (
                  <Input
                    value={profile?.mumblesVibeName || ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-vibe-name"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>About Me</Label>
                {isEditing ? (
                  <Textarea
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                    rows={4}
                    data-testid="input-about-me-edit"
                  />
                ) : (
                  <div className="p-3 border rounded-md bg-muted min-h-[80px] text-sm">
                    {profile?.aboutMe || <span className="text-muted-foreground">No description added</span>}
                  </div>
                )}
                {isEditing && (
                  <p className="text-xs text-muted-foreground">{aboutMe.length}/500 characters</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  {isEditing ? (
                    <Select value={gender || ""} onValueChange={(v) => setGender(v || null)}>
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={profile?.gender || "Not specified"}
                      disabled
                      className="bg-muted"
                      data-testid="input-gender"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Age Group</Label>
                  {isEditing ? (
                    <Select value={ageGroup || ""} onValueChange={(v) => setAgeGroup(v || null)}>
                      <SelectTrigger data-testid="select-age-group">
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageGroupOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={profile?.ageGroup || "Not specified"}
                      disabled
                      className="bg-muted"
                      data-testid="input-age-group"
                    />
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      {isProfilePublic ? "Anyone can view your profile" : "Only you can view your profile"}
                    </p>
                  </div>
                  <Switch
                    checked={isProfilePublic}
                    onCheckedChange={setIsProfilePublic}
                    data-testid="switch-profile-public"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input
                  value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}
                  disabled
                  className="bg-muted"
                  data-testid="input-member-since"
                />
              </div>

              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={!mumblesVibeName.trim() || isUpdatingProfile}
                      data-testid="button-save-profile"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={startEditing}
                    data-testid="button-edit-profile"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {profileFields && profileFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These fields are optional but help other members learn more about you.
              </p>
              <div className="space-y-4">
                {profileFields.map((field) => (
                  <div key={field.id} className="space-y-2" data-testid={`custom-field-${field.slug}`}>
                    <Label>{field.label}</Label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    {field.fieldType === 'select' ? (
                      <Select
                        value={customFieldValues[field.id] || "__none__"}
                        onValueChange={(value) => {
                          const actualValue = value === "__none__" ? "" : value;
                          setCustomFieldValues((prev) => ({ ...prev, [field.id]: actualValue }));
                        }}
                        disabled={!isEditingCustomFields}
                      >
                        <SelectTrigger data-testid={`select-custom-field-${field.slug}`}>
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Not specified</SelectItem>
                          {field.options.map((option) => (
                            <SelectItem key={option.id} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.fieldType === 'selector' ? (
                      <div className="relative">
                        <Input
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => {
                            setCustomFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }));
                            searchSelectorValues(field.id, e.target.value);
                          }}
                          onFocus={() => {
                            const currentValue = customFieldValues[field.id] || "";
                            if (currentValue.length > 0) {
                              searchSelectorValues(field.id, currentValue);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowSelectorDropdown(null), 200);
                          }}
                          placeholder={`Search ${field.label.toLowerCase()}`}
                          maxLength={200}
                          disabled={!isEditingCustomFields}
                          data-testid={`input-selector-field-${field.slug}`}
                          autoComplete="off"
                        />
                        {showSelectorDropdown === field.id && selectorSuggestions[field.id]?.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                            {selectorSuggestions[field.id].map((suggestion, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 cursor-pointer hover-elevate text-sm"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectSelectorValue(field.id, suggestion);
                                }}
                                data-testid={`selector-suggestion-${field.slug}-${idx}`}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        maxLength={200}
                        disabled={!isEditingCustomFields}
                        data-testid={`input-custom-field-${field.slug}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                {isEditingCustomFields ? (
                  <>
                    <Button
                      onClick={handleSaveCustomFields}
                      disabled={isSavingCustomFields}
                      data-testid="button-save-custom-fields"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEditingCustomFields}
                      disabled={isSavingCustomFields}
                      data-testid="button-cancel-custom-fields"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={startEditingCustomFields}
                    data-testid="button-edit-custom-fields"
                  >
                    Edit Additional Info
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add up to 10 photos to your profile gallery. You can add captions to describe each photo.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profilePictures?.map((pic) => (
                <div key={pic.id} className="relative group" data-testid={`gallery-picture-${pic.id}`}>
                  <div className="aspect-square">
                    <img
                      src={pic.imageUrl}
                      alt={pic.caption || `Gallery photo`}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6"
                      onClick={() => setEditingCaption({ id: pic.id, caption: pic.caption || "" })}
                      data-testid={`button-edit-caption-${pic.id}`}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-6 w-6"
                      onClick={() => setPictureToDelete(pic.id)}
                      data-testid={`button-delete-picture-${pic.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {pic.caption ? (
                    <p className="mt-2 text-sm text-muted-foreground truncate" title={pic.caption}>
                      {pic.caption}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground italic">No caption</p>
                  )}
                </div>
              ))}
              {(profilePictures?.length || 0) < 10 && (
                <button
                  className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors gap-2"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploadingGallery}
                  data-testid="button-add-gallery-picture"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </button>
              )}
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleGalleryUpload}
              className="hidden"
              data-testid="input-gallery-file"
            />
          </CardContent>
        </Card>

        {myGroups && myGroups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myGroups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.slug}`}>
                    <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-group-${group.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {group.imageUrl ? (
                            <img
                              src={group.imageUrl}
                              alt={group.name}
                              className="w-14 h-14 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="h-7 w-7 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{group.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              {group.isPublic ? (
                                <>
                                  <Globe className="h-3 w-3" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3" />
                                  Private
                                </>
                              )}
                            </div>
                            {group.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!cropImageSrc} onOpenChange={(open) => !open && handleCropCancel()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the portion of the image you want to use as your profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative h-72 bg-muted rounded-md overflow-hidden">
              {cropImageSrc && (
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
                className="flex-1"
                data-testid="slider-zoom"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCropCancel}
              data-testid="button-cancel-crop"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropSave}
              disabled={isUploadingImage}
              data-testid="button-save-crop"
            >
              {isUploadingImage ? "Uploading..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pictureToDelete} onOpenChange={(open) => !open && setPictureToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this picture from your gallery? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-picture">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pictureToDelete && handleDeleteGalleryPicture(pictureToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-picture"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingCaption} onOpenChange={(open) => !open && setEditingCaption(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Photo Caption</DialogTitle>
            <DialogDescription>
              Add a caption to describe this photo. Captions are visible when others view your profile gallery.
            </DialogDescription>
          </DialogHeader>
          {editingCaption && (
            <div className="space-y-4">
              <div className="aspect-video relative rounded-md overflow-hidden bg-muted">
                <img
                  src={profilePictures?.find(p => p.id === editingCaption.id)?.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={editingCaption.caption}
                  onChange={(e) => setEditingCaption({ ...editingCaption, caption: e.target.value })}
                  placeholder="Describe this photo..."
                  maxLength={100}
                  rows={3}
                  className="resize-none"
                  data-testid="input-caption-dialog"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {editingCaption.caption.length}/100 characters
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditingCaption(null)}
              data-testid="button-cancel-caption"
            >
              Cancel
            </Button>
            <Button
              onClick={() => editingCaption && handleUpdatePictureCaption({ id: editingCaption.id, caption: editingCaption.caption })}
              disabled={isUpdatingCaption}
              data-testid="button-save-caption"
            >
              {isUpdatingCaption ? "Saving..." : "Save Caption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
