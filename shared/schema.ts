import { z } from "zod";

export * from "./models/auth";

export const defaultArticleCategories = [
  "Restaurants",
  "Things to Do",
  "Beaches",
  "Nightlife",
  "History",
  "Local Tips",
  "Shopping",
  "Family"
] as const;

export const articleCategories = defaultArticleCategories;
export type ArticleCategory = string;

export type ArticleCategoryRecord = {
  id: number;
  name: string;
  icon: string | null;
  orderIndex: number | null;
  createdAt: Date | null;
};

export const insertArticleCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string().optional(),
  orderIndex: z.number().optional()
});
export type InsertArticleCategory = z.infer<typeof insertArticleCategorySchema>;

export const defaultEventCategories = [
  "Music",
  "Festival",
  "Sports",
  "Community",
  "Food & Drink",
  "Arts & Culture",
  "Family Friendly",
  "Outdoor"
] as const;

export const eventTags = defaultEventCategories;
export type EventTag = string;

export type EventCategoryRecord = {
  id: number;
  name: string;
  icon: string | null;
  orderIndex: number | null;
  createdAt: Date | null;
};

export const insertEventCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string().optional(),
  orderIndex: z.number().optional()
});
export type InsertEventCategory = z.infer<typeof insertEventCategorySchema>;

export type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  heroImageUrl: string;
  imageUrls: string[];
  publishedAt: string;
  author: string;
  readingTime: number;
  boostedLikes: number | null;
};

export const insertArticleSchema = z.object({
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  excerpt: z.string(),
  content: z.string(),
  heroImageUrl: z.string(),
  imageUrls: z.array(z.string()).optional(),
  publishedAt: z.string(),
  author: z.string(),
  readingTime: z.number(),
  boostedLikes: z.number().optional()
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export const articleSectionTypes = ["text", "image", "gallery", "video"] as const;
export type ArticleSectionType = typeof articleSectionTypes[number];

export type ArticleSection = {
  id: string;
  articleId: string;
  orderIndex: number;
  sectionType: string;
  heading: string | null;
  content: string | null;
  mediaUrls: string[];
  mediaCaptions: string[];
  muxPlaybackId: string | null;
  muxAssetId: string | null;
};

export const insertArticleSectionSchema = z.object({
  articleId: z.string(),
  orderIndex: z.number(),
  sectionType: z.string(),
  heading: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  mediaUrls: z.array(z.string()).optional(),
  mediaCaptions: z.array(z.string()).optional(),
  muxPlaybackId: z.string().optional().nullable(),
  muxAssetId: z.string().optional().nullable()
});
export type InsertArticleSection = z.infer<typeof insertArticleSectionSchema>;

export type Podcast = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  heroImageUrl: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  author: string;
  publishedAt: string;
  isActive: boolean | null;
  createdAt: Date | null;
};

export const insertPodcastSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  heroImageUrl: z.string().optional().nullable(),
  mediaUrl: z.string().optional().nullable(),
  mediaType: z.string().optional().nullable(),
  author: z.string(),
  publishedAt: z.string(),
  isActive: z.boolean().optional()
});
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;

export type PodcastLike = {
  id: string;
  podcastId: string;
  userId: string;
};

export const insertPodcastLikeSchema = z.object({
  podcastId: z.string(),
  userId: z.string()
});

export type PodcastComment = {
  id: string;
  podcastId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  edited: boolean | null;
};

export const insertPodcastCommentSchema = z.object({
  podcastId: z.string(),
  userId: z.string(),
  parentCommentId: z.string().optional().nullable(),
  content: z.string()
});
export type InsertPodcastComment = z.infer<typeof insertPodcastCommentSchema>;

export const eventTypes = ["standard", "knockout", "team_competition", "individual_competition"] as const;
export type EventType = typeof eventTypes[number];

export const competitionFormats = ["scramble", "best_ball", "team_stableford", "other"] as const;
export type CompetitionFormat = typeof competitionFormats[number];

