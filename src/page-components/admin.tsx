// @ts-nocheck
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import api from "@/lib/api";
import {
  api as rtkApi,
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
  useGetHeroSettingsQuery,
  useUpdateHeroSettingsMutation,
  useGetArticlesQuery,
  useCreateArticleMutation,
  useGetArticleCategoriesQuery,
  useCreateArticleCategoryMutation,
  useUpdateArticleCategoryMutation,
  useDeleteArticleCategoryMutation,
  useReorderArticleCategoriesMutation,
  useGetEventsQuery,
  useGetAdminEventsQuery,
  useCreateEventMutation,
  useGetEventCategoriesQuery,
  useCreateEventCategoryMutation,
  useUpdateEventCategoryMutation,
  useDeleteEventCategoryMutation,
  useReorderEventCategoriesMutation,
  useGetEventSuggestionsQuery,
  useGetPendingEventSuggestionsQuery,
  useGetGroupsQuery,
  useGetAdminGroupsQuery,
  useGetAdminGroupPendingCountsQuery,
  useGetAdminGroupPostsQuery,
  useGetAdminGroupMembersQuery,
  useGetAdminGroupPendingQuery,
  useCreateAdminGroupMutation,
  useGetAdminPollsQuery,
  useCreatePollMutation,
  useGetAdminReviewsQuery,
  useGetReviewCategoriesQuery,
  useCreateReviewCategoryMutation,
  useUpdateReviewCategoryMutation,
  useDeleteReviewCategoryMutation,
  useReorderReviewCategoriesMutation,
  useGetAdminVibesQuery,
  useGetAdminPodcastsQuery,
  useCreatePodcastMutation,
  useUpdatePodcastMutation,
  useDeletePodcastMutation,
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useBlockAdminUserMutation,
  useChangeAdminUserPasswordMutation,
  useDeleteAdminUserMutation,
  useGetAdminContactRequestsQuery,
  useGetAdminSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useGetStripeProductsQuery,
  useGetAdminProfileFieldsQuery,
  useCreateAdminProfileFieldMutation,
  useUpdateAdminProfileFieldMutation,
  useDeleteAdminProfileFieldMutation,
  useReorderAdminProfileFieldsMutation,
  useGetInsiderTipsQuery,
  useCreateInsiderTipMutation,
  useUpdateInsiderTipMutation,
  useDeleteInsiderTipMutation,
  useGetAdminPlayRequestsQuery,
  useGetAdminTeeTimeOffersQuery,
  useGetNewsletterSubscriptionsQuery,
  useGetEventBracketQuery,
  useGetEventTeamsQuery,
  useGetEventEntriesQuery,
  useGetEventAttendeesDetailQuery,
  useCreateMuxUploadUrlMutation,
} from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { AdminHelpGuide } from "@/components/admin-help-guide";
import { Pencil, Trash2, Plus, Minus, FileText, Calendar, Mail, Home, Lightbulb, Users, User as UserIcon, ShieldOff, ShieldCheck, CalendarPlus, Check, X, Lock, Star, ThumbsUp, ThumbsDown, BarChart3, MessageSquare, GripVertical, Type, Image, Images, ChevronUp, ChevronDown, ChevronRight, Settings, Twitter, Instagram, Youtube, Linkedin, Edit2, Trophy, Loader2, Shuffle, ArrowLeft, ArrowUpDown, Clock, Eye, Download, Database, Video, AlertCircle, Handshake, MapPin, Globe, HelpCircle } from "lucide-react";
import { SiTiktok, SiSnapchat } from "react-icons/si";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FaUtensils, FaCompass, FaWater, FaMoon, FaLandmark, FaLightbulb, FaShoppingBag, FaBaby, FaFolder, FaMusic, FaCamera, FaCoffee, FaHeart, FaStar, FaMapMarkerAlt,
  FaHome, FaTree, FaBeer, FaWineGlassAlt, FaCocktail, FaIceCream, FaPizzaSlice, FaHamburger, FaFish, FaDog, FaCat, FaPaw,
  FaUmbrellaBeach, FaSwimmer, FaSun, FaCloud, FaMountain, FaBicycle, FaRunning, FaFootballBall, FaGolfBall, FaBasketballBall,
  FaPalette, FaTheaterMasks, FaGuitar, FaMicrophone, FaBook, FaGraduationCap, FaChurch, FaCross, FaPray,
  FaCar, FaBus, FaTrain, FaPlane, FaShip, FaAnchor, FaParking, FaGasPump,
  FaShoppingCart, FaStore, FaGift, FaTshirt, FaGem, FaRing, FaCrown, FaGlasses,
  FaHospital, FaMedkit, FaStethoscope, FaPills, FaTooth, FaHeartbeat,
  FaBuilding, FaCity, FaHouseUser, FaWarehouse, FaIndustry,
  FaWifi, FaTv, FaBed, FaCouch, FaSwimmingPool, FaHotTub, FaDumbbell, FaSpa,
  FaChild, FaGamepad, FaPuzzlePiece, FaBabyCarriage,
  FaBirthdayCake, FaGlassCheers, FaCalendarAlt, FaTicketAlt, FaFireAlt
} from "react-icons/fa";
import { 
  MdRestaurant, MdLocalCafe, MdLocalBar, MdLocalPizza, MdFastfood, MdBakeryDining, MdRamenDining,
  MdBeachAccess, MdPool, MdSurfing, MdKayaking, MdSailing, MdDirectionsBoat,
  MdPark, MdForest, MdNature, MdTerrain, MdLandscape,
  MdMuseum, MdTheaters, MdCasino, MdNightlife, MdAttractions,
  MdSportsGolf, MdSportsTennis, MdSportsSoccer, MdSportsBaseball, MdSportsVolleyball,
  MdPets, MdCrueltyFree, MdChildCare, MdFamilyRestroom, MdAccessible,
  MdLocalFlorist, MdLocalPharmacy, MdLocalLaundryService, MdLocalGroceryStore, MdLocalMall,
  MdWineBar, MdNightlight, MdSunny, MdWbSunny, MdCloud,
  MdFavorite, MdStarRate, MdThumbUp, MdCelebration, MdEmojiEvents
} from "react-icons/md";
import { type IconType } from "react-icons";
import { ImageUpload } from "@/components/image-upload";
import { MediaUpload } from "@/components/media-upload";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import type { Article, Event, NewsletterSubscription, HeroSettings, InsiderTip, User, EventSuggestion, MemberReview, Poll, Vibe, ContactRequest, Group, GroupMembership, GroupPost, SiteSettings, ArticleCategoryRecord, EventCategoryRecord, ReviewCategoryRecord, EventEntry, UserProfile, SubscriptionPlan, Podcast, GroupEvent } from "@shared/schema";
import { defaultArticleCategories } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { RichTextEditor } from "@/components/rich-text-editor";

const iconCategories: { category: string; icons: { name: string; icon: IconType }[] }[] = [
  {
    category: "Food & Drink",
    icons: [
      { name: "restaurant", icon: MdRestaurant },
      { name: "utensils", icon: FaUtensils },
      { name: "cafe", icon: MdLocalCafe },
      { name: "coffee", icon: FaCoffee },
      { name: "bar", icon: MdLocalBar },
      { name: "wine", icon: FaWineGlassAlt },
      { name: "wine-bar", icon: MdWineBar },
      { name: "cocktail", icon: FaCocktail },
      { name: "beer", icon: FaBeer },
      { name: "pizza", icon: FaPizzaSlice },
      { name: "burger", icon: FaHamburger },
      { name: "fastfood", icon: MdFastfood },
      { name: "bakery", icon: MdBakeryDining },
      { name: "ramen", icon: MdRamenDining },
      { name: "ice-cream", icon: FaIceCream },
      { name: "fish", icon: FaFish },
      { name: "birthday-cake", icon: FaBirthdayCake },
      { name: "cheers", icon: FaGlassCheers },
    ]
  },
  {
    category: "Beach & Outdoors",
    icons: [
      { name: "beach", icon: FaUmbrellaBeach },
      { name: "beach-access", icon: MdBeachAccess },
      { name: "water", icon: FaWater },
      { name: "swimmer", icon: FaSwimmer },
      { name: "pool", icon: MdPool },
      { name: "surfing", icon: MdSurfing },
      { name: "kayaking", icon: MdKayaking },
      { name: "sailing", icon: MdSailing },
      { name: "boat", icon: MdDirectionsBoat },
      { name: "sun", icon: FaSun },
      { name: "sunny", icon: MdSunny },
      { name: "cloud", icon: FaCloud },
      { name: "mountain", icon: FaMountain },
      { name: "tree", icon: FaTree },
      { name: "park", icon: MdPark },
      { name: "forest", icon: MdForest },
      { name: "nature", icon: MdNature },
      { name: "landscape", icon: MdLandscape },
    ]
  },
  {
    category: "Activities & Sports",
    icons: [
      { name: "bicycle", icon: FaBicycle },
      { name: "running", icon: FaRunning },
      { name: "golf", icon: MdSportsGolf },
      { name: "tennis", icon: MdSportsTennis },
      { name: "soccer", icon: MdSportsSoccer },
      { name: "football", icon: FaFootballBall },
      { name: "basketball", icon: FaBasketballBall },
      { name: "baseball", icon: MdSportsBaseball },
      { name: "volleyball", icon: MdSportsVolleyball },
      { name: "dumbbell", icon: FaDumbbell },
      { name: "spa", icon: FaSpa },
      { name: "gamepad", icon: FaGamepad },
    ]
  },
  {
    category: "Arts & Culture",
    icons: [
      { name: "palette", icon: FaPalette },
      { name: "theater", icon: FaTheaterMasks },
      { name: "museum", icon: MdMuseum },
      { name: "theaters", icon: MdTheaters },
      { name: "guitar", icon: FaGuitar },
      { name: "microphone", icon: FaMicrophone },
      { name: "music", icon: FaMusic },
      { name: "book", icon: FaBook },
      { name: "graduation", icon: FaGraduationCap },
      { name: "camera", icon: FaCamera },
      { name: "attractions", icon: MdAttractions },
    ]
  },
  {
    category: "Nightlife & Events",
    icons: [
      { name: "moon", icon: FaMoon },
      { name: "nightlife", icon: MdNightlife },
      { name: "casino", icon: MdCasino },
      { name: "celebration", icon: MdCelebration },
      { name: "events", icon: MdEmojiEvents },
      { name: "ticket", icon: FaTicketAlt },
      { name: "calendar", icon: FaCalendarAlt },
      { name: "fire", icon: FaFireAlt },
    ]
  },
  {
    category: "Shopping & Services",
    icons: [
      { name: "shopping-bag", icon: FaShoppingBag },
      { name: "shopping-cart", icon: FaShoppingCart },
      { name: "store", icon: FaStore },
      { name: "mall", icon: MdLocalMall },
      { name: "grocery", icon: MdLocalGroceryStore },
      { name: "gift", icon: FaGift },
      { name: "tshirt", icon: FaTshirt },
      { name: "gem", icon: FaGem },
      { name: "ring", icon: FaRing },
      { name: "crown", icon: FaCrown },
      { name: "glasses", icon: FaGlasses },
      { name: "florist", icon: MdLocalFlorist },
      { name: "pharmacy", icon: MdLocalPharmacy },
      { name: "laundry", icon: MdLocalLaundryService },
    ]
  },
  {
    category: "Accommodation & Amenities",
    icons: [
      { name: "home", icon: FaHome },
      { name: "bed", icon: FaBed },
      { name: "couch", icon: FaCouch },
      { name: "building", icon: FaBuilding },
      { name: "city", icon: FaCity },
      { name: "house", icon: FaHouseUser },
      { name: "wifi", icon: FaWifi },
      { name: "tv", icon: FaTv },
      { name: "swimming-pool", icon: FaSwimmingPool },
      { name: "hot-tub", icon: FaHotTub },
    ]
  },
  {
    category: "Transport",
    icons: [
      { name: "car", icon: FaCar },
      { name: "bus", icon: FaBus },
      { name: "train", icon: FaTrain },
      { name: "plane", icon: FaPlane },
      { name: "ship", icon: FaShip },
      { name: "anchor", icon: FaAnchor },
      { name: "parking", icon: FaParking },
      { name: "gas", icon: FaGasPump },
    ]
  },
  {
    category: "Family & Pets",
    icons: [
      { name: "baby", icon: FaBaby },
      { name: "child", icon: FaChild },
      { name: "family", icon: MdFamilyRestroom },
      { name: "childcare", icon: MdChildCare },
      { name: "puzzle", icon: FaPuzzlePiece },
      { name: "teddy-bear", icon: FaChild },
      { name: "stroller", icon: FaBabyCarriage },
      { name: "dog", icon: FaDog },
      { name: "cat", icon: FaCat },
      { name: "paw", icon: FaPaw },
      { name: "pets", icon: MdPets },
    ]
  },
  {
    category: "Health & Wellness",
    icons: [
      { name: "hospital", icon: FaHospital },
      { name: "medkit", icon: FaMedkit },
      { name: "stethoscope", icon: FaStethoscope },
      { name: "pills", icon: FaPills },
      { name: "tooth", icon: FaTooth },
      { name: "heartbeat", icon: FaHeartbeat },
      { name: "accessible", icon: MdAccessible },
    ]
  },
  {
    category: "Places & Landmarks",
    icons: [
      { name: "landmark", icon: FaLandmark },
      { name: "church", icon: FaChurch },
      { name: "compass", icon: FaCompass },
      { name: "map-marker", icon: FaMapMarkerAlt },
      { name: "warehouse", icon: FaWarehouse },
      { name: "industry", icon: FaIndustry },
    ]
  },
  {
    category: "General",
    icons: [
      { name: "star", icon: FaStar },
      { name: "heart", icon: FaHeart },
      { name: "favorite", icon: MdFavorite },
      { name: "thumbs-up", icon: MdThumbUp },
      { name: "lightbulb", icon: FaLightbulb },
      { name: "folder", icon: FaFolder },
    ]
  },
];

