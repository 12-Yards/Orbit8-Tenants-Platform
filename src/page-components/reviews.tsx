"use client";

import Link from "@/components/tenant-link";
import { tenantHref } from "@/lib/tenant-link";
import { useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Star, User, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from "@/components/feature-gate";
import { useToast } from "@/hooks/use-toast";
import { getIconByName } from "@/lib/icons";
import { type MemberReview, type SiteSettings, type ReviewCategoryRecord } from "@shared/schema";
import { format } from "date-fns";
import { FaFolder } from "react-icons/fa";
import {
  useGetReviewsQuery,
  useGetSiteSettingsQuery,
  useGetReviewCategoriesQuery,
  useGetReviewLikesQuery,
  useGetReviewLikedQuery,
  useGetReviewCommentsQuery,
  useLikeReviewMutation,
  useCreateReviewMutation,
} from "@/store/api";

interface ReviewWithAuthor extends MemberReview {
  authorName: string;
  authorProfileImageUrl: string | null;
}

const submitReviewSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  placeName: z.string().min(2, "Place name must be at least 2 characters"),
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  summary: z.string().min(10, "Summary must be at least 10 characters").max(300, "Summary must be less than 300 characters"),
  liked: z.string().min(10, "Please describe what you liked (at least 10 characters)"),
  disliked: z.string().min(10, "Please describe what could be improved (at least 10 characters)"),
  rating: z.number().min(1, "Please provide a rating").max(5, "Rating must be between 1 and 5"),
  imageUrl: z.string().optional().or(z.literal("")),
});

type SubmitReviewForm = z.infer<typeof submitReviewSchema>;