export type Event = {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string | null;
  venueName: string;
  address: string;
  summary: string;
  description: string;
  imageUrl: string;
  tags: EventTag[];
  ticketUrl: string | null;
  isFeatured: boolean | null;
  isCarousel: boolean | null;
  isEventGroup: boolean | null;
  linkedGroupId: string | null;
  eventType: string | null;
  maxEntries: number | null;
  teamSize: number | null;
  entryFee: string | null;
  signupDeadline: string | null;
  competitionFormat: string | null;
  allowIndividualStableford: boolean | null;
  allowTeamHandicap: boolean | null;
  leagueTableSortOrder: string | null;
  stripeProductId: string | null;
  stripePriceId: string | null;
  adminLastSeenEntrantCount: number | null;
};

export const insertEventSchema = z.object({
  name: z.string(),
  slug: z.string(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  venueName: z.string(),
  address: z.string(),
  summary: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  tags: z.array(z.string()).optional(),
  ticketUrl: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isCarousel: z.boolean().optional(),
  isEventGroup: z.boolean().optional(),
  linkedGroupId: z.string().optional().nullable(),
  eventType: z.string().optional(),
  maxEntries: z.number().optional().nullable(),
  teamSize: z.number().optional().nullable(),
  entryFee: z.string().optional().nullable(),
  signupDeadline: z.string().optional().nullable(),
  competitionFormat: z.string().optional().nullable(),
  allowIndividualStableford: z.boolean().optional(),
  allowTeamHandicap: z.boolean().optional(),
  leagueTableSortOrder: z.string().optional().nullable(),
  stripeProductId: z.string().optional().nullable(),
  stripePriceId: z.string().optional().nullable(),
  adminLastSeenEntrantCount: z.number().optional()
});
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventEntry = {
  id: string;
  eventId: string;
  userId: string;
  teamName: string | null;
  playerNames: string[];
  assignedPlayerIds: string[];
  enteredAt: Date | null;
  paymentStatus: string | null;
  paymentAmount: string | null;
  signupType: string | null;
  playerCount: number | null;
  score: number | null;
  playerScores: Record<number, number>;
  playerHandicaps: Record<number, number>;
  stripePaymentId: string | null;
};

export const insertEventEntrySchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  teamName: z.string().optional().nullable(),
  playerNames: z.array(z.string()).optional(),
  assignedPlayerIds: z.array(z.string()).optional(),
  paymentStatus: z.string().optional(),
  paymentAmount: z.string().optional().nullable(),
  signupType: z.string().optional(),
  playerCount: z.number().optional(),
  score: z.number().optional().nullable(),
  playerScores: z.record(z.number()).optional(),
  playerHandicaps: z.record(z.number()).optional(),
  stripePaymentId: z.string().optional().nullable()
});
export type InsertEventEntry = z.infer<typeof insertEventEntrySchema>;

export type EventAttendee = {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  ticketNumber: number | null;
  createdAt: Date | null;
};

export const insertEventAttendeeSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  status: z.string().optional(),
  ticketNumber: z.number().optional().nullable()
});
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;

export type CompetitionTeam = {
  id: string;
  eventId: string;
  teamNumber: number;
  player1EntryId: string | null;
  player2EntryId: string | null;
  player3EntryId: string | null;
  player4EntryId: string | null;
  player5EntryId: string | null;
  player6EntryId: string | null;
  teamStableford: number | null;
  teamHandicap: number | null;
  teeTime: string | null;
  createdAt: Date | null;
};

export const insertCompetitionTeamSchema = z.object({
  eventId: z.string(),
  teamNumber: z.number(),
  player1EntryId: z.string().optional().nullable(),
  player2EntryId: z.string().optional().nullable(),
  player3EntryId: z.string().optional().nullable(),
  player4EntryId: z.string().optional().nullable(),
  player5EntryId: z.string().optional().nullable(),
  player6EntryId: z.string().optional().nullable(),
  teamStableford: z.number().optional().nullable(),
  teamHandicap: z.number().optional().nullable(),
  teeTime: z.string().optional().nullable()
});
export type InsertCompetitionTeam = z.infer<typeof insertCompetitionTeamSchema>;

export type CompetitionBracket = {
  id: string;
  eventId: string;
  totalRounds: number;
  createdAt: Date | null;
};

export const insertCompetitionBracketSchema = z.object({
  eventId: z.string(),
  totalRounds: z.number()
});
export type InsertCompetitionBracket = z.infer<typeof insertCompetitionBracketSchema>;