const allIcons = iconCategories.flatMap(cat => cat.icons);

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedIcon = allIcons.find(i => i.name === value);
  const IconComponent = selectedIcon?.icon || FaFolder;

  const filteredCategories = searchTerm
    ? iconCategories.map(cat => ({
        ...cat,
        icons: cat.icons.filter(icon => icon.name.toLowerCase().includes(searchTerm.toLowerCase()))
      })).filter(cat => cat.icons.length > 0)
    : iconCategories;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-28 justify-start gap-2" data-testid="button-icon-picker">
          <IconComponent className="h-4 w-4" />
          <span className="text-xs truncate">{value || "Select"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
            data-testid="input-icon-search"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="p-2 space-y-3">
            {filteredCategories.map(({ category, icons }) => (
              <div key={category}>
                <p className="text-xs font-medium text-muted-foreground mb-1">{category}</p>
                <div className="grid grid-cols-8 gap-1">
                  {icons.map(({ name, icon: Icon }) => (
                    <Button
                      key={name}
                      variant={value === name ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        onChange(name);
                        setOpen(false);
                        setSearchTerm("");
                      }}
                      title={name}
                      data-testid={`icon-option-${name}`}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface ReviewWithAuthor extends MemberReview {
  authorName: string;
  authorProfileImageUrl: string | null;
}

interface AdminVibe extends Vibe {
  authorName: string;
  authorProfileImageUrl: string | null;
}

interface ArticleSection {
  id?: string;
  sectionType: "text" | "image" | "gallery" | "video";
  heading?: string;
  content?: string;
  mediaUrls: string[];
  mediaCaptions: string[];
}

function PodcastForm({ 
  podcast, 
  onSave, 
  onCancel 
}: { 
  podcast?: Podcast; 
  onSave: (data: Partial<Podcast>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: podcast?.title || "",
    slug: podcast?.slug || "",
    excerpt: podcast?.excerpt || "",
    content: podcast?.content || "",
    heroImageUrl: podcast?.heroImageUrl || "",
    mediaUrl: podcast?.mediaUrl || "",
    mediaType: podcast?.mediaType || "link",
    author: podcast?.author || "",
    publishedAt: podcast?.publishedAt || new Date().toISOString().split("T")[0],
    isActive: podcast?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            data-testid="input-podcast-title"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Slug</label>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            data-testid="input-podcast-slug"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Author</label>
          <Input
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            required
            data-testid="input-podcast-author"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Published Date</label>
          <Input
            type="date"
            value={formData.publishedAt}
            onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
            required
            data-testid="input-podcast-date"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Hero Image</label>
        <ImageUpload
          value={formData.heroImageUrl}
          onChange={(url) => setFormData({ ...formData, heroImageUrl: url })}
          testId="input-podcast-image"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Excerpt</label>
        <Textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          required
          data-testid="input-podcast-excerpt"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Content</label>
        <RichTextEditor
            value={formData.content}
            onChange={(val) => setFormData({ ...formData, content: val })}
          />
      </div>
      <div className="border rounded-md p-4 space-y-4">
        <h4 className="font-medium">Media</h4>
        <div>
          <label className="text-sm font-medium">Podcast URL (YouTube, Spotify, Apple Podcasts, etc.)</label>
          <Input
            value={formData.mediaUrl}
            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
            placeholder="https://youtube.com/watch?v=... or https://open.spotify.com/..."
            data-testid="input-podcast-media-url"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          data-testid="switch-podcast-active"
        />
        <label className="text-sm font-medium">Active (visible to users)</label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" data-testid="button-save-podcast">
          {podcast ? "Update Podcast" : "Create Podcast"}
        </Button>
      </div>
    </form>
  );
}

function VideoSectionEditor({ section, index, onUpdate }: { section: any; index: number; onUpdate: (updates: any) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await apiRequest("POST", "/api/mux/upload-url");
      const { uploadUrl, uploadId } = res.data;

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.open("PUT", uploadUrl);
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed"));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setUploading(false);
      setProcessing(true);

      const pollForReady = async () => {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const statusRes = await api.get(`/api/mux/upload/${uploadId}`);
          const status = statusRes.data;
          if (status.playbackId && status.status === "ready") {
            onUpdate({ muxPlaybackId: status.playbackId, muxAssetId: status.assetId });
            setProcessing(false);
            toast({ title: "Video uploaded successfully" });
            return;
          }
          if (status.status === "errored") {
            throw new Error("Video processing failed");
          }
        }
        throw new Error("Video processing timed out");
      };
      await pollForReady();
    } catch (error: any) {
      console.error("Video upload error:", error);
      toast({ title: "Video upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {!section.muxPlaybackId && !uploading && !processing && (
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          data-testid={`video-upload-area-${index}`}
        >
          <Video className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium">Click to upload a video</p>
          <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM supported</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleVideoUpload(file);
            }}
            data-testid={`input-video-file-${index}`}
          />
        </div>
      )}
      {uploading && (
        <div className="border rounded-lg p-4 space-y-2" data-testid={`video-uploading-${index}`}>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Uploading video... {uploadProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
      {processing && (
        <div className="border rounded-lg p-4 flex items-center gap-2" data-testid={`video-processing-${index}`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Processing video... This may take a moment.</span>
        </div>
      )}
      {section.muxPlaybackId && (
        <div className="space-y-2">
          <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
            <img
              src={`https://image.mux.com/${section.muxPlaybackId}/thumbnail.jpg?time=0`}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600"><Check className="h-3 w-3 mr-1" /> Ready</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onUpdate({ muxPlaybackId: null, muxAssetId: null });
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              data-testid={`button-remove-video-${index}`}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Replace
            </Button>
          </div>
        </div>
      )}
      <Input
        placeholder="Video caption (optional)"
        value={section.heading || ""}
        onChange={(e) => onUpdate({ heading: e.target.value })}
        data-testid={`input-video-caption-${index}`}
      />
    </div>
  );
}

function ArticleForm({ 
  article, 
  onSave, 
  onCancel,
  categories
}: { 
  article?: Article; 
  onSave: (data: Partial<Article>, sections?: ArticleSection[]) => void; 
  onCancel: () => void;
  categories?: ArticleCategoryRecord[];
}) {
  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    category: article?.category || "Things to Do",
    excerpt: article?.excerpt || "",
    content: article?.content || "",
    heroImageUrl: article?.heroImageUrl || "",
    author: article?.author || "",
    readingTime: article?.readingTime || 5,
    publishedAt: article?.publishedAt || new Date().toISOString().split("T")[0],
    boostedLikes: article?.boostedLikes || 0,
  });
  const [imageUrls, setImageUrls] = useState<string[]>((article?.imageUrls as string[]) || []);
  const [sections, setSections] = useState<ArticleSection[]>([]);
  const [useSections, setUseSections] = useState(!article);

  useEffect(() => {
    if (article?.id) {
      api.get(`/api/articles/${article.id}/sections`)
        .then(res => res.data)
        .then(data => {
          if (data && data.length > 0) {
            setSections(data.map((s: any) => ({
              id: s.id,
              sectionType: s.sectionType,
              heading: s.heading || "",
              content: s.content || "",
              mediaUrls: s.mediaUrls || [],
              mediaCaptions: s.mediaCaptions || [],
              muxPlaybackId: s.muxPlaybackId || null,
              muxAssetId: s.muxAssetId || null
            })));
            setUseSections(true);
          }
        })
        .catch(console.error);
    }
  }, [article?.id]);

  const newSectionRef = useRef<HTMLDivElement>(null);
  const [newSectionIndex, setNewSectionIndex] = useState<number | null>(null);

  const addSection = (type: "text" | "image" | "gallery" | "video") => {
    setSections(prev => {
      setNewSectionIndex(prev.length);
      return [...prev, {
        sectionType: type,
        heading: "",
        content: type === "text" ? "" : undefined,
        mediaUrls: [],
        mediaCaptions: [],
        muxPlaybackId: null,
        muxAssetId: null
      }];
    });
  };

  useEffect(() => {
    if (newSectionIndex !== null && newSectionRef.current) {
      newSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setNewSectionIndex(null);
    }
  }, [newSectionIndex, sections.length]);

  const updateSection = (index: number, updates: Partial<ArticleSection>) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    setSections(prev => {
      const newSections = [...prev];
      [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
      return newSections;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useSections && sections.length > 0) {
      onSave({ ...formData, imageUrls }, sections);
    } else {
      onSave({ ...formData, imageUrls });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            data-testid="input-article-title"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Slug</label>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            data-testid="input-article-slug"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as typeof formData.category })}
          >
            <SelectTrigger data-testid="select-article-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(categories || defaultArticleCategories).map((cat) => {
                const name = typeof cat === 'string' ? cat : cat.name;
                return <SelectItem key={name} value={name}>{name}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Author</label>
          <Input
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            required
            data-testid="input-article-author"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Hero Image</label>
        <ImageUpload
          value={formData.heroImageUrl}
          onChange={(url) => setFormData({ ...formData, heroImageUrl: url })}
          testId="input-article-image"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Excerpt</label>
        <Textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          required
          data-testid="input-article-excerpt"
        />
      </div>

      <div className="border rounded-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={useSections}
              onCheckedChange={setUseSections}
              data-testid="switch-use-sections"
            />
            <label className="text-sm font-medium">Use Section Editor</label>
          </div>
          <p className="text-xs text-muted-foreground">Toggle to use flexible sections instead of a single content block</p>
        </div>

        {!useSections ? (
          <>
            <div>
              <label className="text-sm font-medium">Gallery Images (carousel)</label>
              <p className="text-xs text-muted-foreground mb-2">Add multiple images to display as a rotating carousel</p>
              {imageUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="" className="h-20 w-20 object-cover rounded-md" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                        data-testid={`button-remove-article-gallery-image-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {imageUrls.length < 10 && (
                <ImageUpload
                  value=""
                  onChange={(url) => setImageUrls(prev => [...prev, url])}
                  testId="input-article-gallery-image"
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-32"
                required={!useSections}
                data-testid="input-article-content"
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={() => addSection("text")} data-testid="button-add-text-section">
                <Type className="h-4 w-4 mr-1" /> Add Text
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addSection("image")} data-testid="button-add-image-section">
                <Image className="h-4 w-4 mr-1" /> Add Image
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addSection("gallery")} data-testid="button-add-gallery-section">
                <Images className="h-4 w-4 mr-1" /> Add Gallery
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addSection("video")} data-testid="button-add-video-section">
                <Video className="h-4 w-4 mr-1" /> Add Video
              </Button>
            </div>

            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No sections yet. Add text, images, or galleries above.</p>
            )}

            {sections.map((section, idx) => (
              <Card key={idx} ref={idx === newSectionIndex ? newSectionRef : undefined} className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSection(idx, "up")}
                      disabled={idx === 0}
                      data-testid={`button-move-section-up-${idx}`}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSection(idx, "down")}
                      disabled={idx === sections.length - 1}
                      data-testid={`button-move-section-down-${idx}`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary">
                        {section.sectionType === "text" && <><Type className="h-3 w-3 mr-1" /> Text</>}
                        {section.sectionType === "image" && <><Image className="h-3 w-3 mr-1" /> Image</>}
                        {section.sectionType === "gallery" && <><Images className="h-3 w-3 mr-1" /> Gallery</>}
                        {section.sectionType === "video" && <><Video className="h-3 w-3 mr-1" /> Video</>}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeSection(idx)}
                        data-testid={`button-remove-section-${idx}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {section.sectionType !== "text" && (
                      <Input
                        placeholder="Section heading (optional)"
                        value={section.heading || ""}
                        onChange={(e) => updateSection(idx, { heading: e.target.value })}
                        data-testid={`input-section-heading-${idx}`}
                      />
                    )}
                    {section.sectionType === "text" && (
                      <RichTextEditor
                          value={section.content || ""}
                          onChange={(content) => updateSection(idx, { content })}
                          placeholder="Enter text content..."
                          className="min-h-24"
                        />
                    )}
                    {section.sectionType === "image" && (
                      <div className="space-y-2">
                        <ImageUpload
                          value={section.mediaUrls[0] || ""}
                          onChange={(url) => updateSection(idx, { mediaUrls: [url] })}
                          testId={`input-section-image-${idx}`}
                        />
                        {section.mediaUrls[0] && (
                          <Input
                            placeholder="Image caption (optional)"
                            value={section.mediaCaptions[0] || ""}
                            onChange={(e) => updateSection(idx, { mediaCaptions: [e.target.value] })}
                            data-testid={`input-section-image-caption-${idx}`}
                          />
                        )}
                      </div>
                    )}
                    {section.sectionType === "gallery" && (
                      <div className="space-y-3">
                        {section.mediaUrls.length > 0 && (
                          <div className="space-y-2">
                            {section.mediaUrls.map((url, imgIdx) => (
                              <div key={imgIdx} className="flex items-start gap-2 p-2 border rounded-md">
                                <div className="relative group flex-shrink-0">
                                  <img src={url} alt="" className="h-16 w-16 object-cover rounded-md" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      const newUrls = section.mediaUrls.filter((_, i) => i !== imgIdx);
                                      const newCaptions = section.mediaCaptions.filter((_, i) => i !== imgIdx);
                                      updateSection(idx, { mediaUrls: newUrls, mediaCaptions: newCaptions });
                                    }}
                                    data-testid={`button-remove-gallery-image-${idx}-${imgIdx}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Input
                                  placeholder="Caption (optional)"
                                  value={section.mediaCaptions[imgIdx] || ""}
                                  onChange={(e) => {
                                    const newCaptions = [...section.mediaCaptions];
                                    newCaptions[imgIdx] = e.target.value;
                                    updateSection(idx, { mediaCaptions: newCaptions });
                                  }}
                                  className="flex-1"
                                  data-testid={`input-gallery-caption-${idx}-${imgIdx}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {section.mediaUrls.length < 10 && (
                          <ImageUpload
                            value=""
                            onChange={(url) => updateSection(idx, { 
                              mediaUrls: [...section.mediaUrls, url],
                              mediaCaptions: [...section.mediaCaptions, ""]
                            })}
                            testId={`input-section-gallery-image-${idx}`}
                          />
                        )}
                      </div>
                    )}
                    {section.sectionType === "video" && (
                      <VideoSectionEditor
                        section={section}
                        index={idx}
                        onUpdate={(updates) => updateSection(idx, updates)}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Published Date</label>
          <Input
            type="date"
            value={formData.publishedAt}
            onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
            required
            data-testid="input-article-date"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Reading Time (mins)</label>
          <Input
            type="number"
            value={formData.readingTime}
            onChange={(e) => setFormData({ ...formData, readingTime: Number(e.target.value) })}
            min={1}
            data-testid="input-article-reading-time"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Boosted Likes</label>
          <Input
            type="number"
            value={formData.boostedLikes}
            onChange={(e) => setFormData({ ...formData, boostedLikes: Number(e.target.value) })}
            min={0}
            data-testid="input-article-boosted-likes"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" data-testid="button-save-article">Save Article</Button>
      </div>
    </form>
  );
}

interface EntrantUserInfo {
  userId: string;
  mumblesVibeName?: string;
  profileImageUrl?: string;
}

interface ScoreEditRowProps {
  entry: EventEntry;
  playerName: string;
  profileImage?: string | null;
  eventId: string;
  slotIndex?: number;
  allowHandicap?: boolean;
}

function ScoreEditRow({ entry, playerName, profileImage, eventId, slotIndex, allowHandicap }: ScoreEditRowProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const getPlayerScore = (): number | null => {
    if (typeof slotIndex === "number" && entry.playerScores) {
      const scores = entry.playerScores as Record<number, number>;
      return scores[slotIndex] ?? null;
    }
    return entry.score ?? null;
  };

  const getPlayerHandicap = (): number | null => {
    const handicaps = entry.playerHandicaps as Record<number, number> | null;
    if (!handicaps) return null;
    const idx = typeof slotIndex === "number" ? slotIndex : 0;
    return handicaps[idx] ?? null;
  };
  
  const currentScore = getPlayerScore();
  const currentHandicap = getPlayerHandicap();
  const [scoreValue, setScoreValue] = useState(currentScore?.toString() || "");
  const [handicapValue, setHandicapValue] = useState(currentHandicap?.toString() || "");

  const dispatch = useAppDispatch();
    const [updateScoreLoading, setUpdateScoreLoading] = useState(false);
    const updateScore = {
      isPending: updateScoreLoading,
      mutate: async ({ score, handicap }: { score: number; handicap?: number }) => {
        setUpdateScoreLoading(true);
        try {
          const body: any = typeof slotIndex === "number" 
            ? { score, slotIndex } 
            : { score };
          if (typeof handicap === "number" && handicap >= 0) {
            body.handicap = handicap;
          }
          await apiRequest("PATCH", `/api/events/${eventId}/entries/${entry.id}/score`, body);
          toast({ description: "Score updated successfully" });
          setIsEditing(false);
          dispatch(rtkApi.util.invalidateTags(["Events"]));
        } catch {
          toast({ description: "Failed to update score", variant: "destructive" });
        } finally {
          setUpdateScoreLoading(false);
        }
      },
    };

  const handleSave = () => {
    const score = parseInt(scoreValue, 10);
    if (!isNaN(score) && score >= 0) {
      const handicap = handicapValue ? parseInt(handicapValue, 10) : undefined;
      if (allowHandicap && handicapValue && (isNaN(handicap!) || handicap! < 0)) {
        toast({ description: "Please enter a valid handicap", variant: "destructive" });
        return;
      }
      updateScore.mutate({ score, handicap });
    } else {
      toast({ description: "Please enter a valid score", variant: "destructive" });
    }
  };

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {profileImage ? (
            <img src={profileImage} alt="" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-3 w-3" />
            </div>
          )}
          <span className="text-sm">{playerName}</span>
        </div>
      </td>
      {allowHandicap && (
        <td className="px-4 py-3 text-right">
          {isEditing ? (
            <Input
              type="number"
              min="0"
              value={handicapValue}
              onChange={(e) => setHandicapValue(e.target.value)}
              className="w-20 h-8 text-right ml-auto"
              placeholder="HCP"
              data-testid={`input-handicap-${entry.id}-${slotIndex ?? 0}`}
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {currentHandicap != null ? currentHandicap : "-"}
            </span>
          )}
        </td>
      )}
      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <Input
            type="number"
            min="0"
            value={scoreValue}
            onChange={(e) => setScoreValue(e.target.value)}
            className="w-20 h-8 text-right ml-auto"
            data-testid={`input-score-${entry.id}-${slotIndex ?? 0}`}
          />
        ) : (
          <span className="text-sm font-medium">
            {currentScore != null && currentScore > 0 ? currentScore : "-"}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setScoreValue(currentScore?.toString() || "");
                setHandicapValue(currentHandicap?.toString() || "");
              }}
              data-testid={`button-cancel-score-${entry.id}`}
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={updateScore.isPending}
              data-testid={`button-save-score-${entry.id}`}
            >
              {updateScore.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            data-testid={`button-edit-score-${entry.id}`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </td>
    </tr>
  );
}

interface TeamStablefordEditProps {
  team: { id: string; teamNumber: number; teamStableford?: number | null; teamHandicap?: number | null };
  eventId: string;
  scoreLabel?: string;
  allowHandicap?: boolean;
}

function TeamStablefordEdit({ team, eventId, scoreLabel = "Team Score", allowHandicap }: TeamStablefordEditProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [scoreValue, setScoreValue] = useState(team.teamStableford?.toString() || "");
  const [handicapValue, setHandicapValue] = useState(team.teamHandicap?.toString() || "");

  const dispatch = useAppDispatch();
    const [updateTeamStablefordLoading, setUpdateTeamStablefordLoading] = useState(false);
    const updateTeamStableford = {
      isPending: updateTeamStablefordLoading,
      mutate: async ({ teamStableford, teamHandicap }: { teamStableford: number; teamHandicap?: number }) => {
        setUpdateTeamStablefordLoading(true);
        try {
          const body: any = { teamStableford };
          if (typeof teamHandicap === "number" && teamHandicap >= 0) {
            body.teamHandicap = teamHandicap;
          }
          await apiRequest("PATCH", `/api/events/${eventId}/teams/${team.id}/stableford`, body);
          toast({ description: `${scoreLabel} updated successfully` });
          setIsEditing(false);
          dispatch(rtkApi.util.invalidateTags(["Events"]));
        } catch {
          toast({ description: `Failed to update ${scoreLabel}`, variant: "destructive" });
        } finally {
          setUpdateTeamStablefordLoading(false);
        }
      },
    };

  const handleSave = () => {
    const score = parseInt(scoreValue, 10);
    if (!isNaN(score) && score >= 0) {
      const handicap = handicapValue ? parseInt(handicapValue, 10) : undefined;
      if (allowHandicap && handicapValue && (isNaN(handicap!) || handicap! < 0)) {
        toast({ description: "Please enter a valid handicap", variant: "destructive" });
        return;
      }
      updateTeamStableford.mutate({ teamStableford: score, teamHandicap: handicap });
    } else {
      toast({ description: "Please enter a valid score", variant: "destructive" });
    }
  };

  const hasScore = team.teamStableford != null && team.teamStableford > 0;
  const hasHandicap = team.teamHandicap != null;

  return (
    <div className="flex items-center gap-2 ml-4 pl-4 border-l">
      {allowHandicap && (
        <>
          <span className="text-sm text-muted-foreground">HCP:</span>
          {isEditing ? (
            <Input
              type="number"
              min="0"
              value={handicapValue}
              onChange={(e) => setHandicapValue(e.target.value)}
              className="w-14 h-7 text-right text-sm"
              placeholder="0"
              data-testid={`input-team-handicap-${team.id}`}
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{hasHandicap ? team.teamHandicap : "-"}</span>
          )}
          <span className="text-muted-foreground">|</span>
        </>
      )}
      <span className="text-sm text-muted-foreground">{scoreLabel}:</span>
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            value={scoreValue}
            onChange={(e) => setScoreValue(e.target.value)}
            className="w-16 h-7 text-right text-sm"
            data-testid={`input-team-stableford-${team.id}`}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              setIsEditing(false);
              setScoreValue(team.teamStableford?.toString() || "");
              setHandicapValue(team.teamHandicap?.toString() || "");
            }}
            data-testid={`button-cancel-team-stableford-${team.id}`}
          >
            <X className="h-3 w-3" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleSave}
            disabled={updateTeamStableford.isPending}
            data-testid={`button-save-team-stableford-${team.id}`}
          >
            {updateTeamStableford.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{hasScore ? team.teamStableford : "-"}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsEditing(true)}
            data-testid={`button-edit-team-stableford-${team.id}`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface TeeTimeGeneratorProps {
  eventId: string;
  teams: any[];
  entries: EventEntry[];
  userInfos: EntrantUserInfo[];
  teamSize: number;
}

function TeeTimeGenerator({ eventId, teams, entries, userInfos, teamSize }: TeeTimeGeneratorProps) {
  const { toast } = useToast();
  const [firstTee, setFirstTee] = useState("10:00");
  const [interval, setInterval] = useState("10");

  const getPlayersPerTeeTimeOptions = () => {
    if (teamSize === 1) return [2, 3, 4];
    if (teamSize === 2) return [2, 4];
    if (teamSize === 3) return [3];
    if (teamSize === 4) return [4];
    return [teamSize];
  };

  const defaultPlayersPerTeeTime = teamSize === 1 ? 4 : teamSize;
  const [playersPerTeeTime, setPlayersPerTeeTime] = useState(defaultPlayersPerTeeTime.toString());

  const dispatch = useAppDispatch();
    const [generateTeeTimesLoading, setGenerateTeeTimesLoading] = useState(false);
    const generateTeeTimes = {
      isPending: generateTeeTimesLoading,
      mutate: async () => {
        setGenerateTeeTimesLoading(true);
        try {
          await apiRequest("POST", `/api/events/${eventId}/generate-tee-times`, {
            firstTee,
            interval: parseInt(interval, 10),
            playersPerTeeTime: parseInt(playersPerTeeTime, 10),
            teamSize,
          });
          toast({ description: "Tee times generated successfully" });
          dispatch(rtkApi.util.invalidateTags(["Events"]));
        } catch {
          toast({ description: "Failed to generate tee times", variant: "destructive" });
        } finally {
          setGenerateTeeTimesLoading(false);
        }
      },
    };

  const getTeamPlayerNames = (team: any) => {
    const playerEntryIds = [
      team.player1EntryId, team.player2EntryId, team.player3EntryId,
      team.player4EntryId, team.player5EntryId, team.player6EntryId
    ];
    const names: string[] = [];
    playerEntryIds.forEach((slotId: string | null) => {
      if (!slotId) return;
      const parts = slotId.split(':');
      const entryId = parts[0];
      const slotIndex = parts.length > 1 ? parseInt(parts[1], 10) : 0;
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      if (slotIndex === 0) {
        const userInfo = userInfos.find(u => u.userId === entry.userId);
        names.push(userInfo?.mumblesVibeName || entry.teamName || `User ${entry.userId.slice(0, 8)}`);
      } else {
        const assignedPlayerIds = entry.assignedPlayerIds || [];
        const assignedUserId = assignedPlayerIds[slotIndex - 1];
        if (assignedUserId) {
          const userInfo = userInfos.find(u => u.userId === assignedUserId);
          names.push(userInfo?.mumblesVibeName || `Player ${slotIndex + 1}`);
        } else {
          const playerNames = entry.playerNames || [];
          names.push(playerNames[slotIndex - 1] || `Player ${slotIndex + 1}`);
        }
      }
    });
    return names;
  };

  const sortedTeams = [...teams].sort((a, b) => a.teamNumber - b.teamNumber);
  const hasTeeTimes = sortedTeams.some((t) => t.teeTime);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/50 rounded-lg space-y-4">
        <h4 className="font-medium">Generate Tee Times</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-tee">First Tee</Label>
            <Input
              id="first-tee"
              type="time"
              value={firstTee}
              onChange={(e) => setFirstTee(e.target.value)}
              data-testid="input-first-tee"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tee-interval">Tee Time Interval</Label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger id="tee-interval" data-testid="select-tee-interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="12">12 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="players-per-tee">Number of Players per Tee Time</Label>
          <Select value={playersPerTeeTime} onValueChange={setPlayersPerTeeTime}>
            <SelectTrigger id="players-per-tee" data-testid="select-players-per-tee">
              <SelectValue placeholder="Select players per tee time" />
            </SelectTrigger>
            <SelectContent>
              {getPlayersPerTeeTimeOptions().map(opt => (
                <SelectItem key={opt} value={opt.toString()}>{opt} players</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => generateTeeTimes.mutate()}
          disabled={generateTeeTimes.isPending}
          data-testid="button-generate-tee-times"
        >
          {generateTeeTimes.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Generate Tee Times
            </>
          )}
        </Button>
      </div>

      {hasTeeTimes && (
        <div className="space-y-2">
          <h4 className="font-medium">Generated Tee Times</h4>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium w-24">Tee Time</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Players</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedTeams.map((team) => {
                  const playerNames = getTeamPlayerNames(team);
                  return (
                    <tr key={team.id} data-testid={`row-teetime-${team.id}`}>
                      <td className="px-4 py-2 text-sm font-medium" data-testid={`text-teetime-${team.id}`}>
                        {team.teeTime || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm" data-testid={`text-team-${team.id}`}>
                        {playerNames.length > 0 ? (
                          <span>{playerNames.join(", ")}</span>
                        ) : (
                          <span className="text-muted-foreground">No players assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface BracketSectionProps {
  eventId: string;
  event: Event;
  teams: any[];
  entries: EventEntry[];
  userInfos: EntrantUserInfo[];
}

function BracketSection({ eventId, event, teams, entries, userInfos }: BracketSectionProps) {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [deadlineValue, setDeadlineValue] = useState("");
  const [pendingWinner, setPendingWinner] = useState<{ matchId: string; winnerId: string; teamName: string } | null>(null);

  const { data: bracketData, isLoading } = useGetEventBracketQuery(eventId);

  const dispatch = useAppDispatch();
    const [createBracketLoading, setCreateBracketLoading] = useState(false);
    const createBracket = {
      isPending: createBracketLoading,
      mutate: async () => {
        setCreateBracketLoading(true);
        try {
          const data: any = await apiRequest("POST", `/api/events/${eventId}/bracket`, {});
          toast({ description: data.message || "Competition bracket created" });
          dispatch(rtkApi.util.invalidateTags(["Events"]));
          setShowConfirm(false);
        } catch (error: any) {
          toast({ description: error?.message || "Failed to create bracket", variant: "destructive" });
        } finally {
          setCreateBracketLoading(false);
        }
      },
    };

  const [updateRoundDeadlineLoading, setUpdateRoundDeadlineLoading] = useState(false);
    const updateRoundDeadline = {
      isPending: updateRoundDeadlineLoading,
      mutate: async ({ roundId, deadline }: { roundId: string; deadline: string | null }) => {
        setUpdateRoundDeadlineLoading(true);
        try {
          await apiRequest("PATCH", `/api/events/${eventId}/rounds/${roundId}`, { deadline });
          toast({ description: "Deadline updated" });
          dispatch(rtkApi.util.invalidateTags(["Events"]));
          setEditingRoundId(null);
          setDeadlineValue("");
        } catch (error: any) {
          toast({ description: error?.message || "Failed to update deadline", variant: "destructive" });
        } finally {
          setUpdateRoundDeadlineLoading(false);
        }
      },
    };

  const [setMatchWinnerLoading, setSetMatchWinnerLoading] = useState(false);
    const setMatchWinner = {
      isPending: setMatchWinnerLoading,
      mutate: async ({ matchId, winnerId }: { matchId: string; winnerId: string }) => {
        setSetMatchWinnerLoading(true);
        try {
          await apiRequest("PATCH", `/api/events/${eventId}/matches/${matchId}/winner`, { winnerId });
          toast({ description: "Winner confirmed and progressed to next round" });
          dispatch(rtkApi.util.invalidateTags(["Events"]));
          setPendingWinner(null);
        } catch (error: any) {
          toast({ description: error?.message || "Failed to set winner", variant: "destructive" });
          setPendingWinner(null);
        } finally {
          setSetMatchWinnerLoading(false);
        }
      },
    };

  const handleSelectWinner = (matchId: string, winnerId: string) => {
    const teamName = getTeamName(winnerId);
    setPendingWinner({ matchId, winnerId, teamName: teamName || winnerId });
  };

  const confirmWinner = () => {
    if (pendingWinner) {
      setMatchWinner.mutate({ matchId: pendingWinner.matchId, winnerId: pendingWinner.winnerId });
    }
  };

  // Helper to get player name from slot ID (entryId:slotIndex format)
  const getPlayerNameFromSlotId = (slotId: string) => {
    if (!slotId) return null;
    
    const parts = slotId.split(':');
    const entryId = parts[0];
    const slotIndex = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return null;
    
    if (slotIndex === 0) {
      // Entry owner
      const userInfo = userInfos.find(u => u.userId === entry.userId);
      return userInfo?.mumblesVibeName || entry?.teamName || "Player";
    } else {
      // Assigned player at slot index
      const assignedPlayerIds = entry.assignedPlayerIds || [];
      const assignedUserId = assignedPlayerIds[slotIndex - 1];
      if (assignedUserId) {
        if (assignedUserId.startsWith("guest:")) return assignedUserId.replace("guest:", "");
        const userInfo = userInfos.find(u => u.userId === assignedUserId);
        return userInfo?.mumblesVibeName || `Player ${slotIndex + 1}`;
      } else {
        const playerNames = entry.playerNames || [];
        return playerNames[slotIndex - 1] || `Player ${slotIndex + 1}`;
      }
    }
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "TBD";
    const team = teams.find((t: any) => t.id === teamId);
    if (!team) return "Unknown Team";
    
    // Get all player slot IDs for this team (now stored as entryId:slotIndex)
    const playerSlotIds = [
      team.player1EntryId, team.player2EntryId, team.player3EntryId,
      team.player4EntryId, team.player5EntryId, team.player6EntryId
    ].filter(Boolean);
    
    const playerNames = playerSlotIds.map((slotId: string) => getPlayerNameFromSlotId(slotId)).filter(Boolean);
    
    if (playerNames.length === 0) return "Empty Team";
    if (playerNames.length === 1) return playerNames[0];
    if (playerNames.length === 2) return `${playerNames[0]} & ${playerNames[1]}`;
    return `${playerNames[0]} + ${playerNames.length - 1} others`;
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  // Show Create Competition button if no bracket exists
  if (!bracketData?.bracket) {
    return (
      <div className="border-t pt-4 mt-4">
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full" 
              data-testid="button-create-competition"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Create Competition
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create Competition</AlertDialogTitle>
              <AlertDialogDescription>
                {event.eventType === "team_competition" 
                  ? `Create competition matches for ${teams.length} teams? This will generate ${Math.floor(teams.length / 2)} matches (Team 1 vs Team 2, Team 3 vs Team 4, etc.)`
                  : `Create a knockout competition bracket for ${teams.length} teams? This will generate ${Math.ceil(Math.log2(teams.length))} rounds with matches.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => createBracket.mutate()}
                disabled={createBracket.isPending}
              >
                {createBracket.isPending ? "Creating..." : "Yes, Create Competition"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Show bracket visualization
  const { rounds, matches } = bracketData;

  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Competition Bracket
        </h4>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max p-2">
          {rounds.map((round: any, roundIndex: number) => {
            const roundMatches = matches
              .filter((m: any) => m.roundId === round.id)
              .sort((a: any, b: any) => a.matchNumber - b.matchNumber);
            const isEditing = editingRoundId === round.id;
            const matchHeight = 100;
            const gap = 8;
            const spacingMultiplier = Math.pow(2, roundIndex);
            const matchSpacing = (matchHeight + gap) * spacingMultiplier - matchHeight;
            const topPadding = ((matchHeight + gap) * (spacingMultiplier - 1)) / 2;
            
            return (
              <div key={round.id} className="flex-shrink-0 w-56">
                <div className="text-center mb-2">
                  <div className="font-medium text-sm">{round.roundName}</div>
                  <div className="text-xs text-muted-foreground">
                    {roundMatches.length} {roundMatches.length === 1 ? 'match' : 'matches'}
                  </div>
                  {isEditing ? (
                    <div className="flex gap-1 mt-1">
                      <Input
                        type="date"
                        value={deadlineValue}
                        onChange={(e) => setDeadlineValue(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => updateRoundDeadline.mutate({ 
                          roundId: round.id, 
                          deadline: deadlineValue || null 
                        })}
                        disabled={updateRoundDeadline.isPending}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          setEditingRoundId(null);
                          setDeadlineValue("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center justify-center gap-1 mt-1"
                      onClick={() => {
                        setEditingRoundId(round.id);
                        setDeadlineValue(round.deadline ? new Date(round.deadline).toISOString().split('T')[0] : "");
                      }}
                    >
                      <Calendar className="h-3 w-3" />
                      {round.deadline 
                        ? `Due: ${new Date(round.deadline).toLocaleDateString()}`
                        : "Set deadline"
                      }
                    </div>
                  )}
                </div>
                
                <div 
                  className="flex flex-col"
                  style={{ paddingTop: `${topPadding}px`, gap: `${matchSpacing}px` }}
                >
                  {roundMatches.map((match: any) => (
                    <div 
                      key={match.id} 
                      className="border rounded-md p-2 bg-card"
                      style={{ height: `${matchHeight}px` }}
                    >
                      <div className="text-xs text-muted-foreground mb-1">Match {match.matchNumber}</div>
                      {(() => {
                        const canSelectWinner = match.team1Id && match.team2Id && !match.winnerId;
                        return (
                          <>
                            <button
                              type="button"
                              disabled={!canSelectWinner || setMatchWinner.isPending}
                              onClick={() => canSelectWinner && handleSelectWinner(match.id, match.team1Id)}
                              className={`w-full text-left text-xs p-1 rounded truncate transition-colors ${
                                match.winnerId === match.team1Id 
                                  ? 'bg-green-500/20 text-green-700 dark:text-green-400 font-medium' 
                                  : canSelectWinner
                                    ? 'hover:bg-muted cursor-pointer' 
                                    : 'opacity-50 cursor-not-allowed'
                              }`}
                              title={match.winnerId ? (match.winnerId === match.team1Id ? 'Winner' : '') : (!match.team1Id || !match.team2Id ? 'Waiting for both teams' : 'Click to select as winner')}
                              data-testid={`button-select-winner-${match.id}-team1`}
                            >
                              {getTeamName(match.team1Id)}
                              {match.winnerId === match.team1Id && <Trophy className="h-3 w-3 inline ml-1" />}
                            </button>
                            <div className="text-center text-xs text-muted-foreground">vs</div>
                            <button
                              type="button"
                              disabled={!canSelectWinner || setMatchWinner.isPending}
                              onClick={() => canSelectWinner && handleSelectWinner(match.id, match.team2Id)}
                              className={`w-full text-left text-xs p-1 rounded truncate transition-colors ${
                                match.winnerId === match.team2Id 
                                  ? 'bg-green-500/20 text-green-700 dark:text-green-400 font-medium' 
                                  : canSelectWinner
                                    ? 'hover:bg-muted cursor-pointer' 
                                    : 'opacity-50 cursor-not-allowed'
                              }`}
                              title={match.winnerId ? (match.winnerId === match.team2Id ? 'Winner' : '') : (!match.team1Id || !match.team2Id ? 'Waiting for both teams' : 'Click to select as winner')}
                              data-testid={`button-select-winner-${match.id}-team2`}
                            >
                              {getTeamName(match.team2Id)}
                              {match.winnerId === match.team2Id && <Trophy className="h-3 w-3 inline ml-1" />}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={!!pendingWinner} onOpenChange={(open) => !open && setPendingWinner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Match Winner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure <span className="font-semibold">{pendingWinner?.teamName}</span> won this match? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmWinner}
              disabled={setMatchWinner.isPending}
            >
              {setMatchWinner.isPending ? "Confirming..." : "Yes, Confirm Winner"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface TeamManagementViewProps {
  eventId: string;
  event: Event;
  entries: EventEntry[];
  userInfos: EntrantUserInfo[];
  onBack: () => void;
}

// Player slot format: "entryId:slotIndex" (e.g., "abc123:0" for entry owner, "abc123:1" for first assigned player)
function TeamManagementView({ eventId, event, entries, userInfos, onBack }: TeamManagementViewProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'choose' | 'random' | 'manual'>('choose');
  const [manualTeams, setManualTeams] = useState<{ playerSlotIds: (string | null)[] }[]>([]);
  const [unassignedSlots, setUnassignedSlots] = useState<string[]>([]);
  const [swapMode, setSwapMode] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<{ teamId: string; slot: number; playerName: string } | null>(null);
  const teamSize = event.teamSize || 2;

  // Expand entries into individual player slots
  const allPlayerSlots = useMemo(() => {
    const slots: { slotId: string; entryId: string; slotIndex: number; name: string; profileImageUrl?: string }[] = [];
    entries.forEach(entry => {
      const playerCount = entry.playerCount || 1;
      for (let i = 0; i < playerCount; i++) {
        const slotId = `${entry.id}:${i}`;
        let name: string;
        let profileImageUrl: string | undefined;
        
        if (i === 0) {
          // Entry owner
          const userInfo = userInfos.find(u => u.userId === entry.userId);
          name = userInfo?.mumblesVibeName || entry.teamName || `User ${entry.userId.slice(0, 8)}`;
          profileImageUrl = userInfo?.profileImageUrl;
        } else {
          // Assigned player
          const assignedUserId = entry.assignedPlayerIds?.[i - 1];
          if (assignedUserId) {
            if (assignedUserId.startsWith("guest:")) {
              name = assignedUserId.replace("guest:", "");
              profileImageUrl = undefined;
            } else {
              const assignedInfo = userInfos.find(u => u.userId === assignedUserId);
              name = assignedInfo?.mumblesVibeName || 'Assigned Player';
              profileImageUrl = assignedInfo?.profileImageUrl;
            }
          } else {
            name = `${entry.teamName || 'Entry'} - Player ${i + 1}`;
          }
        }
        
        slots.push({ slotId, entryId: entry.id, slotIndex: i, name, profileImageUrl });
      }
    });
    return slots;
  }, [entries, userInfos]);

  const { data: existingTeams, isLoading: teamsLoading } = useGetEventTeamsQuery(eventId);

  const dispatch = useAppDispatch();
    const [createRandomTeamsLoading, setCreateRandomTeamsLoading] = useState(false);
    const createRandomTeams = {
      isPending: createRandomTeamsLoading,
      mutate: async () => {
        setCreateRandomTeamsLoading(true);
        try {
          const data: any = await apiRequest("POST", `/api/events/${eventId}/teams/random`, {});
          toast({ description: data.message || "Teams created" });
          dispatch(rtkApi.util.invalidateTags(["Events", { type: "EventTeams", id: eventId }, { type: "EventEntries", id: eventId }]));
          setMode('random');
        } catch (error: any) {
          toast({ description: error?.message || "Failed to create teams", variant: "destructive" });
        } finally {
          setCreateRandomTeamsLoading(false);
        }
      },
    };

  const [saveManualTeamsLoading, setSaveManualTeamsLoading] = useState(false);
    const saveManualTeams = {
      isPending: saveManualTeamsLoading,
      mutate: async (teams: { playerSlotIds: string[] }[]) => {
        setSaveManualTeamsLoading(true);
        try {
          const teamsForApi = teams.map(t => ({ playerSlotIds: t.playerSlotIds }));
          const data: any = await apiRequest("POST", `/api/events/${eventId}/teams/manual`, { teams: teamsForApi });
          toast({ description: data.message || "Teams saved" });
          dispatch(rtkApi.util.invalidateTags(["Events", { type: "EventTeams", id: eventId }, { type: "EventEntries", id: eventId }]));
        } catch (error: any) {
          toast({ description: error?.message || "Failed to save teams", variant: "destructive" });
        } finally {
          setSaveManualTeamsLoading(false);
        }
      },
    };

  const [swapPlayersLoading, setSwapPlayersLoading] = useState(false);
    const swapPlayers = {
      isPending: swapPlayersLoading,
      mutate: async (data: { team1Id: string; team1Slot: string; team2Id: string; team2Slot: string }) => {
        setSwapPlayersLoading(true);
        try {
          const res: any = await apiRequest("POST", `/api/events/${eventId}/teams/swap`, data);
          toast({ description: res.message || "Players swapped" });
          dispatch(rtkApi.util.invalidateTags(["Events", { type: "EventTeams", id: eventId }, { type: "EventEntries", id: eventId }]));
          setSwapMode(false);
          setSelectedForSwap(null);
        } catch (error: any) {
          toast({ description: error?.message || "Failed to swap players", variant: "destructive" });
        } finally {
          setSwapPlayersLoading(false);
        }
      },
    };

  const handlePlayerClick = (teamId: string, slotNumber: number, playerName: string) => {
    if (!swapMode) return;
    
    if (!selectedForSwap) {
      setSelectedForSwap({ teamId, slot: slotNumber, playerName });
    } else {
      // Perform swap
      swapPlayers.mutate({
        team1Id: selectedForSwap.teamId,
        team1Slot: String(selectedForSwap.slot),
        team2Id: teamId,
        team2Slot: String(slotNumber)
      });
    }
  };

  const cancelSwap = () => {
    setSwapMode(false);
    setSelectedForSwap(null);
  };

  const getSlotInfo = (slotId: string) => {
    return allPlayerSlots.find(s => s.slotId === slotId) || null;
  };

  // Get player info from slot ID (entryId:slotIndex) or legacy entry ID
  const getPlayerInfoFromSlotId = (slotId: string) => {
    if (!slotId) return null;
    
    // Check if it's a slot ID format (entryId:slotIndex)
    const parts = slotId.split(':');
    const entryId = parts[0];
    const slotIndex = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return null;
    
    if (slotIndex === 0) {
      // Entry owner
      const userInfo = userInfos.find(u => u.userId === entry.userId);
      return {
        entryId,
        slotIndex,
        name: userInfo?.mumblesVibeName || entry.teamName || `User ${entry.userId.slice(0, 8)}`,
        profileImageUrl: userInfo?.profileImageUrl
      };
    } else {
      // Assigned player at slot index
      const assignedPlayerIds = entry.assignedPlayerIds || [];
      const assignedUserId = assignedPlayerIds[slotIndex - 1];
      if (assignedUserId) {
        if (assignedUserId.startsWith("guest:")) {
          return {
            entryId,
            slotIndex,
            name: assignedUserId.replace("guest:", ""),
            profileImageUrl: undefined
          };
        }
        const userInfo = userInfos.find(u => u.userId === assignedUserId);
        return {
          entryId,
          slotIndex,
          name: userInfo?.mumblesVibeName || `Player ${slotIndex + 1}`,
          profileImageUrl: userInfo?.profileImageUrl
        };
      } else {
        // Fallback to player name from playerNames array
        const playerNames = entry.playerNames || [];
        return {
          entryId,
          slotIndex,
          name: playerNames[slotIndex - 1] || `Player ${slotIndex + 1}`,
          profileImageUrl: null
        };
      }
    }
  };

  const getEntryInfo = (entryIdOrSlotId: string) => {
    // Use the new slot-aware function
    return getPlayerInfoFromSlotId(entryIdOrSlotId);
  };

  const initializeManualTeams = (fromExisting = false) => {
    // Always calculate the total number of teams needed based on player count
    const totalPlayers = allPlayerSlots.length;
    const neededTeamCount = Math.ceil(totalPlayers / teamSize);
    
    if (fromExisting && existingTeams && existingTeams.length > 0) {
      // Load existing teams and fill in with empty teams if needed
      const teams: { playerSlotIds: (string | null)[] }[] = [];
      
      // First, add existing teams
      existingTeams.forEach((t: any) => {
        const playerSlotIds: (string | null)[] = Array(teamSize).fill(null);
        // Slot IDs are now stored directly in the database
        if (t.player1EntryId) playerSlotIds[0] = t.player1EntryId;
        if (t.player2EntryId) playerSlotIds[1] = t.player2EntryId;
        for (let i = 3; i <= teamSize; i++) {
          const key = `player${i}EntryId`;
          if (t[key]) playerSlotIds[i - 1] = t[key];
        }
        teams.push({ playerSlotIds });
      });
      
      // Add empty teams to reach the needed count
      while (teams.length < neededTeamCount) {
        teams.push({ playerSlotIds: Array(teamSize).fill(null) });
      }
      
      // Find unassigned slots
      const assignedSlotIds = new Set<string>();
      teams.forEach((t) => {
        t.playerSlotIds.forEach((id: string | null) => {
          if (id) assignedSlotIds.add(id);
        });
      });
      const unassigned = allPlayerSlots.filter(s => !assignedSlotIds.has(s.slotId)).map(s => s.slotId);
      setManualTeams(teams);
      setUnassignedSlots(unassigned);
    } else {
      // Start fresh - create all needed empty teams
      setManualTeams(Array(neededTeamCount).fill(null).map(() => ({ 
        playerSlotIds: Array(teamSize).fill(null) 
      })));
      setUnassignedSlots(allPlayerSlots.map(s => s.slotId));
    }
    setMode('manual');
  };

  const handleSaveManualTeams = () => {
    const validTeams = manualTeams
      .filter(t => t.playerSlotIds.some(id => id !== null))
      .map(t => ({
        playerSlotIds: t.playerSlotIds.filter(id => id !== null) as string[]
      }));
    saveManualTeams.mutate(validTeams);
  };

  // Get entry owner name for showing group info
  const getEntryOwnerName = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return null;
    const userInfo = userInfos.find(u => u.userId === entry.userId);
    return userInfo?.mumblesVibeName || entry.teamName || null;
  };

  // Get count of players in an entry
  const getEntryPlayerCount = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    return entry?.playerCount || 1;
  };

  // Generate a consistent color for an entry based on its ID
  const getEntryColor = (entryId: string) => {
    const colors = [
      'border-l-blue-500',
      'border-l-green-500', 
      'border-l-purple-500',
      'border-l-orange-500',
      'border-l-pink-500',
      'border-l-cyan-500',
      'border-l-yellow-500',
      'border-l-red-500',
    ];
    // Simple hash of entry ID to pick a color
    let hash = 0;
    for (let i = 0; i < entryId.length; i++) {
      hash = entryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Add player to a team slot
  const handleAddPlayerToSlot = (teamIndex: number, slotIndex: number, slotId: string) => {
    // Remove from unassigned
    setUnassignedSlots(prev => prev.filter(id => id !== slotId));
    
    // Add to team slot
    setManualTeams(prev => {
      const newTeams = [...prev];
      const newPlayerSlotIds = [...newTeams[teamIndex].playerSlotIds];
      newPlayerSlotIds[slotIndex] = slotId;
      newTeams[teamIndex] = { ...newTeams[teamIndex], playerSlotIds: newPlayerSlotIds };
      return newTeams;
    });
  };
  
  // Remove player from a team slot
  const handleRemovePlayerFromSlot = (teamIndex: number, slotIndex: number) => {
    const slotId = manualTeams[teamIndex]?.playerSlotIds[slotIndex];
    if (!slotId) return;
    
    // Add back to unassigned
    setUnassignedSlots(prev => [...prev, slotId]);
    
    // Remove from team slot
    setManualTeams(prev => {
      const newTeams = [...prev];
      const newPlayerSlotIds = [...newTeams[teamIndex].playerSlotIds];
      newPlayerSlotIds[slotIndex] = null;
      newTeams[teamIndex] = { ...newTeams[teamIndex], playerSlotIds: newPlayerSlotIds };
      return newTeams;
    });
  };

  // Player card showing assigned player with remove button
  const AssignedPlayerCard = ({ slotId, teamIndex, slotIndex }: { slotId: string; teamIndex: number; slotIndex: number }) => {
    const info = getSlotInfo(slotId);
    if (!info) return null;
    
    const playerCount = getEntryPlayerCount(info.entryId);
    const isMultiPlayerEntry = playerCount > 1;
    const entryOwnerName = getEntryOwnerName(info.entryId);
    const entryColor = getEntryColor(info.entryId);
    
    return (
      <div className={`flex items-center gap-2 p-2 border rounded-md bg-background ${isMultiPlayerEntry ? `border-l-4 ${entryColor}` : ''}`}>
        <div className="flex-1 min-w-0">
          <span className="text-sm truncate block">{info.name}</span>
          {isMultiPlayerEntry && (
            <span className="text-xs text-muted-foreground truncate block">
              {entryOwnerName}'s entry ({info.slotIndex + 1}/{playerCount})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => handleRemovePlayerFromSlot(teamIndex, slotIndex)}
          data-testid={`button-remove-player-${teamIndex}-${slotIndex}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Get background color class for entry color coding
  const getEntryBgColor = (entryId: string) => {
    const colors = [
      'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
      'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800', 
      'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
      'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
      'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800',
      'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800',
      'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    ];
    let hash = 0;
    for (let i = 0; i < entryId.length; i++) {
      hash = entryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Team slot with add button or assigned player
  const TeamSlot = ({ teamIndex, slotIndex, slotId }: { teamIndex: number; slotIndex: number; slotId: string | null }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    if (slotId) {
      return <AssignedPlayerCard slotId={slotId} teamIndex={teamIndex} slotIndex={slotIndex} />;
    }
    
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div 
            className="min-h-[44px] border-2 border-dashed rounded-md p-2 flex items-center justify-between cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            data-testid={`slot-add-player-${teamIndex}-${slotIndex}`}
          >
            <span className="text-xs text-muted-foreground">Player {slotIndex + 1}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Player for Team {teamIndex + 1}</DialogTitle>
            <DialogDescription>
              {unassignedSlots.length} players available. Players with the same color are from the same signup.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-2">
            {unassignedSlots.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No players available
              </div>
            ) : (
              <div className="space-y-2">
                {unassignedSlots.map(uSlotId => {
                  const info = getSlotInfo(uSlotId);
                  if (!info) return null;
                  const playerCount = getEntryPlayerCount(info.entryId);
                  const isMultiPlayerEntry = playerCount > 1;
                  const entryOwnerName = getEntryOwnerName(info.entryId);
                  const entryBgColor = getEntryBgColor(info.entryId);
                  
                  return (
                    <div
                      key={uSlotId}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${isMultiPlayerEntry ? entryBgColor : 'bg-background'}`}
                      data-testid={`select-player-${uSlotId}`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block">{info.name}</span>
                        {isMultiPlayerEntry && (
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            Part of {entryOwnerName}'s signup ({info.slotIndex + 1} of {playerCount} players)
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          handleAddPlayerToSlot(teamIndex, slotIndex, uSlotId);
                          setIsOpen(false);
                        }}
                        data-testid={`button-select-player-${uSlotId}`}
                      >
                        Select
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Choose mode view
  if (mode === 'choose' && (!existingTeams || existingTeams.length === 0)) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h3 className="font-semibold">Team Management</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => createRandomTeams.mutate()}
            disabled={createRandomTeams.isPending}
            data-testid="button-create-random-teams"
          >
            {createRandomTeams.isPending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Shuffle className="h-6 w-6" />
            )}
            <span>Create Random Teams</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => initializeManualTeams()}
            data-testid="button-select-teams"
          >
            <Users className="h-6 w-6" />
            <span>Select Teams</span>
          </Button>
        </div>
      </div>
    );
  }

  // Show existing teams or random teams result with tabs
  if (mode === 'random' || (mode === 'choose' && existingTeams && existingTeams.length > 0)) {
    const teamsToShow = existingTeams || [];
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h3 className="font-semibold">Competition Management</h3>
        </div>

        <Tabs defaultValue="teams" className="w-full">
          <TabsList className={`grid w-full ${
            event.eventType === "knockout" 
              ? "grid-cols-2" 
              : event.eventType === "team_competition"
                ? ((event as any).allowIndividualStableford
                  ? (teamsToShow.length > 0 ? "grid-cols-3" : "grid-cols-2")
                  : (teamsToShow.length > 0 ? "grid-cols-2" : "grid-cols-1"))
                : event.eventType === "individual_competition"
                  ? ((event as any).allowIndividualStableford ? "grid-cols-2" : "grid-cols-1")
                  : "grid-cols-1"
          }`}>
            <TabsTrigger value="teams" data-testid="tab-teams">
              {event.eventType === "individual_competition" ? "Entrants" : "Teams"}
            </TabsTrigger>
            {event.eventType === "knockout" && (
              <TabsTrigger value="matches" data-testid="tab-matches">Matches</TabsTrigger>
            )}
            {event.eventType === "team_competition" && (event as any).allowIndividualStableford && (
              <TabsTrigger value="scores" data-testid="tab-scores">Individuals</TabsTrigger>
            )}
            {event.eventType === "individual_competition" && (event as any).allowIndividualStableford && (
              <TabsTrigger value="scores" data-testid="tab-scores">Individuals</TabsTrigger>
            )}
            {event.eventType === "team_competition" && teamsToShow.length > 0 && (
              <TabsTrigger value="teetimes" data-testid="tab-teetimes">Tee Times</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="teams" className="space-y-4 mt-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium">
                {event.eventType === "individual_competition" ? `Entrants (${entries.length})` : `Teams (${teamsToShow.length})`}
              </h4>
              <div className="flex gap-2">
                {swapMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelSwap}
                    data-testid="button-cancel-swap"
                  >
                    Cancel Swap
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSwapMode(true)}
                    data-testid="button-swap-players"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    Swap
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => initializeManualTeams(true)}
                  data-testid="button-edit-teams"
                  disabled={swapMode}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createRandomTeams.mutate()}
                  disabled={createRandomTeams.isPending || swapMode}
                >
                  {createRandomTeams.isPending ? "Regenerating..." : "Regenerate"}
                </Button>
              </div>
            </div>

            {swapMode && (
              <div className="bg-muted/50 p-3 rounded-md text-sm">
                {selectedForSwap ? (
                  <span>Selected: <strong>{selectedForSwap.playerName}</strong> - Click another player to swap</span>
                ) : (
                  <span>Click on a player to select them for swapping</span>
                )}
              </div>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {teamsToShow.map((team: any) => {
                const playerEntryIds = [
                  team.player1EntryId, team.player2EntryId, team.player3EntryId,
                  team.player4EntryId, team.player5EntryId, team.player6EntryId
                ];
                const players = playerEntryIds.map((entryId: string | null, idx: number) => {
                  if (!entryId) return null;
                  const info = getEntryInfo(entryId);
                  return info ? { ...info, slotNumber: idx + 1 } : null;
                }).filter(Boolean);
                
                return (
                  <div key={team.id} className="flex items-center gap-2 p-3 border rounded-md">
                    <span className="font-medium text-muted-foreground w-8">#{team.teamNumber}</span>
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      {players.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No players assigned</span>
                      ) : (
                        players.map((player: any, idx: number) => {
                          const isSelected = selectedForSwap?.teamId === team.id && selectedForSwap?.slot === player.slotNumber;
                          return (
                            <div 
                              key={player.entryId + ':' + idx} 
                              className={`flex items-center gap-1 ${swapMode ? 'cursor-pointer hover:bg-muted p-1 rounded-md' : ''} ${isSelected ? 'bg-primary/20 ring-2 ring-primary rounded-md p-1' : ''}`}
                              onClick={() => swapMode && handlePlayerClick(team.id, player.slotNumber, player.name)}
                            >
                              {idx > 0 && <span className="text-muted-foreground mx-1">&</span>}
                              {player.profileImageUrl ? (
                                <img src={player.profileImageUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  <Users className="h-3 w-3" />
                                </div>
                              )}
                              <span className="text-sm">{player.name}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {event.eventType === "team_competition" && !["matchplay"].includes((event as any).competitionFormat) && (
                      <TeamStablefordEdit 
                        team={team} 
                        eventId={eventId} 
                        scoreLabel={
                          (event as any).competitionFormat === "team_scramble" ? "Scramble Score" :
                          (event as any).competitionFormat === "team_stableford" ? "Team Stableford" :
                          (event as any).competitionFormat === "foursomes" ? "Foursomes Score" :
                          (event as any).competitionFormat === "fourball" ? "Fourball Score" :
                          "Team Score"
                        }
                        allowHandicap={(event as any).allowTeamHandicap}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="matches" className="mt-4">
            <BracketSection eventId={eventId} event={event} teams={teamsToShow} entries={entries} userInfos={userInfos} />
          </TabsContent>

          {(event.eventType === "team_competition" || event.eventType === "individual_competition") && (
            <TabsContent value="scores" className="space-y-4 mt-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium">
                  {event.eventType === "individual_competition" ? "Individual Scores" : "Player Scores"}
                </h4>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">Player</th>
                        {(event as any).allowTeamHandicap && (
                          <th className="px-4 py-2 text-right text-sm font-medium w-24">HCP</th>
                        )}
                        <th className="px-4 py-2 text-right text-sm font-medium w-32">Score</th>
                        <th className="px-4 py-2 text-right text-sm font-medium w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {entries.flatMap((entry: any) => {
                        const rows: any[] = [];
                        const ownerInfo = userInfos.find((u: any) => u.userId === entry.userId);
                        const ownerName = entry.teamName || ownerInfo?.mumblesVibeName || entry.playerNames?.[0] || "Unknown";
                        rows.push(
                          <ScoreEditRow
                            key={`${entry.id}:0`}
                            entry={entry}
                            playerName={ownerName}
                            profileImage={ownerInfo?.profileImageUrl}
                            eventId={eventId}
                            slotIndex={0}
                            allowHandicap={(event as any).allowTeamHandicap}
                          />
                        );
                        if (event.eventType !== "individual_competition" && entry.assignedPlayerIds && entry.assignedPlayerIds.length > 0) {
                          entry.assignedPlayerIds.forEach((assignedId: string, idx: number) => {
                            if (assignedId) {
                              const isGuestAssigned = assignedId.startsWith("guest:");
                              const assignedInfo = !isGuestAssigned ? userInfos.find((u: any) => u.userId === assignedId) : undefined;
                              const assignedName = isGuestAssigned ? assignedId.replace("guest:", "") : (assignedInfo?.mumblesVibeName || entry.playerNames?.[idx + 1] || "Assigned Player");
                              rows.push(
                                <ScoreEditRow
                                  key={`${entry.id}:${idx + 1}`}
                                  entry={entry}
                                  playerName={assignedName}
                                  profileImage={assignedInfo?.profileImageUrl}
                                  eventId={eventId}
                                  slotIndex={idx + 1}
                                  allowHandicap={(event as any).allowTeamHandicap}
                                />
                              );
                            }
                          });
                        }
                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          )}

          {event.eventType === "team_competition" && teamsToShow.length > 0 && (
            <TabsContent value="teetimes" className="space-y-4 mt-4">
              <TeeTimeGenerator eventId={eventId} teams={teamsToShow} entries={entries} userInfos={userInfos || []} teamSize={event.teamSize || 2} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  }

  // Manual team selection mode
  if (mode === 'manual') {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMode('choose')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h3 className="font-semibold">Select Teams</h3>
          </div>
          <Button
            size="sm"
            onClick={handleSaveManualTeams}
            disabled={saveManualTeams.isPending || manualTeams.every(t => t.playerSlotIds.every(id => id === null))}
            data-testid="button-save-manual-teams"
          >
            {saveManualTeams.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Save Teams
          </Button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Teams ({manualTeams.length}) - {teamSize} players each</h4>
            <span className="text-xs text-muted-foreground">{unassignedSlots.length} players available</span>
          </div>
          {manualTeams.map((team, index) => (
            <div key={index} className="border rounded-md p-2 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Team {index + 1}</span>
              {team.playerSlotIds.map((slotId, slotIndex) => (
                <TeamSlot key={slotIndex} teamIndex={index} slotIndex={slotIndex} slotId={slotId} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function EventAttendeesButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [open, setOpen] = useState(false);
  const { data: attendees, isLoading } = useGetEventAttendeesDetailQuery(eventId, { skip: !open });

  const attending = attendees?.filter((a: any) => a.status === "attending") || [];
  const maybe = attendees?.filter((a: any) => a.status === "maybe") || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-view-attendees-${eventId}`}>
          <Users className="h-4 w-4 mr-1" />
          Attendees
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendees - {eventName}</DialogTitle>
          <DialogDescription>
            {attending.length} attending, {maybe.length} interested
          </DialogDescription>
        </DialogHeader>
        {attendees && attendees.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            data-testid={`button-export-attendees-${eventId}`}
            onClick={() => {
              const rows = [["Name", "Email", "Status", "Ticket No"]];
              attendees.forEach((a: any) => {
                rows.push([a.displayName, a.email, a.status === "attending" ? "Going" : "Interested", a.ticketNumber ? String(a.ticketNumber) : ""]);
              });
              const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${eventName.replace(/[^a-zA-Z0-9]/g, "_")}_attendees.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        )}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : (attending.length === 0 && maybe.length === 0) ? (
          <p className="text-muted-foreground text-sm">No attendees yet.</p>
        ) : (
          <div className="space-y-4">
            {attending.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Attending ({attending.length})</h4>
                <div className="space-y-2">
                  {attending.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-2 border rounded-md text-sm" data-testid={`attendee-row-${a.userId}`}>
                      <span className="font-medium">{a.displayName}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {a.ticketNumber && (
                          <span className="flex items-center gap-1 text-xs font-mono bg-muted px-2 py-0.5 rounded" data-testid={`ticket-number-${a.userId}`}>
                            #{a.ticketNumber}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {a.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {maybe.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Interested ({maybe.length})</h4>
                <div className="space-y-2">
                  {maybe.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-2 border rounded-md text-sm" data-testid={`attendee-row-${a.userId}`}>
                      <span className="font-medium">{a.displayName}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {a.email}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EventEntrantsView({ eventId, event }: { eventId: string; event: Event }) {
  const { toast } = useToast();
  const { data: siteSettings } = useGetSiteSettingsQuery();
  const { data: entries, isLoading } = useGetEventEntriesQuery(eventId);

  // Collect all user IDs including entry owners and assigned players
  const allUserIds = useMemo(() => {
    if (!entries) return [];
    const ids = new Set<string>();
    entries.forEach((entry: any) => {
      ids.add(entry.userId);
      entry.assignedPlayerIds?.forEach((id: string) => ids.add(id));
    });
    return Array.from(ids);
  }, [entries]);

  const [userInfos, setUserInfos] = useState<EntrantUserInfo[]>([]);
    useEffect(() => {
      if (allUserIds.length === 0) { setUserInfos([]); return; }
      Promise.all(
        allUserIds.map(async (userId) => {
          try {
            const res = await api.get(`/api/users/${userId}/profile`);
            const data = res.data;
            return { userId, mumblesVibeName: data.mumblesVibeName, profileImageUrl: data.profileImageUrl };
          } catch {
            return { userId };
          }
        })
      ).then(setUserInfos);
    }, [allUserIds.join(",")]);

  const dispatch = useAppDispatch();
    const [fillTestEntriesLoading, setFillTestEntriesLoading] = useState(false);
    const fillTestEntries = {
      isPending: fillTestEntriesLoading,
      mutate: async () => {
        setFillTestEntriesLoading(true);
        try {
          const data: any = await apiRequest("POST", `/api/events/${eventId}/fill-test-entries`, {});
          toast({ description: data.message || "Test entries added" });
          dispatch(rtkApi.util.invalidateTags(["Events", { type: "EventEntries", id: eventId }, { type: "EventTeams", id: eventId }]));
        } catch (error: any) {
          toast({ description: error?.message || "Failed to add test entries", variant: "destructive" });
        } finally {
          setFillTestEntriesLoading(false);
        }
      },
    };

  const [clearTestEntriesLoading, setClearTestEntriesLoading] = useState(false);
    const clearTestEntries = {
      isPending: clearTestEntriesLoading,
      mutate: async () => {
        setClearTestEntriesLoading(true);
        try {
          const data: any = await apiRequest("DELETE", `/api/events/${eventId}/test-entries`);
          toast({ description: data.message || "Test entries removed" });
          dispatch(rtkApi.util.invalidateTags(["Events", { type: "EventEntries", id: eventId }, { type: "EventTeams", id: eventId }]));
        } catch (error: any) {
          toast({ description: error?.message || "Failed to clear test entries", variant: "destructive" });
        } finally {
          setClearTestEntriesLoading(false);
        }
      },
    };

  const testEntryCount = entries?.filter((e: any) => e.userId.startsWith('test-')).length || 0;
  
  // Calculate total places taken (each entry stores its own playerCount)
  const totalPlacesTaken = entries?.reduce((sum: number, entry: any) => {
    return sum + (entry.playerCount || 1);
  }, 0) || 0;
  
  const isFull = event.maxEntries ? totalPlacesTaken >= event.maxEntries : false;
  const deadlinePassed = event.signupDeadline ? new Date() > new Date(event.signupDeadline) : false;
  const showManagement = true;
  
  const [showTeamManagement, setShowTeamManagement] = useState(false);

  const getUserInfo = (userId: string) => {
    return userInfos?.find(u => u.userId === userId);
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading entrants...</div>;
  }
  
  if (showTeamManagement) {
    return (
      <TeamManagementView 
        eventId={eventId} 
        event={event}
        entries={entries || []}
        userInfos={userInfos || []}
        onBack={() => setShowTeamManagement(false)} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b gap-2 flex-wrap">
        <span className="font-medium">
          {event.eventType === 'knockout' 
            ? `${totalPlacesTaken} Place${totalPlacesTaken !== 1 ? 's' : ''} / ${event.maxEntries || '∞'}`
            : `${entries?.length || 0} Entrant${(entries?.length || 0) !== 1 ? 's' : ''}`
          }
        </span>
        <div className="flex gap-2">
          {showManagement && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowTeamManagement(true)}
              data-testid="button-competition-management"
            >
              <Settings className="h-3 w-3 mr-1" />
              Management
            </Button>
          )}
          {testEntryCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearTestEntries.mutate()}
              disabled={clearTestEntries.isPending}
              data-testid="button-clear-test-entries"
            >
              {clearTestEntries.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Clear Test ({testEntryCount})
            </Button>
          )}
          {(siteSettings?.fillCompetitionAllowed !== false) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fillTestEntries.mutate()}
            disabled={fillTestEntries.isPending}
            data-testid="button-fill-test-entries"
          >
            {fillTestEntries.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Fill Competition
          </Button>
          )}
        </div>
      </div>
      
      {(() => {
        // Expand entries into individual player rows
        const expandedRows: Array<{
          entry: EventEntry;
          playerIndex: number;
          playerName: string;
          isFirst: boolean;
          userInfo: EntrantUserInfo | undefined;
        }> = [];
        
        entries?.forEach((entry: any) => {
          const userInfo = getUserInfo(entry.userId);
          // Use stored playerCount (already set at signup time based on team vs individual)
          const playerCount = entry.playerCount || 1;
          
          // First player is the person who signed up
          const firstName = userInfo?.mumblesVibeName || entry.teamName || `User ${entry.userId.slice(0, 8)}`;
          expandedRows.push({
            entry,
            playerIndex: 0,
            playerName: firstName,
            isFirst: true,
            userInfo
          });
          
          // Remaining players - check if assigned
          for (let i = 1; i < playerCount; i++) {
            const assignedUserId = entry.assignedPlayerIds?.[i - 1];
            const isGuestPlayer = assignedUserId?.startsWith("guest:");
            const assignedUserInfo = assignedUserId && !isGuestPlayer ? getUserInfo(assignedUserId) : undefined;
            const assignedName = isGuestPlayer ? assignedUserId.replace("guest:", "") : (assignedUserInfo?.mumblesVibeName || (assignedUserId ? 'Assigned' : 'TBC'));
            expandedRows.push({
              entry,
              playerIndex: i,
              playerName: assignedName,
              isFirst: false,
              userInfo: assignedUserInfo
            });
          }
        });
        
        const totalPlaces = expandedRows.length;
        
        return (!entries || entries.length === 0) ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No entries yet</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              {totalPlaces} place{totalPlaces !== 1 ? 's' : ''} taken
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {expandedRows.map((row, index) => {
                const isTestUser = row.entry.userId.startsWith('test-');
                const isTBC = row.playerName === 'TBC';
                return (
                  <div
                    key={`${row.entry.id}-${row.playerIndex}`}
                    className={`flex items-center justify-between p-3 border rounded-md ${isTestUser ? 'bg-muted/50' : ''} ${isTBC ? 'opacity-60' : ''}`}
                    data-testid={`entrant-row-${row.entry.id}-${row.playerIndex}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                      {row.userInfo?.profileImageUrl ? (
                        <img src={row.userInfo.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className={`font-medium ${isTBC ? 'italic text-muted-foreground' : ''}`}>
                          {row.playerName}
                          {isTestUser && row.isFirst && <span className="ml-2 text-xs text-muted-foreground">(Test)</span>}
                        </p>
                        {row.entry.teamName && row.entry.signupType === 'team' && (
                          <p className="text-xs text-muted-foreground">Team: {row.entry.teamName}</p>
                        )}
                        {row.entry.signupType === 'individual' && row.entry.playerCount && row.entry.playerCount > 1 && row.isFirst && (
                          <p className="text-xs text-muted-foreground">Signed up with {row.entry.playerCount} player{row.entry.playerCount > 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                    {row.isFirst && (
                      <div className="flex items-center gap-2">
                        {row.entry.paymentAmount && (
                          <Badge variant="outline">£{Number(row.entry.paymentAmount).toFixed(2)}</Badge>
                        )}
                        <Badge className={row.entry.paymentStatus === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}>
                          {row.entry.paymentStatus === 'confirmed' ? 'Confirmed' : row.entry.paymentStatus}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  );
}

function EventForm({ 
  event, 
  onSave, 
  onCancel,
  eventType = "standard"
}: { 
  event?: Event; 
  onSave: (data: Partial<Event>) => void; 
  onCancel: () => void;
  eventType?: "standard" | "knockout" | "team_competition";
}) {
  const parseDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return { date: "", time: "" };
    const [date, timePart] = dateStr.split("T");
    const time = timePart ? timePart.substring(0, 5) : "";
    return { date: date || "", time };
  };

  const startParsed = parseDateTime(event?.startDate);
  const endParsed = parseDateTime(event?.endDate || undefined);
  const signupParsed = parseDateTime(event?.signupDeadline || undefined);

  const currentEventType = event?.eventType || eventType;

  const [formData, setFormData] = useState({
    name: event?.name || "",
    summary: event?.summary || "",
    description: event?.description || "",
    venueName: event?.venueName || "",
    address: event?.address || "",
    startDate: startParsed.date || new Date().toISOString().split("T")[0],
    startTime: startParsed.time || "10:00",
    endDate: endParsed.date || "",
    endTime: endParsed.time || "",
    imageUrl: event?.imageUrl || "",
    ticketUrl: event?.ticketUrl || "",
    isFeatured: event?.isFeatured || false,
    isCarousel: event?.isCarousel || false,
    isEventGroup: event?.isEventGroup ?? (eventType === "knockout" || eventType === "team_competition" || (eventType as string) === "individual_competition"),
    eventType: currentEventType,
    maxEntries: event?.maxEntries || 32,
    teamSize: event?.teamSize || 2,
    entryFee: event?.entryFee || "",
    signupDeadlineDate: signupParsed.date || "",
    signupDeadlineTime: signupParsed.time || "23:59",
    competitionFormat: (event as any)?.competitionFormat || ((eventType as string) === "individual_competition" ? "stableford" : eventType === "knockout" ? "matchplay" : "team_stableford"),
    allowIndividualStableford: (event as any)?.allowIndividualStableford || false,
    allowTeamHandicap: (event as any)?.allowTeamHandicap || false,
    leagueTableSortOrder: (event as any)?.leagueTableSortOrder || "highest_first",
  });
  const [tagsInput, setTagsInput] = useState((event?.tags || []).join(", "));
  const [showFreeEventConfirm, setShowFreeEventConfirm] = useState(false);
  const [showNoGroupConfirm, setShowNoGroupConfirm] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Event> | null>(null);

  const { toast } = useToast();

  const isCompetitionType = (type: string) => 
    ["knockout", "team_competition", "individual_competition"].includes(type);

  const performSave = (data: Partial<Event>) => {
    onSave(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = formData.startTime 
      ? `${formData.startDate}T${formData.startTime}:00` 
      : formData.startDate;
    const endDateTime = formData.endDate 
      ? (formData.endTime ? `${formData.endDate}T${formData.endTime}:00` : formData.endDate)
      : undefined;
    
    // Validate end date/time is after start date/time
    if (endDateTime) {
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);
      if (endDate <= startDate) {
        toast({
          title: "Invalid Date",
          description: "End date and time must be after start date and time",
          variant: "destructive",
        });
        return;
      }
    }
    
    const tags = tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0);
    const slug = event?.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    // Validate team size divides evenly into max entries for knockout and team competitions
    if ((formData.eventType === "knockout" || formData.eventType === "team_competition") && formData.maxEntries && formData.teamSize) {
      if (formData.maxEntries % formData.teamSize !== 0) {
        toast({
          title: "Invalid Configuration",
          description: `Team size (${formData.teamSize}) must divide evenly into number of places (${formData.maxEntries})`,
          variant: "destructive",
        });
        return;
      }
    }
    
    const signupDeadline = formData.signupDeadlineDate 
      ? `${formData.signupDeadlineDate}T${formData.signupDeadlineTime}:00`
      : undefined;

    const baseData = {
      name: formData.name,
      summary: formData.summary,
      description: formData.description,
      venueName: formData.venueName,
      address: formData.address,
      imageUrl: formData.imageUrl,
      isFeatured: formData.isFeatured,
      isCarousel: formData.isCarousel,
      isEventGroup: formData.isEventGroup,
      slug,
      tags,
      startDate: startDateTime,
      endDate: endDateTime,
      ticketUrl: formData.ticketUrl,
      eventType: formData.eventType,
    };

    let saveData: Partial<Event>;

    if (formData.eventType === "knockout") {
      saveData = {
        ...baseData,
        maxEntries: formData.maxEntries || null,
        teamSize: formData.teamSize || null,
        entryFee: formData.entryFee || null,
        signupDeadline: signupDeadline || null,
        competitionFormat: formData.competitionFormat || null,
        allowIndividualStableford: false,
        allowTeamHandicap: formData.allowTeamHandicap,
        leagueTableSortOrder: formData.leagueTableSortOrder || "highest_first",
      };
    } else if (formData.eventType === "team_competition") {
      saveData = {
        ...baseData,
        maxEntries: formData.maxEntries || null,
        teamSize: formData.teamSize || null,
        entryFee: formData.entryFee || null,
        signupDeadline: signupDeadline || null,
        competitionFormat: formData.competitionFormat || null,
        allowIndividualStableford: formData.allowIndividualStableford,
        allowTeamHandicap: formData.allowTeamHandicap,
        leagueTableSortOrder: formData.leagueTableSortOrder || "highest_first",
      };
    } else if (formData.eventType === "individual_competition") {
      saveData = {
        ...baseData,
        maxEntries: formData.maxEntries || null,
        teamSize: 1,
        entryFee: formData.entryFee || null,
        signupDeadline: signupDeadline || null,
        competitionFormat: formData.competitionFormat || null,
        allowIndividualStableford: formData.competitionFormat === "stableford" ? formData.allowIndividualStableford : false,
        allowTeamHandicap: false,
        leagueTableSortOrder: formData.leagueTableSortOrder || "highest_first",
      };
    } else {
      saveData = {
        ...baseData,
        maxEntries: null,
        teamSize: null,
        entryFee: null,
        signupDeadline: null,
        competitionFormat: null,
        allowIndividualStableford: false,
        allowTeamHandicap: false,
        leagueTableSortOrder: null,
      };
    }

    const fee = parseFloat(formData.entryFee as string);
    if (isCompetitionType(formData.eventType) && (!formData.entryFee || isNaN(fee) || fee <= 0)) {
      setPendingSaveData(saveData);
      setShowFreeEventConfirm(true);
      return;
    }

    if ((formData.eventType === "social" || formData.eventType === "standard" || !formData.eventType) && !formData.isEventGroup) {
      setPendingSaveData(saveData);
      setShowNoGroupConfirm(true);
      return;
    }

    performSave(saveData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Event Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="input-event-name"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Summary (short description)</label>
        <Input
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          required
          data-testid="input-event-summary"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Venue Name</label>
          <Input
            value={formData.venueName}
            onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
            required
            data-testid="input-event-venue"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Address</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            data-testid="input-event-address"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Event Image</label>
        <ImageUpload
          value={formData.imageUrl}
          onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          testId="input-event-image"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Full Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          data-testid="input-event-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
            data-testid="input-event-start-date"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Start Time</label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            data-testid="input-event-start-time"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">End Date (optional)</label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            data-testid="input-event-end-date"
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Time</label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            data-testid="input-event-end-time"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Ticket URL (optional)</label>
        <Input
          value={formData.ticketUrl}
          onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
          data-testid="input-event-ticket-url"
        />
      </div>

      {(formData.eventType === "knockout" || formData.eventType === "team_competition" || formData.eventType === "individual_competition") && (
        <>
          <div className="p-4 border rounded-md bg-muted/30 space-y-4">
            <h4 className="font-medium text-sm">
              {formData.eventType === "knockout" ? "Knockout Competition Settings" : 
               formData.eventType === "individual_competition" ? "Individual Competition Settings" : "Competition Settings"}
            </h4>
            <div className={formData.eventType === "individual_competition" ? "" : "grid grid-cols-2 gap-4"}>
              <div>
                <label className="text-sm font-medium">Maximum Entrants</label>
                <Input
                  type="number"
                  value={formData.maxEntries || ""}
                  onChange={(e) => setFormData({ ...formData, maxEntries: e.target.value ? Number(e.target.value) : 0 })}
                  min={2}
                  placeholder="e.g., 72"
                  data-testid="input-event-max-entries"
                />
                {formData.eventType !== "individual_competition" && (
                  <p className="text-xs text-muted-foreground mt-1">Must be divisible by team size</p>
                )}
              </div>
              {(formData.eventType === "knockout" || formData.eventType === "team_competition") && (
              <div>
                <label className="text-sm font-medium">
                  {formData.eventType === "knockout" ? "Team Size (1-2)" : "Team Size (1-4)"}
                </label>
                <Select
                  value={String(formData.teamSize || 2)}
                  onValueChange={(value) => {
                    const newSize = Number(value);
                    setFormData(prev => {
                      const updates: any = { teamSize: newSize };
                      const isKnockout = prev.eventType === "knockout";
                      if (newSize === 1) {
                        if (isKnockout) {
                          const knockoutIndividualFormats = ["matchplay", "other"];
                          if (!knockoutIndividualFormats.includes(prev.competitionFormat)) {
                            updates.competitionFormat = "matchplay";
                            updates.leagueTableSortOrder = "none";
                            updates.allowTeamHandicap = false;
                          }
                        } else {
                          const individualFormats = ["stableford", "stroke_play", "other"];
                          if (!individualFormats.includes(prev.competitionFormat)) {
                            updates.competitionFormat = "stableford";
                            updates.leagueTableSortOrder = "highest_first";
                            updates.allowTeamHandicap = false;
                          }
                        }
                      } else {
                        if (isKnockout) {
                          const knockoutTeamFormats = ["fourball", "foursomes_alternate", "matchplay", "greensomes", "gruesomes", "other"];
                          if (!knockoutTeamFormats.includes(prev.competitionFormat)) {
                            updates.competitionFormat = "matchplay";
                          }
                        } else {
                          const teamFormats = ["team_stableford", "team_scramble", "matchplay", "fourball", "foursomes", "other"];
                          if (!teamFormats.includes(prev.competitionFormat)) {
                            updates.competitionFormat = "team_stableford";
                            updates.leagueTableSortOrder = "highest_first";
                          }
                        }
                      }
                      return { ...prev, ...updates };
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-event-team-size">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Individual)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    {formData.eventType !== "knockout" && (
                      <>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              )}
            </div>
            {formData.eventType === "knockout" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Competition Format</label>
                  <Select
                    value={formData.competitionFormat}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, competitionFormat: value }))}
                  >
                    <SelectTrigger data-testid="select-knockout-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.teamSize === 1 ? (
                        <>
                          <SelectItem value="matchplay">Matchplay</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="fourball">Fourball</SelectItem>
                          <SelectItem value="foursomes_alternate">Foursomes/Alternate</SelectItem>
                          <SelectItem value="matchplay">Matchplay</SelectItem>
                          <SelectItem value="greensomes">Greensomes</SelectItem>
                          <SelectItem value="gruesomes">Gruesomes</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allow-team-handicap-knockout"
                    checked={formData.allowTeamHandicap}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowTeamHandicap: checked === true }))}
                    data-testid="checkbox-allow-team-handicap-knockout"
                  />
                  <label htmlFor="allow-team-handicap-knockout" className="text-sm cursor-pointer">
                    Allow Team Handicap
                  </label>
                </div>
              </div>
            )}
            {formData.eventType === "team_competition" && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Competition Format</label>
                    <Select
                      value={formData.competitionFormat}
                      onValueChange={(value) => {
                        setFormData(prev => {
                          const updates: any = { competitionFormat: value };
                          if (prev.teamSize === 1) {
                            if (value === "stableford") {
                              updates.leagueTableSortOrder = "highest_first";
                              updates.allowTeamHandicap = false;
                            } else if (value === "stroke_play") {
                              updates.leagueTableSortOrder = "lowest_first";
                              updates.allowTeamHandicap = true;
                            }
                          } else {
                            if (value === "team_stableford") {
                              updates.leagueTableSortOrder = "highest_first";
                              updates.allowTeamHandicap = false;
                              updates.allowIndividualStableford = false;
                            } else if (value === "team_scramble") {
                              updates.leagueTableSortOrder = "lowest_first";
                              updates.allowTeamHandicap = false;
                              updates.allowIndividualStableford = false;
                            } else if (value === "foursomes") {
                              updates.leagueTableSortOrder = "highest_first";
                              updates.allowTeamHandicap = false;
                              updates.allowIndividualStableford = false;
                            } else if (value === "matchplay" || value === "fourball") {
                              updates.leagueTableSortOrder = "none";
                              updates.allowTeamHandicap = false;
                              updates.allowIndividualStableford = false;
                            } else if (value === "other") {
                              updates.leagueTableSortOrder = "highest_first";
                              updates.allowTeamHandicap = false;
                              updates.allowIndividualStableford = false;
                            }
                          }
                          return { ...prev, ...updates };
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-event-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.teamSize === 1 ? (
                          <>
                            <SelectItem value="stableford">Stableford</SelectItem>
                            <SelectItem value="stroke_play">Strokeplay</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="team_stableford">Team Stableford</SelectItem>
                            <SelectItem value="team_scramble">Team Scramble</SelectItem>
                            <SelectItem value="matchplay">Matchplay</SelectItem>
                            <SelectItem value="fourball">Fourball</SelectItem>
                            <SelectItem value="foursomes">Foursomes</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.competitionFormat === "team_stableford" && formData.teamSize !== 1 && (
                    <div className="flex items-center gap-2 pt-5">
                      <Checkbox
                        id="allow-individual-stableford"
                        checked={formData.allowIndividualStableford}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowIndividualStableford: checked === true })}
                        data-testid="checkbox-allow-individual-stableford"
                      />
                      <label htmlFor="allow-individual-stableford" className="text-sm cursor-pointer">
                        Allow Individual Stableford
                      </label>
                    </div>
                  )}
                  {(formData.competitionFormat === "team_scramble" || formData.competitionFormat === "foursomes") && formData.teamSize !== 1 && (
                    <div className="flex items-center gap-2 pt-5">
                      <Checkbox
                        id="allow-team-handicap"
                        checked={formData.allowTeamHandicap}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowTeamHandicap: checked === true })}
                        data-testid="checkbox-allow-team-handicap-scramble"
                      />
                      <label htmlFor="allow-team-handicap" className="text-sm cursor-pointer">
                        Allow Team Handicap
                      </label>
                    </div>
                  )}
                </div>
                {formData.teamSize === 1 && formData.competitionFormat !== "matchplay" && formData.competitionFormat !== "fourball" && formData.competitionFormat !== "foursomes" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">League Table Order</label>
                      <Select
                        value={formData.leagueTableSortOrder}
                        onValueChange={(value) => setFormData({ ...formData, leagueTableSortOrder: value })}
                      >
                        <SelectTrigger data-testid="select-league-table-sort">
                          <SelectValue placeholder="Select sort order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="highest_first">Highest to Lowest</SelectItem>
                          <SelectItem value="lowest_first">Lowest to Highest</SelectItem>
                          <SelectItem value="none">No League Table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="allow-team-handicap"
                        checked={formData.allowTeamHandicap}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowTeamHandicap: checked === true })}
                        data-testid="checkbox-allow-team-handicap"
                      />
                      <label htmlFor="allow-team-handicap" className="text-sm cursor-pointer">
                        Allow Handicap Input
                      </label>
                    </div>
                  </>
                )}
                {formData.teamSize !== 1 && (formData.competitionFormat === "team_stableford" || formData.competitionFormat === "team_scramble" || formData.competitionFormat === "foursomes") && (
                  <div>
                    <label className="text-sm font-medium">League Table Order</label>
                    {formData.competitionFormat !== "foursomes" && (
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                        {formData.competitionFormat === "team_stableford" ? "Highest to Lowest (set automatically)" : "Lowest to Highest (set automatically)"}
                      </p>
                    )}
                    <Select
                      value={formData.leagueTableSortOrder}
                      onValueChange={(value) => setFormData({ ...formData, leagueTableSortOrder: value })}
                      disabled={formData.competitionFormat !== "foursomes"}
                    >
                      <SelectTrigger data-testid="select-league-table-sort-team">
                        <SelectValue placeholder="Select sort order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="highest_first">Highest to Lowest</SelectItem>
                        <SelectItem value="lowest_first">Lowest to Highest</SelectItem>
                        <SelectItem value="none">No League Table</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.teamSize !== 1 && formData.competitionFormat === "other" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">League Table Order</label>
                      <Select
                        value={formData.leagueTableSortOrder}
                        onValueChange={(value) => setFormData({ ...formData, leagueTableSortOrder: value })}
                      >
                        <SelectTrigger data-testid="select-league-table-sort-custom">
                          <SelectValue placeholder="Select sort order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="highest_first">Highest to Lowest</SelectItem>
                          <SelectItem value="lowest_first">Lowest to Highest</SelectItem>
                          <SelectItem value="none">No League Table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="allow-team-handicap-other"
                        checked={formData.allowTeamHandicap}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowTeamHandicap: checked === true })}
                        data-testid="checkbox-allow-team-handicap-other"
                      />
                      <label htmlFor="allow-team-handicap-other" className="text-sm cursor-pointer">
                        Allow Team Handicap
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
            {formData.eventType === "individual_competition" && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Competition Format</label>
                    <Select
                      value={formData.competitionFormat}
                      onValueChange={(value) => setFormData({ ...formData, competitionFormat: value })}
                    >
                      <SelectTrigger data-testid="select-event-format-individual">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stableford">Stableford</SelectItem>
                        <SelectItem value="stroke_play">Stroke Play</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.competitionFormat === "stableford" && (
                    <div className="flex items-center gap-2 pt-5">
                      <Checkbox
                        id="allow-individual-stableford"
                        checked={formData.allowIndividualStableford}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowIndividualStableford: checked === true })}
                        data-testid="checkbox-allow-individual-stableford"
                      />
                      <label htmlFor="allow-individual-stableford" className="text-sm cursor-pointer">
                        Allow Individual Stableford
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">League Table Order</label>
                  <Select
                    value={formData.leagueTableSortOrder}
                    onValueChange={(value) => setFormData({ ...formData, leagueTableSortOrder: value })}
                  >
                    <SelectTrigger data-testid="select-league-table-sort-individual">
                      <SelectValue placeholder="Select sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="highest_first">Highest to Lowest</SelectItem>
                      <SelectItem value="lowest_first">Lowest to Highest</SelectItem>
                      <SelectItem value="none">No League Table</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Entry Fee per Person</label>
              <Input
                value={formData.entryFee}
                onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                placeholder="e.g., £25"
                data-testid="input-event-entry-fee"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sign Up Deadline Date</label>
                <Input
                  type="date"
                  value={formData.signupDeadlineDate}
                  onChange={(e) => setFormData({ ...formData, signupDeadlineDate: e.target.value })}
                  data-testid="input-event-signup-deadline-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sign Up Deadline Time</label>
                <Input
                  type="time"
                  value={formData.signupDeadlineTime}
                  onChange={(e) => setFormData({ ...formData, signupDeadlineTime: e.target.value })}
                  data-testid="input-event-signup-deadline-time"
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="text-sm font-medium">Tags (comma-separated)</label>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g., Music, Festival, Free Entry"
          data-testid="input-event-tags"
        />
        <p className="text-xs text-muted-foreground mt-1">Enter tags separated by commas</p>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isCarousel}
            onChange={(e) => setFormData({ ...formData, isCarousel: e.target.checked })}
            id="isCarousel"
            data-testid="checkbox-event-carousel"
          />
          <label htmlFor="isCarousel" className="text-sm">Carousel</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isFeatured}
            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            id="isFeatured"
            data-testid="checkbox-event-featured"
          />
          <label htmlFor="isFeatured" className="text-sm">Featured Event</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isEventGroup}
            onChange={(e) => setFormData({ ...formData, isEventGroup: e.target.checked })}
            id="isEventGroup"
            data-testid="checkbox-event-group"
          />
          <label htmlFor="isEventGroup" className="text-sm">Event Group</label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" data-testid="button-save-event">Save Event</Button>
      </div>

      <Dialog open={showFreeEventConfirm} onOpenChange={setShowFreeEventConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              No Entry Fee Set
            </DialogTitle>
            <DialogDescription>
              You haven't entered an entry fee for this competition. This means it will be listed as a free event and members will not be charged to enter.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowFreeEventConfirm(false);
                setPendingSaveData(null);
              }}
              data-testid="button-free-event-go-back"
            >
              Go Back
            </Button>
            <Button
              onClick={() => {
                setShowFreeEventConfirm(false);
                if (pendingSaveData) {
                  performSave(pendingSaveData);
                  setPendingSaveData(null);
                }
              }}
              data-testid="button-free-event-confirm"
            >
              Continue as Free Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoGroupConfirm} onOpenChange={setShowNoGroupConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Event Group Not Enabled
            </DialogTitle>
            <DialogDescription>
              The "Event Group" option is not checked. Without an event group, members won't have a community space to discuss and interact around this event.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowNoGroupConfirm(false);
                setPendingSaveData(null);
              }}
              data-testid="button-no-group-go-back"
            >
              Go Back
            </Button>
            <Button
              onClick={() => {
                setShowNoGroupConfirm(false);
                if (pendingSaveData) {
                  performSave(pendingSaveData);
                  setPendingSaveData(null);
                }
              }}
              data-testid="button-no-group-confirm"
            >
              Continue Without Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

function InsiderTipForm({ 
  tip, 
  onSave, 
  onCancel 
}: { 
  tip?: InsiderTip; 
  onSave: (data: Partial<InsiderTip>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: tip?.title || "",
    tip: tip?.tip || "",
    author: tip?.author || "",
    isActive: tip?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Best Time to Visit"
          required
          data-testid="input-tip-title"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Tip</label>
        <Textarea
          value={formData.tip}
          onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
          placeholder="Share your insider knowledge..."
          rows={4}
          required
          data-testid="input-tip-content"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Author Name</label>
        <Input
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          placeholder="e.g., Sarah"
          required
          data-testid="input-tip-author"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          id="tipActive"
          data-testid="switch-tip-active"
        />
        <label htmlFor="tipActive" className="text-sm">Active (visible on homepage)</label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" data-testid="button-save-tip">Save Tip</Button>
      </div>
    </form>
  );
}

interface AdminUser {
  id: string;
  email: string;
  mumblesVibeName: string;
  blocked: boolean | null;
  isAdmin: boolean | null;
  isSuperAdmin: boolean | null;
  adminArticles: boolean | null;
  adminEvents: boolean | null;
  adminReviews: boolean | null;
  adminPosts: boolean | null;
  adminGroups: boolean | null;
  adminPodcasts: boolean | null;
  createdAt: string | null;
  lastActiveAt: string | null;
  subscriptionPlanId: string | null;
  subscriptionEndDate: string | null;
  stripeSubscriptionId: string | null;
  profileImageUrl: string | null;
}

export default function AdminPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user: currentUser, isAuthenticated, isAdmin, isSuperAdmin, adminArticles: canManageArticles, adminEvents: canManageEvents, adminReviews: canManageReviews, adminPosts: canManagePosts, adminGroups: canManageGroups, isLoading: authLoading } = useAuth();
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTip, setEditingTip] = useState<InsiderTip | null>(null);
  const [editingVibe, setEditingVibe] = useState<AdminVibe | null>(null);
  const [editingVibeContent, setEditingVibeContent] = useState("");
  const [editingVibeImages, setEditingVibeImages] = useState<string[]>([]);
  const [editingGroupPost, setEditingGroupPost] = useState<GroupPostWithDetails | null>(null);
  const [editingGroupPostContent, setEditingGroupPostContent] = useState("");
  const [editingGroupPostImages, setEditingGroupPostImages] = useState<string[]>([]);
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [isAddingPodcast, setIsAddingPodcast] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventType, setNewEventType] = useState<"standard" | "knockout" | "team_competition" | null>(null);
  const [isAddingTip, setIsAddingTip] = useState(false);
  const [showCreateAdminDialog, setShowCreateAdminDialog] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSortBy, setUserSortBy] = useState<"date" | "name">("date");
  const [userFilterRole, setUserFilterRole] = useState<string>("all");
  const [editingAdminUser, setEditingAdminUser] = useState<AdminUser | null>(null);
  const [editAdminData, setEditAdminData] = useState({
    isAdmin: true,
    isSuperAdmin: false,
    adminArticles: false,
    adminEvents: false,
    adminReviews: false,
    adminPosts: false,
    adminGroups: false,
    adminPodcasts: false,
  });
  const [newAdminData, setNewAdminData] = useState({
    email: "",
    password: "",
    mumblesVibeName: "",
    isSuperAdmin: false,
    adminArticles: false,
    adminEvents: false,
    adminReviews: false,
    adminPosts: false,
    adminGroups: false,
    adminPodcasts: false,
  });
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  
  const [inputDialog, setInputDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    placeholder?: string;
    value: string;
    onConfirm: (value: string) => void;
  }>({ open: false, title: "", description: "", value: "", onConfirm: () => {} });
  
  const showConfirm = useCallback((title: string, description: string, onConfirm: () => void, options?: { confirmText?: string; variant?: "default" | "destructive" }) => {
    setConfirmDialog({ open: true, title, description, onConfirm, confirmText: options?.confirmText, variant: options?.variant });
  }, []);
  
  const showInput = useCallback((title: string, description: string, onConfirm: (value: string) => void, placeholder?: string) => {
    setInputDialog({ open: true, title, description, value: "", onConfirm, placeholder });
  }, []);
  
  const [heroFormData, setHeroFormData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    ctaText: "",
    ctaLink: ""
  });

  const { data: articles, isLoading: articlesLoading } = useGetArticlesQuery(undefined, { skip: !isAdmin });

  const { data: adminPodcasts, isLoading: podcastsLoading } = useGetAdminPodcastsQuery(undefined, { skip: !isAdmin });

  const [triggerCreatePodcast, { isLoading: createPodcastLoading }] = useCreatePodcastMutation();
    const createPodcast = {
      isPending: createPodcastLoading,
      mutate: (data: Partial<Podcast>) => {
        triggerCreatePodcast(data).unwrap().then(() => {
          setIsAddingPodcast(false);
          toast({ title: "Podcast created" });
        }).catch(() => toast({ title: "Failed to create podcast", variant: "destructive" }));
      },
    };

  const [triggerUpdatePodcast, { isLoading: updatePodcastLoading }] = useUpdatePodcastMutation();
    const updatePodcast = {
      isPending: updatePodcastLoading,
      mutate: ({ id, data }: { id: string; data: Partial<Podcast> }) => {
        triggerUpdatePodcast({ id, body: data }).unwrap().then(() => {
          setEditingPodcast(null);
          toast({ title: "Podcast updated" });
        }).catch(() => toast({ title: "Failed to update podcast", variant: "destructive" }));
      },
    };

  const [triggerDeletePodcast] = useDeletePodcastMutation();
    const deletePodcast = {
      mutate: (id: string) => {
        triggerDeletePodcast(id).unwrap().then(() => {
          toast({ title: "Podcast deleted" });
        }).catch(() => toast({ title: "Failed to delete podcast", variant: "destructive" }));
      },
    };

  const { data: events, isLoading: eventsLoading } = useGetAdminEventsQuery(undefined, { skip: !isAdmin });

  const { data: subscribers } = useGetNewsletterSubscriptionsQuery(undefined, { skip: !isAdmin });

  const { data: heroSettings } = useGetHeroSettingsQuery(undefined, { skip: !isAdmin });

  const { data: siteSettings } = useGetSiteSettingsQuery(undefined, { skip: !isAdmin });

  const { data: articleCategoriesData, isLoading: categoriesLoading } = useGetArticleCategoriesQuery(undefined, { skip: !isAdmin });

  const [editingCategory, setEditingCategory] = useState<ArticleCategoryRecord | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");

  const [triggerCreateCategory] = useCreateArticleCategoryMutation();
    const createCategory = {
      mutate: (data: { name: string; icon?: string }) => {
        triggerCreateCategory(data).unwrap().then(() => {
          setNewCategoryName("");
          setNewCategoryIcon("");
          toast({ title: "Category created" });
        }).catch(() => toast({ title: "Failed to create category", variant: "destructive" }));
      },
    };

  const [triggerUpdateCategory] = useUpdateArticleCategoryMutation();
    const updateCategory = {
      mutate: ({ id, name, icon }: { id: number; name: string; icon?: string }) => {
        triggerUpdateCategory({ id, body: { name, icon } }).unwrap().then(() => {
          setEditingCategory(null);
          toast({ title: "Category updated" });
        }).catch(() => toast({ title: "Failed to update category", variant: "destructive" }));
      },
    };

  const [triggerDeleteCategory] = useDeleteArticleCategoryMutation();
    const deleteCategory = {
      mutate: (id: number) => {
        triggerDeleteCategory(id).unwrap().then(() => {
          toast({ title: "Category deleted" });
        }).catch(() => toast({ title: "Failed to delete category", variant: "destructive" }));
      },
    };

  const [triggerReorderArticleCategories] = useReorderArticleCategoriesMutation();
    const reorderArticleCategories = {
      mutate: (categories: { id: number; orderIndex: number }[]) => {
        triggerReorderArticleCategories({ categories }).unwrap().catch(() => toast({ title: "Failed to reorder categories", variant: "destructive" }));
      },
    };

  const moveArticleCategory = (index: number, direction: 'up' | 'down') => {
    if (!articleCategoriesData) return;
    const sorted = [...articleCategoriesData].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const updates = reordered.map((cat, i) => ({ id: cat.id, orderIndex: i }));
    reorderArticleCategories.mutate(updates);
  };

  // Event Categories
  const { data: eventCategoriesData, isLoading: eventCategoriesLoading } = useGetEventCategoriesQuery(undefined, { skip: !isAdmin });

  const [editingEventCategory, setEditingEventCategory] = useState<EventCategoryRecord | null>(null);
  const [newEventCategoryName, setNewEventCategoryName] = useState("");
  const [newEventCategoryIcon, setNewEventCategoryIcon] = useState("");

  const [triggerCreateEventCategory] = useCreateEventCategoryMutation();
    const createEventCategory = {
      mutate: (data: { name: string; icon?: string }) => {
        triggerCreateEventCategory(data).unwrap().then(() => {
          setNewEventCategoryName("");
          setNewEventCategoryIcon("");
          toast({ title: "Event category created" });
        }).catch(() => toast({ title: "Failed to create event category", variant: "destructive" }));
      },
    };

  const [triggerUpdateEventCategory] = useUpdateEventCategoryMutation();
    const updateEventCategory = {
      mutate: ({ id, name, icon }: { id: number; name: string; icon?: string }) => {
        triggerUpdateEventCategory({ id, body: { name, icon } }).unwrap().then(() => {
          setEditingEventCategory(null);
          toast({ title: "Event category updated" });
        }).catch(() => toast({ title: "Failed to update event category", variant: "destructive" }));
      },
    };

  const [triggerDeleteEventCategory] = useDeleteEventCategoryMutation();
    const deleteEventCategory = {
      mutate: (id: number) => {
        triggerDeleteEventCategory(id).unwrap().then(() => {
          toast({ title: "Event category deleted" });
        }).catch(() => toast({ title: "Failed to delete event category", variant: "destructive" }));
      },
    };

  const [triggerReorderEventCategories] = useReorderEventCategoriesMutation();
    const reorderEventCategories = {
      mutate: (categories: { id: number; orderIndex: number }[]) => {
        triggerReorderEventCategories({ categories }).unwrap().catch(() => toast({ title: "Failed to reorder categories", variant: "destructive" }));
      },
    };

  const moveEventCategory = (index: number, direction: 'up' | 'down') => {
    if (!eventCategoriesData) return;
    const sorted = [...eventCategoriesData].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const updates = reordered.map((cat, i) => ({ id: cat.id, orderIndex: i }));
    reorderEventCategories.mutate(updates);
  };

  // Review Categories
  const { data: reviewCategoriesData, isLoading: reviewCategoriesLoading } = useGetReviewCategoriesQuery(undefined, { skip: !isAdmin });

  const [editingReviewCategory, setEditingReviewCategory] = useState<ReviewCategoryRecord | null>(null);
  const [newReviewCategoryName, setNewReviewCategoryName] = useState("");
  const [newReviewCategoryIcon, setNewReviewCategoryIcon] = useState("");

  const [triggerCreateReviewCategory] = useCreateReviewCategoryMutation();
    const createReviewCategory = {
      mutate: (data: { name: string; icon?: string }) => {
        triggerCreateReviewCategory(data).unwrap().then(() => {
          setNewReviewCategoryName("");
          setNewReviewCategoryIcon("");
          toast({ title: "Review category created" });
        }).catch(() => toast({ title: "Failed to create review category", variant: "destructive" }));
      },
    };

  const [triggerUpdateReviewCategory] = useUpdateReviewCategoryMutation();
    const updateReviewCategory = {
      mutate: ({ id, name, icon }: { id: number; name: string; icon?: string }) => {
        triggerUpdateReviewCategory({ id, body: { name, icon } }).unwrap().then(() => {
          setEditingReviewCategory(null);
          toast({ title: "Review category updated" });
        }).catch(() => toast({ title: "Failed to update review category", variant: "destructive" }));
      },
    };

  const [triggerDeleteReviewCategory] = useDeleteReviewCategoryMutation();
    const deleteReviewCategory = {
      mutate: (id: number) => {
        triggerDeleteReviewCategory(id).unwrap().then(() => {
          toast({ title: "Review category deleted" });
        }).catch(() => toast({ title: "Failed to delete review category", variant: "destructive" }));
      },
    };

  const [triggerReorderReviewCategories] = useReorderReviewCategoriesMutation();
    const reorderReviewCategories = {
      mutate: (categories: { id: number; orderIndex: number }[]) => {
        triggerReorderReviewCategories({ categories }).unwrap().catch(() => toast({ title: "Failed to reorder categories", variant: "destructive" }));
      },
    };

  const moveReviewCategory = (index: number, direction: 'up' | 'down') => {
    if (!reviewCategoriesData) return;
    const sorted = [...reviewCategoriesData].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const updates = reordered.map((cat, i) => ({ id: cat.id, orderIndex: i }));
    reorderReviewCategories.mutate(updates);
  };

  // Profile Fields
  type ProfileFieldWithOptions = {
    id: number;
    label: string;
    slug: string;
    fieldType: 'text' | 'select' | 'selector';
    description: string | null;
    isRequired: boolean;
    orderIndex: number;
    options: { id: number; label: string; value: string; orderIndex: number }[];
    selectorValuesCount?: number;
  };

  const { data: profileFieldsData, isLoading: profileFieldsLoading } = useGetAdminProfileFieldsQuery(undefined, { skip: !isAdmin });

  const [editingProfileField, setEditingProfileField] = useState<ProfileFieldWithOptions | null>(null);
  const [newProfileField, setNewProfileField] = useState({ label: "", fieldType: "text" as "text" | "select" | "selector", description: "", isRequired: false, options: "", selectorValues: "" });
  const [showProfileFieldDialog, setShowProfileFieldDialog] = useState(false);
  const [profileFieldToDelete, setProfileFieldToDelete] = useState<number | null>(null);

  const [triggerCreateProfileField] = useCreateAdminProfileFieldMutation();
    const createProfileField = {
      mutate: (data: { label: string; fieldType: string; description?: string; isRequired?: boolean; options?: string[] }) => {
        triggerCreateProfileField(data).unwrap().then(() => {
          setNewProfileField({ label: "", fieldType: "text", description: "", isRequired: false, options: "", selectorValues: "" });
          setShowProfileFieldDialog(false);
          toast({ title: "Profile field created" });
        }).catch(() => toast({ title: "Failed to create profile field", variant: "destructive" }));
      },
    };

  const [selectorValuesText, setSelectorValuesText] = useState<string>("");
  const [uploadSelectorValuesLoading, setUploadSelectorValuesLoading] = useState(false);
    const uploadSelectorValues = {
      isPending: uploadSelectorValuesLoading,
      mutate: async ({ fieldId, values }: { fieldId: number; values: string[] }) => {
        setUploadSelectorValuesLoading(true);
        try {
          await apiRequest("POST", `/api/admin/profile-fields/${fieldId}/selector-values`, { values });
          dispatch(rtkApi.util.invalidateTags(["ProfileFields"]));
          setSelectorValuesText("");
          toast({ title: "Selector values uploaded" });
        } catch {
          toast({ title: "Failed to upload selector values", variant: "destructive" });
        } finally {
          setUploadSelectorValuesLoading(false);
        }
      },
    };

  const [triggerUpdateProfileField] = useUpdateAdminProfileFieldMutation();
    const updateProfileField = {
      mutate: ({ id, ...data }: { id: number; label?: string; description?: string; isRequired?: boolean; options?: string[] }) => {
        triggerUpdateProfileField({ id, body: data }).unwrap().then(() => {
          setEditingProfileField(null);
          toast({ title: "Profile field updated" });
        }).catch(() => toast({ title: "Failed to update profile field", variant: "destructive" }));
      },
    };

  const [triggerDeleteProfileField] = useDeleteAdminProfileFieldMutation();
    const deleteProfileField = {
      mutate: (id: number) => {
        triggerDeleteProfileField(id).unwrap().then(() => {
          setProfileFieldToDelete(null);
          toast({ title: "Profile field deleted" });
        }).catch(() => toast({ title: "Failed to delete profile field", variant: "destructive" }));
      },
    };

  const [triggerReorderProfileFields] = useReorderAdminProfileFieldsMutation();
    const reorderProfileFields = {
      mutate: (fieldIds: number[]) => {
        triggerReorderProfileFields({ fieldIds }).unwrap().catch(() => toast({ title: "Failed to reorder fields", variant: "destructive" }));
      },
    };

  const moveProfileField = (index: number, direction: 'up' | 'down') => {
    if (!profileFieldsData) return;
    const sorted = [...profileFieldsData].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    [sorted[index], sorted[newIndex]] = [sorted[newIndex], sorted[index]];
    reorderProfileFields.mutate(sorted.map(f => f.id));
  };

  const { data: insiderTips } = useGetInsiderTipsQuery(undefined, { skip: !isAdmin });

  const { data: registeredUsers } = useGetAdminUsersQuery(undefined, { skip: !isAdmin });

  const { data: adminVibes, isLoading: vibesLoading } = useGetAdminVibesQuery(undefined, { skip: !isAdmin });

  interface GroupPostWithDetails extends GroupPost {
    authorName: string;
    groupName: string;
  }

  const { data: adminGroupPosts, isLoading: groupPostsLoading } = useGetAdminGroupPostsQuery(undefined, { skip: !isAdmin });

  const [deleteGroupPostLoading, setDeleteGroupPostLoading] = useState(false);
    const deleteGroupPost = {
      isPending: deleteGroupPostLoading,
      mutate: async (id: string) => {
        setDeleteGroupPostLoading(true);
        try {
          await apiRequest("DELETE", `/api/admin/groups/posts/${id}`);
          dispatch(rtkApi.util.invalidateTags(["GroupPosts"]));
          toast({ title: "Group post deleted" });
        } catch {
          toast({ title: "Failed to delete group post", variant: "destructive" });
        } finally {
          setDeleteGroupPostLoading(false);
        }
      },
    };

  const [updateGroupPostLoading, setUpdateGroupPostLoading] = useState(false);
    const updateGroupPost = {
      isPending: updateGroupPostLoading,
      mutate: async ({ id, content, imageUrls }: { id: string; content: string; imageUrls: string[] }) => {
        setUpdateGroupPostLoading(true);
        try {
          await apiRequest("PATCH", `/api/admin/groups/posts/${id}`, { content, imageUrls });
          dispatch(rtkApi.util.invalidateTags(["GroupPosts"]));
          toast({ title: "Group post updated" });
          setEditingGroupPost(null);
        } catch {
          toast({ title: "Failed to update group post", variant: "destructive" });
        } finally {
          setUpdateGroupPostLoading(false);
        }
      },
    };

  const [updateVibeLoading, setUpdateVibeLoading] = useState(false);
    const updateVibe = {
      isPending: updateVibeLoading,
      mutate: async ({ id, content, imageUrls }: { id: string; content: string; imageUrls: string[] }) => {
        setUpdateVibeLoading(true);
        try {
          await apiRequest("PUT", `/api/admin/vibes/${id}`, { content, imageUrls });
          dispatch(rtkApi.util.invalidateTags(["Vibes"]));
          setEditingVibe(null);
          setEditingVibeContent("");
          setEditingVibeImages([]);
          toast({ title: "Post updated successfully" });
        } catch {
          toast({ title: "Failed to update post", variant: "destructive" });
        } finally {
          setUpdateVibeLoading(false);
        }
      },
    };

  const [deleteVibeLoading, setDeleteVibeLoading] = useState(false);
    const deleteVibe = {
      isPending: deleteVibeLoading,
      mutate: async (id: string) => {
        setDeleteVibeLoading(true);
        try {
          await apiRequest("DELETE", `/api/admin/vibes/${id}`);
          dispatch(rtkApi.util.invalidateTags(["Vibes"]));
          toast({ title: "Post deleted" });
        } catch {
          toast({ title: "Failed to delete post", variant: "destructive" });
        } finally {
          setDeleteVibeLoading(false);
        }
      },
    };

  const [triggerBlockUser] = useBlockAdminUserMutation();
    const toggleBlockUser = {
      mutate: ({ id, blocked }: { id: string; blocked: boolean }) => {
        triggerBlockUser({ id, body: { blocked } }).unwrap().then(() => {
          toast({ title: "User status updated" });
        }).catch(() => {});
      },
    };

  const [triggerCreateAdminUser] = useCreateAdminUserMutation();
    const createAdminUser = {
      mutate: (data: typeof newAdminData) => {
        triggerCreateAdminUser(data).unwrap().then(() => {
          setShowCreateAdminDialog(false);
          setNewAdminData({
            email: "",
            password: "",
            mumblesVibeName: "",
            isSuperAdmin: false,
            adminArticles: false,
            adminEvents: false,
            adminReviews: false,
            adminPosts: false,
            adminGroups: false,
            adminPodcasts: false,
          });
          toast({ title: "Admin user created successfully" });
        }).catch((error: any) => {
          toast({ title: error.message || "Failed to create admin user", variant: "destructive" });
        });
      },
    };

  const [triggerUpdateAdminUser] = useUpdateAdminUserMutation();
    const updateAdminUser = {
      mutate: ({ id, data }: { id: string; data: typeof editAdminData }) => {
        triggerUpdateAdminUser({ id, body: data }).unwrap().then(() => {
          setEditingAdminUser(null);
          toast({ title: "User permissions updated successfully" });
        }).catch((error: any) => {
          toast({ title: error.message || "Failed to update user", variant: "destructive" });
        });
      },
    };

  const [triggerDeleteUser] = useDeleteAdminUserMutation();
    const deleteUser = {
      mutate: (id: string) => {
        triggerDeleteUser(id).unwrap().then(() => {
          toast({ title: "User deleted successfully" });
        }).catch((error: any) => {
          toast({ title: error.message || "Failed to delete user", variant: "destructive" });
        });
      },
    };

  const [triggerChangePassword] = useChangeAdminUserPasswordMutation();
    const changeUserPassword = {
      mutate: ({ id, newPassword }: { id: string; newPassword: string }) => {
        triggerChangePassword({ id, body: { newPassword } }).unwrap().then(() => {
          toast({ title: "Password changed successfully" });
        }).catch((error: any) => {
          toast({ title: error.message || "Failed to change password", variant: "destructive" });
        });
      },
    };

  const { data: adminPlayRequests, isLoading: playRequestsLoading } = useGetAdminPlayRequestsQuery(undefined, { skip: !isSuperAdmin });

  const [deleteAdminPlayRequestLoading, setDeleteAdminPlayRequestLoading] = useState(false);
    const deleteAdminPlayRequest = {
      isPending: deleteAdminPlayRequestLoading,
      mutate: async (id: string) => {
        setDeleteAdminPlayRequestLoading(true);
        try {
          await apiRequest("DELETE", `/api/admin/play-requests/${id}`);
          dispatch(rtkApi.util.invalidateTags(["PlayRequests"]));
          toast({ title: "Play request deleted" });
        } catch {
          toast({ title: "Failed to delete play request", variant: "destructive" });
        } finally {
          setDeleteAdminPlayRequestLoading(false);
        }
      },
    };

  const { data: adminTeeTimeOffers, isLoading: teeTimeOffersLoading } = useGetAdminTeeTimeOffersQuery(undefined, { skip: !isSuperAdmin });

  const [deleteAdminTeeTimeOfferLoading, setDeleteAdminTeeTimeOfferLoading] = useState(false);
    const deleteAdminTeeTimeOffer = {
      isPending: deleteAdminTeeTimeOfferLoading,
      mutate: async (id: string) => {
        setDeleteAdminTeeTimeOfferLoading(true);
        try {
          await apiRequest("DELETE", `/api/admin/tee-time-offers/${id}`);
          dispatch(rtkApi.util.invalidateTags(["TeeTimeOffers"]));
          toast({ title: "Tee time offer deleted" });
        } catch {
          toast({ title: "Failed to delete tee time offer", variant: "destructive" });
        } finally {
          setDeleteAdminTeeTimeOfferLoading(false);
        }
      },
    };

  useEffect(() => {
    if (heroSettings) {
      setHeroFormData({
        title: heroSettings.title || "",
        subtitle: heroSettings.subtitle || "",
        imageUrl: heroSettings.imageUrl || "",
        ctaText: heroSettings.ctaText || "",
        ctaLink: heroSettings.ctaLink || ""
      });
    }
  }, [heroSettings]);

  const [triggerUpdateHeroSettings] = useUpdateHeroSettingsMutation();
    const updateHeroSettings = {
      mutate: (data: any) => {
        triggerUpdateHeroSettings(data).unwrap().then(() => {
          toast({ title: "Hero settings updated" });
        }).catch(() => toast({ title: "Failed to update hero settings", variant: "destructive" }));
      },
    };

  const [triggerUpdateSiteSettings] = useUpdateSiteSettingsMutation();
    const updateSiteSettings = {
      mutate: (data: any) => {
        triggerUpdateSiteSettings(data).unwrap().then(() => {
          toast({ title: "Site settings updated" });
        }).catch(() => toast({ title: "Failed to update site settings", variant: "destructive" }));
      },
    };

  const [triggerCreateArticle] = useCreateArticleMutation();
    const createArticle = {
      mutate: async ({ data, sections }: { data: any; sections?: any[] }) => {
        try {
          const article = await triggerCreateArticle(data).unwrap();
          if (sections && sections.length > 0 && article?.id) {
            await apiRequest("PUT", `/api/articles/${article.id}/sections`, { sections });
          }
          setIsAddingArticle(false);
          toast({ title: "Article created" });
        } catch {
          toast({ title: "Failed to create article", variant: "destructive" });
        }
      },
    };

  const [updateArticleLoading, setUpdateArticleLoading] = useState(false);
    const updateArticle = {
      isPending: updateArticleLoading,
      mutate: async ({ id, data }: { id: string; data: any }) => {
        setUpdateArticleLoading(true);
        try {
          await apiRequest("PUT", `/api/articles/${id}`, data);
          dispatch(rtkApi.util.invalidateTags(["Articles"]));
          setEditingArticle(null);
          toast({ title: "Article updated" });
        } catch {
          toast({ title: "Failed to update article", variant: "destructive" });
        } finally {
          setUpdateArticleLoading(false);
        }
      },
    };

  const [deleteArticleLoading, setDeleteArticleLoading] = useState(false);
    const deleteArticle = {
      isPending: deleteArticleLoading,
      mutate: async (id: string) => {
        setDeleteArticleLoading(true);
        try {
          await apiRequest("DELETE", `/api/articles/${id}`);
          dispatch(rtkApi.util.invalidateTags(["Articles"]));
          toast({ title: "Article deleted" });
        } catch {
          toast({ title: "Failed to delete article", variant: "destructive" });
        } finally {
          setDeleteArticleLoading(false);
        }
      },
    };

  const [triggerCreateEvent] = useCreateEventMutation();
    const createEvent = {
      mutate: (data: any) => {
        triggerCreateEvent(data).unwrap().then(() => {
          setIsAddingEvent(false);
          toast({ title: "Event created" });
        }).catch(() => toast({ title: "Failed to create event", variant: "destructive" }));
      },
    };

  const [updateEventLoading, setUpdateEventLoading] = useState(false);
    const updateEvent = {
      isPending: updateEventLoading,
      mutate: async ({ id, data }: { id: string; data: any }) => {
        setUpdateEventLoading(true);
        try {
          await apiRequest("PUT", `/api/events/${id}`, data);
          dispatch(rtkApi.util.invalidateTags(["Events"]));
          setEditingEvent(null);
          toast({ title: "Event updated" });
        } catch {
          toast({ title: "Failed to update event", variant: "destructive" });
        } finally {
          setUpdateEventLoading(false);
        }
      },
    };

  const [toggleEventFeaturedLoading, setToggleEventFeaturedLoading] = useState(false);
    const toggleEventFeatured = {
      isPending: toggleEventFeaturedLoading,
      mutate: async ({ id, featured }: { id: string; featured: boolean }) => {
        setToggleEventFeaturedLoading(true);
        try {
          await apiRequest("PATCH", `/api/events/${id}/featured`, { featured });
          dispatch(rtkApi.util.invalidateTags(["Events"]));
          toast({ title: featured ? "Event featured" : "Event unfeatured" });
        } catch {
          toast({ title: "Failed to update event", variant: "destructive" });
        } finally {
          setToggleEventFeaturedLoading(false);
        }
      },
    };

  const [deleteEventLoading, setDeleteEventLoading] = useState(false);
    const deleteEvent = {
      isPending: deleteEventLoading,
      mutate: async (id: string) => {
        setDeleteEventLoading(true);
        try {
          await apiRequest("DELETE", `/api/events/${id}`);
          dispatch(rtkApi.util.invalidateTags(["Events"]));
          toast({ title: "Event deleted" });
        } catch {
          toast({ title: "Failed to delete event", variant: "destructive" });
        } finally {
          setDeleteEventLoading(false);
        }
      },
    };

  const [triggerCreateTip] = useCreateInsiderTipMutation();
    const createTip = {
      mutate: (data: any) => {
        triggerCreateTip(data).unwrap().then(() => {
          setIsAddingTip(false);
          toast({ title: "Insider tip created" });
        }).catch(() => toast({ title: "Failed to create tip", variant: "destructive" }));
      },
    };

  const [triggerUpdateTip] = useUpdateInsiderTipMutation();
    const updateTip = {
      mutate: ({ id, data }: { id: string; data: any }) => {
        triggerUpdateTip({ id, body: data }).unwrap().then(() => {
          setEditingTip(null);
          toast({ title: "Insider tip updated" });
        }).catch(() => toast({ title: "Failed to update tip", variant: "destructive" }));
      },
    };

  const [triggerDeleteTip] = useDeleteInsiderTipMutation();
    const deleteTip = {
      mutate: (id: string) => {
        triggerDeleteTip(id).unwrap().then(() => {
          toast({ title: "Insider tip deleted" });
        }).catch(() => toast({ title: "Failed to delete tip", variant: "destructive" }));
      },
    };

  const { data: eventSuggestions } = useGetPendingEventSuggestionsQuery(undefined, { skip: !isAdmin });

  const [approveEventLoading, setApproveEventLoading] = useState(false);
  const [rejectEventLoading, setRejectEventLoading] = useState(false);

  const approveEventSuggestion = {
    mutate: async (id: string) => {
      setApproveEventLoading(true);
      try {
        await apiRequest("PATCH", `/api/admin/event-suggestions/${id}/approve`);
        dispatch(rtkApi.util.invalidateTags(["EventSuggestions", "Events"]));
        toast({ title: "Event approved and published" });
      } catch {
        toast({ title: "Failed to approve event", variant: "destructive" });
      } finally {
        setApproveEventLoading(false);
      }
    },
    isPending: approveEventLoading,
  };

  const rejectEventSuggestion = {
    mutate: async ({ id, reason }: { id: string; reason?: string }) => {
      setRejectEventLoading(true);
      try {
        await apiRequest("PATCH", `/api/admin/event-suggestions/${id}/reject`, { rejectionReason: reason });
        dispatch(rtkApi.util.invalidateTags(["EventSuggestions"]));
        toast({ title: "Event suggestion rejected" });
      } catch {
        toast({ title: "Failed to reject event", variant: "destructive" });
      } finally {
        setRejectEventLoading(false);
      }
    },
    isPending: rejectEventLoading,
  };

  const [reviewStatusFilter, setReviewStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: adminReviews } = useGetAdminReviewsQuery(reviewStatusFilter === "all" ? undefined : reviewStatusFilter, { skip: !isAdmin });

  const pendingReviewCount = adminReviews?.filter((r: any) => r.status === "pending").length || 0;

  const [approveReviewLoading, setApproveReviewLoading] = useState(false);
  const [rejectReviewLoading, setRejectReviewLoading] = useState(false);
  const [deleteReviewLoading, setDeleteReviewLoading] = useState(false);

  const approveReview = {
    mutate: async (id: string) => {
      setApproveReviewLoading(true);
      try {
        await apiRequest("PATCH", `/api/admin/reviews/${id}/approve`);
        dispatch(rtkApi.util.invalidateTags(["Reviews"]));
        toast({ title: "Review approved" });
      } catch {
        toast({ title: "Failed to approve review", variant: "destructive" });
      } finally {
        setApproveReviewLoading(false);
      }
    },
    isPending: approveReviewLoading,
  };

  const rejectReview = {
    mutate: async (id: string) => {
      setRejectReviewLoading(true);
      try {
        await apiRequest("PATCH", `/api/admin/reviews/${id}/reject`);
        dispatch(rtkApi.util.invalidateTags(["Reviews"]));
        toast({ title: "Review rejected" });
      } catch {
        toast({ title: "Failed to reject review", variant: "destructive" });
      } finally {
        setRejectReviewLoading(false);
      }
    },
    isPending: rejectReviewLoading,
  };

  const deleteReview = {
    mutate: async (id: string) => {
      setDeleteReviewLoading(true);
      try {
        await apiRequest("DELETE", `/api/admin/reviews/${id}`);
        dispatch(rtkApi.util.invalidateTags(["Reviews"]));
        toast({ title: "Review deleted" });
      } catch {
        toast({ title: "Failed to delete review", variant: "destructive" });
      } finally {
        setDeleteReviewLoading(false);
      }
    },
    isPending: deleteReviewLoading,
  };

  const [editingReview, setEditingReview] = useState<ReviewWithAuthor | null>(null);

  const { data: adminPolls } = useGetAdminPollsQuery(undefined, { skip: !isAdmin });

  const { data: contactRequests } = useGetAdminContactRequestsQuery(undefined, { skip: !isAdmin });

  const { data: adminGroups } = useGetAdminGroupsQuery(undefined, { skip: !isAdmin });

  const [adminGroupEvents, setAdminGroupEvents] = useState<(GroupEvent & { authorName: string; groupName: string })[] | undefined>(undefined);
    useEffect(() => {
      if (!isAdmin) return;
      api.get("/api/admin/group-events").then(res => setAdminGroupEvents(res.data)).catch(() => {});
    }, [isAdmin]);

  const [editingGroupEvent, setEditingGroupEvent] = useState<(GroupEvent & { authorName: string; groupName: string }) | null>(null);
  const [viewingGroupEvent, setViewingGroupEvent] = useState<(GroupEvent & { authorName: string; groupName: string }) | null>(null);
  const [groupEventFilterGroup, setGroupEventFilterGroup] = useState<string>("all");
  const [groupTypeFilter, setGroupTypeFilter] = useState<string>("all");

  const [updateGroupEventLoading, setUpdateGroupEventLoading] = useState(false);
  const [deleteGroupEventLoading, setDeleteGroupEventLoading] = useState(false);

  const updateGroupEventMutation = {
    mutate: async ({ id, data }: { id: string; data: any }) => {
      setUpdateGroupEventLoading(true);
      try {
        await apiRequest("PUT", `/api/group-events/${id}`, data);
        dispatch(rtkApi.util.invalidateTags(["GroupEvents"]));
        setEditingGroupEvent(null);
        toast({ title: "Group event updated" });
        api.get("/api/admin/group-events").then(res => setAdminGroupEvents(res.data)).catch(() => {});
      } catch (error: any) {
        toast({ title: "Failed to update group event", description: error.message, variant: "destructive" });
      } finally {
        setUpdateGroupEventLoading(false);
      }
    },
    isPending: updateGroupEventLoading,
  };

  const deleteGroupEventMutation = {
    mutate: async (id: string) => {
      setDeleteGroupEventLoading(true);
      try {
        await apiRequest("DELETE", `/api/group-events/${id}`);
        dispatch(rtkApi.util.invalidateTags(["GroupEvents"]));
        toast({ title: "Group event deleted" });
        api.get("/api/admin/group-events").then(res => setAdminGroupEvents(res.data)).catch(() => {});
      } catch (error: any) {
        toast({ title: "Failed to delete group event", description: error.message, variant: "destructive" });
      } finally {
        setDeleteGroupEventLoading(false);
      }
    },
    isPending: deleteGroupEventLoading,
  };

  const { data: pendingCounts = {} } = useGetAdminGroupPendingCountsQuery(undefined, { skip: !isAdmin });

  const totalPendingGroupMembers = Object.values(pendingCounts).reduce((sum: number, count: any) => sum + count, 0);

  const { data: subscriptionPlans } = useGetAdminSubscriptionPlansQuery(undefined, { skip: !isSuperAdmin });

  const { data: stripeProducts } = useGetStripeProductsQuery(undefined, { skip: !isSuperAdmin });

  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionPlan | null>(null);
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    billingPeriod: "monthly" as "monthly" | "yearly" | "one-time",
    stripePriceId: "" as string | null,
    isActive: true,
    orderIndex: 0,
    featureEditorial: true,
    featureSuggestEvent: false,
    featureEventsStandard: false,
    featureEventsCompetitions: false,
    featureReviews: false,
    featureCommunities: false,
    featureConnections: false,
    featurePlay: false,
    featurePlayAddRequest: false,
  });

  const [createSubPlanTrigger, { isLoading: isCreatingSubPlan }] = useCreateSubscriptionPlanMutation();
  const [updateSubPlanTrigger, { isLoading: isUpdatingSubPlan }] = useUpdateSubscriptionPlanMutation();
  const [deleteSubPlanTrigger, { isLoading: isDeletingSubPlan }] = useDeleteSubscriptionPlanMutation();
  const [setDefaultSubPlanLoading, setSetDefaultSubPlanLoading] = useState(false);

  const createSubscriptionPlan = {
    mutate: (data: typeof subscriptionFormData) => {
      createSubPlanTrigger(data).unwrap()
        .then(() => {
          toast({ title: "Subscription plan created" });
          setShowSubscriptionForm(false);
          resetSubscriptionForm();
        })
        .catch(() => toast({ title: "Failed to create subscription plan", variant: "destructive" }));
    },
    isPending: isCreatingSubPlan,
  };

  const updateSubscriptionPlan = {
    mutate: ({ id, data }: { id: number; data: Partial<typeof subscriptionFormData> }) => {
      updateSubPlanTrigger({ id, body: data }).unwrap()
        .then(() => {
          toast({ title: "Subscription plan updated" });
          setEditingSubscription(null);
          resetSubscriptionForm();
        })
        .catch(() => toast({ title: "Failed to update subscription plan", variant: "destructive" }));
    },
    isPending: isUpdatingSubPlan,
  };

  const deleteSubscriptionPlan = {
    mutate: (id: number) => {
      deleteSubPlanTrigger(id).unwrap()
        .then(() => toast({ title: "Subscription plan deleted" }))
        .catch(() => toast({ title: "Failed to delete subscription plan", variant: "destructive" }));
    },
    isPending: isDeletingSubPlan,
  };

  const setDefaultSubscriptionPlan = {
    mutate: async (id: number) => {
      setSetDefaultSubPlanLoading(true);
      try {
        await apiRequest("POST", `/api/admin/subscription-plans/${id}/set-default`);
        dispatch(rtkApi.util.invalidateTags(["SubscriptionPlans"]));
        toast({ title: "Default subscription plan updated" });
      } catch {
        toast({ title: "Failed to set default subscription plan", variant: "destructive" });
      } finally {
        setSetDefaultSubPlanLoading(false);
      }
    },
    isPending: setDefaultSubPlanLoading,
  };

  const resetSubscriptionForm = () => {
    setSubscriptionFormData({
      name: "",
      slug: "",
      description: "",
      price: 0,
      billingPeriod: "monthly",
      stripePriceId: null,
      isActive: true,
      orderIndex: 0,
      featureEditorial: true,
      featureSuggestEvent: false,
      featureEventsStandard: false,
      featureEventsCompetitions: false,
      featureReviews: false,
      featureCommunities: false,
      featureConnections: false,
      featurePlay: false,
      featurePlayAddRequest: false,
    });
  };

  const router = useTenantRouter();
  
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlGroupId = searchParams.get('groupId');
  
  // Initialize tab from URL or based on permissions
  const getDefaultTab = () => {
    if (urlTab) return urlTab;
    if (isSuperAdmin) return "hero";
    if (canManageArticles) return "articles";
    if (canManageEvents) return "events";
    if (canManageReviews) return "reviews";
    if (canManagePosts) return "posts";
    if (canManageGroups) return "groups";
    return "articles";
  };
  
  const dataManagementTabs = ["hero", "categories", "event-categories", "review-categories", "profile-fields", "settings", "tips"];
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [dataManagementOpen, setDataManagementOpen] = useState(() => dataManagementTabs.includes(getDefaultTab()));
  const [helpGuideOpen, setHelpGuideOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(urlGroupId);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupFormData, setGroupFormData] = useState({ name: "", description: "", imageUrl: "", isActive: true, isPublic: false });
  
  // Update URL when tab changes (without groupId for non-groups tabs)
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (dataManagementTabs.includes(newTab)) {
      setDataManagementOpen(true);
    }
    if (newTab !== 'groups') {
      router.replace('/admin?tab=' + newTab);
    }
  };

  interface MembershipWithUser extends GroupMembership {
    userName: string;
    userEmail: string;
    profileImageUrl?: string | null;
  }

  const { data: pendingMemberships } = useGetAdminGroupPendingQuery(selectedGroupId!, { skip: !selectedGroupId });

  const { data: allGroupMembers } = useGetAdminGroupMembersQuery(selectedGroupId!, { skip: !selectedGroupId });

  const approvedMembers = allGroupMembers?.filter(m => m.status === "approved") || [];
  const pendingMembers = allGroupMembers?.filter(m => m.status === "pending") || [];
  
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  const [createGroupTrigger, { isLoading: isCreatingGroup }] = useCreateAdminGroupMutation();
  const [updateGroupLoading, setUpdateGroupLoading] = useState(false);
  const [deleteGroupLoading, setDeleteGroupLoading] = useState(false);
  const [approveMembershipLoading, setApproveMembershipLoading] = useState(false);
  const [rejectMembershipLoading, setRejectMembershipLoading] = useState(false);
  const [removeMembershipLoading, setRemoveMembershipLoading] = useState(false);
  const [deleteContactLoading, setDeleteContactLoading] = useState(false);

  const createGroup = {
    mutate: (data: { name: string; description: string; imageUrl: string; isActive: boolean; isPublic: boolean }) => {
      createGroupTrigger(data).unwrap()
        .then(() => {
          toast({ title: "Group created" });
          setShowGroupForm(false);
          setGroupFormData({ name: "", description: "", imageUrl: "", isActive: true, isPublic: false });
        })
        .catch(() => toast({ title: "Failed to create group", variant: "destructive" }));
    },
    isPending: isCreatingGroup,
  };

  const updateGroup = {
    mutate: async ({ id, data }: { id: string; data: Partial<Group> }) => {
      setUpdateGroupLoading(true);
      try {
        await apiRequest("PUT", `/api/admin/groups/${id}`, data);
        dispatch(rtkApi.util.invalidateTags(["Groups"]));
        toast({ title: "Group updated" });
        setEditingGroup(null);
      } catch {
        toast({ title: "Failed to update group", variant: "destructive" });
      } finally {
        setUpdateGroupLoading(false);
      }
    },
    isPending: updateGroupLoading,
  };

  const deleteGroup = {
    mutate: async (id: string) => {
      setDeleteGroupLoading(true);
      try {
        await apiRequest("DELETE", `/api/admin/groups/${id}`);
        dispatch(rtkApi.util.invalidateTags(["Groups"]));
        toast({ title: "Group deleted" });
      } catch {
        toast({ title: "Failed to delete group", variant: "destructive" });
      } finally {
        setDeleteGroupLoading(false);
      }
    },
    isPending: deleteGroupLoading,
  };

  const approveMembership = {
    mutate: async (id: string) => {
      setApproveMembershipLoading(true);
      try {
        await apiRequest("PATCH", `/api/admin/memberships/${id}/approve`);
        dispatch(rtkApi.util.invalidateTags(["GroupMembers", "Groups"]));
        toast({ title: "Membership approved" });
      } catch {
        toast({ title: "Failed to approve membership", variant: "destructive" });
      } finally {
        setApproveMembershipLoading(false);
      }
    },
    isPending: approveMembershipLoading,
  };

  const rejectMembership = {
    mutate: async (id: string) => {
      setRejectMembershipLoading(true);
      try {
        await apiRequest("PATCH", `/api/admin/memberships/${id}/reject`);
        dispatch(rtkApi.util.invalidateTags(["GroupMembers", "Groups"]));
        toast({ title: "Membership rejected" });
      } catch {
        toast({ title: "Failed to reject membership", variant: "destructive" });
      } finally {
        setRejectMembershipLoading(false);
      }
    },
    isPending: rejectMembershipLoading,
  };

  const removeMembership = {
    mutate: async (id: string) => {
      setRemoveMembershipLoading(true);
      try {
        await apiRequest("DELETE", `/api/admin/memberships/${id}`);
        dispatch(rtkApi.util.invalidateTags(["GroupMembers", "Groups"]));
        toast({ title: "Member removed from group" });
      } catch {
        toast({ title: "Failed to remove member", variant: "destructive" });
      } finally {
        setRemoveMembershipLoading(false);
      }
    },
    isPending: removeMembershipLoading,
  };

  const deleteContactRequest = {
    mutate: async (id: string) => {
      setDeleteContactLoading(true);
      try {
        await apiRequest("DELETE", `/api/admin/contact-requests/${id}`);
        dispatch(rtkApi.util.invalidateTags(["ContactRequests"]));
        toast({ title: "Contact request deleted" });
      } catch {
        toast({ title: "Failed to delete contact request", variant: "destructive" });
      } finally {
        setDeleteContactLoading(false);
      }
    },
    isPending: deleteContactLoading,
  };

  const markContactRequestRead = {
    mutate: async (id: string) => {
      try {
        await apiRequest("PATCH", `/api/admin/contact-requests/${id}/read`);
        dispatch(rtkApi.util.invalidateTags(["ContactRequests"]));
      } catch {}
    },
    isPending: false,
  };

  const [showPollForm, setShowPollForm] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [pollFormData, setPollFormData] = useState({
    title: "",
    imageUrl: "",
    options: ["", ""],
    optionImages: [null, null] as (string | null)[],
    article: "",
    pollType: "standard" as "standard" | "ranking" | "this_or_that",
    startDate: new Date().toISOString().slice(0, 16),
    durationHours: 24,
    boostedVotes: 0,
    isActive: true,
  });

  const resetPollForm = () => {
    setPollFormData({
      title: "",
      imageUrl: "",
      options: ["", ""],
      optionImages: [null, null],
      article: "",
      pollType: "standard",
      startDate: new Date().toISOString().slice(0, 16),
      durationHours: 24,
      boostedVotes: 0,
      isActive: true,
    });
    setEditingPoll(null);
    setShowPollForm(false);
  };

  const [createPollTrigger, { isLoading: isCreatingPoll }] = useCreatePollMutation();
  const [updatePollLoading, setUpdatePollLoading] = useState(false);
  const [deletePollLoading, setDeletePollLoading] = useState(false);
  const [updateReviewLoading, setUpdateReviewLoading] = useState(false);

  const createPoll = {
    mutate: (data: { title: string; imageUrl: string; options: string[]; optionImages: (string | null)[]; article: string; pollType: string; startDate: Date; durationHours: number; boostedVotes: number; isActive: boolean }) => {
      createPollTrigger(data).unwrap()
        .then(() => {
          toast({ title: "Poll created" });
          resetPollForm();
        })
        .catch(() => toast({ title: "Failed to create poll", variant: "destructive" }));
    },
    isPending: isCreatingPoll,
  };

  const updatePoll = {
    mutate: async ({ id, data }: { id: string; data: Partial<Poll> }) => {
      setUpdatePollLoading(true);
      try {
        await apiRequest("PUT", `/api/admin/polls/${id}`, data);
        dispatch(rtkApi.util.invalidateTags(["Polls"]));
        toast({ title: "Poll updated" });
        resetPollForm();
      } catch {
        toast({ title: "Failed to update poll", variant: "destructive" });
      } finally {
        setUpdatePollLoading(false);
      }
    },
    isPending: updatePollLoading,
  };

  const deletePoll = {
    mutate: async (id: string) => {
      setDeletePollLoading(true);
      try {
        await apiRequest("DELETE", `/api/admin/polls/${id}`);
        dispatch(rtkApi.util.invalidateTags(["Polls"]));
        toast({ title: "Poll deleted" });
      } catch {
        toast({ title: "Failed to delete poll", variant: "destructive" });
      } finally {
        setDeletePollLoading(false);
      }
    },
    isPending: deletePollLoading,
  };

  const updateReview = {
    mutate: async ({ id, data }: { id: string; data: Partial<ReviewWithAuthor> }) => {
      setUpdateReviewLoading(true);
      try {
        await apiRequest("PATCH", `/api/admin/reviews/${id}`, data);
        dispatch(rtkApi.util.invalidateTags(["Reviews"]));
        toast({ title: "Review updated" });
        setEditingReview(null);
      } catch {
        toast({ title: "Failed to update review", variant: "destructive" });
      } finally {
        setUpdateReviewLoading(false);
      }
    },
    isPending: updateReviewLoading,
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This page is restricted to administrators only.
            </p>
            {!isAuthenticated ? (
              <Link href="/signin">
                <Button data-testid="button-admin-signin">Sign In</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="outline" data-testid="button-go-home">Go Home</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEO 
        title="Admin Panel"
        description="Manage MumblesVibe content, users, and settings."
        noIndex={true}
      />
      <div className="flex">
        <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="flex w-full">
          <div className="w-64 min-h-screen border-r bg-muted/30 p-4 shrink-0">
            <h1 className="text-xl font-bold mb-6 px-2">Admin Panel</h1>
            <TabsList className="flex flex-col h-auto w-full bg-transparent gap-1">
              {(isSuperAdmin || canManageArticles) && (
                <TabsTrigger value="articles" data-testid="tab-articles" className="w-full justify-start px-3 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Articles ({articles?.length || 0})
                </TabsTrigger>
              )}
              {isSuperAdmin && (
                <TabsTrigger value="podcasts" data-testid="tab-podcasts" className="w-full justify-start px-3 py-2">
                  <FaMicrophone className="h-4 w-4 mr-2" />
                  Podcasts ({adminPodcasts?.length || 0})
                </TabsTrigger>
              )}
              {(isSuperAdmin || canManageEvents) && (
                <TabsTrigger value="events" data-testid="tab-events" className="w-full justify-start px-3 py-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Events ({events?.length || 0})
                </TabsTrigger>
              )}
              {(isSuperAdmin || canManageEvents) && (
                <TabsTrigger value="suggestions" data-testid="tab-suggestions" className="w-full justify-start px-3 py-2">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Event Suggestions ({eventSuggestions?.length || 0})
                </TabsTrigger>
              )}
              {(isSuperAdmin || canManageGroups) && (
                <TabsTrigger value="groups" data-testid="tab-groups" className="w-full justify-start px-3 py-2">
                  <Lock className="h-4 w-4 mr-2" />
                  Groups {totalPendingGroupMembers > 0 && `(${totalPendingGroupMembers})`}
                </TabsTrigger>
              )}
              {(isSuperAdmin || canManageEvents) && (
                <TabsTrigger value="group-events" data-testid="tab-group-events" className="w-full justify-start px-3 py-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Group Events
                </TabsTrigger>
              )}
              {(isSuperAdmin || canManageReviews) && (
                <TabsTrigger value="reviews" data-testid="tab-reviews" className="w-full justify-start px-3 py-2">
                  <Star className="h-4 w-4 mr-2" />
                  Reviews {pendingReviewCount > 0 && `(${pendingReviewCount})`}
                </TabsTrigger>
              )}
              {isSuperAdmin && (
                <TabsTrigger value="polls" data-testid="tab-polls" className="w-full justify-start px-3 py-2">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Polls ({adminPolls?.length || 0})
                </TabsTrigger>
              )}
              {(isSuperAdmin || canManagePosts) && (
                <TabsTrigger value="posts" data-testid="tab-posts" className="w-full justify-start px-3 py-2">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Posts ({adminVibes?.length || 0})
                </TabsTrigger>
              )}
              {isSuperAdmin && (
                <TabsTrigger value="play-requests" data-testid="tab-play-requests" className="w-full justify-start px-3 py-2">
                  <Handshake className="h-4 w-4 mr-2" />
                  Play Requests ({adminPlayRequests?.length || 0})
                </TabsTrigger>
              )}
              {isSuperAdmin && (
                <TabsTrigger value="tee-times" data-testid="tab-tee-times" className="w-full justify-start px-3 py-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Tee Times ({adminTeeTimeOffers?.length || 0})
                </TabsTrigger>
              )}
              {isSuperAdmin && (
                <TabsTrigger value="users" data-testid="tab-users" className="w-full justify-start px-3 py-2">
                  <Users className="h-4 w-4 mr-2" />
                  Users ({registeredUsers?.length || 0})
                </TabsTrigger>
              )}
              {isSuperAdmin && (
                <TabsTrigger value="subscribers" data-testid="tab-subscribers" className="w-full justify-start px-3 py-2">
                  <Mail className="h-4 w-4 mr-2" />
                  Newsletter Subscribers ({subscribers?.length || 0})
                </TabsTrigger>
              )}
              {isSuperAdmin && (
                <TabsTrigger value="contact" data-testid="tab-contact" className="w-full justify-start px-3 py-2">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact ({contactRequests?.filter(r => !r.isRead).length || 0})
                </TabsTrigger>
              )}
            </TabsList>

            {isSuperAdmin && (
              <div className="mt-4 border-t pt-4">
                <button
                  onClick={() => setDataManagementOpen(!dataManagementOpen)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-data-management-toggle"
                >
                  <Database className="h-4 w-4" />
                  Data Management
                  {dataManagementOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
                </button>
                {dataManagementOpen && (
                  <TabsList className="flex flex-col h-auto w-full bg-transparent gap-1 mt-1 pl-2">
                    <TabsTrigger value="subscriptions" data-testid="tab-subscriptions" className="w-full justify-start px-3 py-2">
                      <Star className="h-4 w-4 mr-2" />
                      Subscriptions ({subscriptionPlans?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="hero" data-testid="tab-hero" className="w-full justify-start px-3 py-2">
                      <Home className="h-4 w-4 mr-2" />
                      Homepage Hero
                    </TabsTrigger>
                    <TabsTrigger value="categories" data-testid="tab-categories" className="w-full justify-start px-3 py-2">
                      <FileText className="h-4 w-4 mr-2" />
                      Article Categories ({articleCategoriesData?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="event-categories" data-testid="tab-event-categories" className="w-full justify-start px-3 py-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      Event Categories ({eventCategoriesData?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="review-categories" data-testid="tab-review-categories" className="w-full justify-start px-3 py-2">
                      <Star className="h-4 w-4 mr-2" />
                      Review Categories ({reviewCategoriesData?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="profile-fields" data-testid="tab-profile-fields" className="w-full justify-start px-3 py-2">
                      <FileText className="h-4 w-4 mr-2" />
                      User Profile Fields ({profileFieldsData?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="settings" data-testid="tab-settings" className="w-full justify-start px-3 py-2">
                      <Settings className="h-4 w-4 mr-2" />
                      Site Settings
                    </TabsTrigger>
                  </TabsList>
                )}
              </div>
            )}

            {isSuperAdmin && (
              <div className="mt-4 border-t pt-4 space-y-1">
                <button
                  onClick={() => setHelpGuideOpen(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                  data-testid="button-admin-help"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help Guide
                </button>
                <Link
                  href="/tenants"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                  data-testid="link-tenant-management"
                >
                  <Globe className="h-4 w-4" />
                  Tenant Management
                </Link>
              </div>
            )}
            <AdminHelpGuide open={helpGuideOpen} onOpenChange={setHelpGuideOpen} />
          </div>
          
          <div className="flex-1 p-6 overflow-auto">

          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Homepage Hero Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateHeroSettings.mutate({
                      title: heroFormData.title,
                      subtitle: heroFormData.subtitle,
                      imageUrl: heroFormData.imageUrl,
                      ctaText: heroFormData.ctaText,
                      ctaLink: heroFormData.ctaLink,
                    });
                  }}
                >
                  <div>
                    <label className="text-sm font-medium">Hero Title</label>
                    <Input
                      placeholder={heroSettings?.title}
                      value={heroFormData.title}
                      onChange={(e) => setHeroFormData({ ...heroFormData, title: e.target.value })}
                      data-testid="input-hero-title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hero Subtitle</label>
                    <Input
                      placeholder={heroSettings?.subtitle}
                      value={heroFormData.subtitle}
                      onChange={(e) => setHeroFormData({ ...heroFormData, subtitle: e.target.value })}
                      data-testid="input-hero-subtitle"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hero Background Image</label>
                    <ImageUpload
                      value={heroFormData.imageUrl || heroSettings?.imageUrl || ""}
                      onChange={(url) => setHeroFormData({ ...heroFormData, imageUrl: url })}
                      testId="input-hero-image"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">CTA Button Text</label>
                      <Input
                        placeholder={heroSettings?.ctaText}
                        value={heroFormData.ctaText}
                        onChange={(e) => setHeroFormData({ ...heroFormData, ctaText: e.target.value })}
                        data-testid="input-hero-cta-text"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CTA Button Link</label>
                      <Input
                        placeholder={heroSettings?.ctaLink}
                        value={heroFormData.ctaLink}
                        onChange={(e) => setHeroFormData({ ...heroFormData, ctaLink: e.target.value })}
                        data-testid="input-hero-cta-link"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={updateHeroSettings.isPending} data-testid="button-save-hero">
                    {updateHeroSettings.isPending ? "Saving..." : "Save Hero Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Manage Articles</CardTitle>
                <Dialog open={isAddingArticle} onOpenChange={setIsAddingArticle}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-article">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Article
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle>Add New Article</DialogTitle>
                    </DialogHeader>
                    <ArticleForm
                      onSave={(data, sections) => createArticle.mutate({ data, sections })}
                      onCancel={() => setIsAddingArticle(false)}
                      categories={articleCategoriesData}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {articlesLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <div className="space-y-4">
                    {articles?.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between gap-4 p-4 border rounded-md"
                        data-testid={`article-row-${article.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{article.title}</h3>
                            <Badge variant="secondary">{article.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{article.excerpt}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Dialog open={editingArticle?.id === article.id} onOpenChange={(open) => !open && setEditingArticle(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setEditingArticle(article)}
                                data-testid={`button-edit-article-${article.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                              <DialogHeader>
                                <DialogTitle>Edit Article</DialogTitle>
                              </DialogHeader>
                              <ArticleForm
                                article={editingArticle!}
                                onSave={(data, sections) => updateArticle.mutate({ id: article.id, data, sections })}
                                onCancel={() => setEditingArticle(null)}
                                categories={articleCategoriesData}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => showConfirm("Delete Article", "Are you sure you want to delete this article?", () => deleteArticle.mutate(article.id), { variant: "destructive", confirmText: "Delete" })}
                            data-testid={`button-delete-article-${article.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Article Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1"
                      data-testid="input-new-category"
                    />
                    <IconPicker
                      value={newCategoryIcon}
                      onChange={setNewCategoryIcon}
                    />
                    <Button
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          createCategory.mutate({ name: newCategoryName.trim(), icon: newCategoryIcon.trim() || undefined });
                          setNewCategoryName("");
                          setNewCategoryIcon("");
                        }
                      }}
                      disabled={!newCategoryName.trim() || createCategory.isPending}
                      data-testid="button-add-category"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {categoriesLoading ? (
                    <p className="text-muted-foreground">Loading categories...</p>
                  ) : !articleCategoriesData || articleCategoriesData.length === 0 ? (
                    <p className="text-muted-foreground">No categories yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...articleCategoriesData].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((category, index, sortedArr) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                          data-testid={`category-row-${category.id}`}
                        >
                          {editingCategory?.id === category.id ? (
                            <div className="flex gap-2 flex-1 items-center">
                              <Input
                                value={editingCategory.name}
                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                placeholder="Name"
                                className="flex-1"
                                data-testid="input-edit-category"
                              />
                              <IconPicker
                                value={editingCategory.icon || ""}
                                onChange={(icon) => setEditingCategory({ ...editingCategory, icon })}
                              />
                              <Button
                                size="sm"
                                onClick={() => updateCategory.mutate({ id: category.id, name: editingCategory.name, icon: editingCategory.icon || undefined })}
                                disabled={!editingCategory.name.trim() || updateCategory.isPending}
                                data-testid="button-save-category"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCategory(null)}
                                data-testid="button-cancel-edit-category"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => moveArticleCategory(index, 'up')}
                                    disabled={index === 0 || reorderArticleCategories.isPending}
                                    data-testid={`button-move-up-category-${category.id}`}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => moveArticleCategory(index, 'down')}
                                    disabled={index === sortedArr.length - 1 || reorderArticleCategories.isPending}
                                    data-testid={`button-move-down-category-${category.id}`}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                {(() => {
                                  const iconData = allIcons.find(i => i.name === category.icon);
                                  const IconComp = iconData?.icon || FaFolder;
                                  return <IconComp className="h-4 w-4 text-muted-foreground" />;
                                })()}
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingCategory(category)}
                                  data-testid={`button-edit-category-${category.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    showConfirm("Delete Category", "Are you sure you want to delete this category?", () => deleteCategory.mutate(category.id), { variant: "destructive", confirmText: "Delete" })
                                  }}
                                  data-testid={`button-delete-category-${category.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="podcasts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Manage Podcasts</CardTitle>
                <Dialog open={isAddingPodcast} onOpenChange={setIsAddingPodcast}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-podcast">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Podcast
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Podcast</DialogTitle>
                      <DialogDescription>Create a new podcast or live stream entry.</DialogDescription>
                    </DialogHeader>
                    <PodcastForm
                      onSave={(data) => createPodcast.mutate(data)}
                      onCancel={() => setIsAddingPodcast(false)}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {podcastsLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <div className="space-y-4">
                    {adminPodcasts?.map((podcast) => (
                      <div
                        key={podcast.id}
                        className="flex items-center justify-between gap-4 p-4 border rounded-md"
                        data-testid={`podcast-row-${podcast.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{podcast.title}</h3>
                            <Badge variant={podcast.isActive ? "default" : "secondary"}>
                              {podcast.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {podcast.mediaType && (
                              <Badge variant="outline">{podcast.mediaType}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{podcast.excerpt}</p>
                          <p className="text-xs text-muted-foreground">By {podcast.author} · {podcast.publishedAt}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Dialog open={editingPodcast?.id === podcast.id} onOpenChange={(open) => !open && setEditingPodcast(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setEditingPodcast(podcast)}
                                data-testid={`button-edit-podcast-${podcast.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Podcast</DialogTitle>
                                <DialogDescription>Update this podcast or live stream entry.</DialogDescription>
                              </DialogHeader>
                              <PodcastForm
                                podcast={editingPodcast!}
                                onSave={(data) => updatePodcast.mutate({ id: podcast.id, data })}
                                onCancel={() => setEditingPodcast(null)}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => showConfirm("Delete Podcast", "Are you sure you want to delete this podcast?", () => deletePodcast.mutate(podcast.id), { variant: "destructive", confirmText: "Delete" })}
                            data-testid={`button-delete-podcast-${podcast.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!adminPodcasts || adminPodcasts.length === 0) && (
                      <p className="text-muted-foreground text-center py-8">No podcasts yet. Click "Add Podcast" to get started.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Manage Events</CardTitle>
                <Dialog open={isAddingEvent} onOpenChange={(open) => {
                  setIsAddingEvent(open);
                  if (!open) setNewEventType(null);
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-event">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{newEventType ? `Add New ${newEventType === "standard" ? "Social Event" : newEventType === "knockout" ? "Knockout Competition" : "Competition"}` : "Select Event Type"}</DialogTitle>
                    </DialogHeader>
                    {!newEventType ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">What type of event would you like to create?</p>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="h-auto py-6 flex flex-col gap-2"
                            onClick={() => setNewEventType("standard")}
                            data-testid="button-select-standard-event"
                          >
                            <Calendar className="h-8 w-8" />
                            <span className="font-medium">Social Event</span>
                            <span className="text-xs text-muted-foreground">Regular event or activity</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-auto py-6 flex flex-col gap-2"
                            onClick={() => setNewEventType("knockout")}
                            data-testid="button-select-knockout-event"
                          >
                            <Trophy className="h-8 w-8" />
                            <span className="font-medium">Knockout Competition</span>
                            <span className="text-xs text-muted-foreground">Competition with entries & fees</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-auto py-6 flex flex-col gap-2"
                            onClick={() => setNewEventType("team_competition")}
                            data-testid="button-select-team-competition-event"
                          >
                            <Users className="h-8 w-8" />
                            <span className="font-medium">Competition</span>
                            <span className="text-xs text-muted-foreground">Score based competitions</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <EventForm
                        onSave={(data) => createEvent.mutate(data)}
                        onCancel={() => setIsAddingEvent(false)}
                        eventType={newEventType}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (() => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const currentEvents = (events || []).filter(e => {
                    const eventDate = new Date(e.endDate || e.startDate);
                    return eventDate >= now;
                  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                  const pastEvents = (events || []).filter(e => {
                    const eventDate = new Date(e.endDate || e.startDate);
                    return eventDate < now;
                  }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

                  const renderEventRow = (event: Event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between gap-4 p-4 border rounded-md"
                      data-testid={`event-row-${event.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">{event.name}</h3>
                          {event.eventType === "knockout" && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                              <Trophy className="h-3 w-3 mr-1" />
                              Knockout Competition
                            </Badge>
                          )}
                          {event.eventType === "team_competition" && (
                            <Badge variant="secondary" className={event.teamSize && event.teamSize > 1 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"}>
                              <Users className="h-3 w-3 mr-1" />
                              {event.teamSize && event.teamSize > 1 ? "Team Competition" : "Competition"}
                            </Badge>
                          )}
                          {event.eventType === "individual_competition" && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              <UserIcon className="h-3 w-3 mr-1" />
                              Individual Competition
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.startDate} | {event.venueName}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {(event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition") && (
                          <Dialog onOpenChange={(open) => {
                            if (open) {
                              const currentCount = Number((event as any).currentEntries) || 0;
                              const lastSeen = (event as any).adminLastSeenEntrantCount || 0;
                              if (currentCount > lastSeen) {
                                apiRequest("PATCH", `/api/events/${event.id}/mark-entrants-seen`).then(() => {
                                  dispatch(rtkApi.util.invalidateTags(["Events"]));
                                });
                              }
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="relative"
                                data-testid={`button-view-entrants-${event.id}`}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                Entrants
                                {(() => {
                                  const currentCount = Number((event as any).currentEntries) || 0;
                                  const lastSeen = (event as any).adminLastSeenEntrantCount || 0;
                                  const unseen = currentCount - lastSeen;
                                  if (unseen > 0) {
                                    return (
                                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1" data-testid={`badge-new-entrants-${event.id}`}>
                                        {unseen}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[90vw] max-w-[90vw] max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {event.eventType === "knockout" ? (
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                  ) : (
                                    <Users className="h-5 w-5 text-green-500" />
                                  )}
                                  Competition Entrants - {event.name}
                                </DialogTitle>
                                <DialogDescription>
                                  {event.maxEntries ? `${event.maxEntries} max spaces` : 'No limit set'}
                                  {event.entryFee && ` | Entry fee: £${Number(event.entryFee).toFixed(2)}`}
                                </DialogDescription>
                              </DialogHeader>
                              <EventEntrantsView eventId={event.id} event={event} />
                            </DialogContent>
                          </Dialog>
                        )}
                        {(event.eventType === "standard" || event.eventType === "social" || !event.eventType) && (
                          <EventAttendeesButton eventId={event.id} eventName={event.name} />
                        )}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={event.isFeatured ?? false}
                            onCheckedChange={(checked) => toggleEventFeatured.mutate({ id: event.id, isFeatured: checked })}
                            disabled={toggleEventFeatured.isPending}
                            data-testid={`switch-featured-${event.id}`}
                          />
                          <span className="text-sm text-muted-foreground">Featured</span>
                        </div>
                        <Dialog open={editingEvent?.id === event.id} onOpenChange={(open) => !open && setEditingEvent(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingEvent(event)}
                              data-testid={`button-edit-event-${event.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Event</DialogTitle>
                            </DialogHeader>
                            {editingEvent?.id === event.id && (
                              <EventForm
                                event={editingEvent}
                                onSave={(data) => updateEvent.mutate({ id: event.id, data })}
                                onCancel={() => setEditingEvent(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            showConfirm("Delete Event", "Are you sure you want to delete this event?", () => deleteEvent.mutate(event.id), { variant: "destructive", confirmText: "Delete" })
                          }}
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );

                  return (
                    <Tabs defaultValue="current" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="current" data-testid="tab-current-events">
                          Upcoming Events ({currentEvents.length})
                        </TabsTrigger>
                        <TabsTrigger value="past" data-testid="tab-past-events">
                          Past Events ({pastEvents.length})
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="current">
                        {currentEvents.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">No current or upcoming events</p>
                        ) : (
                          <div className="space-y-4">
                            {currentEvents.map(renderEventRow)}
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="past">
                        {pastEvents.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">No past events</p>
                        ) : (
                          <div className="space-y-4">
                            {pastEvents.map(renderEventRow)}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="event-categories">
            <Card>
              <CardHeader>
                <CardTitle>Event Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Category name"
                      value={newEventCategoryName}
                      onChange={(e) => setNewEventCategoryName(e.target.value)}
                      className="flex-1"
                      data-testid="input-new-event-category"
                    />
                    <IconPicker
                      value={newEventCategoryIcon}
                      onChange={setNewEventCategoryIcon}
                    />
                    <Button
                      onClick={() => {
                        if (newEventCategoryName.trim()) {
                          createEventCategory.mutate({ name: newEventCategoryName.trim(), icon: newEventCategoryIcon.trim() || undefined });
                        }
                      }}
                      disabled={!newEventCategoryName.trim() || createEventCategory.isPending}
                      data-testid="button-add-event-category"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {eventCategoriesLoading ? (
                    <p className="text-muted-foreground">Loading categories...</p>
                  ) : !eventCategoriesData || eventCategoriesData.length === 0 ? (
                    <p className="text-muted-foreground">No event categories yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...eventCategoriesData].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((category, index, sortedArr) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                          data-testid={`event-category-row-${category.id}`}
                        >
                          {editingEventCategory?.id === category.id ? (
                            <div className="flex gap-2 flex-1 items-center">
                              <Input
                                value={editingEventCategory.name}
                                onChange={(e) => setEditingEventCategory({ ...editingEventCategory, name: e.target.value })}
                                placeholder="Name"
                                className="flex-1"
                                data-testid="input-edit-event-category"
                              />
                              <IconPicker
                                value={editingEventCategory.icon || ""}
                                onChange={(icon) => setEditingEventCategory({ ...editingEventCategory, icon })}
                              />
                              <Button
                                size="sm"
                                onClick={() => updateEventCategory.mutate({ id: category.id, name: editingEventCategory.name, icon: editingEventCategory.icon || undefined })}
                                disabled={!editingEventCategory.name.trim() || updateEventCategory.isPending}
                                data-testid="button-save-event-category"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingEventCategory(null)}
                                data-testid="button-cancel-edit-event-category"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => moveEventCategory(index, 'up')}
                                    disabled={index === 0 || reorderEventCategories.isPending}
                                    data-testid={`button-move-up-event-category-${category.id}`}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => moveEventCategory(index, 'down')}
                                    disabled={index === sortedArr.length - 1 || reorderEventCategories.isPending}
                                    data-testid={`button-move-down-event-category-${category.id}`}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                {(() => {
                                  const iconData = allIcons.find(i => i.name === category.icon);
                                  const IconComp = iconData?.icon || FaFolder;
                                  return <IconComp className="h-4 w-4 text-muted-foreground" />;
                                })()}
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingEventCategory(category)}
                                  data-testid={`button-edit-event-category-${category.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    showConfirm("Delete Category", "Are you sure you want to delete this event category?", () => deleteEventCategory.mutate(category.id), { variant: "destructive", confirmText: "Delete" })
                                  }}
                                  data-testid={`button-delete-event-category-${category.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review-categories">
            <Card>
              <CardHeader>
                <CardTitle>Review Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Category name"
                      value={newReviewCategoryName}
                      onChange={(e) => setNewReviewCategoryName(e.target.value)}
                      className="flex-1"
                      data-testid="input-new-review-category"
                    />
                    <IconPicker
                      value={newReviewCategoryIcon}
                      onChange={setNewReviewCategoryIcon}
                    />
                    <Button
                      onClick={() => {
                        if (newReviewCategoryName.trim()) {
                          createReviewCategory.mutate({ name: newReviewCategoryName.trim(), icon: newReviewCategoryIcon.trim() || undefined });
                        }
                      }}
                      disabled={!newReviewCategoryName.trim() || createReviewCategory.isPending}
                      data-testid="button-add-review-category"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {reviewCategoriesLoading ? (
                    <p className="text-muted-foreground">Loading categories...</p>
                  ) : !reviewCategoriesData || reviewCategoriesData.length === 0 ? (
                    <p className="text-muted-foreground">No review categories yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...reviewCategoriesData].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((category, index, sortedArr) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                          data-testid={`review-category-row-${category.id}`}
                        >
                          {editingReviewCategory?.id === category.id ? (
                            <div className="flex gap-2 flex-1 items-center">
                              <Input
                                value={editingReviewCategory.name}
                                onChange={(e) => setEditingReviewCategory({ ...editingReviewCategory, name: e.target.value })}
                                placeholder="Name"
                                className="flex-1"
                                data-testid="input-edit-review-category"
                              />
                              <IconPicker
                                value={editingReviewCategory.icon || ""}
                                onChange={(icon) => setEditingReviewCategory({ ...editingReviewCategory, icon })}
                              />
                              <Button
                                size="sm"
                                onClick={() => updateReviewCategory.mutate({ id: category.id, name: editingReviewCategory.name, icon: editingReviewCategory.icon || undefined })}
                                disabled={!editingReviewCategory.name.trim() || updateReviewCategory.isPending}
                                data-testid="button-save-review-category"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingReviewCategory(null)}
                                data-testid="button-cancel-edit-review-category"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => moveReviewCategory(index, 'up')}
                                    disabled={index === 0 || reorderReviewCategories.isPending}
                                    data-testid={`button-move-up-review-category-${category.id}`}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => moveReviewCategory(index, 'down')}
                                    disabled={index === sortedArr.length - 1 || reorderReviewCategories.isPending}
                                    data-testid={`button-move-down-review-category-${category.id}`}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                {(() => {
                                  const iconData = allIcons.find(i => i.name === category.icon);
                                  const IconComp = iconData?.icon || FaFolder;
                                  return <IconComp className="h-4 w-4 text-muted-foreground" />;
                                })()}
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingReviewCategory(category)}
                                  data-testid={`button-edit-review-category-${category.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    showConfirm("Delete Category", "Are you sure you want to delete this review category?", () => deleteReviewCategory.mutate(category.id), { variant: "destructive", confirmText: "Delete" })
                                  }}
                                  data-testid={`button-delete-review-category-${category.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                {subscribers?.length === 0 ? (
                  <p className="text-muted-foreground">No subscribers yet.</p>
                ) : (
                  <div className="space-y-2">
                    {subscribers?.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-4 p-3 border rounded-md"
                        data-testid={`subscriber-row-${sub.id}`}
                      >
                        <span className="font-medium">{sub.email}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(sub.subscribedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="play-requests">
            <Card>
              <CardHeader>
                <CardTitle>Play Requests</CardTitle>
                <p className="text-sm text-muted-foreground">Manage all play requests submitted by users</p>
              </CardHeader>
              <CardContent>
                {playRequestsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !adminPlayRequests?.length ? (
                  <p className="text-center text-muted-foreground py-8">No play requests found</p>
                ) : (
                  <div className="space-y-3">
                    {adminPlayRequests.map((request: any) => (
                      <div key={request.id} className="flex items-start justify-between gap-4 p-4 border rounded-md" data-testid={`play-request-row-${request.id}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{request.requesterProfile?.mumblesVibeName || "Unknown User"}</h3>
                            <Badge variant={request.status === "active" ? "default" : "secondary"}>{request.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.requesterProfile?.email}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(request.startDate).toLocaleDateString()}
                            </span>
                            {request.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {request.startTime}
                              </span>
                            )}
                          </div>
                          {request.guests?.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">Guests: {request.guests.join(", ")}</p>
                          )}
                          {request.message && (
                            <p className="text-sm mt-1 text-muted-foreground italic">"{request.message}"</p>
                          )}
                          {request.criteria?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {request.criteria.map((c: any) => (
                                <Badge key={c.id} variant="outline" className="text-xs">{c.fieldLabel}: {c.value}</Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Created: {new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => showConfirm(
                            "Delete Play Request",
                            `Are you sure you want to delete this play request from ${request.requesterProfile?.mumblesVibeName || "Unknown"}? This action cannot be undone.`,
                            () => deleteAdminPlayRequest.mutate(request.id),
                            { variant: "destructive", confirmText: "Delete" }
                          )}
                          disabled={deleteAdminPlayRequest.isPending}
                          data-testid={`button-delete-play-request-${request.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tee-times">
            <Card>
              <CardHeader>
                <CardTitle>Tee Time Offers</CardTitle>
                <p className="text-sm text-muted-foreground">Manage all tee time offers submitted by users</p>
              </CardHeader>
              <CardContent>
                {teeTimeOffersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !adminTeeTimeOffers?.length ? (
                  <p className="text-center text-muted-foreground py-8">No tee time offers found</p>
                ) : (
                  <div className="space-y-3">
                    {adminTeeTimeOffers.map((offer: any) => (
                      <div key={offer.id} className="flex items-start justify-between gap-4 p-4 border rounded-md" data-testid={`tee-time-row-${offer.id}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{offer.creator?.mumblesVibeName || "Unknown User"}</h3>
                            <Badge variant={offer.status === "active" ? "default" : "secondary"}>{offer.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{offer.creator?.email}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(offer.dateTime).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(offer.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                            {offer.homeClub && <span>Club: {offer.homeClub}</span>}
                            {offer.pricePerPerson != null && <span>Price: £{offer.pricePerPerson}</span>}
                            <span>Spots: {offer.availableSpots}/{offer.originalSpots}</span>
                          </div>
                          {offer.message && (
                            <p className="text-sm mt-1 text-muted-foreground italic">"{offer.message}"</p>
                          )}
                          {offer.criteria?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {offer.criteria.map((c: any) => (
                                <Badge key={c.id} variant="outline" className="text-xs">{c.fieldLabel || `Field ${c.fieldId}`}: {c.value}</Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Created: {new Date(offer.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => showConfirm(
                            "Delete Tee Time Offer",
                            `Are you sure you want to delete this tee time offer from ${offer.creator?.mumblesVibeName || "Unknown"}? This action cannot be undone.`,
                            () => deleteAdminTeeTimeOffer.mutate(offer.id),
                            { variant: "destructive", confirmText: "Delete" }
                          )}
                          disabled={deleteAdminTeeTimeOffer.isPending}
                          data-testid={`button-delete-tee-time-${offer.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Registered Users</CardTitle>
                {isSuperAdmin && (
                <Dialog open={showCreateAdminDialog} onOpenChange={(open) => {
                  setShowCreateAdminDialog(open);
                  if (!open) {
                    setNewAdminData({
                      email: "",
                      password: "",
                      mumblesVibeName: "",
                      isSuperAdmin: false,
                      adminArticles: false,
                      adminEvents: false,
                      adminReviews: false,
                      adminPosts: false,
                      adminGroups: false,
                      adminPodcasts: false,
                    });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-admin">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Admin User</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        createAdminUser.mutate(newAdminData);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-sm font-medium">Username</label>
                        <Input
                          value={newAdminData.mumblesVibeName}
                          onChange={(e) => setNewAdminData({ ...newAdminData, mumblesVibeName: e.target.value })}
                          placeholder="Enter username"
                          required
                          data-testid="input-admin-username"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          value={newAdminData.email}
                          onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                          placeholder="Enter email"
                          required
                          data-testid="input-admin-email"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Password</label>
                        <Input
                          type="password"
                          value={newAdminData.password}
                          onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                          placeholder="Enter password"
                          required
                          data-testid="input-admin-password"
                        />
                      </div>
                      <div className="space-y-3 pt-2 border-t">
                        <label className="text-sm font-medium">Admin Permissions</label>
                        <div className="flex items-center justify-between">
                          <label htmlFor="superAdmin" className="text-sm font-medium text-primary">Super Admin</label>
                          <Switch
                            id="superAdmin"
                            checked={newAdminData.isSuperAdmin}
                            onCheckedChange={(checked) => setNewAdminData({
                              ...newAdminData,
                              isSuperAdmin: checked,
                              adminArticles: checked ? true : newAdminData.adminArticles,
                              adminEvents: checked ? true : newAdminData.adminEvents,
                              adminReviews: checked ? true : newAdminData.adminReviews,
                              adminPosts: checked ? true : newAdminData.adminPosts,
                              adminGroups: checked ? true : newAdminData.adminGroups,
                              adminPodcasts: checked ? true : newAdminData.adminPodcasts,
                            })}
                            data-testid="switch-super-admin"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Super Admin has access to all admin features</p>
                        
                        <div className="space-y-2 pl-4 border-l-2 border-muted">
                          <div className="flex items-center justify-between">
                            <label htmlFor="adminArticles" className="text-sm">Articles</label>
                            <Switch
                              id="adminArticles"
                              checked={newAdminData.adminArticles}
                              onCheckedChange={(checked) => setNewAdminData({ ...newAdminData, adminArticles: checked })}
                              disabled={newAdminData.isSuperAdmin}
                              data-testid="switch-admin-articles"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="adminEvents" className="text-sm">Events</label>
                            <Switch
                              id="adminEvents"
                              checked={newAdminData.adminEvents}
                              onCheckedChange={(checked) => setNewAdminData({ ...newAdminData, adminEvents: checked })}
                              disabled={newAdminData.isSuperAdmin}
                              data-testid="switch-admin-events"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="adminReviews" className="text-sm">Reviews</label>
                            <Switch
                              id="adminReviews"
                              checked={newAdminData.adminReviews}
                              onCheckedChange={(checked) => setNewAdminData({ ...newAdminData, adminReviews: checked })}
                              disabled={newAdminData.isSuperAdmin}
                              data-testid="switch-admin-reviews"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="adminPosts" className="text-sm">Posts</label>
                            <Switch
                              id="adminPosts"
                              checked={newAdminData.adminPosts}
                              onCheckedChange={(checked) => setNewAdminData({ ...newAdminData, adminPosts: checked })}
                              disabled={newAdminData.isSuperAdmin}
                              data-testid="switch-admin-posts"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="adminGroups" className="text-sm">Groups</label>
                            <Switch
                              id="adminGroups"
                              checked={newAdminData.adminGroups}
                              onCheckedChange={(checked) => setNewAdminData({ ...newAdminData, adminGroups: checked })}
                              disabled={newAdminData.isSuperAdmin}
                              data-testid="switch-admin-groups"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="adminPodcasts" className="text-sm">Podcasts</label>
                            <Switch
                              id="adminPodcasts"
                              checked={newAdminData.adminPodcasts}
                              onCheckedChange={(checked) => setNewAdminData({ ...newAdminData, adminPodcasts: checked })}
                              disabled={newAdminData.isSuperAdmin}
                              data-testid="switch-admin-podcasts"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreateAdminDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createAdminUser.isPending} data-testid="button-save-admin">
                          {createAdminUser.isPending ? "Creating..." : "Create Admin"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {!registeredUsers ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : registeredUsers.length === 0 ? (
                  <p className="text-muted-foreground">No registered users yet.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Search by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          data-testid="input-user-search"
                        />
                      </div>
                      <Select value={userSortBy} onValueChange={(v) => setUserSortBy(v as "date" | "name")}>
                        <SelectTrigger className="w-[180px]" data-testid="select-user-sort">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Sort by Date Joined</SelectItem>
                          <SelectItem value="name">Sort by User Name</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={userFilterRole} onValueChange={(v) => setUserFilterRole(v)}>
                        <SelectTrigger className="w-[180px]" data-testid="select-user-filter">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                          <SelectItem value="no_subscription">No Subscription</SelectItem>
                          {subscriptionPlans?.map((plan) => (
                            <SelectItem key={plan.id} value={`plan_${plan.id}`}>{plan.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(() => {
                      let filtered = registeredUsers.filter((user) => {
                        const search = userSearch.toLowerCase();
                        if (search && !user.mumblesVibeName?.toLowerCase().includes(search) && !user.email?.toLowerCase().includes(search)) return false;
                        if (userFilterRole === "admin") return user.isAdmin && !user.isSuperAdmin;
                        if (userFilterRole === "superadmin") return user.isSuperAdmin;
                        if (userFilterRole === "no_subscription") return !user.subscriptionPlanId;
                        if (userFilterRole.startsWith("plan_")) {
                          const planId = userFilterRole.replace("plan_", "");
                          return String(user.subscriptionPlanId) === planId;
                        }
                        return true;
                      });
                      filtered = [...filtered].sort((a, b) => {
                        if (userSortBy === "name") return (a.mumblesVibeName || "").localeCompare(b.mumblesVibeName || "");
                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                      });
                      if (filtered.length === 0) return <p className="text-muted-foreground text-center py-4">No users match your filters.</p>;
                      return filtered.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-start justify-between gap-4 p-4 border rounded-md"
                        data-testid={`user-row-${user.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{user.mumblesVibeName}</h3>
                            {user.subscriptionPlanId && subscriptionPlans && (
                              <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30">
                                <Star className="h-3 w-3 fill-amber-500" />
                                {subscriptionPlans.find(p => String(p.id) === String(user.subscriptionPlanId))?.name || "Subscriber"}
                              </Badge>
                            )}
                            {user.blocked && (
                              <Badge variant="destructive">Blocked</Badge>
                            )}
                            {user.isAdmin && (
                              <Badge variant="default">
                                {user.isSuperAdmin ? "Super Admin" : "Admin"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.isAdmin && !user.isSuperAdmin && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.adminArticles && <Badge variant="outline" className="text-xs">Articles</Badge>}
                              {user.adminEvents && <Badge variant="outline" className="text-xs">Events</Badge>}
                              {user.adminReviews && <Badge variant="outline" className="text-xs">Reviews</Badge>}
                              {user.adminPosts && <Badge variant="outline" className="text-xs">Posts</Badge>}
                              {user.adminGroups && <Badge variant="outline" className="text-xs">Groups</Badge>}
                              {user.adminPodcasts && <Badge variant="outline" className="text-xs">Podcasts</Badge>}
                            </div>
                          )}
                          {user.createdAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          )}
                          {user.lastActiveAt && (
                            <p className="text-xs text-muted-foreground">
                              Last Active: {new Date(user.lastActiveAt).toLocaleDateString()} at {new Date(user.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {user.subscriptionEndDate && (
                            <p className="text-xs text-muted-foreground">
                              Subscription {new Date(user.subscriptionEndDate) > new Date() ? 'expires' : 'expired'}: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {user.profileImageUrl && (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profileImageUrl} alt={user.mumblesVibeName || "User"} />
                              <AvatarFallback>
                                {user.mumblesVibeName?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {isSuperAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAdminUser(user);
                                setEditAdminData({
                                  isAdmin: user.isAdmin === true,
                                  isSuperAdmin: user.isSuperAdmin === true,
                                  adminArticles: user.adminArticles === true,
                                  adminEvents: user.adminEvents === true,
                                  adminReviews: user.adminReviews === true,
                                  adminPosts: user.adminPosts === true,
                                  adminGroups: user.adminGroups === true,
                                  adminPodcasts: user.adminPodcasts === true,
                                });
                              }}
                              data-testid={`button-edit-admin-${user.id}`}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          )}
                          {isSuperAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                showInput(
                                  "Change Password",
                                  `Enter a new password for ${user.mumblesVibeName || user.email} (minimum 6 characters):`,
                                  (password) => {
                                    if (password.length < 6) {
                                      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
                                      return;
                                    }
                                    changeUserPassword.mutate({ id: user.id, password });
                                  },
                                  "New password..."
                                );
                              }}
                              disabled={changeUserPassword.isPending}
                              data-testid={`button-change-password-${user.id}`}
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Password
                            </Button>
                          )}
                          {user.id !== currentUser?.id && (
                            <Button
                              variant={user.blocked ? "default" : "destructive"}
                              size="sm"
                              onClick={() => {
                                const action = user.blocked ? "unblock" : "block";
                                showConfirm(
                                  user.blocked ? "Unblock User" : "Block User",
                                  `Are you sure you want to ${action} this user?`,
                                  () => toggleBlockUser.mutate({ id: user.id, blocked: !user.blocked }),
                                  { variant: user.blocked ? "default" : "destructive", confirmText: user.blocked ? "Unblock" : "Block" }
                                );
                              }}
                              disabled={toggleBlockUser.isPending}
                              data-testid={`button-toggle-block-${user.id}`}
                            >
                              {user.blocked ? (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Block
                                </>
                              )}
                            </Button>
                          )}
                          {isSuperAdmin && !user.isSuperAdmin && user.id !== currentUser?.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                showConfirm(
                                  "Delete User",
                                  `Are you sure you want to permanently delete ${user.mumblesVibeName || user.email}? This will remove all their data and cannot be undone.`,
                                  () => deleteUser.mutate(user.id),
                                  { variant: "destructive", confirmText: "Delete" }
                                );
                              }}
                              disabled={deleteUser.isPending}
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!editingAdminUser} onOpenChange={(open) => { if (!open) setEditingAdminUser(null); }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit User: {editingAdminUser?.mumblesVibeName}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingAdminUser) {
                      updateAdminUser.mutate({ id: editingAdminUser.id, data: editAdminData });
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-3 border-t pt-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="editIsAdmin" className="text-sm font-medium">Admin</label>
                      <Switch
                        id="editIsAdmin"
                        checked={editAdminData.isAdmin}
                        onCheckedChange={(checked) => setEditAdminData({
                          ...editAdminData,
                          isAdmin: checked,
                          isSuperAdmin: checked ? editAdminData.isSuperAdmin : false,
                          adminArticles: checked ? editAdminData.adminArticles : false,
                          adminEvents: checked ? editAdminData.adminEvents : false,
                          adminReviews: checked ? editAdminData.adminReviews : false,
                          adminPosts: checked ? editAdminData.adminPosts : false,
                          adminGroups: checked ? editAdminData.adminGroups : false,
                          adminPodcasts: checked ? editAdminData.adminPodcasts : false,
                        })}
                        data-testid="switch-edit-is-admin"
                      />
                    </div>

                    {editAdminData.isAdmin && (
                      <>
                        <div className="flex items-center justify-between">
                          <label htmlFor="editSuperAdmin" className="text-sm font-medium text-primary">Super Admin</label>
                          <Switch
                            id="editSuperAdmin"
                            checked={editAdminData.isSuperAdmin}
                            onCheckedChange={(checked) => setEditAdminData({
                              ...editAdminData,
                              isSuperAdmin: checked,
                              adminArticles: checked ? true : editAdminData.adminArticles,
                              adminEvents: checked ? true : editAdminData.adminEvents,
                              adminReviews: checked ? true : editAdminData.adminReviews,
                              adminPosts: checked ? true : editAdminData.adminPosts,
                              adminGroups: checked ? true : editAdminData.adminGroups,
                              adminPodcasts: checked ? true : editAdminData.adminPodcasts,
                            })}
                            data-testid="switch-edit-super-admin"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Super Admin has access to all admin features</p>

                        <div className="space-y-2 pl-4 border-l-2 border-muted">
                          <div className="flex items-center justify-between">
                            <label htmlFor="editAdminArticles" className="text-sm">Articles</label>
                            <Switch
                              id="editAdminArticles"
                              checked={editAdminData.adminArticles}
                              onCheckedChange={(checked) => setEditAdminData({ ...editAdminData, adminArticles: checked })}
                              disabled={editAdminData.isSuperAdmin}
                              data-testid="switch-edit-admin-articles"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="editAdminEvents" className="text-sm">Events</label>
                            <Switch
                              id="editAdminEvents"
                              checked={editAdminData.adminEvents}
                              onCheckedChange={(checked) => setEditAdminData({ ...editAdminData, adminEvents: checked })}
                              disabled={editAdminData.isSuperAdmin}
                              data-testid="switch-edit-admin-events"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="editAdminReviews" className="text-sm">Reviews</label>
                            <Switch
                              id="editAdminReviews"
                              checked={editAdminData.adminReviews}
                              onCheckedChange={(checked) => setEditAdminData({ ...editAdminData, adminReviews: checked })}
                              disabled={editAdminData.isSuperAdmin}
                              data-testid="switch-edit-admin-reviews"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="editAdminPosts" className="text-sm">Posts</label>
                            <Switch
                              id="editAdminPosts"
                              checked={editAdminData.adminPosts}
                              onCheckedChange={(checked) => setEditAdminData({ ...editAdminData, adminPosts: checked })}
                              disabled={editAdminData.isSuperAdmin}
                              data-testid="switch-edit-admin-posts"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="editAdminGroups" className="text-sm">Groups</label>
                            <Switch
                              id="editAdminGroups"
                              checked={editAdminData.adminGroups}
                              onCheckedChange={(checked) => setEditAdminData({ ...editAdminData, adminGroups: checked })}
                              disabled={editAdminData.isSuperAdmin}
                              data-testid="switch-edit-admin-groups"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="editAdminPodcasts" className="text-sm">Podcasts</label>
                            <Switch
                              id="editAdminPodcasts"
                              checked={editAdminData.adminPodcasts}
                              onCheckedChange={(checked) => setEditAdminData({ ...editAdminData, adminPodcasts: checked })}
                              disabled={editAdminData.isSuperAdmin}
                              data-testid="switch-edit-admin-podcasts"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setEditingAdminUser(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateAdminUser.isPending} data-testid="button-save-edit-admin">
                      {updateAdminUser.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="profile-fields">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Profile Fields</CardTitle>
                <Dialog open={showProfileFieldDialog} onOpenChange={setShowProfileFieldDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-profile-field">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Profile Field</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Field Label</label>
                        <Input
                          placeholder="e.g., Your Club"
                          value={newProfileField.label}
                          onChange={(e) => setNewProfileField({ ...newProfileField, label: e.target.value })}
                          data-testid="input-profile-field-label"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Field Type</label>
                        <Select
                          value={newProfileField.fieldType}
                          onValueChange={(value: 'text' | 'select' | 'selector') => setNewProfileField({ ...newProfileField, fieldType: value })}
                        >
                          <SelectTrigger data-testid="select-profile-field-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text (Free Format)</SelectItem>
                            <SelectItem value="select">Dropdown (Options)</SelectItem>
                            <SelectItem value="selector">Selector (Autocomplete)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newProfileField.fieldType === 'select' && (
                        <div>
                          <label className="text-sm font-medium">Options (comma separated)</label>
                          <Input
                            placeholder="e.g., Indian, Chinese, Italian"
                            value={newProfileField.options}
                            onChange={(e) => setNewProfileField({ ...newProfileField, options: e.target.value })}
                            data-testid="input-profile-field-options"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Enter options separated by commas</p>
                        </div>
                      )}
                      {newProfileField.fieldType === 'selector' && (
                        <div>
                          <label className="text-sm font-medium">Note</label>
                          <p className="text-xs text-muted-foreground">Selector values can be uploaded after creating the field.</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium">Description (optional)</label>
                        <Input
                          placeholder="e.g., What is your local club?"
                          value={newProfileField.description}
                          onChange={(e) => setNewProfileField({ ...newProfileField, description: e.target.value })}
                          data-testid="input-profile-field-description"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowProfileFieldDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => {
                            const options = newProfileField.fieldType === 'select' 
                              ? newProfileField.options.split(',').map(o => o.trim()).filter(Boolean)
                              : undefined;
                            createProfileField.mutate({
                              label: newProfileField.label,
                              fieldType: newProfileField.fieldType,
                              description: newProfileField.description || undefined,
                              isRequired: newProfileField.isRequired,
                              options
                            });
                          }}
                          disabled={!newProfileField.label || createProfileField.isPending}
                          data-testid="button-save-profile-field"
                        >
                          Create Field
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Custom fields that users can optionally fill out on their profiles.
                </p>
                {profileFieldsLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : !profileFieldsData || profileFieldsData.length === 0 ? (
                  <p className="text-muted-foreground">No custom profile fields yet.</p>
                ) : (
                  <div className="space-y-4">
                    {[...profileFieldsData].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((field, index, sortedArray) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-md"
                        data-testid={`profile-field-row-${field.id}`}
                      >
                        {editingProfileField?.id === field.id ? (
                          <div className="space-y-4">
                            <Input
                              value={editingProfileField.label}
                              onChange={(e) => setEditingProfileField({ ...editingProfileField, label: e.target.value })}
                              placeholder="Field label"
                              data-testid="input-edit-field-label"
                            />
                            <Input
                              value={editingProfileField.description || ""}
                              onChange={(e) => setEditingProfileField({ ...editingProfileField, description: e.target.value })}
                              placeholder="Description (optional)"
                              data-testid="input-edit-field-description"
                            />
                            {field.fieldType === 'select' && (
                              <Input
                                value={editingProfileField.options.map(o => o.label).join(', ')}
                                onChange={(e) => {
                                  const newOptions = e.target.value.split(',').map((o, i) => ({
                                    id: i,
                                    label: o.trim(),
                                    value: o.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                                    orderIndex: i
                                  }));
                                  setEditingProfileField({ ...editingProfileField, options: newOptions });
                                }}
                                placeholder="Options (comma separated)"
                                data-testid="input-edit-field-options"
                              />
                            )}
                            {field.fieldType === 'selector' && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Selector Values (one per line)</label>
                                <Textarea
                                  value={selectorValuesText}
                                  onChange={(e) => setSelectorValuesText(e.target.value)}
                                  placeholder="Enter values one per line, e.g.:\nSwansea\nMumbles\nCardiff"
                                  className="min-h-[100px]"
                                  data-testid="textarea-selector-values"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const values = selectorValuesText.split('\n').map(v => v.trim()).filter(Boolean);
                                    if (values.length > 0) {
                                      uploadSelectorValues.mutate({ fieldId: field.id, values });
                                    }
                                  }}
                                  disabled={uploadSelectorValues.isPending || !selectorValuesText.trim()}
                                  data-testid="button-upload-selector-values"
                                >
                                  {uploadSelectorValues.isPending ? "Uploading..." : "Upload Values"}
                                </Button>
                                <p className="text-xs text-muted-foreground">This will replace any existing values for this field.</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const options = field.fieldType === 'select'
                                    ? editingProfileField.options.map(o => o.label).filter(Boolean)
                                    : undefined;
                                  updateProfileField.mutate({
                                    id: field.id,
                                    label: editingProfileField.label,
                                    description: editingProfileField.description || undefined,
                                    options
                                  });
                                }}
                                disabled={updateProfileField.isPending}
                                data-testid="button-save-edit-field"
                              >
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingProfileField(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{field.label}</h3>
                                <Badge variant="outline">
                                  {field.fieldType === 'text' ? 'Text' : field.fieldType === 'select' ? 'Dropdown' : 'Selector'}
                                </Badge>
                              </div>
                              {field.description && (
                                <p className="text-sm text-muted-foreground">{field.description}</p>
                              )}
                              {field.fieldType === 'select' && field.options.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Options: {field.options.map(o => o.label).join(', ')}
                                </p>
                              )}
                              {field.fieldType === 'selector' && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {field.selectorValuesCount || 0} values loaded
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 mt-2">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={field.useOnPlayRequests ?? true}
                                    onChange={(e) => {
                                      updateProfileField.mutate({
                                        id: field.id,
                                        useOnPlayRequests: e.target.checked
                                      });
                                    }}
                                    className="rounded"
                                    data-testid={`checkbox-play-requests-${field.id}`}
                                  />
                                  Use on Play Requests
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={field.useOnTeeTimes ?? true}
                                    onChange={(e) => {
                                      updateProfileField.mutate({
                                        id: field.id,
                                        useOnTeeTimes: e.target.checked
                                      });
                                    }}
                                    className="rounded"
                                    data-testid={`checkbox-tee-times-${field.id}`}
                                  />
                                  Use on Offer Tee Time
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={field.useOnPlayRequestOffers ?? true}
                                    onChange={(e) => {
                                      updateProfileField.mutate({
                                        id: field.id,
                                        useOnPlayRequestOffers: e.target.checked
                                      });
                                    }}
                                    className="rounded"
                                    data-testid={`checkbox-play-request-offers-${field.id}`}
                                  />
                                  Use in Play Request Make Offer
                                </label>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => moveProfileField(index, 'up')}
                                disabled={index === 0 || reorderProfileFields.isPending}
                                data-testid={`button-move-up-field-${field.id}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => moveProfileField(index, 'down')}
                                disabled={index === sortedArray.length - 1 || reorderProfileFields.isPending}
                                data-testid={`button-move-down-field-${field.id}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setEditingProfileField(field)}
                                data-testid={`button-edit-field-${field.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  showConfirm(
                                    "Delete Field",
                                    "Are you sure you want to delete this profile field? This will also remove all user values for this field.",
                                    () => deleteProfileField.mutate(field.id),
                                    { variant: "destructive", confirmText: "Delete" }
                                  );
                                }}
                                data-testid={`button-delete-field-${field.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle>Event Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                {!eventSuggestions ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : eventSuggestions.length === 0 ? (
                  <p className="text-muted-foreground">No pending event suggestions.</p>
                ) : (
                  <div className="space-y-4">
                    {eventSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-4 border rounded-md space-y-3"
                        data-testid={`suggestion-row-${suggestion.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{suggestion.name}</h3>
                              <Badge variant="outline">Pending Review</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {suggestion.venueName} | {new Date(suggestion.startDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm">{suggestion.summary}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        {suggestion.imageUrl && (
                          <img 
                            src={suggestion.imageUrl} 
                            alt={suggestion.name} 
                            className="w-full max-w-md h-32 object-cover rounded-md"
                          />
                        )}
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              showConfirm("Approve Event", "Approve this event and publish it to the events page?", () => approveEventSuggestion.mutate(suggestion.id))
                            }}
                            disabled={approveEventSuggestion.isPending}
                            data-testid={`button-approve-${suggestion.id}`}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve & Publish
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              showInput(
                                "Reject Event", 
                                "Provide a reason for rejection (optional):",
                                (reason) => rejectEventSuggestion.mutate({ id: suggestion.id, reason: reason || undefined }),
                                "Enter reason..."
                              );
                            }}
                            disabled={rejectEventSuggestion.isPending}
                            data-testid={`button-reject-${suggestion.id}`}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <CardTitle>Member Reviews</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={reviewStatusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewStatusFilter("all")}
                    data-testid="button-filter-reviews-all"
                  >
                    All
                  </Button>
                  <Button
                    variant={reviewStatusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewStatusFilter("pending")}
                    data-testid="button-filter-reviews-pending"
                  >
                    Pending
                  </Button>
                  <Button
                    variant={reviewStatusFilter === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewStatusFilter("approved")}
                    data-testid="button-filter-reviews-approved"
                  >
                    Approved
                  </Button>
                  <Button
                    variant={reviewStatusFilter === "rejected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewStatusFilter("rejected")}
                    data-testid="button-filter-reviews-rejected"
                  >
                    Rejected
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!adminReviews ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : adminReviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews found.</p>
                ) : (
                  <div className="space-y-4">
                    {adminReviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 border rounded-md space-y-3"
                        data-testid={`review-row-${review.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{review.title}</h3>
                              <Badge variant="outline">{review.category}</Badge>
                              <Badge 
                                variant="secondary"
                                className={
                                  review.status === "approved" 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                                    : review.status === "rejected"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : ""
                                }
                              >
                                {review.status === "pending" ? "Pending Review" : review.status === "approved" ? "Approved" : "Rejected"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {review.placeName} | by {review.authorName}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm">{review.summary}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                              <ThumbsUp className="h-4 w-4" />
                              What they liked
                            </div>
                            <p className="text-sm text-muted-foreground">{review.liked}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                              <ThumbsDown className="h-4 w-4" />
                              Could be improved
                            </div>
                            <p className="text-sm text-muted-foreground">{review.disliked}</p>
                          </div>
                        </div>
                        {review.imageUrl && (
                          <img 
                            src={review.imageUrl} 
                            alt={review.placeName} 
                            className="w-full max-w-md aspect-[4/3] object-cover rounded-md"
                          />
                        )}
                        <div className="flex items-center gap-2 pt-2 flex-wrap">
                          {review.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                showConfirm("Approve Review", "Approve this review and publish it?", () => approveReview.mutate(review.id))
                              }}
                              disabled={approveReview.isPending}
                              data-testid={`button-approve-review-${review.id}`}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingReview(review)}
                            data-testid={`button-edit-review-${review.id}`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {review.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                showConfirm("Reject Review", "Are you sure you want to reject this review?", () => rejectReview.mutate(review.id), { variant: "destructive", confirmText: "Reject" })
                              }}
                              disabled={rejectReview.isPending}
                              data-testid={`button-reject-review-${review.id}`}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              showConfirm("Delete Review", "Permanently delete this review? This cannot be undone.", () => deleteReview.mutate(review.id), { variant: "destructive", confirmText: "Delete" })
                            }}
                            disabled={deleteReview.isPending}
                            data-testid={`button-delete-review-${review.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="polls">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <CardTitle>Community Polls</CardTitle>
                <Button 
                  onClick={() => {
                    resetPollForm();
                    setShowPollForm(true);
                  }}
                  data-testid="button-create-poll"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Poll
                </Button>
              </CardHeader>
              <CardContent>
                {showPollForm && (
                  <div className="mb-6 p-4 border rounded-md bg-muted/50">
                    <h3 className="font-medium mb-4">{editingPoll ? "Edit Poll" : "Create New Poll"}</h3>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const filteredIndices: number[] = [];
                        const filteredOptions = pollFormData.options.filter((opt, idx) => {
                          if (opt.trim() !== "") {
                            filteredIndices.push(idx);
                            return true;
                          }
                          return false;
                        });
                        if (filteredOptions.length < 2) {
                          toast({ title: "Please add at least 2 options", variant: "destructive" });
                          return;
                        }
                        const filteredOptionImages = filteredIndices.map(idx => pollFormData.optionImages[idx] || null);
                        const data = {
                          title: pollFormData.title,
                          imageUrl: pollFormData.imageUrl,
                          options: filteredOptions,
                          optionImages: filteredOptionImages,
                          article: pollFormData.article,
                          pollType: pollFormData.pollType,
                          startDate: new Date(pollFormData.startDate),
                          durationHours: pollFormData.durationHours,
                          boostedVotes: pollFormData.boostedVotes,
                          isActive: pollFormData.isActive,
                        };
                        if (editingPoll) {
                          updatePoll.mutate({ id: editingPoll.id, data });
                        } else {
                          createPoll.mutate(data);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-sm font-medium">Poll Title/Question</label>
                        <Input
                          value={pollFormData.title}
                          onChange={(e) => setPollFormData({ ...pollFormData, title: e.target.value })}
                          placeholder="Enter your title for the poll"
                          required
                          data-testid="input-poll-title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Poll Image</label>
                        <ImageUpload
                          value={pollFormData.imageUrl || null}
                          onChange={(url) => setPollFormData({ ...pollFormData, imageUrl: url || "" })}
                          testId="poll-image"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Article/Background (optional)</label>
                        <Textarea
                          value={pollFormData.article}
                          onChange={(e) => setPollFormData({ ...pollFormData, article: e.target.value })}
                          placeholder="Provide detailed background information about this poll..."
                          rows={4}
                          className="mt-1"
                          data-testid="input-poll-article"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This text will appear on the poll's detail page to provide context and background information.
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Poll Type</label>
                        <div className="flex gap-4 mt-2 flex-wrap">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pollType"
                              value="standard"
                              checked={pollFormData.pollType === "standard"}
                              onChange={() => setPollFormData({ ...pollFormData, pollType: "standard" })}
                              className="w-4 h-4"
                              data-testid="radio-poll-type-standard"
                            />
                            <span className="text-sm">Standard</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pollType"
                              value="ranking"
                              checked={pollFormData.pollType === "ranking"}
                              onChange={() => setPollFormData({ ...pollFormData, pollType: "ranking" })}
                              className="w-4 h-4"
                              data-testid="radio-poll-type-ranking"
                            />
                            <span className="text-sm">Ranking</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pollType"
                              value="this_or_that"
                              checked={pollFormData.pollType === "this_or_that"}
                              onChange={() => setPollFormData({ ...pollFormData, pollType: "this_or_that", options: ["", ""], optionImages: [null, null] })}
                              className="w-4 h-4"
                              data-testid="radio-poll-type-this-or-that"
                            />
                            <span className="text-sm">This or That</span>
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pollFormData.pollType === "standard" 
                            ? "Users vote for a single option" 
                            : pollFormData.pollType === "ranking"
                            ? "Users rank all options in order of preference (Borda count scoring)"
                            : "Binary choice between exactly two options"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Options</label>
                        <div className="space-y-4">
                          {pollFormData.options.map((option, index) => (
                            <div key={index} className="p-3 border rounded-md space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...pollFormData.options];
                                    newOptions[index] = e.target.value;
                                    setPollFormData({ ...pollFormData, options: newOptions });
                                  }}
                                  placeholder={`Option ${index + 1}`}
                                  data-testid={`input-poll-option-${index}`}
                                />
                                {pollFormData.options.length > 2 && pollFormData.pollType !== "this_or_that" && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      const newOptions = pollFormData.options.filter((_, i) => i !== index);
                                      const newOptionImages = pollFormData.optionImages.filter((_, i) => i !== index);
                                      setPollFormData({ ...pollFormData, options: newOptions, optionImages: newOptionImages });
                                    }}
                                    data-testid={`button-remove-option-${index}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Option Image (optional)</label>
                                <ImageUpload
                                  value={pollFormData.optionImages[index] || null}
                                  onChange={(url) => {
                                    const newOptionImages = [...pollFormData.optionImages];
                                    newOptionImages[index] = url;
                                    setPollFormData({ ...pollFormData, optionImages: newOptionImages });
                                  }}
                                  testId={`poll-option-image-${index}`}
                                />
                              </div>
                            </div>
                          ))}
                          {pollFormData.pollType !== "this_or_that" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPollFormData({ 
                                ...pollFormData, 
                                options: [...pollFormData.options, ""],
                                optionImages: [...pollFormData.optionImages, null]
                              })}
                              data-testid="button-add-option"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Start Date & Time</label>
                          <Input
                            type="datetime-local"
                            value={pollFormData.startDate}
                            onChange={(e) => setPollFormData({ ...pollFormData, startDate: e.target.value })}
                            required
                            data-testid="input-poll-start-date"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duration (hours)</label>
                          <Input
                            type="number"
                            min={1}
                            value={pollFormData.durationHours}
                            onChange={(e) => setPollFormData({ ...pollFormData, durationHours: parseInt(e.target.value) || 24 })}
                            required
                            data-testid="input-poll-duration"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Boosted Votes</label>
                          <Input
                            type="number"
                            min={0}
                            value={pollFormData.boostedVotes}
                            onChange={(e) => setPollFormData({ ...pollFormData, boostedVotes: parseInt(e.target.value) || 0 })}
                            data-testid="input-poll-boosted-votes"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pollFormData.isActive}
                          onCheckedChange={(checked) => setPollFormData({ ...pollFormData, isActive: checked })}
                          data-testid="switch-poll-active"
                        />
                        <label className="text-sm">Active</label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={resetPollForm} data-testid="button-cancel-poll">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createPoll.isPending || updatePoll.isPending} data-testid="button-save-poll">
                          {editingPoll ? "Update Poll" : "Create Poll"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {!adminPolls ? (
                  <p className="text-muted-foreground">Loading polls...</p>
                ) : adminPolls.length === 0 ? (
                  <p className="text-muted-foreground">No polls created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {adminPolls.map((poll) => {
                      const now = new Date();
                      const endDate = new Date(new Date(poll.startDate).getTime() + poll.durationHours * 60 * 60 * 1000);
                      const isLive = poll.isActive && now >= new Date(poll.startDate) && now <= endDate;
                      const isUpcoming = poll.isActive && now < new Date(poll.startDate);
                      const isExpired = now > endDate;

                      return (
                        <div key={poll.id} className="p-4 border rounded-md flex gap-4">
                          {poll.imageUrl && (
                            <img 
                              src={poll.imageUrl} 
                              alt="" 
                              className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <h3 className="font-medium">{poll.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {(poll.options as string[]).length} options | {poll.totalVotes || 0} {(poll.totalVotes || 0) === 1 ? "vote" : "votes"}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {isLive && <Badge className="bg-green-500">Live</Badge>}
                                {isUpcoming && <Badge variant="outline">Upcoming</Badge>}
                                {isExpired && <Badge variant="secondary">Ended</Badge>}
                                {!poll.isActive && <Badge variant="destructive">Inactive</Badge>}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Starts: {new Date(poll.startDate).toLocaleString()} | Duration: {poll.durationHours}h
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingPoll(poll);
                                  const options = poll.options as string[];
                                  const optionImages = (poll.optionImages as (string | null)[] | null) || options.map(() => null);
                                  setPollFormData({
                                    title: poll.title,
                                    imageUrl: poll.imageUrl,
                                    options: options,
                                    optionImages: optionImages,
                                    article: poll.article || "",
                                    pollType: (poll.pollType as "standard" | "ranking" | "this_or_that") || "standard",
                                    startDate: new Date(poll.startDate).toISOString().slice(0, 16),
                                    durationHours: poll.durationHours,
                                    boostedVotes: poll.boostedVotes || 0,
                                    isActive: poll.isActive ?? true,
                                  });
                                  setShowPollForm(true);
                                }}
                                data-testid={`button-edit-poll-${poll.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  showConfirm("Delete Poll", "Are you sure you want to delete this poll?", () => deletePoll.mutate(poll.id), { variant: "destructive", confirmText: "Delete" })
                                }}
                                data-testid={`button-delete-poll-${poll.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {groupPostsLoading ? (
                  <p className="text-muted-foreground">Loading group posts...</p>
                ) : !adminGroupPosts || adminGroupPosts.length === 0 ? (
                  <p className="text-muted-foreground">No group posts yet.</p>
                ) : (
                  <div className="space-y-4">
                    {adminGroupPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-4 border rounded-md space-y-3"
                        data-testid={`group-post-row-${post.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{post.authorName}</span>
                              <Badge variant="outline">{post.groupName}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {post.createdAt && new Date(post.createdAt).toLocaleString()}
                              {post.edited && " (edited)"}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingGroupPost(post);
                                setEditingGroupPostContent(post.content);
                                setEditingGroupPostImages((post.imageUrls as string[]) || []);
                              }}
                              data-testid={`button-edit-group-post-${post.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                showConfirm("Delete Post", "Are you sure you want to delete this group post?", () => deleteGroupPost.mutate(post.id), { variant: "destructive", confirmText: "Delete" })
                              }}
                              data-testid={`button-delete-group-post-${post.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {editingGroupPost?.id === post.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editingGroupPostContent}
                              onChange={(e) => setEditingGroupPostContent(e.target.value)}
                              className="min-h-24"
                              data-testid="textarea-edit-group-post"
                            />
                            {editingGroupPostImages.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {editingGroupPostImages.map((url, idx) => (
                                  <div key={idx} className="relative group">
                                    <img
                                      src={url}
                                      alt=""
                                      className="h-20 w-20 object-cover rounded-md"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => setEditingGroupPostImages(prev => prev.filter((_, i) => i !== idx))}
                                      data-testid={`button-remove-group-post-image-${idx}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {editingGroupPostImages.length < 4 && (
                              <ImageUpload
                                value=""
                                onChange={(url) => setEditingGroupPostImages(prev => [...prev, url])}
                                testId="input-admin-group-post-image"
                              />
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateGroupPost.mutate({ id: post.id, content: editingGroupPostContent, imageUrls: editingGroupPostImages })}
                                disabled={updateGroupPost.isPending || !editingGroupPostContent.trim()}
                                data-testid="button-save-group-post"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingGroupPost(null);
                                  setEditingGroupPostContent("");
                                  setEditingGroupPostImages([]);
                                }}
                                data-testid="button-cancel-edit-group-post"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                        )}

                        {editingGroupPost?.id !== post.id && post.imageUrls && (post.imageUrls as string[]).length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {(post.imageUrls as string[]).map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt=""
                                className="h-20 w-20 object-cover rounded-md"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {!contactRequests || contactRequests.length === 0 ? (
                  <p className="text-muted-foreground">No contact requests yet.</p>
                ) : (
                  <div className="space-y-4">
                    {contactRequests.map((request) => (
                      <div
                        key={request.id}
                        className={`p-4 border rounded-md space-y-3 ${!request.isRead ? "bg-accent/30" : ""}`}
                        data-testid={`contact-row-${request.id}`}
                        onClick={() => {
                          if (!request.isRead) {
                            markContactRequestRead.mutate(request.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{request.name}</span>
                              <Badge variant="secondary">{request.type}</Badge>
                              {!request.isRead && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.email}
                              {request.phone && ` | ${request.phone}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {request.createdAt && new Date(request.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              showConfirm("Delete Request", "Are you sure you want to delete this contact request?", () => deleteContactRequest.mutate(request.id), { variant: "destructive", confirmText: "Delete" })
                            }}
                            data-testid={`button-delete-contact-${request.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{request.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Groups</CardTitle>
                <Button onClick={() => { setShowGroupForm(true); setEditingGroup(null); setGroupFormData({ name: "", description: "", imageUrl: "", isActive: true, isPublic: false }); }} data-testid="button-add-group">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm font-medium whitespace-nowrap">Filter by type:</label>
                  <Select value={groupTypeFilter} onValueChange={setGroupTypeFilter}>
                    <SelectTrigger className="w-[200px]" data-testid="select-group-type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      <SelectItem value="community">Community Groups</SelectItem>
                      <SelectItem value="event">Event Groups</SelectItem>
                      <SelectItem value="competition">Competition Groups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(showGroupForm || editingGroup) && (
                  <div className="mb-6 p-4 border rounded-lg space-y-4">
                    <h3 className="font-medium">{editingGroup ? "Edit Group" : "Create New Group"}</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={editingGroup ? editingGroup.name : groupFormData.name}
                          onChange={(e) => editingGroup ? setEditingGroup({ ...editingGroup, name: e.target.value }) : setGroupFormData({ ...groupFormData, name: e.target.value })}
                          placeholder="Group name"
                          data-testid="input-group-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={editingGroup ? (editingGroup.description || "") : groupFormData.description}
                          onChange={(e) => editingGroup ? setEditingGroup({ ...editingGroup, description: e.target.value }) : setGroupFormData({ ...groupFormData, description: e.target.value })}
                          placeholder="Group description"
                          data-testid="textarea-group-description"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Image</label>
                        <ImageUpload
                          value={editingGroup ? (editingGroup.imageUrl || null) : (groupFormData.imageUrl || null)}
                          onChange={(url) => editingGroup ? setEditingGroup({ ...editingGroup, imageUrl: url || "" }) : setGroupFormData({ ...groupFormData, imageUrl: url || "" })}
                          testId="group-image"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingGroup ? editingGroup.isActive : groupFormData.isActive}
                          onCheckedChange={(checked) => editingGroup ? setEditingGroup({ ...editingGroup, isActive: checked }) : setGroupFormData({ ...groupFormData, isActive: checked })}
                          data-testid="switch-group-active"
                        />
                        <label className="text-sm">Active</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingGroup ? (editingGroup.isPublic ?? false) : groupFormData.isPublic}
                          onCheckedChange={(checked) => editingGroup ? setEditingGroup({ ...editingGroup, isPublic: checked }) : setGroupFormData({ ...groupFormData, isPublic: checked })}
                          data-testid="switch-group-public"
                        />
                        <label className="text-sm">Public (anyone can access without joining)</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (editingGroup) {
                            updateGroup.mutate({ id: editingGroup.id, data: { name: editingGroup.name, description: editingGroup.description, imageUrl: editingGroup.imageUrl, isActive: editingGroup.isActive, isPublic: editingGroup.isPublic } });
                          } else {
                            createGroup.mutate(groupFormData);
                          }
                        }}
                        disabled={createGroup.isPending || updateGroup.isPending}
                        data-testid="button-save-group"
                      >
                        {editingGroup ? "Update" : "Create"}
                      </Button>
                      <Button variant="outline" onClick={() => { setShowGroupForm(false); setEditingGroup(null); }} data-testid="button-cancel-group">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {!adminGroups || adminGroups.length === 0 ? (
                  <p className="text-muted-foreground">No groups yet. Create one to get started.</p>
                ) : (() => {
                  const filteredGroups = adminGroups.filter((group) => {
                    if (groupTypeFilter === "all") return true;
                    const isCompetition = group.eventId && group.linkedEventType && ["knockout", "team_competition", "individual_competition"].includes(group.linkedEventType);
                    const isEvent = group.eventId && !isCompetition;
                    if (groupTypeFilter === "community") return !group.eventId;
                    if (groupTypeFilter === "event") return isEvent;
                    if (groupTypeFilter === "competition") return isCompetition;
                    return true;
                  });
                  if (filteredGroups.length === 0) return <p className="text-muted-foreground">No groups match the selected filter.</p>;
                  return (
                  <div className="space-y-4">
                    {filteredGroups.map((group) => {
                      const groupCategory = !group.eventId ? "Community" : 
                        (group.linkedEventType && ["knockout", "team_competition", "individual_competition"].includes(group.linkedEventType)) ? "Competition" : "Event";
                      return (
                      <div key={group.id} className="flex items-center justify-between p-4 border rounded-md" data-testid={`group-row-${group.id}`}>
                        <div className="flex items-center gap-4">
                          {group.imageUrl && <img src={group.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" />}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{group.name}</span>
                              <Badge className={groupCategory === "Community" ? "bg-blue-600 text-white border-blue-600" : groupCategory === "Competition" ? "bg-purple-600 text-white border-purple-600" : "bg-green-600 text-white border-green-600"}>
                                {groupCategory}
                              </Badge>
                              <Badge variant={group.isActive ? "default" : "secondary"}>
                                {group.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">
                                {group.isPublic ? "Public" : "Private"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created by: {(group as any).creatorName || "Unknown"}
                              {group.description && ` — ${group.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGroupId(group.id);
                              setShowMembersDialog(true);
                            }}
                            data-testid={`button-view-members-${group.id}`}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Members
                            {pendingCounts[group.id] && (
                              <Badge variant="destructive" className="ml-2" data-testid={`badge-pending-count-${group.id}`}>
                                {pendingCounts[group.id]}
                              </Badge>
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingGroup(group); setShowGroupForm(false); }} data-testid={`button-edit-group-${group.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => showConfirm("Delete Group", "Delete this group? All posts and memberships will be removed.", () => deleteGroup.mutate(group.id), { variant: "destructive", confirmText: "Delete" })} data-testid={`button-delete-group-${group.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                  );
                })()}

                <Dialog open={showMembersDialog} onOpenChange={(open) => {
                  setShowMembersDialog(open);
                  if (!open) setSelectedGroupId(null);
                }}>
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {adminGroups?.find(g => g.id === selectedGroupId)?.name || "Group"} - Members
                      </DialogTitle>
                    </DialogHeader>
                    
                    {pendingMembers.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Badge variant="destructive">{pendingMembers.length}</Badge>
                          Pending Requests
                        </h4>
                        <div className="space-y-3">
                          {pendingMembers.map((m) => (
                            <div key={m.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg" data-testid={`membership-pending-${m.id}`}>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {m.profileImageUrl ? (
                                    <img src={m.profileImageUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-medium">{m.userName.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{m.userName}</p>
                                  <p className="text-sm text-muted-foreground">{m.userEmail}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => approveMembership.mutate(m.id)} disabled={approveMembership.isPending} data-testid={`button-approve-${m.id}`}>
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => rejectMembership.mutate(m.id)} disabled={rejectMembership.isPending} data-testid={`button-reject-${m.id}`}>
                                  <X className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium mb-3">
                        Members ({approvedMembers.length})
                      </h4>
                      {approvedMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No members in this group yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {approvedMembers.map((m) => (
                            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`membership-approved-${m.id}`}>
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {m.profileImageUrl ? (
                                  <img src={m.profileImageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-sm font-medium">{m.userName.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{m.userName}</p>
                                <p className="text-sm text-muted-foreground">{m.userEmail}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">Member</Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => showConfirm(
                                    "Remove Member",
                                    `Remove ${m.userName} from this group?`,
                                    () => removeMembership.mutate(m.id),
                                    { variant: "destructive", confirmText: "Remove" }
                                  )}
                                  disabled={removeMembership.isPending}
                                  data-testid={`button-remove-member-${m.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="group-events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Group Events</CardTitle>
                <div className="w-64">
                  <Select value={groupEventFilterGroup} onValueChange={setGroupEventFilterGroup} data-testid="select-group-event-filter">
                    <SelectTrigger data-testid="select-group-event-filter-trigger">
                      <SelectValue placeholder="Filter by group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {Array.from(new Set(adminGroupEvents?.map(e => e.groupName) || [])).sort().map(groupName => (
                        <SelectItem key={groupName} value={groupName}>{groupName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {editingGroupEvent && (
                  <div className="mb-6 p-4 border rounded-lg space-y-4">
                    <h3 className="font-medium">Edit Group Event</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={editingGroupEvent.name}
                          onChange={(e) => setEditingGroupEvent({ ...editingGroupEvent, name: e.target.value })}
                          data-testid="input-edit-group-event-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Venue Name</label>
                        <Input
                          value={editingGroupEvent.venueName || ""}
                          onChange={(e) => setEditingGroupEvent({ ...editingGroupEvent, venueName: e.target.value })}
                          data-testid="input-edit-group-event-venue"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Address</label>
                        <Input
                          value={editingGroupEvent.address || ""}
                          onChange={(e) => setEditingGroupEvent({ ...editingGroupEvent, address: e.target.value })}
                          data-testid="input-edit-group-event-address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Start Date</label>
                          <Input
                            type="datetime-local"
                            value={editingGroupEvent.startDate ? new Date(editingGroupEvent.startDate).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setEditingGroupEvent({ ...editingGroupEvent, startDate: e.target.value ? new Date(e.target.value).toISOString() : editingGroupEvent.startDate })}
                            data-testid="input-edit-group-event-start"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">End Date</label>
                          <Input
                            type="datetime-local"
                            value={editingGroupEvent.endDate ? new Date(editingGroupEvent.endDate).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setEditingGroupEvent({ ...editingGroupEvent, endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                            data-testid="input-edit-group-event-end"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Summary</label>
                        <Textarea
                          value={editingGroupEvent.summary || ""}
                          onChange={(e) => setEditingGroupEvent({ ...editingGroupEvent, summary: e.target.value })}
                          data-testid="textarea-edit-group-event-summary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={editingGroupEvent.description || ""}
                          onChange={(e) => setEditingGroupEvent({ ...editingGroupEvent, description: e.target.value })}
                          data-testid="textarea-edit-group-event-description"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Image</label>
                        <ImageUpload
                          value={editingGroupEvent.imageUrl || null}
                          onChange={(url) => setEditingGroupEvent({ ...editingGroupEvent, imageUrl: url || null })}
                          testId="edit-group-event-image"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Ticket URL</label>
                        <Input
                          value={editingGroupEvent.ticketUrl || ""}
                          onChange={(e) => setEditingGroupEvent({ ...editingGroupEvent, ticketUrl: e.target.value })}
                          data-testid="input-edit-group-event-ticket"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingGroupEvent.showOnPublic || false}
                          onCheckedChange={(checked) => setEditingGroupEvent({ ...editingGroupEvent, showOnPublic: checked })}
                          data-testid="switch-edit-group-event-public"
                        />
                        <label className="text-sm">Show on Public Events Page</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          updateGroupEventMutation.mutate({
                            id: editingGroupEvent.id,
                            data: {
                              name: editingGroupEvent.name,
                              startDate: editingGroupEvent.startDate,
                              endDate: editingGroupEvent.endDate,
                              venueName: editingGroupEvent.venueName,
                              address: editingGroupEvent.address,
                              summary: editingGroupEvent.summary,
                              description: editingGroupEvent.description,
                              imageUrl: editingGroupEvent.imageUrl,
                              ticketUrl: editingGroupEvent.ticketUrl,
                              showOnPublic: editingGroupEvent.showOnPublic,
                            },
                          });
                        }}
                        disabled={updateGroupEventMutation.isPending}
                        data-testid="button-save-group-event"
                      >
                        Update
                      </Button>
                      <Button variant="outline" onClick={() => setEditingGroupEvent(null)} data-testid="button-cancel-group-event">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {(() => {
                  const filteredEvents = adminGroupEvents?.filter(e => groupEventFilterGroup === "all" || e.groupName === groupEventFilterGroup) || [];
                  if (filteredEvents.length === 0) {
                    return <p className="text-muted-foreground">No group events found{groupEventFilterGroup !== "all" ? ` for "${groupEventFilterGroup}"` : ""}.</p>;
                  }
                  return (
                    <div className="space-y-4">
                      {filteredEvents.map((ge) => (
                        <div key={ge.id} className="flex items-center justify-between p-4 border rounded-md" data-testid={`group-event-row-${ge.id}`}>
                          <div className="flex items-center gap-4">
                            {ge.imageUrl && <img src={ge.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{ge.name}</span>
                                {ge.showOnPublic && <Badge variant="default">Public</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Group: {ge.groupName} | By: {ge.authorName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {ge.startDate ? new Date(ge.startDate).toLocaleDateString() : "No date"} 
                                {ge.venueName && ` — ${ge.venueName}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingGroupEvent(ge)}
                              data-testid={`button-view-group-event-${ge.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingGroupEvent(ge)}
                              data-testid={`button-edit-group-event-${ge.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => showConfirm(
                                "Delete Group Event",
                                `Are you sure you want to delete "${ge.name}"?`,
                                () => deleteGroupEventMutation.mutate(ge.id),
                                { variant: "destructive", confirmText: "Delete" }
                              )}
                              disabled={deleteGroupEventMutation.isPending}
                              data-testid={`button-delete-group-event-${ge.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <Dialog open={!!viewingGroupEvent} onOpenChange={(open) => { if (!open) setViewingGroupEvent(null); }}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{viewingGroupEvent?.name}</DialogTitle>
                    </DialogHeader>
                    {viewingGroupEvent && (
                      <div className="space-y-4">
                        {viewingGroupEvent.imageUrl && (
                          <img src={viewingGroupEvent.imageUrl} alt={viewingGroupEvent.name} className="w-full h-48 object-cover rounded-lg" />
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Group</p>
                            <p>{viewingGroupEvent.groupName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Created By</p>
                            <p>{viewingGroupEvent.authorName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                            <p>{viewingGroupEvent.startDate ? new Date(viewingGroupEvent.startDate).toLocaleString() : "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">End Date</p>
                            <p>{viewingGroupEvent.endDate ? new Date(viewingGroupEvent.endDate).toLocaleString() : "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Venue</p>
                            <p>{viewingGroupEvent.venueName || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                            <p>{viewingGroupEvent.address || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Public Event</p>
                            <p>{viewingGroupEvent.showOnPublic ? "Yes" : "No"}</p>
                          </div>
                          {viewingGroupEvent.ticketUrl && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Ticket URL</p>
                              <a href={viewingGroupEvent.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{viewingGroupEvent.ticketUrl}</a>
                            </div>
                          )}
                        </div>
                        {viewingGroupEvent.summary && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Summary</p>
                            <p className="mt-1">{viewingGroupEvent.summary}</p>
                          </div>
                        )}
                        {viewingGroupEvent.description && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <div className="mt-1 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: viewingGroupEvent.description }} />
                          </div>
                        )}
                        {viewingGroupEvent.tags && viewingGroupEvent.tags.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Tags</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {viewingGroupEvent.tags.map((tag: string) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingGroupEvent(viewingGroupEvent);
                              setViewingGroupEvent(null);
                            }}
                            data-testid="button-view-to-edit-group-event"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setViewingGroupEvent(null);
                              showConfirm(
                                "Delete Group Event",
                                `Are you sure you want to delete "${viewingGroupEvent.name}"?`,
                                () => deleteGroupEventMutation.mutate(viewingGroupEvent.id),
                                { variant: "destructive", confirmText: "Delete" }
                              );
                            }}
                            data-testid="button-view-delete-group-event"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Subscription Plans</CardTitle>
                <Button onClick={() => {
                  resetSubscriptionForm();
                  setShowSubscriptionForm(true);
                }} data-testid="button-add-subscription">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Create and manage subscription tiers with different feature access levels and pricing.
                </p>

                {subscriptionPlans?.length === 0 && !showSubscriptionForm && (
                  <p className="text-muted-foreground text-center py-8">No subscription plans yet. Create your first plan!</p>
                )}

                {(showSubscriptionForm || editingSubscription) && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>{editingSubscription ? "Edit Subscription Plan" : "New Subscription Plan"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Plan Name</label>
                            <Input
                              value={subscriptionFormData.name}
                              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, name: e.target.value })}
                              placeholder="e.g. Freemium, Premium, Pro"
                              data-testid="input-subscription-name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Slug</label>
                            <Input
                              value={subscriptionFormData.slug}
                              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                              placeholder="e.g. freemium, premium"
                              data-testid="input-subscription-slug"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            value={subscriptionFormData.description}
                            onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, description: e.target.value })}
                            placeholder="Describe what this plan offers..."
                            data-testid="input-subscription-description"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium">Price</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={subscriptionFormData.price}
                              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, price: parseFloat(e.target.value) || 0 })}
                              placeholder="0 for free"
                              data-testid="input-subscription-price"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Billing Period</label>
                            <Select
                              value={subscriptionFormData.billingPeriod}
                              onValueChange={(value) => setSubscriptionFormData({ ...subscriptionFormData, billingPeriod: value as "monthly" | "yearly" | "one-time" })}
                            >
                              <SelectTrigger data-testid="select-billing-period">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                                <SelectItem value="one-time">One-time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Order Index</label>
                            <Input
                              type="number"
                              value={subscriptionFormData.orderIndex}
                              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, orderIndex: parseInt(e.target.value) || 0 })}
                              data-testid="input-subscription-order"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Link to Stripe Price (for payment processing)</label>
                          <Select
                            value={subscriptionFormData.stripePriceId || "none"}
                            onValueChange={(value) => setSubscriptionFormData({ ...subscriptionFormData, stripePriceId: value === "none" ? null : value })}
                          >
                            <SelectTrigger data-testid="select-stripe-price">
                              <SelectValue placeholder="Select a Stripe price..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Stripe Price (Free plan)</SelectItem>
                              {stripeProducts?.data?.flatMap(product => 
                                product.prices.filter(p => p.active).map(price => (
                                  <SelectItem key={price.id} value={price.id}>
                                    {product.name} - {price.currency.toUpperCase()} {(price.unit_amount / 100).toFixed(2)}/{price.recurring?.interval || 'one-time'}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Link this plan to a Stripe price to enable payment processing
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={subscriptionFormData.isActive}
                            onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, isActive: checked })}
                            data-testid="switch-subscription-active"
                          />
                          <label className="text-sm font-medium">Active</label>
                        </div>
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-4">Feature Access</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscriptionFormData.featureEventsStandard}
                                onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, featureEventsStandard: checked })}
                                data-testid="switch-feature-events-standard"
                              />
                              <label className="text-sm">Events (Standard)</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscriptionFormData.featureEventsCompetitions}
                                onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, featureEventsCompetitions: checked })}
                                data-testid="switch-feature-events-competitions"
                              />
                              <label className="text-sm">Events (Competitions)</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscriptionFormData.featureReviews}
                                onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, featureReviews: checked })}
                                data-testid="switch-feature-reviews"
                              />
                              <label className="text-sm">Add Reviews</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscriptionFormData.featureCommunities}
                                onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, featureCommunities: checked })}
                                data-testid="switch-feature-communities"
                              />
                              <label className="text-sm">Communities</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscriptionFormData.featureConnections}
                                onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, featureConnections: checked })}
                                data-testid="switch-feature-connections"
                              />
                              <label className="text-sm">Connections</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscriptionFormData.featurePlay}
                                onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, featurePlay: checked })}
                                data-testid="switch-feature-play"
                              />
                              <label className="text-sm">Play</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscriptionFormData.featurePlayAddRequest}
                                onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, featurePlayAddRequest: checked })}
                                data-testid="switch-feature-play-add-request"
                              />
                              <label className="text-sm">Play (Add Request)</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={subscriptionFormData.featureSuggestEvent}
                                onCheckedChange={(checked) => setSubscriptionFormData({ ...subscriptionFormData, featureSuggestEvent: checked })}
                                data-testid="switch-feature-suggest-event"
                              />
                              <label className="text-sm">Suggest Event</label>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => {
                              if (editingSubscription) {
                                updateSubscriptionPlan.mutate({ id: editingSubscription.id, data: subscriptionFormData });
                              } else {
                                createSubscriptionPlan.mutate(subscriptionFormData);
                              }
                            }}
                            disabled={!subscriptionFormData.name || !subscriptionFormData.slug || createSubscriptionPlan.isPending || updateSubscriptionPlan.isPending}
                            data-testid="button-save-subscription"
                          >
                            {(createSubscriptionPlan.isPending || updateSubscriptionPlan.isPending) ? "Saving..." : editingSubscription ? "Update Plan" : "Create Plan"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowSubscriptionForm(false);
                              setEditingSubscription(null);
                              resetSubscriptionForm();
                            }}
                            data-testid="button-cancel-subscription"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {subscriptionPlans?.map((plan) => (
                    <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{plan.name}</h4>
                              {plan.isDefault && <Badge className="bg-primary text-primary-foreground">Default</Badge>}
                              {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                              <Badge variant="outline">
                                {plan.price === 0 ? "Free" : `$${plan.price}/${plan.billingPeriod}`}
                              </Badge>
                            </div>
                            {plan.description && (
                              <p className="text-muted-foreground text-sm mb-3">{plan.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {plan.featureEventsStandard && <Badge>Events</Badge>}
                              {plan.featureEventsCompetitions && <Badge>Competitions</Badge>}
                              {plan.featureReviews && <Badge>Add Reviews</Badge>}
                              {plan.featureCommunities && <Badge>Communities</Badge>}
                              {plan.featureConnections && <Badge>Connections</Badge>}
                              {plan.featurePlay && <Badge>Play</Badge>}
                              {plan.featurePlayAddRequest && <Badge>Play Requests</Badge>}
                              {plan.featureSuggestEvent && <Badge>Suggest Event</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!plan.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDefaultSubscriptionPlan.mutate(plan.id)}
                                disabled={setDefaultSubscriptionPlan.isPending}
                                data-testid={`button-set-default-subscription-${plan.id}`}
                              >
                                Set as Default
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingSubscription(plan);
                                setSubscriptionFormData({
                                  name: plan.name,
                                  slug: plan.slug,
                                  description: plan.description || "",
                                  price: plan.price,
                                  billingPeriod: (plan.billingPeriod as "monthly" | "yearly" | "one-time") || "monthly",
                                  stripePriceId: plan.stripePriceId || "",
                                  isActive: plan.isActive ?? true,
                                  orderIndex: plan.orderIndex ?? 0,
                                  featureEditorial: plan.featureEditorial ?? true,
                                  featureSuggestEvent: plan.featureSuggestEvent ?? false,
                                  featureEventsStandard: plan.featureEventsStandard ?? false,
                                  featureEventsCompetitions: plan.featureEventsCompetitions ?? false,
                                  featureReviews: plan.featureReviews ?? false,
                                  featureCommunities: plan.featureCommunities ?? false,
                                  featureConnections: plan.featureConnections ?? false,
                                  featurePlay: plan.featurePlay ?? false,
                                  featurePlayAddRequest: plan.featurePlayAddRequest ?? false,
                                });
                                setShowSubscriptionForm(false);
                              }}
                              data-testid={`button-edit-subscription-${plan.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" data-testid={`button-delete-subscription-${plan.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{plan.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSubscriptionPlan.mutate(plan.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Control site branding and which sections are visible across the site.
                </p>
                <div className="space-y-6">
                  <PlatformNameInput 
                    initialValue={siteSettings?.platformName ?? "Mumbles Vibe"} 
                    onSave={(value) => updateSiteSettings.mutate({ platformName: value })}
                    isPending={updateSiteSettings.isPending}
                  />
                  <TaglineInput
                    initialValue={siteSettings?.tagline ?? ""}
                    onSave={(value) => updateSiteSettings.mutate({ tagline: value })}
                    isPending={updateSiteSettings.isPending}
                  />
                  <SocialLinksInput
                    twitterUrl={siteSettings?.twitterUrl ?? ""}
                    instagramUrl={siteSettings?.instagramUrl ?? ""}
                    youtubeUrl={siteSettings?.youtubeUrl ?? ""}
                    linkedinUrl={siteSettings?.linkedinUrl ?? ""}
                    tiktokUrl={siteSettings?.tiktokUrl ?? ""}
                    snapchatUrl={siteSettings?.snapchatUrl ?? ""}
                    onSave={(urls) => updateSiteSettings.mutate({ 
                      twitterUrl: urls.twitter || null, 
                      instagramUrl: urls.instagram || null,
                      youtubeUrl: urls.youtube || null,
                      linkedinUrl: urls.linkedin || null,
                      tiktokUrl: urls.tiktok || null,
                      snapchatUrl: urls.snapchat || null
                    })}
                    isPending={updateSiteSettings.isPending}
                  />
                  <LogoUpload
                    currentUrl={siteSettings?.logoUrl}
                    onSave={(url) => updateSiteSettings.mutate({ logoUrl: url })}
                    isPending={updateSiteSettings.isPending}
                  />
                  <FaviconUpload
                    currentUrl={siteSettings?.faviconUrl}
                    onSave={(url) => updateSiteSettings.mutate({ faviconUrl: url })}
                    isPending={updateSiteSettings.isPending}
                  />
                  <ColorSettingsInput
                    primaryColor={siteSettings?.primaryColor ?? ""}
                    secondaryColor={siteSettings?.secondaryColor ?? ""}
                    onSave={(colors) => updateSiteSettings.mutate({
                      primaryColor: colors.primaryColor || null,
                      secondaryColor: colors.secondaryColor || null
                    })}
                    isPending={updateSiteSettings.isPending}
                  />
                  <CtaSettingsInput
                    ctaHeading={siteSettings?.ctaHeading ?? "Got something to say?"}
                    ctaDescription={siteSettings?.ctaDescription ?? "Have a recommendation or need one? Share with the community."}
                    ctaButtonText={siteSettings?.ctaButtonText ?? "Join the Conversation"}
                    onSave={(heading, description, buttonText) => updateSiteSettings.mutate({ 
                      ctaHeading: heading, 
                      ctaDescription: description,
                      ctaButtonText: buttonText
                    })}
                    isPending={updateSiteSettings.isPending}
                  />
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Currency Symbol</h4>
                    <p className="text-sm text-muted-foreground mb-3">Select the currency symbol to display for subscription pricing.</p>
                    <Select
                      value={siteSettings?.currency ?? "$"}
                      onValueChange={(value) => updateSiteSettings.mutate({ currency: value })}
                      disabled={updateSiteSettings.isPending}
                    >
                      <SelectTrigger className="w-48" data-testid="select-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="$">$ (USD)</SelectItem>
                        <SelectItem value="£">£ (GBP)</SelectItem>
                        <SelectItem value="€">€ (EUR)</SelectItem>
                        <SelectItem value="¥">¥ (JPY/CNY)</SelectItem>
                        <SelectItem value="₹">₹ (INR)</SelectItem>
                        <SelectItem value="A$">A$ (AUD)</SelectItem>
                        <SelectItem value="C$">C$ (CAD)</SelectItem>
                        <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Use Default Terms of Service</h4>
                        <p className="text-sm text-muted-foreground">Toggle on to see the default template. You can edit it below.</p>
                      </div>
                      <Switch
                        checked={siteSettings?.useDefaultTerms ?? false}
                        onCheckedChange={(checked) => updateSiteSettings.mutate({ useDefaultTerms: checked })}
                        disabled={updateSiteSettings.isPending}
                        data-testid="switch-default-terms"
                      />
                    </div>
                    <ContentEditor
                      title="Terms of Service"
                      description={siteSettings?.useDefaultTerms ? "Default template shown below. Edit to customize or toggle off to start fresh." : "The legal terms and conditions for using your site."}
                      initialValue={siteSettings?.useDefaultTerms ? getDefaultTermsContent() : (siteSettings?.termsOfService ?? "")}
                      onSave={(value) => updateSiteSettings.mutate({ termsOfService: value || null, useDefaultTerms: false })}
                      isPending={updateSiteSettings.isPending}
                      testId="input-terms"
                      useRichText={true}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Use Default Privacy Policy</h4>
                        <p className="text-sm text-muted-foreground">Toggle on to see the default template. You can edit it below.</p>
                      </div>
                      <Switch
                        checked={siteSettings?.useDefaultPrivacy ?? false}
                        onCheckedChange={(checked) => updateSiteSettings.mutate({ useDefaultPrivacy: checked })}
                        disabled={updateSiteSettings.isPending}
                        data-testid="switch-default-privacy"
                      />
                    </div>
                    <ContentEditor
                      title="Privacy Policy"
                      description={siteSettings?.useDefaultPrivacy ? "Default template shown below. Edit to customize or toggle off to start fresh." : "Your site's privacy policy."}
                      initialValue={siteSettings?.useDefaultPrivacy ? getDefaultPrivacyContent() : (siteSettings?.privacyPolicy ?? "")}
                      onSave={(value) => updateSiteSettings.mutate({ privacyPolicy: value || null, useDefaultPrivacy: false })}
                      isPending={updateSiteSettings.isPending}
                      testId="input-privacy"
                      useRichText={true}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                    <div>
                      <h4 className="font-medium">Platform Live</h4>
                      <p className="text-sm text-muted-foreground">When off, visitors see a "Coming Soon" page. Admins can still access the full platform.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.platformLive ?? false}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ platformLive: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-platform-live"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Allow Login from Platform</h4>
                      <p className="text-sm text-muted-foreground">When off, Sign In and Sign Up buttons are hidden. Only admins can still log in and see the logout option.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.allowPlatformLogin ?? true}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ allowPlatformLogin: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-allow-platform-login"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Events</h4>
                      <p className="text-sm text-muted-foreground">Show events listings and calendar.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.showEvents ?? true}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ showEvents: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-events-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Podcasts</h4>
                      <p className="text-sm text-muted-foreground">Show podcasts and live streams section.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.showPodcasts ?? true}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ showPodcasts: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-podcasts-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Reviews</h4>
                      <p className="text-sm text-muted-foreground">Show member reviews section.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.showReviews ?? true}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ showReviews: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-reviews-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Communities</h4>
                      <p className="text-sm text-muted-foreground">Show community posts and groups.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.showCommunity ?? true}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ showCommunity: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-community-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Connections</h4>
                      <p className="text-sm text-muted-foreground">Show member search and connections feature.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.showConnections ?? true}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ showConnections: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-connections-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Play</h4>
                      <p className="text-sm text-muted-foreground">Show play requests for members to find matches.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.showPlay ?? true}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ showPlay: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-play-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Ecommerce</h4>
                      <p className="text-sm text-muted-foreground">Show online shop and product listings.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.showEcommerce ?? false}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ showEcommerce: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-ecommerce-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Fill Competition Allowed</h4>
                      <p className="text-sm text-muted-foreground">Show the Fill Competition option in event competition management.</p>
                    </div>
                    <Switch
                      checked={siteSettings?.fillCompetitionAllowed ?? true}
                      onCheckedChange={(checked) => updateSiteSettings.mutate({ fillCompetitionAllowed: checked })}
                      disabled={updateSiteSettings.isPending}
                      data-testid="switch-fill-competition-allowed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Edit Review Dialog */}
        <Dialog open={!!editingReview} onOpenChange={(open) => !open && setEditingReview(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Review</DialogTitle>
            </DialogHeader>
            {editingReview && (
              <ReviewEditForm
                review={editingReview}
                onSave={(data) => updateReview.mutate({ id: editingReview.id, data })}
                onCancel={() => setEditingReview(null)}
                isPending={updateReview.isPending}
                categories={reviewCategoriesData || []}
              />
            )}
          </DialogContent>
        </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText || "Confirm"}
        variant={confirmDialog.variant || "default"}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, open: false });
        }}
      />

      {/* Input Dialog */}
      <Dialog open={inputDialog.open} onOpenChange={(open) => !open && setInputDialog({ ...inputDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{inputDialog.title}</DialogTitle>
            <DialogDescription>{inputDialog.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={inputDialog.placeholder}
              value={inputDialog.value}
              onChange={(e) => setInputDialog({ ...inputDialog, value: e.target.value })}
              data-testid="input-dialog-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInputDialog({ ...inputDialog, open: false })} data-testid="button-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={() => {
              inputDialog.onConfirm(inputDialog.value);
              setInputDialog({ ...inputDialog, open: false, value: "" });
            }} data-testid="button-dialog-submit">
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlatformNameInput({ 
  initialValue, 
  onSave, 
  isPending 
}: { 
  initialValue: string; 
  onSave: (value: string) => void; 
  isPending: boolean; 
}) {
  const [value, setValue] = useState(initialValue);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setValue(initialValue);
    setHasChanges(false);
  }, [initialValue]);

  const handleSave = () => {
    if (value.trim() && value !== initialValue) {
      onSave(value.trim());
      setHasChanges(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-2">Platform Name</h4>
      <p className="text-sm text-muted-foreground mb-3">This name appears in page titles, copyright, and site branding.</p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHasChanges(e.target.value !== initialValue);
          }}
          placeholder="Enter platform name"
          className="max-w-xs"
          data-testid="input-platform-name"
        />
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isPending || !value.trim()}
            data-testid="button-save-platform-name"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

function TaglineInput({ 
  initialValue, 
  onSave, 
  isPending 
}: { 
  initialValue: string; 
  onSave: (value: string) => void; 
  isPending: boolean; 
}) {
  const [value, setValue] = useState(initialValue);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setValue(initialValue);
    setHasChanges(false);
  }, [initialValue]);

  const handleSave = () => {
    if (value !== initialValue) {
      onSave(value.trim());
      setHasChanges(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-2">Site Tagline</h4>
      <p className="text-sm text-muted-foreground mb-3">This text appears in the footer describing your site.</p>
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHasChanges(e.target.value !== initialValue);
          }}
          placeholder="Enter site tagline"
          className="max-w-lg"
          rows={3}
          data-testid="input-tagline"
        />
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isPending}
            data-testid="button-save-tagline"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ColorSettingsInput({
  primaryColor,
  secondaryColor,
  onSave,
  isPending
}: {
  primaryColor: string;
  secondaryColor: string;
  onSave: (colors: { primaryColor: string; secondaryColor: string }) => void;
  isPending: boolean;
}) {
  const [primary, setPrimary] = useState(primaryColor || "#1a8fc4");
  const [secondary, setSecondary] = useState(secondaryColor || "#d4dce4");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (primaryColor) setPrimary(primaryColor);
    if (secondaryColor) setSecondary(secondaryColor);
    setHasChanges(false);
  }, [primaryColor, secondaryColor]);

  const handleSave = () => {
    onSave({ primaryColor: primary, secondaryColor: secondary });
    setHasChanges(false);
  };

  const handleReset = () => {
    onSave({ primaryColor: "", secondaryColor: "" });
    setPrimary("#1a8fc4");
    setSecondary("#d4dce4");
    setHasChanges(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-2">Brand Colours</h4>
      <p className="text-sm text-muted-foreground mb-4">Set the primary and secondary colours for your site. These will be applied across buttons, links, and accents.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Primary Colour</label>
          <p className="text-xs text-muted-foreground mb-2">Used for buttons, links, and main accents.</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primary}
              onChange={(e) => {
                setPrimary(e.target.value);
                setHasChanges(true);
              }}
              className="w-12 h-10 rounded border cursor-pointer"
              data-testid="input-primary-color"
            />
            <Input
              value={primary}
              onChange={(e) => {
                setPrimary(e.target.value);
                setHasChanges(true);
              }}
              placeholder="#1a8fc4"
              className="w-32 font-mono text-sm"
              data-testid="input-primary-color-hex"
            />
            <div
              className="w-24 h-10 rounded border"
              style={{ backgroundColor: primary }}
              data-testid="preview-primary-color"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Secondary Colour</label>
          <p className="text-xs text-muted-foreground mb-2">Used for secondary buttons and subtle backgrounds.</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondary}
              onChange={(e) => {
                setSecondary(e.target.value);
                setHasChanges(true);
              }}
              className="w-12 h-10 rounded border cursor-pointer"
              data-testid="input-secondary-color"
            />
            <Input
              value={secondary}
              onChange={(e) => {
                setSecondary(e.target.value);
                setHasChanges(true);
              }}
              placeholder="#d4dce4"
              className="w-32 font-mono text-sm"
              data-testid="input-secondary-color-hex"
            />
            <div
              className="w-24 h-10 rounded border"
              style={{ backgroundColor: secondary }}
              data-testid="preview-secondary-color"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          size="sm"
          data-testid="button-save-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Save Colours
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          disabled={isPending || (!primaryColor && !secondaryColor)}
          data-testid="button-reset-colors"
        >
          Reset to Default
        </Button>
      </div>
    </div>
  );
}

function CtaSettingsInput({
  ctaHeading,
  ctaDescription,
  ctaButtonText,
  onSave,
  isPending
}: {
  ctaHeading: string;
  ctaDescription: string;
  ctaButtonText: string;
  onSave: (heading: string, description: string, buttonText: string) => void;
  isPending: boolean;
}) {
  const [heading, setHeading] = useState(ctaHeading);
  const [description, setDescription] = useState(ctaDescription);
  const [buttonText, setButtonText] = useState(ctaButtonText);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHeading(ctaHeading);
    setDescription(ctaDescription);
    setButtonText(ctaButtonText);
    setHasChanges(false);
  }, [ctaHeading, ctaDescription, ctaButtonText]);

  const checkChanges = (h: string, d: string, b: string) => {
    setHasChanges(h !== ctaHeading || d !== ctaDescription || b !== ctaButtonText);
  };

  const handleSave = () => {
    onSave(heading.trim(), description.trim(), buttonText.trim());
    setHasChanges(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-2">Homepage CTA Section</h4>
      <p className="text-sm text-muted-foreground mb-3">Customize the call-to-action section on the homepage.</p>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Heading</label>
          <Input
            value={heading}
            onChange={(e) => {
              setHeading(e.target.value);
              checkChanges(e.target.value, description, buttonText);
            }}
            placeholder="Got something to say?"
            data-testid="input-cta-heading"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              checkChanges(heading, e.target.value, buttonText);
            }}
            placeholder="Have a recommendation or need one? Share with the community."
            rows={2}
            data-testid="input-cta-description"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Button Text</label>
          <Input
            value={buttonText}
            onChange={(e) => {
              setButtonText(e.target.value);
              checkChanges(heading, description, e.target.value);
            }}
            placeholder="Join the Conversation"
            data-testid="input-cta-button-text"
          />
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isPending}
            data-testid="button-save-cta"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

function LogoUpload({
  currentUrl,
  onSave,
  isPending
}: {
  currentUrl: string | null | undefined;
  onSave: (url: string | null) => void;
  isPending: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/uploads/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { url } = res.data;
      onSave(url);
      toast({ title: "Logo updated", description: "Your site logo has been updated." });
    } catch {
      toast({ title: "Upload failed", description: "Failed to upload logo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-2">Site Logo</h4>
      <p className="text-sm text-muted-foreground mb-3">Upload a logo image that appears in the header and footer.</p>
      <div className="flex items-center gap-4">
        {currentUrl && (
          <img src={currentUrl} alt="Current logo" className="h-16 w-auto object-contain border rounded p-1" />
        )}
        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading || isPending}
            className="max-w-xs"
            data-testid="input-logo-upload"
          />
          {currentUrl && (
            <Button 
              variant="outline" 
              onClick={() => onSave(null)} 
              disabled={isPending}
              data-testid="button-remove-logo"
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FaviconUpload({
  currentUrl,
  onSave,
  isPending
}: {
  currentUrl: string | null | undefined;
  onSave: (url: string | null) => void;
  isPending: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/uploads/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { url } = res.data;
      onSave(url);
      toast({ title: "Favicon updated", description: "Your site favicon has been updated." });
    } catch {
      toast({ title: "Upload failed", description: "Failed to upload favicon", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-2">Site Favicon</h4>
      <p className="text-sm text-muted-foreground mb-3">Upload a favicon (browser tab icon). Recommended: 32x32 or 64x64 pixels, PNG or ICO format.</p>
      <div className="flex items-center gap-4">
        {currentUrl && (
          <img src={currentUrl} alt="Current favicon" className="h-8 w-8 object-contain border rounded p-1" />
        )}
        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*,.ico"
            onChange={handleUpload}
            disabled={uploading || isPending}
            className="max-w-xs"
            data-testid="input-favicon-upload"
          />
          {currentUrl && (
            <Button 
              variant="outline" 
              onClick={() => onSave(null)} 
              disabled={isPending}
              data-testid="button-remove-favicon"
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentEditor({
  title,
  description,
  initialValue,
  onSave,
  isPending,
  testId,
  useRichText = false
}: {
  title: string;
  description: string;
  initialValue: string;
  onSave: (value: string) => void;
  isPending: boolean;
  testId: string;
  useRichText?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setValue(initialValue);
    setHasChanges(false);
  }, [initialValue]);

  const handleSave = () => {
    if (value !== initialValue) {
      onSave(value);
      setHasChanges(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="space-y-2">
        {useRichText ? (
          <RichTextEditor
              value={value}
              onChange={(newValue) => {
                setValue(newValue);
                setHasChanges(newValue !== initialValue);
              }}
              placeholder={`Enter ${title.toLowerCase()} content...`}
            />
        ) : (
          <Textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHasChanges(e.target.value !== initialValue);
            }}
            placeholder={`Enter ${title.toLowerCase()} content...`}
            className="min-h-[200px] font-mono text-sm"
            rows={12}
            data-testid={testId}
          />
        )}
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isPending}
            data-testid={`button-save-${testId}`}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

function SocialLinksInput({
  twitterUrl,
  instagramUrl,
  youtubeUrl,
  linkedinUrl,
  tiktokUrl,
  snapchatUrl,
  onSave,
  isPending
}: {
  twitterUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  tiktokUrl: string;
  snapchatUrl: string;
  onSave: (urls: { twitter: string; instagram: string; youtube: string; linkedin: string; tiktok: string; snapchat: string }) => void;
  isPending: boolean;
}) {
  const [twitter, setTwitter] = useState(twitterUrl);
  const [instagram, setInstagram] = useState(instagramUrl);
  const [youtube, setYoutube] = useState(youtubeUrl);
  const [linkedin, setLinkedin] = useState(linkedinUrl);
  const [tiktok, setTiktok] = useState(tiktokUrl);
  const [snapchat, setSnapchat] = useState(snapchatUrl);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTwitter(twitterUrl);
    setInstagram(instagramUrl);
    setYoutube(youtubeUrl);
    setLinkedin(linkedinUrl);
    setTiktok(tiktokUrl);
    setSnapchat(snapchatUrl);
    setHasChanges(false);
  }, [twitterUrl, instagramUrl, youtubeUrl, linkedinUrl, tiktokUrl, snapchatUrl]);

  const checkChanges = (urls: { twitter: string; instagram: string; youtube: string; linkedin: string; tiktok: string; snapchat: string }) => {
    setHasChanges(
      urls.twitter !== twitterUrl || 
      urls.instagram !== instagramUrl ||
      urls.youtube !== youtubeUrl ||
      urls.linkedin !== linkedinUrl ||
      urls.tiktok !== tiktokUrl ||
      urls.snapchat !== snapchatUrl
    );
  };

  const handleSave = () => {
    onSave({
      twitter: twitter.trim(),
      instagram: instagram.trim(),
      youtube: youtube.trim(),
      linkedin: linkedin.trim(),
      tiktok: tiktok.trim(),
      snapchat: snapchat.trim()
    });
    setHasChanges(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-2">Social Media Links</h4>
      <p className="text-sm text-muted-foreground mb-3">These links appear in the footer. Leave blank to hide.</p>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Twitter className="h-5 w-5 text-muted-foreground" />
          <Input
            value={twitter}
            onChange={(e) => {
              setTwitter(e.target.value);
              checkChanges({ twitter: e.target.value, instagram, youtube, linkedin, tiktok, snapchat });
            }}
            placeholder="https://x.com/yourhandle"
            className="max-w-md"
            data-testid="input-twitter-url"
          />
        </div>
        <div className="flex items-center gap-2">
          <Instagram className="h-5 w-5 text-muted-foreground" />
          <Input
            value={instagram}
            onChange={(e) => {
              setInstagram(e.target.value);
              checkChanges({ twitter, instagram: e.target.value, youtube, linkedin, tiktok, snapchat });
            }}
            placeholder="https://instagram.com/yourhandle"
            className="max-w-md"
            data-testid="input-instagram-url"
          />
        </div>
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-muted-foreground" />
          <Input
            value={youtube}
            onChange={(e) => {
              setYoutube(e.target.value);
              checkChanges({ twitter, instagram, youtube: e.target.value, linkedin, tiktok, snapchat });
            }}
            placeholder="https://youtube.com/@yourchannel"
            className="max-w-md"
            data-testid="input-youtube-url"
          />
        </div>
        <div className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-muted-foreground" />
          <Input
            value={linkedin}
            onChange={(e) => {
              setLinkedin(e.target.value);
              checkChanges({ twitter, instagram, youtube, linkedin: e.target.value, tiktok, snapchat });
            }}
            placeholder="https://linkedin.com/company/yourcompany"
            className="max-w-md"
            data-testid="input-linkedin-url"
          />
        </div>
        <div className="flex items-center gap-2">
          <SiTiktok className="h-5 w-5 text-muted-foreground" />
          <Input
            value={tiktok}
            onChange={(e) => {
              setTiktok(e.target.value);
              checkChanges({ twitter, instagram, youtube, linkedin, tiktok: e.target.value, snapchat });
            }}
            placeholder="https://tiktok.com/@yourhandle"
            className="max-w-md"
            data-testid="input-tiktok-url"
          />
        </div>
        <div className="flex items-center gap-2">
          <SiSnapchat className="h-5 w-5 text-muted-foreground" />
          <Input
            value={snapchat}
            onChange={(e) => {
              setSnapchat(e.target.value);
              checkChanges({ twitter, instagram, youtube, linkedin, tiktok, snapchat: e.target.value });
            }}
            placeholder="https://snapchat.com/add/yourhandle"
            className="max-w-md"
            data-testid="input-snapchat-url"
          />
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isPending}
            data-testid="button-save-social-links"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewEditForm({
  review,
  onSave,
  onCancel,
  isPending,
  categories
}: {
  review: ReviewWithAuthor;
  onSave: (data: Partial<MemberReview>) => void;
  onCancel: () => void;
  isPending: boolean;
  categories: ReviewCategoryRecord[];
}) {
  const [formData, setFormData] = useState({
    title: review.title,
    placeName: review.placeName,
    category: review.category,
    summary: review.summary,
    liked: review.liked,
    disliked: review.disliked,
    rating: review.rating,
    imageUrl: review.imageUrl || "",
  });

  const handleImageChange = (url: string | null) => {
    setFormData({ ...formData, imageUrl: url || "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      imageUrl: formData.imageUrl || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-muted/50 rounded-md">
        <p className="text-sm">
          <span className="text-muted-foreground">Submitted by:</span>{" "}
          <span className="font-medium">{review.authorName}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            data-testid="input-edit-review-title"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Place Name</label>
          <Input
            value={formData.placeName}
            onChange={(e) => setFormData({ ...formData, placeName: e.target.value })}
            data-testid="input-edit-review-place"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as typeof formData.category })}
          >
            <SelectTrigger data-testid="select-edit-review-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 ? (
                [...categories]
                  .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon && <span className="mr-2">{cat.icon}</span>}
                      {cat.name}
                    </SelectItem>
                  ))
              ) : (
                <>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Accommodation">Accommodation</SelectItem>
                  <SelectItem value="Attraction">Attraction</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex gap-1 pt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 cursor-pointer ${star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                onClick={() => setFormData({ ...formData, rating: star })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Summary</label>
        <Textarea
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          rows={2}
          data-testid="textarea-edit-review-summary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">What they liked</label>
        <Textarea
          value={formData.liked}
          onChange={(e) => setFormData({ ...formData, liked: e.target.value })}
          rows={2}
          data-testid="textarea-edit-review-liked"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">What could be improved</label>
        <Textarea
          value={formData.disliked}
          onChange={(e) => setFormData({ ...formData, disliked: e.target.value })}
          rows={2}
          data-testid="textarea-edit-review-disliked"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Image (optional)</label>
        <ImageUpload
          value={formData.imageUrl || null}
          onChange={handleImageChange}
          className="max-w-md"
          testId="edit-review-image"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-edit-review">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-edit-review">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function getDefaultTermsContent(): string {
  return `<h1>Terms of Service</h1>
<p>Last updated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

<h2>1. Agreement to Terms</h2>
<p>By accessing and using MumblesVibe.com (the "Site"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this Site. These terms are governed by the laws of England and Wales.</p>

<h2>2. Use of the Site</h2>
<p>MumblesVibe is a community website providing information about the village of Mumbles, Swansea, including local articles, events, and community features. You may use our Site for lawful purposes only.</p>
<p>You agree not to:</p>
<ul>
<li>Use the Site in any way that violates any applicable local, national, or international law</li>
<li>Attempt to gain unauthorised access to any portion of the Site</li>
<li>Use the Site to transmit any advertising or promotional material without our prior consent</li>
<li>Impersonate or attempt to impersonate MumblesVibe, its employees, or other users</li>
<li>Engage in any conduct that restricts or inhibits anyone's use of the Site</li>
</ul>

<h2>3. Intellectual Property Rights</h2>
<p>Unless otherwise stated, MumblesVibe and/or its licensors own the intellectual property rights for all material on this Site. All intellectual property rights are reserved.</p>
<p>You may view and/or print pages from the Site for your own personal use subject to restrictions set in these terms. You must not republish, sell, rent, sub-license, reproduce, duplicate, or copy material from MumblesVibe without our express written permission.</p>

<h2>4. User Content</h2>
<p>If you submit content to our Site (such as comments or newsletter subscriptions), you grant MumblesVibe a non-exclusive, royalty-free, perpetual licence to use, reproduce, edit, and authorise others to use your content in any media.</p>
<p>You warrant that any content you submit is accurate, does not infringe any third party's rights, and is not defamatory, obscene, or otherwise unlawful.</p>

<h2>5. Third-Party Links and Services</h2>
<p>Our Site contains links to third-party websites and services. These links are provided for your convenience only.</p>
<p>We have no control over the content, privacy policies, or practices of any third-party sites or services. You acknowledge and agree that MumblesVibe shall not be responsible or liable for any damage or loss caused by your use of any third-party websites or services.</p>

<h2>6. Disclaimer of Warranties</h2>
<p>The information on this Site is provided "as is" without any representations or warranties, express or implied. MumblesVibe makes no representations or warranties in relation to this Site or the information and materials provided herein.</p>

<h2>7. Limitation of Liability</h2>
<p>To the maximum extent permitted by applicable law, MumblesVibe shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.</p>

<h2>8. Changes to Terms</h2>
<p>We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the updated terms on this page.</p>

<h2>9. Contact</h2>
<p>For any questions about these Terms of Service, please contact us.</p>`;
}

function getDefaultPrivacyContent(): string {
  return `<h1>Privacy Policy</h1>
<p>Last updated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

<h2>1. Introduction</h2>
<p>MumblesVibe ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website mumblesvibe.com (the "Site").</p>
<p>This policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>

<h2>2. Information We Collect</h2>
<h3>Personal Information</h3>
<p>We may collect personal information that you voluntarily provide when you:</p>
<ul>
<li>Subscribe to our newsletter (email address)</li>
<li>Contact us via our website</li>
<li>Submit content or enquiries</li>
</ul>

<h3>Automatically Collected Information</h3>
<p>When you visit our Site, we may automatically collect certain information including your IP address, browser type, device information, pages visited, and referring website. This information is collected using cookies and similar technologies.</p>

<h2>3. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
<li>Provide and maintain our Site</li>
<li>Send you our newsletter (if subscribed)</li>
<li>Respond to your enquiries</li>
<li>Improve our Site and services</li>
<li>Analyse usage patterns and trends</li>
<li>Comply with legal obligations</li>
</ul>

<h2>4. Legal Basis for Processing</h2>
<p>Under UK GDPR, we process your personal data based on:</p>
<ul>
<li><strong>Consent:</strong> Where you have given clear consent for us to process your personal data</li>
<li><strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate business interests</li>
<li><strong>Legal Obligation:</strong> Where processing is necessary to comply with UK law</li>
</ul>

<h2>5. Cookies</h2>
<p>Our Site uses cookies to enhance your browsing experience. Cookies are small text files stored on your device.</p>
<p>We use the following types of cookies:</p>
<ul>
<li><strong>Essential Cookies:</strong> Required for the Site to function properly</li>
<li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Site</li>
<li><strong>Preference Cookies:</strong> Remember your settings and preferences (e.g., dark mode)</li>
</ul>

<h2>6. Third-Party Services</h2>
<p>Our Site may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties.</p>

<h2>7. Your Rights</h2>
<p>Under UK GDPR, you have the following rights:</p>
<ul>
<li><strong>Right of Access:</strong> Request a copy of your personal data</li>
<li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
<li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
<li><strong>Right to Restrict Processing:</strong> Request limitation of processing</li>
<li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
<li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
<li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
</ul>

<h2>8. Data Retention</h2>
<p>We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required by law.</p>

<h2>9. Data Security</h2>
<p>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction.</p>

<h2>10. Contact Us</h2>
<p>If you have any questions about this Privacy Policy or our data practices, please contact us.</p>`;
}