function StarRating({ rating, onChange, interactive = false }: { rating: number; onChange?: (rating: number) => void; interactive?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          } ${interactive ? "cursor-pointer" : ""}`}
          onClick={() => interactive && onChange?.(star)}
        />
      ))}
    </div>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Restaurant":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "Bar":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "Accommodation":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "Attraction":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "";
  }
}

function ReviewCard({ review, categories }: { review: ReviewWithAuthor; categories: ReviewCategoryRecord[] }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const categoryData = categories.find(c => c.name === review.category);
  const IconComp = getIconByName(categoryData?.icon);

  const { data: likesData } = useGetReviewLikesQuery(review.id) as { data: { count: number } | undefined };

  const { data: likedData } = useGetReviewLikedQuery(review.id, { skip: !isAuthenticated }) as { data: { liked: boolean } | undefined };

  const { data: commentsData } = useGetReviewCommentsQuery(review.id) as { data: unknown[] | undefined };

  const [triggerLike] = useLikeReviewMutation();

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ description: "Please sign in to like reviews" });
      return;
    }
    triggerLike(review.id)
      .unwrap()
      .catch(() => {
        toast({ variant: "destructive", description: "Failed to like review" });
      });
  };

  const commentCount = Array.isArray(commentsData) ? commentsData.length : 0;
  
  return (
    <Link href={`/reviews/${review.slug}`}>
      <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-review-${review.id}`}>
        {review.imageUrl && (
          <img 
            src={review.imageUrl} 
            alt={review.placeName}
            className="w-full aspect-[4/3] object-cover rounded-t-md"
          />
        )}
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Badge className={getCategoryColor(review.category)}>
              <IconComp className="h-3 w-3 mr-1" />
              {review.category}
            </Badge>
            <StarRating rating={review.rating} />
          </div>
          <div className="mt-2">
            <CardTitle className="text-base line-clamp-1" data-testid={`text-review-title-${review.id}`}>{review.title}</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">{review.placeName}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-review-summary-${review.id}`}>{review.summary}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={review.authorProfileImageUrl || undefined} />
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground" data-testid={`text-review-author-${review.id}`}>{review.authorName}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLikeClick}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-like-review-${review.id}`}
              >
                <Heart className={`h-4 w-4 ${likedData?.liked ? "fill-red-500 text-red-500" : ""}`} />
                <span>{likesData?.count || 0}</span>
              </button>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{commentCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ReviewCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-5 w-48 bg-muted animate-pulse rounded mt-2" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-16 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

export default function ReviewsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const { isAuthenticated, featureReviews } = useAuth();
  const { toast } = useToast();

  const { data: reviews, isLoading } = useGetReviewsQuery() as { data: ReviewWithAuthor[] | undefined; isLoading: boolean };

  const { data: siteSettings } = useGetSiteSettingsQuery() as { data: SiteSettings | undefined };

  const { data: reviewCategoriesData } = useGetReviewCategoriesQuery() as { data: ReviewCategoryRecord[] | undefined };

  const form = useForm<SubmitReviewForm>({
    resolver: zodResolver(submitReviewSchema),
    defaultValues: {
      category: undefined,
      placeName: "",
      title: "",
      summary: "",
      liked: "",
      disliked: "",
      rating: 0,
      imageUrl: "",
    },
  });

  const [triggerSubmitReview, { isLoading: submitLoading }] = useCreateReviewMutation();

  const onSubmit = (data: SubmitReviewForm) => {
    const cleanedData = {
      ...data,
      imageUrl: data.imageUrl || null,
    };
    triggerSubmitReview(cleanedData)
      .unwrap()
      .then(() => {
        toast({
          title: "Review Submitted",
          description: "Your review has been submitted for approval. It will appear once approved by our team.",
        });
        setDialogOpen(false);
        form.reset();
        setRatingValue(0);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
      });
  };

  const filteredReviews = selectedCategory
    ? reviews?.filter((r) => r.category === selectedCategory)
    : reviews;

  return (
    <div className="min-h-screen py-8 md:py-12">
      <SEO 
        title="Member Reviews"
        description="Read authentic reviews from Mumbles locals and visitors. Discover the best restaurants, bars, accommodations, and attractions based on real community experiences."
        canonicalUrl="/reviews"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <SectionHeader
            title="Member Reviews"
            description={`Real reviews from our ${siteSettings?.platformName || "Mumbles Vibe"} community`}
          />
          
          {isAuthenticated ? (
            featureReviews ? (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-write-review">
                    <Plus className="h-4 w-4 mr-2" />
                    Write a Review
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-review-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(reviewCategoriesData || []).map((category) => {
                                const IconComp = getIconByName(category.icon);
                                return (
                                  <SelectItem key={category.id} value={category.name}>
                                    <div className="flex items-center gap-2">
                                      <IconComp className="h-3 w-3" />
                                      {category.name}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="placeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Place Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              data-testid="input-review-place"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Title</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              data-testid="input-review-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating</FormLabel>
                          <FormControl>
                            <div className="pt-1">
                              <StarRating 
                                rating={ratingValue} 
                                onChange={(r) => {
                                  setRatingValue(r);
                                  field.onChange(r);
                                }}
                                interactive 
                              />
                            </div>
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
                          <FormLabel>Summary</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Brief overview of your experience..."
                              rows={2}
                              data-testid="textarea-review-summary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="liked"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What I liked</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="What did you enjoy about this place?"
                              rows={3}
                              data-testid="textarea-review-liked"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="disliked"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What could be improved</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Any areas for improvement?"
                              rows={3}
                              data-testid="textarea-review-disliked"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Photo (optional)</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value || ""}
                              onChange={field.onChange}
                              testId="review-image"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                        data-testid="button-cancel-review"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={submitLoading}
                        data-testid="button-submit-review"
                      >
                        {submitLoading ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
              </Dialog>
            ) : null
          ) : (
            <Button variant="outline" onClick={() => window.location.href = tenantHref("/signin")} data-testid="button-signin-to-review">
              Sign in to Write a Review
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            data-testid="button-filter-all"
          >
            All
          </Button>
          {(reviewCategoriesData || []).map((category) => {
            const IconComp = getIconByName(category.icon);
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                data-testid={`button-filter-${category.name.toLowerCase()}`}
              >
                <IconComp className="h-3 w-3 mr-1" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredReviews && filteredReviews.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} categories={reviewCategoriesData || []} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Be the first to share your experience and write a review.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