export type CompetitionRound = {
  id: string;
  bracketId: string;
  roundNumber: number;
  roundName: string;
  deadline: Date | null;
  createdAt: Date | null;
};

export const insertCompetitionRoundSchema = z.object({
  bracketId: z.string(),
  roundNumber: z.number(),
  roundName: z.string(),
  deadline: z.date().optional().nullable()
});
export type InsertCompetitionRound = z.infer<typeof insertCompetitionRoundSchema>;

export type CompetitionMatch = {
  id: string;
  roundId: string;
  matchNumber: number;
  team1Id: string | null;
  team2Id: string | null;
  winnerId: string | null;
  score1: number | null;
  score2: number | null;
  resultSubmittedByTeamId: string | null;
  proposedWinnerId: string | null;
  resultSubmittedByUserId: string | null;
  resultConfirmedByUserId: string | null;
  resultConfirmedAt: Date | null;
  createdAt: Date | null;
};

export const insertCompetitionMatchSchema = z.object({
  roundId: z.string(),
  matchNumber: z.number(),
  team1Id: z.string().optional().nullable(),
  team2Id: z.string().optional().nullable(),
  winnerId: z.string().optional().nullable(),
  score1: z.number().optional().nullable(),
  score2: z.number().optional().nullable(),
  resultSubmittedByTeamId: z.string().optional().nullable(),
  proposedWinnerId: z.string().optional().nullable(),
  resultSubmittedByUserId: z.string().optional().nullable(),
  resultConfirmedByUserId: z.string().optional().nullable(),
  resultConfirmedAt: z.date().optional().nullable()
});
export type InsertCompetitionMatch = z.infer<typeof insertCompetitionMatchSchema>;

export type NewsletterSubscription = {
  id: string;
  email: string;
  subscribedAt: string;
};

export const insertNewsletterSchema = z.object({
  email: z.string().email()
});
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;

export type HeroSettings = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string | null;
  ctaLink: string | null;
};

export const insertHeroSettingsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  imageUrl: z.string(),
  ctaText: z.string().optional().nullable(),
  ctaLink: z.string().optional().nullable()
});
export type InsertHeroSettings = z.infer<typeof insertHeroSettingsSchema>;

export type InsiderTip = {
  id: string;
  title: string;
  tip: string;
  author: string;
  isActive: boolean | null;
};

export const insertInsiderTipSchema = z.object({
  title: z.string(),
  tip: z.string(),
  author: z.string(),
  isActive: z.boolean().optional()
});
export type InsertInsiderTip = z.infer<typeof insertInsiderTipSchema>;

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.enum(articleCategories),
  excerpt: z.string(),
  content: z.string(),
  heroImageUrl: z.string(),
  publishedAt: z.string(),
  author: z.string(),
  readingTime: z.number()
});

export const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  venueName: z.string(),
  address: z.string(),
  summary: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  tags: z.array(z.enum(eventTags)),
  ticketUrl: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false)
});

export const heroSettingsSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  imageUrl: z.string(),
  ctaText: z.string().optional().nullable(),
  ctaLink: z.string().optional().nullable()
});

export type UserProfile = {
  userId: string;
  mumblesVibeName: string;
  createdAt: Date | null;
};

export const insertUserProfileSchema = z.object({
  userId: z.string(),
  mumblesVibeName: z.string()
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type Comment = {
  id: string;
  articleId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  edited: boolean | null;
};

export const insertCommentSchema = z.object({
  articleId: z.string(),
  userId: z.string(),
  parentCommentId: z.string().optional().nullable(),
  content: z.string()
});
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type ArticleLike = {
  id: string;
  articleId: string;
  userId: string;
};

export const insertArticleLikeSchema = z.object({
  articleId: z.string(),
  userId: z.string()
});
export type InsertArticleLike = z.infer<typeof insertArticleLikeSchema>;

export const vibeCategories = ["Social", "Food", "Beach", "Music", "Sports", "Events", "Lost & Found", "Other"] as const;
export type VibeCategory = typeof vibeCategories[number];

export const vibeTypes = ["post", "recommendation", "ask"] as const;
export type VibeType = typeof vibeTypes[number];

export type Vibe = {
  id: string;
  userId: string;
  content: string;
  category: string;
  vibeType: string;
  imageUrls: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
  edited: boolean | null;
};

export const insertVibeSchema = z.object({
  userId: z.string(),
  content: z.string(),
  category: z.string(),
  vibeType: z.string().optional(),
  imageUrls: z.array(z.string()).optional()
});
export type InsertVibe = z.infer<typeof insertVibeSchema>;

export type VibeComment = {
  id: string;
  vibeId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date | null;
};

export const insertVibeCommentSchema = z.object({
  vibeId: z.string(),
  userId: z.string(),
  parentCommentId: z.string().optional().nullable(),
  content: z.string()
});
export type InsertVibeComment = z.infer<typeof insertVibeCommentSchema>;

export const vibeReactionTypes = ["wave", "heart", "laugh", "fire", "clap"] as const;
export type VibeReactionType = typeof vibeReactionTypes[number];

export type VibeReaction = {
  id: string;
  vibeId: string;
  userId: string;
  reactionType: string;
};

export const insertVibeReactionSchema = z.object({
  vibeId: z.string(),
  userId: z.string(),
  reactionType: z.string()
});
export type InsertVibeReaction = z.infer<typeof insertVibeReactionSchema>;

export const eventSuggestionStatus = ["pending", "approved", "rejected"] as const;
export type EventSuggestionStatus = typeof eventSuggestionStatus[number];

export type EventSuggestion = {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  venueName: string;
  address: string;
  summary: string;
  description: string;
  imageUrl: string | null;
  tags: EventTag[];
  ticketUrl: string | null;
  groupEventId: string | null;
  approvedEventId: string | null;
  status: string;
  createdAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
};

export const insertEventSuggestionSchema = z.object({
  userId: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  venueName: z.string(),
  address: z.string(),
  summary: z.string(),
  description: z.string(),
  imageUrl: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  ticketUrl: z.string().optional().nullable(),
  groupEventId: z.string().optional().nullable(),
  approvedEventId: z.string().optional().nullable()
});
export type InsertEventSuggestion = z.infer<typeof insertEventSuggestionSchema>;

export const defaultReviewCategories = [
  "Restaurant",
  "Bar",
  "Accommodation",
  "Attraction"
] as const;

export type ReviewCategoryRecord = {
  id: number;
  name: string;
  icon: string | null;
  orderIndex: number | null;
  createdAt: Date | null;
};

export const insertReviewCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string().optional(),
  orderIndex: z.number().optional()
});
export type InsertReviewCategory = z.infer<typeof insertReviewCategorySchema>;

export const reviewCategories = defaultReviewCategories;
export type ReviewCategory = typeof reviewCategories[number];

export const reviewStatus = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = typeof reviewStatus[number];

export type MemberReview = {
  id: string;
  userId: string;
  slug: string;
  category: string;
  placeName: string;
  title: string;
  summary: string;
  liked: string;
  disliked: string;
  rating: number;
  imageUrl: string | null;
  status: string;
  createdAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
};

export const insertMemberReviewSchema = z.object({
  userId: z.string(),
  category: z.string(),
  placeName: z.string(),
  title: z.string(),
  summary: z.string(),
  liked: z.string(),
  disliked: z.string(),
  rating: z.number(),
  imageUrl: z.string().optional().nullable()
});
export type InsertMemberReview = z.infer<typeof insertMemberReviewSchema>;

export type ReviewLike = {
  id: string;
  reviewId: string;
  userId: string;
};

export const insertReviewLikeSchema = z.object({
  reviewId: z.string(),
  userId: z.string()
});
export type InsertReviewLike = z.infer<typeof insertReviewLikeSchema>;

export type ReviewComment = {
  id: string;
  reviewId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  edited: boolean | null;
};

export const insertReviewCommentSchema = z.object({
  reviewId: z.string(),
  userId: z.string(),
  parentCommentId: z.string().optional().nullable(),
  content: z.string()
});
export type InsertReviewComment = z.infer<typeof insertReviewCommentSchema>;

export const pollTypes = ["standard", "ranking", "this_or_that"] as const;
export type PollType = typeof pollTypes[number];

export type Poll = {
  id: string;
  title: string;
  slug: string;
  pollType: string;
  imageUrl: string;
  options: string[];
  optionImages: (string | null)[];
  article: string | null;
  startDate: Date;
  durationHours: number;
  boostedVotes: number | null;
  createdAt: Date | null;
  isActive: boolean | null;
};

export const insertPollSchema = z.object({
  title: z.string(),
  pollType: z.string().optional(),
  imageUrl: z.string(),
  options: z.array(z.string()),
  optionImages: z.array(z.string().nullable()).optional(),
  article: z.string().optional().nullable(),
  startDate: z.date(),
  durationHours: z.number(),
  boostedVotes: z.number().optional(),
  isActive: z.boolean().optional()
});
export type InsertPoll = z.infer<typeof insertPollSchema>;

export type PollVote = {
  id: string;
  pollId: string;
  userId: string;
  optionIndex: number;
  createdAt: Date | null;
};

export const insertPollVoteSchema = z.object({
  pollId: z.string(),
  userId: z.string(),
  optionIndex: z.number()
});
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;

export type RankingVote = {
  id: string;
  pollId: string;
  userId: string;
  ranking: number[];
  createdAt: Date | null;
};

export const insertRankingVoteSchema = z.object({
  pollId: z.string(),
  userId: z.string(),
  ranking: z.array(z.number())
});
export type InsertRankingVote = z.infer<typeof insertRankingVoteSchema>;

export type ContactRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  type: string;
  createdAt: Date | null;
  isRead: boolean | null;
};

export const insertContactRequestSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().optional().nullable(),
  message: z.string(),
  type: z.string().optional()
});
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;

export type Group = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  createdBy: string;
  createdAt: Date | null;
  isActive: boolean | null;
  isPublic: boolean | null;
  eventId: string | null;
};

export const insertGroupSchema = z.object({
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().optional().nullable(),
  createdBy: z.string(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  eventId: z.string().optional().nullable()
});
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export const membershipStatus = ["pending", "approved", "rejected"] as const;
export type MembershipStatus = typeof membershipStatus[number];

export const membershipRole = ["member", "admin"] as const;
export type MembershipRole = typeof membershipRole[number];

export type GroupMembership = {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  status: string;
  requestedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
};

export const insertGroupMembershipSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  role: z.string().optional(),
  status: z.string().optional()
});
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;

export type GroupPost = {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  category: string;
  postType: string;
  imageUrls: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
  edited: boolean | null;
};

export const insertGroupPostSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  content: z.string(),
  category: z.string().optional(),
  postType: z.string().optional(),
  imageUrls: z.array(z.string()).optional()
});
export type InsertGroupPost = z.infer<typeof insertGroupPostSchema>;

export type GroupPostComment = {
  id: string;
  postId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date | null;
};

export const insertGroupPostCommentSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  parentCommentId: z.string().optional().nullable(),
  content: z.string()
});
export type InsertGroupPostComment = z.infer<typeof insertGroupPostCommentSchema>;

export type GroupPostReaction = {
  id: string;
  postId: string;
  userId: string;
  reactionType: string;
};

export const insertGroupPostReactionSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  reactionType: z.string()
});
export type InsertGroupPostReaction = z.infer<typeof insertGroupPostReactionSchema>;

export type SiteSettings = {
  id: string;
  platformName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  termsOfService: string | null;
  privacyPolicy: string | null;
  useDefaultTerms: boolean | null;
  useDefaultPrivacy: boolean | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
  showEvents: boolean | null;
  showReviews: boolean | null;
  showCommunity: boolean | null;
  showConnections: boolean | null;
  showPlay: boolean | null;
  showEcommerce: boolean | null;
  showPodcasts: boolean | null;
  platformLive: boolean | null;
  allowPlatformLogin: boolean | null;
  ctaHeading: string | null;
  ctaDescription: string | null;
  ctaButtonText: string | null;
  currency: string | null;
  fillCompetitionAllowed: boolean | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  updatedAt: Date | null;
};

export const updateSiteSettingsSchema = z.object({
  platformName: z.string().min(1).optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  termsOfService: z.string().optional().nullable(),
  privacyPolicy: z.string().optional().nullable(),
  useDefaultTerms: z.boolean().optional(),
  useDefaultPrivacy: z.boolean().optional(),
  twitterUrl: z.string().optional().nullable(),
  instagramUrl: z.string().optional().nullable(),
  youtubeUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  tiktokUrl: z.string().optional().nullable(),
  snapchatUrl: z.string().optional().nullable(),
  showEvents: z.boolean().optional(),
  showReviews: z.boolean().optional(),
  showCommunity: z.boolean().optional(),
  showConnections: z.boolean().optional(),
  showPlay: z.boolean().optional(),
  showEcommerce: z.boolean().optional(),
  showPodcasts: z.boolean().optional(),
  platformLive: z.boolean().optional(),
  allowPlatformLogin: z.boolean().optional(),
  ctaHeading: z.string().optional(),
  ctaDescription: z.string().optional(),
  ctaButtonText: z.string().optional(),
  currency: z.string().optional(),
  fillCompetitionAllowed: z.boolean().optional(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable()
});
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;

export type GroupEvent = {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  venueName: string;
  address: string;
  summary: string;
  description: string;
  imageUrl: string | null;
  tags: EventTag[];
  ticketUrl: string | null;
  showOnPublic: boolean | null;
  createdAt: Date | null;
};

export const insertGroupEventSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  venueName: z.string(),
  address: z.string(),
  summary: z.string(),
  description: z.string(),
  imageUrl: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  ticketUrl: z.string().optional().nullable(),
  showOnPublic: z.boolean().optional()
});
export type InsertGroupEvent = z.infer<typeof insertGroupEventSchema>;

export type GroupEventComment = {
  id: string;
  eventId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date | null;
};

export const insertGroupEventCommentSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  parentCommentId: z.string().optional().nullable(),
  content: z.string()
});
export type InsertGroupEventComment = z.infer<typeof insertGroupEventCommentSchema>;

export type GroupEventReaction = {
  id: string;
  eventId: string;
  userId: string;
  reactionType: string;
};

export const insertGroupEventReactionSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  reactionType: z.string()
});
export type InsertGroupEventReaction = z.infer<typeof insertGroupEventReactionSchema>;

export const profileFieldTypes = ["text", "select", "selector"] as const;
export type ProfileFieldType = typeof profileFieldTypes[number];

export type ProfileFieldDefinition = {
  id: number;
  label: string;
  slug: string;
  fieldType: string;
  description: string | null;
  isRequired: boolean | null;
  orderIndex: number | null;
  useOnPlayRequests: boolean | null;
  useOnTeeTimes: boolean | null;
  useOnPlayRequestOffers: boolean | null;
  createdAt: Date | null;
};

export const insertProfileFieldDefinitionSchema = z.object({
  label: z.string().min(1, "Label is required").max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, "Slug must be lowercase with underscores only"),
  fieldType: z.enum(profileFieldTypes),
  description: z.string().max(200).optional().nullable(),
  isRequired: z.boolean().optional(),
  orderIndex: z.number().optional(),
  useOnPlayRequests: z.boolean().optional(),
  useOnTeeTimes: z.boolean().optional(),
  useOnPlayRequestOffers: z.boolean().optional()
});
export type InsertProfileFieldDefinition = z.infer<typeof insertProfileFieldDefinitionSchema>;

export type ProfileFieldOption = {
  id: number;
  fieldId: number;
  label: string;
  value: string;
  orderIndex: number | null;
};

export const insertProfileFieldOptionSchema = z.object({
  fieldId: z.number(),
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  orderIndex: z.number().optional()
});
export type InsertProfileFieldOption = z.infer<typeof insertProfileFieldOptionSchema>;

export type ProfileFieldSelectorValue = {
  id: number;
  fieldId: number;
  value: string;
  createdAt: Date | null;
};

export const insertProfileFieldSelectorValueSchema = z.object({
  fieldId: z.number(),
  value: z.string().min(1).max(500)
});
export type InsertProfileFieldSelectorValue = z.infer<typeof insertProfileFieldSelectorValueSchema>;

export type UserProfileFieldValue = {
  id: number;
  userId: string;
  fieldId: number;
  value: string;
};

export const insertUserProfileFieldValueSchema = z.object({
  userId: z.string(),
  fieldId: z.number(),
  value: z.string().max(500)
});
export type InsertUserProfileFieldValue = z.infer<typeof insertUserProfileFieldValueSchema>;

export type ProfilePicture = {
  id: number;
  userId: string;
  imageUrl: string;
  caption: string | null;
  orderIndex: number | null;
  createdAt: Date | null;
};

export const insertProfilePictureSchema = z.object({
  userId: z.string(),
  imageUrl: z.string().url(),
  caption: z.string().max(200).optional().nullable(),
  orderIndex: z.number().optional()
});
export type InsertProfilePicture = z.infer<typeof insertProfilePictureSchema>;

export const connectionStatus = ["pending", "accepted", "rejected"] as const;
export type ConnectionStatus = typeof connectionStatus[number];

export type UserConnection = {
  id: number;
  requesterId: string;
  receiverId: string;
  status: string;
  message: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export const insertUserConnectionSchema = z.object({
  requesterId: z.string(),
  receiverId: z.string(),
  status: z.enum(connectionStatus).optional(),
  message: z.string().max(500).optional()
});
export type InsertUserConnection = z.infer<typeof insertUserConnectionSchema>;

export type Message = {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean | null;
  createdAt: Date | null;
};

export const insertMessageSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string().min(1).max(2000),
  isRead: z.boolean().optional()
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type PlayRequest = {
  id: number;
  userId: string;
  guests: string[];
  startDate: Date;
  startTime: string | null;
  endDate: Date | null;
  endTime: string | null;
  message: string | null;
  status: string | null;
  createdAt: Date | null;
};

export const insertPlayRequestSchema = z.object({
  userId: z.string(),
  guests: z.array(z.string()).max(7, "Maximum 7 guests allowed").optional(),
  startDate: z.string(),
  startTime: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  message: z.string().max(500).optional().nullable(),
  status: z.string().optional()
});
export type InsertPlayRequest = z.infer<typeof insertPlayRequestSchema>;

export type PlayRequestCriteria = {
  id: number;
  playRequestId: number;
  fieldId: number;
  value: string;
};

export const insertPlayRequestCriteriaSchema = z.object({
  playRequestId: z.number(),
  fieldId: z.number(),
  value: z.string()
});
export type InsertPlayRequestCriteria = z.infer<typeof insertPlayRequestCriteriaSchema>;

export type PlayRequestOffer = {
  id: number;
  playRequestId: number;
  userId: string;
  note: string | null;
  clubName: string | null;
  status: string | null;
  responseNote: string | null;
  createdAt: Date | null;
};

export const insertPlayRequestOfferSchema = z.object({
  playRequestId: z.number(),
  userId: z.string(),
  note: z.string().max(500).optional(),
  clubName: z.string().max(200).optional()
});
export type InsertPlayRequestOffer = z.infer<typeof insertPlayRequestOfferSchema>;

export type PlayRequestOfferCriteria = {
  id: number;
  playRequestOfferId: number;
  fieldId: number;
  fieldLabel: string;
  value: string;
};

export const insertPlayRequestOfferCriteriaSchema = z.object({
  playRequestOfferId: z.number(),
  fieldId: z.number(),
  fieldLabel: z.string(),
  value: z.string()
});
export type InsertPlayRequestOfferCriteria = z.infer<typeof insertPlayRequestOfferCriteriaSchema>;

export type TeeTimeOffer = {
  id: number;
  userId: string;
  dateTime: Date;
  homeClub: string;
  pricePerPerson: number;
  availableSpots: number;
  message: string | null;
  status: string | null;
  createdAt: Date | null;
};

export const insertTeeTimeOfferSchema = z.object({
  userId: z.string(),
  dateTime: z.string(),
  homeClub: z.string().min(1, "Home club is required").max(200),
  pricePerPerson: z.number().min(0, "Price must be positive"),
  availableSpots: z.number().min(1).max(3, "Maximum 3 available spots"),
  message: z.string().max(500).optional().nullable(),
  status: z.string().optional()
});
export type InsertTeeTimeOffer = z.infer<typeof insertTeeTimeOfferSchema>;

export type TeeTimeOfferCriteria = {
  id: number;
  teeTimeOfferId: number;
  fieldId: number;
  value: string;
};

export const insertTeeTimeOfferCriteriaSchema = z.object({
  teeTimeOfferId: z.number(),
  fieldId: z.number(),
  value: z.string()
});
export type InsertTeeTimeOfferCriteria = z.infer<typeof insertTeeTimeOfferCriteriaSchema>;

export type TeeTimeReservation = {
  id: number;
  teeTimeOfferId: number;
  userId: string;
  spotsRequested: number;
  guestNames: string[];
  status: string | null;
  responseNote: string | null;
  createdAt: Date | null;
};

export const insertTeeTimeReservationSchema = z.object({
  teeTimeOfferId: z.number(),
  userId: z.string(),
  spotsRequested: z.number().min(1),
  guestNames: z.array(z.string()).optional()
});
export type InsertTeeTimeReservation = z.infer<typeof insertTeeTimeReservationSchema>;

export const notificationTypes = [
  "incoming_request", 
  "request_accepted", 
  "request_declined", 
  "new_message",
  "competition_entry",
  "competition_added",
  "competition_winner",
  "team_confirmed",
  "first_match",
  "play_request",
  "play_request_offer",
  "group_membership_approved",
  "tee_time_reservation",
  "tee_time_accepted",
  "tee_time_declined"
] as const;

export type ConnectionNotification = {
  id: number;
  userId: string;
  type: string;
  connectionId: number | null;
  messageId: number | null;
  fromUserId: string | null;
  eventId: string | null;
  teamId: string | null;
  matchId: string | null;
  playRequestId: number | null;
  metadata: string | null;
  isRead: boolean | null;
  createdAt: Date | null;
};

export const insertConnectionNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(notificationTypes),
  connectionId: z.number().optional().nullable(),
  messageId: z.number().optional().nullable(),
  fromUserId: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  matchId: z.string().optional().nullable(),
  playRequestId: z.number().optional().nullable(),
  metadata: z.string().optional().nullable(),
  isRead: z.boolean().optional()
});
export type InsertConnectionNotification = z.infer<typeof insertConnectionNotificationSchema>;

export type SearchResultEvent = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  imageUrl: string | null;
  startDate: string;
  venueName: string;
};

export type SearchResultArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  heroImageUrl: string;
  category: string;
};

export type SearchResultReview = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  rating: number;
  category: string;
  imageUrl: string | null;
  venueName: string | null;
};

export type SearchResultUser = {
  id: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
  aboutMe: string | null;
  connectionStatus: 'connected' | 'pending' | 'none' | null;
};

export type SearchResultGroup = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  isPublic: boolean;
  memberCount?: number;
};

export type SearchResults = {
  query: string;
  events: SearchResultEvent[];
  articles: SearchResultArticle[];
  reviews: SearchResultReview[];
  users: SearchResultUser[];
  groups: SearchResultGroup[];
};

export type SubscriptionPlan = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billingPeriod: string | null;
  stripePriceId: string | null;
  isActive: boolean | null;
  isDefault: boolean | null;
  orderIndex: number | null;
  featureEditorial: boolean | null;
  featureEventsStandard: boolean | null;
  featureEventsCompetitions: boolean | null;
  featureReviews: boolean | null;
  featureCommunities: boolean | null;
  featureConnections: boolean | null;
  featurePlay: boolean | null;
  featurePlayAddRequest: boolean | null;
  featureSuggestEvent: boolean | null;
  createdAt: Date | null;
};

export const insertSubscriptionPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  slug: z.string().min(1, "Slug is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
  billingPeriod: z.enum(["monthly", "yearly", "one-time"]).optional(),
  stripePriceId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  orderIndex: z.number().optional(),
  featureEditorial: z.boolean().optional(),
  featureEventsStandard: z.boolean().optional(),
  featureEventsCompetitions: z.boolean().optional(),
  featureReviews: z.boolean().optional(),
  featureCommunities: z.boolean().optional(),
  featureConnections: z.boolean().optional(),
  featurePlay: z.boolean().optional(),
  featurePlayAddRequest: z.boolean().optional(),
  featureSuggestEvent: z.boolean().optional()
});
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Tenant = {
  id: string;
  name: string;
  domainName: string | null;
  subDomain: string | null;
  createdAt: Date | null;
};

export const insertTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  domainName: z.string().optional().nullable(),
  subDomain: z.string().optional().nullable(),
  adminEmail: z.string().email("Valid admin email is required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminName: z.string().min(1, "Admin name is required")
});
export type InsertTenant = z.infer<typeof insertTenantSchema>;
