import { prisma, getTenantPrisma, getCurrentTenantId } from "./db";
import {
  type Article,
  type InsertArticle,
  type ArticleSection,
  type InsertArticleSection,
  type Event,
  type InsertEvent,
  type NewsletterSubscription,
  type InsertNewsletter,
  type HeroSettings,
  type InsertHeroSettings,
  type InsiderTip,
  type InsertInsiderTip,
  type ArticleCategory,
  type ArticleCategoryRecord,
  type InsertArticleCategory,
  type EventCategoryRecord,
  type InsertEventCategory,
  type ReviewCategoryRecord,
  type InsertReviewCategory,
  type UserProfile,
  type InsertUserProfile,
  type Comment,
  type InsertComment,
  type ArticleLike,
  type InsertArticleLike,
  type Vibe,
  type InsertVibe,
  type VibeReaction,
  type InsertVibeReaction,
  type VibeComment,
  type InsertVibeComment,
  type EventSuggestion,
  type InsertEventSuggestion,
  type EventSuggestionStatus,
  type MemberReview,
  type InsertMemberReview,
  type ReviewStatus,
  type ReviewLike,
  type InsertReviewLike,
  type ReviewComment,
  type InsertReviewComment,
  type Poll,
  type InsertPoll,
  type PollVote,
  type InsertPollVote,
  type RankingVote,
  type InsertRankingVote,
  type ContactRequest,
  type InsertContactRequest,
  type Group,
  type InsertGroup,
  type GroupMembership,
  type InsertGroupMembership,
  type MembershipStatus,
  type GroupPost,
  type InsertGroupPost,
  type GroupPostComment,
  type InsertGroupPostComment,
  type GroupPostReaction,
  type InsertGroupPostReaction,
  type GroupEvent,
  type InsertGroupEvent,
  type GroupEventComment,
  type InsertGroupEventComment,
  type GroupEventReaction,
  type InsertGroupEventReaction,
  type SiteSettings,
  type UpdateSiteSettings,
  type ProfileFieldDefinition,
  type InsertProfileFieldDefinition,
  type ProfileFieldOption,
  type InsertProfileFieldOption,
  type ProfileFieldSelectorValue,
  type InsertProfileFieldSelectorValue,
  type UserProfileFieldValue,
  type InsertUserProfileFieldValue,
  type ProfilePicture,
  type InsertProfilePicture,
  type UserConnection,
  type Message,
  type ConnectionNotification,
  type SearchResults,
  type SearchResultEvent,
  type SearchResultArticle,
  type SearchResultReview,
  type SearchResultUser,
  type SearchResultGroup,
  type EventEntry,
  type InsertEventEntry,
  type CompetitionTeam,
  type InsertCompetitionTeam,
  type CompetitionBracket,
  type InsertCompetitionBracket,
  type CompetitionRound,
  type InsertCompetitionRound,
  type CompetitionMatch,
  type InsertCompetitionMatch,
  type PlayRequest,
  type InsertPlayRequest,
  type PlayRequestCriteria,
  type InsertPlayRequestCriteria,
  type PlayRequestOffer,
  type InsertPlayRequestOffer,
  type PlayRequestOfferCriteria,
  type InsertPlayRequestOfferCriteria,
  type TeeTimeOffer,
  type InsertTeeTimeOffer,
  type TeeTimeOfferCriteria,
  type InsertTeeTimeOfferCriteria,
  type TeeTimeReservation,
  type InsertTeeTimeReservation,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Podcast,
  type InsertPodcast,
  type PodcastLike,
  type PodcastComment,
  type InsertPodcastComment,
  type EventAttendee,
  type Tenant,
  type InsertTenant,
} from "@shared/schema";

export interface IStorage {
  getArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | undefined>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getArticlesByCategory(category: ArticleCategory): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;

  getArticleSections(articleId: string): Promise<ArticleSection[]>;
  createArticleSection(section: InsertArticleSection): Promise<ArticleSection>;
  updateArticleSection(id: string, updates: Partial<InsertArticleSection>): Promise<ArticleSection | undefined>;
  deleteArticleSection(id: string): Promise<boolean>;
  deleteArticleSectionsByArticle(articleId: string): Promise<boolean>;
  replaceArticleSections(articleId: string, sections: Omit<InsertArticleSection, 'articleId'>[]): Promise<ArticleSection[]>;

  getEvents(): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  subscribeNewsletter(email: InsertNewsletter): Promise<NewsletterSubscription>;
  getNewsletterSubscriptions(): Promise<NewsletterSubscription[]>;

  getHeroSettings(): Promise<HeroSettings>;
  updateHeroSettings(settings: InsertHeroSettings): Promise<HeroSettings>;

  getInsiderTips(): Promise<InsiderTip[]>;
  createInsiderTip(tip: InsertInsiderTip): Promise<InsiderTip>;
  updateInsiderTip(id: string, tip: Partial<InsertInsiderTip>): Promise<InsiderTip | undefined>;
  deleteInsiderTip(id: string): Promise<boolean>;

  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  getCommentsByArticle(articleId: string): Promise<Comment[]>;
  getCommentById(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, userId: string, content: string): Promise<Comment | undefined>;
  deleteComment(id: string, userId: string): Promise<boolean>;

  getArticleLikes(articleId: string): Promise<ArticleLike[]>;
  hasUserLikedArticle(articleId: string, userId: string): Promise<boolean>;
  toggleArticleLike(articleId: string, userId: string): Promise<boolean>;

  getPodcastLikes(podcastId: string): Promise<PodcastLike[]>;
  hasUserLikedPodcast(podcastId: string, userId: string): Promise<boolean>;
  togglePodcastLike(podcastId: string, userId: string): Promise<boolean>;
  getCommentsByPodcast(podcastId: string): Promise<PodcastComment[]>;
  getPodcastCommentById(id: string): Promise<PodcastComment | undefined>;
  createPodcastComment(comment: InsertPodcastComment): Promise<PodcastComment>;
  updatePodcastComment(id: string, userId: string, content: string): Promise<PodcastComment | undefined>;
  deletePodcastComment(id: string, userId: string): Promise<boolean>;

  getVibes(): Promise<Vibe[]>;
  getVibeById(id: string): Promise<Vibe | undefined>;
  createVibe(vibe: InsertVibe): Promise<Vibe>;
  updateVibe(id: string, content: string, imageUrls?: string[]): Promise<Vibe | undefined>;
  deleteVibe(id: string, userId: string): Promise<boolean>;
  adminUpdateVibe(id: string, content: string, imageUrls?: string[]): Promise<Vibe | undefined>;
  adminDeleteVibe(id: string): Promise<boolean>;
  getVibeReactions(vibeId: string): Promise<VibeReaction[]>;
  toggleVibeReaction(vibeId: string, userId: string, reactionType: string): Promise<boolean>;
  
  getVibeComments(vibeId: string): Promise<VibeComment[]>;
  createVibeComment(comment: InsertVibeComment): Promise<VibeComment>;
  deleteVibeComment(id: string, userId: string): Promise<boolean>;

  getEventSuggestions(status?: EventSuggestionStatus): Promise<EventSuggestion[]>;
  getEventSuggestionById(id: string): Promise<EventSuggestion | undefined>;
  createEventSuggestion(suggestion: InsertEventSuggestion): Promise<EventSuggestion>;
  updateEventSuggestionStatus(id: string, status: EventSuggestionStatus, reviewedBy: string, rejectionReason?: string): Promise<EventSuggestion | undefined>;
  approveEventSuggestion(id: string, reviewedBy: string): Promise<Event | undefined>;
  deleteEventSuggestionsByGroupEventId(groupEventId: string): Promise<boolean>;
  getEventSuggestionByGroupEventId(groupEventId: string): Promise<EventSuggestion | undefined>;

  getEventAttendees(eventId: string): Promise<EventAttendee[]>;
  getUserAttendance(eventId: string, userId: string): Promise<EventAttendee | undefined>;
  setEventAttendance(eventId: string, userId: string, status: string): Promise<EventAttendee | null>;
  getUserAttendingEvents(userId: string): Promise<EventAttendee[]>;

  getApprovedReviews(): Promise<MemberReview[]>;
  getReviewsByStatus(status?: ReviewStatus): Promise<MemberReview[]>;
  getReviewById(id: string): Promise<MemberReview | undefined>;
  getReviewBySlug(slug: string): Promise<MemberReview | undefined>;
  createReview(review: InsertMemberReview): Promise<MemberReview>;
  updateReview(id: string, updates: Partial<InsertMemberReview>): Promise<MemberReview | undefined>;
  approveReview(id: string, reviewedBy: string): Promise<MemberReview | undefined>;
  rejectReview(id: string, reviewedBy: string): Promise<MemberReview | undefined>;
  deleteReview(id: string): Promise<boolean>;

  getReviewLikes(reviewId: string): Promise<ReviewLike[]>;
  hasUserLikedReview(reviewId: string, userId: string): Promise<boolean>;
  toggleReviewLike(reviewId: string, userId: string): Promise<boolean>;

  getReviewComments(reviewId: string): Promise<ReviewComment[]>;
  getReviewCommentById(id: string): Promise<ReviewComment | undefined>;
  createReviewComment(comment: InsertReviewComment): Promise<ReviewComment>;
  updateReviewComment(id: string, userId: string, content: string): Promise<ReviewComment | undefined>;
  deleteReviewComment(id: string, userId: string): Promise<boolean>;

  getPolls(): Promise<Poll[]>;
  getActivePolls(): Promise<Poll[]>;
  getPollById(id: string): Promise<Poll | undefined>;
  getPollBySlug(slug: string): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined>;
  deletePoll(id: string): Promise<boolean>;
  getPollVotes(pollId: string): Promise<PollVote[]>;
  getUserVoteForPoll(pollId: string, userId: string): Promise<PollVote | undefined>;
  votePoll(pollId: string, userId: string, optionIndex: number): Promise<PollVote>;
  
  getRankingVotes(pollId: string): Promise<RankingVote[]>;
  getUserRankingVote(pollId: string, userId: string): Promise<RankingVote | undefined>;
  voteRankingPoll(pollId: string, userId: string, ranking: number[]): Promise<RankingVote>;

  getContactRequests(): Promise<ContactRequest[]>;
  createContactRequest(request: InsertContactRequest): Promise<ContactRequest>;
  markContactRequestRead(id: string): Promise<ContactRequest | undefined>;
  deleteContactRequest(id: string): Promise<boolean>;

  getGroups(): Promise<Group[]>;
  getActiveGroups(): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | undefined>;
  getGroupBySlug(slug: string): Promise<Group | undefined>;
  getGroupByLinkedEventId(eventId: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<boolean>;

  getGroupMemberships(groupId: string): Promise<GroupMembership[]>;
  getGroupMembershipsByUser(userId: string): Promise<GroupMembership[]>;
  getUserApprovedGroups(userId: string): Promise<Group[]>;
  getGroupMembership(groupId: string, userId: string): Promise<GroupMembership | undefined>;
  getPendingMemberships(groupId: string): Promise<GroupMembership[]>;
  requestGroupMembership(groupId: string, userId: string): Promise<GroupMembership>;
  createGroupMembership(membership: InsertGroupMembership): Promise<GroupMembership>;
  approveMembership(id: string, approvedBy: string): Promise<GroupMembership | undefined>;
  rejectMembership(id: string): Promise<boolean>;
  leaveGroup(groupId: string, userId: string): Promise<boolean>;
  isGroupMember(groupId: string, userId: string): Promise<boolean>;

  getAllGroupPosts(): Promise<GroupPost[]>;
  getGroupPosts(groupId: string): Promise<GroupPost[]>;
  getGroupPostById(id: string): Promise<GroupPost | undefined>;
  createGroupPost(post: InsertGroupPost): Promise<GroupPost>;
  updateGroupPost(id: string, content: string, imageUrls?: string[]): Promise<GroupPost | undefined>;
  deleteGroupPost(id: string, userId: string): Promise<boolean>;
  adminDeleteGroupPost(id: string): Promise<boolean>;

  getGroupPostComments(postId: string): Promise<GroupPostComment[]>;
  createGroupPostComment(comment: InsertGroupPostComment): Promise<GroupPostComment>;
  deleteGroupPostComment(id: string, userId: string): Promise<boolean>;

  getGroupPostReactions(postId: string): Promise<GroupPostReaction[]>;
  toggleGroupPostReaction(postId: string, userId: string, reactionType: string): Promise<boolean>;

  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(updates: UpdateSiteSettings): Promise<SiteSettings>;

  getAllGroupEvents(): Promise<GroupEvent[]>;
  getGroupEvents(groupId: string): Promise<GroupEvent[]>;
  createGroupEvent(event: InsertGroupEvent): Promise<GroupEvent>;
  getGroupEventById(id: string): Promise<GroupEvent | undefined>;
  updateGroupEvent(id: string, updates: Partial<InsertGroupEvent>): Promise<GroupEvent | undefined>;
  deleteGroupEvent(id: string): Promise<boolean>;

  getGroupEventComments(eventId: string): Promise<GroupEventComment[]>;
  createGroupEventComment(comment: InsertGroupEventComment): Promise<GroupEventComment>;
  deleteGroupEventComment(id: string, userId: string): Promise<boolean>;

  getGroupEventReactions(eventId: string): Promise<GroupEventReaction[]>;
  toggleGroupEventReaction(eventId: string, userId: string, reactionType: string): Promise<boolean>;
  getGroupEventReactionCount(eventId: string): Promise<number>;
  getGroupEventCommentCount(eventId: string): Promise<number>;

  getArticleCategories(): Promise<ArticleCategoryRecord[]>;
  createArticleCategory(category: InsertArticleCategory): Promise<ArticleCategoryRecord>;
  updateArticleCategory(id: number, updates: Partial<InsertArticleCategory>): Promise<ArticleCategoryRecord | undefined>;
  deleteArticleCategory(id: number): Promise<boolean>;
  updateArticlesByCategory(oldName: string, newName: string): Promise<void>;

  getEventCategories(): Promise<EventCategoryRecord[]>;
  createEventCategory(category: InsertEventCategory): Promise<EventCategoryRecord>;
  updateEventCategory(id: number, updates: Partial<InsertEventCategory>): Promise<EventCategoryRecord | undefined>;
  deleteEventCategory(id: number): Promise<boolean>;

  getReviewCategories(): Promise<ReviewCategoryRecord[]>;
  createReviewCategory(category: InsertReviewCategory): Promise<ReviewCategoryRecord>;
  updateReviewCategory(id: number, updates: Partial<InsertReviewCategory>): Promise<ReviewCategoryRecord | undefined>;
  deleteReviewCategory(id: number): Promise<boolean>;
  updateReviewsByCategory(oldName: string, newName: string): Promise<void>;

  getProfileFieldDefinitions(): Promise<ProfileFieldDefinition[]>;
  getProfileFieldDefinitionById(id: number): Promise<ProfileFieldDefinition | undefined>;
  createProfileFieldDefinition(field: InsertProfileFieldDefinition): Promise<ProfileFieldDefinition>;
  updateProfileFieldDefinition(id: number, updates: Partial<InsertProfileFieldDefinition>): Promise<ProfileFieldDefinition | undefined>;
  deleteProfileFieldDefinition(id: number): Promise<boolean>;

  getProfileFieldOptions(fieldId: number): Promise<ProfileFieldOption[]>;
  createProfileFieldOption(option: InsertProfileFieldOption): Promise<ProfileFieldOption>;
  updateProfileFieldOption(id: number, updates: Partial<InsertProfileFieldOption>): Promise<ProfileFieldOption | undefined>;
  deleteProfileFieldOption(id: number): Promise<boolean>;
  deleteProfileFieldOptionsByField(fieldId: number): Promise<boolean>;

  getProfileFieldSelectorValues(fieldId: number): Promise<ProfileFieldSelectorValue[]>;
  searchProfileFieldSelectorValues(fieldId: number, query: string, limit?: number): Promise<ProfileFieldSelectorValue[]>;
  bulkInsertProfileFieldSelectorValues(fieldId: number, values: string[]): Promise<void>;
  deleteProfileFieldSelectorValuesByField(fieldId: number): Promise<boolean>;

  getUserProfileFieldValues(userId: string): Promise<UserProfileFieldValue[]>;
  setUserProfileFieldValue(userId: string, fieldId: number, value: string): Promise<UserProfileFieldValue>;
  deleteUserProfileFieldValue(userId: string, fieldId: number): Promise<boolean>;

  getProfilePictures(userId: string): Promise<ProfilePicture[]>;
  addProfilePicture(picture: InsertProfilePicture): Promise<ProfilePicture>;
  updateProfilePicture(id: number, updates: Partial<InsertProfilePicture>): Promise<ProfilePicture | undefined>;
  deleteProfilePicture(id: number): Promise<boolean>;
  migrateProfilePicturesToTable(userId: string, imageUrls: string[]): Promise<ProfilePicture[]>;

  createConnectionRequest(requesterId: string, receiverId: string, message?: string): Promise<UserConnection>;
  getConnectionById(id: number): Promise<UserConnection | undefined>;
  getConnections(userId: string): Promise<UserConnection[]>;
  getIncomingRequests(userId: string): Promise<UserConnection[]>;
  getOutgoingRequests(userId: string): Promise<UserConnection[]>;
  getConnectionBetweenUsers(userId1: string, userId2: string): Promise<UserConnection | undefined>;
  updateConnectionStatus(id: number, status: string): Promise<UserConnection | undefined>;
  deleteConnection(id: number): Promise<boolean>;

  createConnectionNotification(data: { userId: string; type: string; connectionId?: number | null; messageId?: number | null; fromUserId?: string | null; eventId?: string | null; teamId?: string | null; matchId?: string | null; playRequestId?: number | null; metadata?: string | null }): Promise<ConnectionNotification>;
  getConnectionNotifications(userId: string): Promise<ConnectionNotification[]>;
  getUnreadConnectionNotificationCounts(userId: string): Promise<{ incomingRequests: number; acceptedRequests: number; declinedRequests: number; newMessages: number; total: number }>;
  markConnectionNotificationsAsRead(userId: string, type?: string): Promise<void>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  
  getUnreadMessageCountByUser(userId: string): Promise<Record<string, number>>;
  getTotalUnreadMessageCount(userId: string): Promise<number>;

  searchContent(query: string, userId?: string): Promise<import("@shared/schema").SearchResults>;

  getEventEntries(eventId: string): Promise<EventEntry[]>;
  getEventEntriesByUser(userId: string): Promise<EventEntry[]>;
  getEventEntryById(entryId: string): Promise<EventEntry | undefined>;
  getEventEntryByUserAndEvent(eventId: string, userId: string): Promise<EventEntry | undefined>;
  getEventEntryCount(eventId: string): Promise<number>;
  createEventEntry(entry: InsertEventEntry): Promise<EventEntry>;
  updateEventEntry(id: string, updates: Partial<InsertEventEntry>): Promise<EventEntry | undefined>;
  deleteEventEntry(id: string): Promise<boolean>;

  getCompetitionTeams(eventId: string): Promise<CompetitionTeam[]>;
  createCompetitionTeam(team: InsertCompetitionTeam): Promise<CompetitionTeam>;
  deleteCompetitionTeams(eventId: string): Promise<boolean>;
  updateCompetitionTeamTeeTime(teamId: string, teeTime: string): Promise<CompetitionTeam | undefined>;

  getCompetitionBracket(eventId: string): Promise<CompetitionBracket | undefined>;
  createCompetitionBracket(bracket: InsertCompetitionBracket): Promise<CompetitionBracket>;
  deleteCompetitionBracket(eventId: string): Promise<boolean>;

  getCompetitionRounds(bracketId: string): Promise<CompetitionRound[]>;
  createCompetitionRound(round: InsertCompetitionRound): Promise<CompetitionRound>;
  updateCompetitionRound(id: string, updates: Partial<InsertCompetitionRound>): Promise<CompetitionRound | undefined>;

  getCompetitionMatch(id: string): Promise<CompetitionMatch | undefined>;
  getCompetitionMatches(roundId: string): Promise<CompetitionMatch[]>;
  getCompetitionMatchesByBracket(bracketId: string): Promise<CompetitionMatch[]>;
  getCompetitionBracketByRoundId(roundId: string): Promise<CompetitionBracket | undefined>;
  createCompetitionMatch(match: InsertCompetitionMatch): Promise<CompetitionMatch>;
  updateCompetitionMatch(id: string, updates: Partial<InsertCompetitionMatch>): Promise<CompetitionMatch | undefined>;

  getPlayRequests(): Promise<PlayRequest[]>;
  getPlayRequestById(id: number): Promise<PlayRequest | undefined>;
  getPlayRequestsByUser(userId: string): Promise<PlayRequest[]>;
  createPlayRequest(request: InsertPlayRequest): Promise<PlayRequest>;
  updatePlayRequest(id: number, data: Partial<InsertPlayRequest>): Promise<PlayRequest | undefined>;
  deletePlayRequest(id: number): Promise<boolean>;
  getPlayRequestCriteria(playRequestId: number): Promise<PlayRequestCriteria[]>;
  createPlayRequestCriteria(criteria: InsertPlayRequestCriteria): Promise<PlayRequestCriteria>;
  deletePlayRequestCriteriaByRequest(playRequestId: number): Promise<boolean>;
  findMatchingUsersForPlayRequest(criteria: { fieldId: number; value: string }[]): Promise<string[]>;

  getPlayRequestOffers(playRequestId: number): Promise<PlayRequestOffer[]>;
  createPlayRequestOffer(offer: InsertPlayRequestOffer): Promise<PlayRequestOffer>;
  getOffersByUser(userId: string): Promise<PlayRequestOffer[]>;
  getUserOfferForRequest(playRequestId: number, userId: string): Promise<PlayRequestOffer | null>;
  deletePlayRequestOffer(offerId: number): Promise<void>;
  getPlayRequestOfferById(offerId: number): Promise<PlayRequestOffer | null>;
  getOfferCountsForUserRequests(userId: string): Promise<Map<number, { pending: number; accepted: number; rejected: number }>>;
  updateOfferStatus(offerId: number, status: string, responseNote?: string): Promise<PlayRequestOffer | null>;
  getAcceptedGamesForUser(userId: string): Promise<any[]>;
  
  createPlayRequestOfferCriteria(criteria: InsertPlayRequestOfferCriteria): Promise<PlayRequestOfferCriteria>;
  getPlayRequestOfferCriteria(offerId: number): Promise<PlayRequestOfferCriteria[]>;
  deletePlayRequestOfferCriteria(offerId: number): Promise<void>;

  getTeeTimeOffers(): Promise<import("@shared/schema").TeeTimeOffer[]>;
  getTeeTimeOfferById(id: number): Promise<import("@shared/schema").TeeTimeOffer | undefined>;
  getTeeTimeOffersByUser(userId: string): Promise<import("@shared/schema").TeeTimeOffer[]>;
  createTeeTimeOffer(offer: import("@shared/schema").InsertTeeTimeOffer): Promise<import("@shared/schema").TeeTimeOffer>;
  updateTeeTimeOffer(id: number, data: Partial<import("@shared/schema").InsertTeeTimeOffer>): Promise<import("@shared/schema").TeeTimeOffer | undefined>;
  deleteTeeTimeOffer(id: number): Promise<boolean>;
  getTeeTimeOfferCriteria(teeTimeOfferId: number): Promise<import("@shared/schema").TeeTimeOfferCriteria[]>;
  createTeeTimeOfferCriteria(criteria: import("@shared/schema").InsertTeeTimeOfferCriteria): Promise<import("@shared/schema").TeeTimeOfferCriteria>;
  deleteTeeTimeOfferCriteriaByOffer(teeTimeOfferId: number): Promise<boolean>;

  getTeeTimeReservationsByOffer(teeTimeOfferId: number): Promise<import("@shared/schema").TeeTimeReservation[]>;
  getTeeTimeReservationsByUser(userId: string): Promise<import("@shared/schema").TeeTimeReservation[]>;
  getTeeTimeReservation(id: number): Promise<import("@shared/schema").TeeTimeReservation | undefined>;
  getUserReservationForOffer(userId: string, teeTimeOfferId: number): Promise<import("@shared/schema").TeeTimeReservation | undefined>;
  createTeeTimeReservation(reservation: import("@shared/schema").InsertTeeTimeReservation): Promise<import("@shared/schema").TeeTimeReservation>;
  updateTeeTimeReservation(id: number, data: { status: string; responseNote?: string }): Promise<import("@shared/schema").TeeTimeReservation | undefined>;
  deleteTeeTimeReservation(id: number): Promise<void>;

  getSubscriptionPlans(): Promise<import("@shared/schema").SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<import("@shared/schema").SubscriptionPlan[]>;
  getSubscriptionPlanById(id: number): Promise<import("@shared/schema").SubscriptionPlan | undefined>;
  getSubscriptionPlanBySlug(slug: string): Promise<import("@shared/schema").SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: import("@shared/schema").InsertSubscriptionPlan): Promise<import("@shared/schema").SubscriptionPlan>;
  updateSubscriptionPlan(id: number, updates: Partial<import("@shared/schema").InsertSubscriptionPlan>): Promise<import("@shared/schema").SubscriptionPlan | undefined>;
  setDefaultSubscriptionPlan(id: number): Promise<import("@shared/schema").SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;
  
  getUserById(userId: string): Promise<import("@shared/schema").User | undefined>;
  updateUserSubscription(userId: string, planId: number): Promise<void>;
  updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string; subscriptionEndDate?: Date; subscriptionPlanId?: string }): Promise<void>;

  getPodcasts(): Promise<Podcast[]>;
  getActivePodcasts(): Promise<Podcast[]>;
  getPodcastById(id: string): Promise<Podcast | undefined>;
  getPodcastBySlug(slug: string): Promise<Podcast | undefined>;
  createPodcast(podcast: InsertPodcast): Promise<Podcast>;
  updatePodcast(id: string, updates: Partial<InsertPodcast>): Promise<Podcast | undefined>;
  deletePodcast(id: string): Promise<boolean>;

  seedDataIfEmpty(): Promise<void>;

  getTenants(): Promise<Tenant[]>;
  getTenantById(id: string): Promise<Tenant | undefined>;
  createTenant(data: { name: string; domainName?: string | null; subDomain?: string | null }): Promise<Tenant>;
  updateTenant(id: string, data: Partial<{ name: string; domainName: string | null; subDomain: string | null }>): Promise<Tenant | undefined>;
  deleteTenant(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  get db(): any {
    const tenantId = getCurrentTenantId();
    return getTenantPrisma(tenantId);
  }
  
  async getArticles(): Promise<Article[]> {
    const results = await this.db.articles.findMany({ orderBy: { publishedAt: 'desc' } });
    return results as any as Article[];
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const result = await this.db.articles.findUnique({ where: { id } });
    return (result as any as Article) ?? undefined;
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const result = await this.db.articles.findFirst({ where: { slug } });
    return (result as any as Article) ?? undefined;
  }

  async getArticlesByCategory(category: ArticleCategory): Promise<Article[]> {
    const results = await this.db.articles.findMany({
      where: { category },
      orderBy: { publishedAt: 'desc' }
    });
    return results as any as Article[];
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const result = await this.db.articles.create({ data: article as any });
    return result as any as Article;
  }

  async updateArticle(id: string, updates: Partial<InsertArticle>): Promise<Article | undefined> {
    try {
      const result = await this.db.articles.update({ where: { id }, data: updates as any });
      return result as any as Article;
    } catch {
      return undefined;
    }
  }

  async deleteArticle(id: string): Promise<boolean> {
    await this.deleteArticleSectionsByArticle(id);
    try {
      await this.db.articles.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getArticleSections(articleId: string): Promise<ArticleSection[]> {
    const results = await this.db.articleSections.findMany({
      where: { articleId },
      orderBy: { orderIndex: 'asc' }
    });
    return results as any as ArticleSection[];
  }

  async createArticleSection(section: InsertArticleSection): Promise<ArticleSection> {
    const result = await this.db.articleSections.create({ data: section as any });
    return result as any as ArticleSection;
  }

  async updateArticleSection(id: string, updates: Partial<InsertArticleSection>): Promise<ArticleSection | undefined> {
    try {
      const result = await this.db.articleSections.update({ where: { id }, data: updates as any });
      return result as any as ArticleSection;
    } catch {
      return undefined;
    }
  }

  async deleteArticleSection(id: string): Promise<boolean> {
    try {
      await this.db.articleSections.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async deleteArticleSectionsByArticle(articleId: string): Promise<boolean> {
    await this.db.articleSections.deleteMany({ where: { articleId } });
    return true;
  }

  async replaceArticleSections(articleId: string, sections: Omit<InsertArticleSection, 'articleId'>[]): Promise<ArticleSection[]> {
    await this.deleteArticleSectionsByArticle(articleId);
    const results: ArticleSection[] = [];
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const created = await this.createArticleSection({
        ...section,
        articleId,
        orderIndex: i
      });
      results.push(created);
    }
    return results;
  }

  async getEvents(): Promise<Event[]> {
    const allEvents = await this.db.events.findMany({ orderBy: { startDate: 'asc' } });
    const now = new Date();
    return (allEvents as any as Event[]).filter(event => {
      const dateToCheck = event.endDate || event.startDate;
      const eventDate = new Date(dateToCheck);
      if (isNaN(eventDate.getTime())) return false;
      return eventDate >= now;
    });
  }

  async getAllEvents(): Promise<Event[]> {
    const results = await this.db.events.findMany({ orderBy: { startDate: 'desc' } });
    return results as any as Event[];
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const result = await this.db.events.findUnique({ where: { id } });
    return (result as any as Event) ?? undefined;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const result = await this.db.events.findFirst({ where: { slug } });
    return (result as any as Event) ?? undefined;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  private async ensureUniqueEventSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (await this.getEventBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const baseSlug = this.generateSlug(event.name);
    const slug = await this.ensureUniqueEventSlug(baseSlug);
    const result = await this.db.events.create({ data: { ...event, slug } as any });
    return result as any as Event;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    try {
      const result = await this.db.events.update({ where: { id }, data: updates as any });
      return result as any as Event;
    } catch {
      return undefined;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      await this.db.events.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async subscribeNewsletter(data: InsertNewsletter): Promise<NewsletterSubscription> {
    const result = await this.db.newsletterSubscriptions.create({
      data: {
        ...data,
        subscribedAt: new Date().toISOString(),
      }
    });
    return result as any as NewsletterSubscription;
  }

  async getNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
    const results = await this.db.newsletterSubscriptions.findMany({ orderBy: { subscribedAt: 'desc' } });
    return results as any as NewsletterSubscription[];
  }

  async getHeroSettings(): Promise<HeroSettings> {
    const result = await this.db.heroSettings.findFirst();
    if (!result) {
      const defaultSettings: InsertHeroSettings = {
        title: "Discover Mumbles",
        subtitle: "Your guide to the jewel of the Welsh coast",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop",
        ctaText: "Explore Now",
        ctaLink: "/articles"
      };
      const inserted = await this.db.heroSettings.create({ data: defaultSettings as any });
      return inserted as any as HeroSettings;
    }
    return result as any as HeroSettings;
  }

  async updateHeroSettings(settings: InsertHeroSettings): Promise<HeroSettings> {
    const existing = await this.db.heroSettings.findFirst();
    if (!existing) {
      const result = await this.db.heroSettings.create({ data: settings as any });
      return result as any as HeroSettings;
    }
    const result = await this.db.heroSettings.update({
      where: { id: existing.id },
      data: settings as any
    });
    return result as any as HeroSettings;
  }

  async getInsiderTips(): Promise<InsiderTip[]> {
    const results = await this.db.insiderTips.findMany();
    return results as any as InsiderTip[];
  }

  async createInsiderTip(tip: InsertInsiderTip): Promise<InsiderTip> {
    const result = await this.db.insiderTips.create({ data: tip as any });
    return result as any as InsiderTip;
  }

  async updateInsiderTip(id: string, tip: Partial<InsertInsiderTip>): Promise<InsiderTip | undefined> {
    try {
      const result = await this.db.insiderTips.update({ where: { id }, data: tip as any });
      return result as any as InsiderTip;
    } catch {
      return undefined;
    }
  }

  async deleteInsiderTip(id: string): Promise<boolean> {
    try {
      await this.db.insiderTips.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const result = await this.db.userProfiles.findUnique({ where: { userId } });
    return (result as any as UserProfile) ?? undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const result = await this.db.userProfiles.create({ data: profile as any });
    return result as any as UserProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    try {
      const result = await this.db.userProfiles.update({ where: { userId }, data: updates as any });
      return result as any as UserProfile;
    } catch {
      return undefined;
    }
  }

  async getCommentsByArticle(articleId: string): Promise<Comment[]> {
    const allComments = await this.db.comments.findMany({
      where: { articleId },
      orderBy: { createdAt: 'asc' }
    });
    
    const userIds = [...new Set(allComments.map(c => c.userId))];
    const blockedUsers = new Set<string>();
    if (userIds.length > 0) {
      const users = await this.db.users.findMany({
        where: { id: { in: userIds }, blocked: true },
        select: { id: true }
      });
      users.forEach(u => blockedUsers.add(u.id));
    }

    return allComments.map(comment => ({
      id: comment.id,
      articleId: comment.articleId,
      userId: comment.userId,
      parentCommentId: comment.parentCommentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      edited: comment.edited,
      content: blockedUsers.has(comment.userId) ? "This post has been removed" : comment.content,
    })) as Comment[];
  }

  async getCommentById(id: string): Promise<Comment | undefined> {
    const result = await this.db.comments.findUnique({ where: { id } });
    return (result as any as Comment) ?? undefined;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await this.db.comments.create({ data: comment as any });
    return result as any as Comment;
  }

  async updateComment(id: string, userId: string, content: string): Promise<Comment | undefined> {
    const existing = await this.db.comments.findFirst({ where: { id, userId } });
    if (!existing) return undefined;
    const result = await this.db.comments.update({
      where: { id },
      data: { content, updatedAt: new Date(), edited: true }
    });
    return result as any as Comment;
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const result = await this.db.comments.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async getArticleLikes(articleId: string): Promise<ArticleLike[]> {
    const results = await this.db.articleLikes.findMany({ where: { articleId } });
    return results as any as ArticleLike[];
  }

  async hasUserLikedArticle(articleId: string, userId: string): Promise<boolean> {
    const result = await this.db.articleLikes.findFirst({ where: { articleId, userId } });
    return !!result;
  }

  async toggleArticleLike(articleId: string, userId: string): Promise<boolean> {
    const existing = await this.db.articleLikes.findFirst({ where: { articleId, userId } });
    if (existing) {
      await this.db.articleLikes.delete({ where: { id: existing.id } });
      return false;
    } else {
      await this.db.articleLikes.create({ data: { articleId, userId } });
      return true;
    }
  }

  async getPodcastLikes(podcastId: string): Promise<PodcastLike[]> {
    const results = await this.db.podcastLikes.findMany({ where: { podcastId } });
    return results as any as PodcastLike[];
  }

  async hasUserLikedPodcast(podcastId: string, userId: string): Promise<boolean> {
    const result = await this.db.podcastLikes.findFirst({ where: { podcastId, userId } });
    return !!result;
  }

  async togglePodcastLike(podcastId: string, userId: string): Promise<boolean> {
    const existing = await this.db.podcastLikes.findFirst({ where: { podcastId, userId } });
    if (existing) {
      await this.db.podcastLikes.delete({ where: { id: existing.id } });
      return false;
    } else {
      await this.db.podcastLikes.create({ data: { podcastId, userId } });
      return true;
    }
  }

  async getCommentsByPodcast(podcastId: string): Promise<PodcastComment[]> {
    const allComments = await this.db.podcastComments.findMany({
      where: { podcastId },
      orderBy: { createdAt: 'asc' }
    });

    const userIds = [...new Set(allComments.map(c => c.userId))];
    const blockedUsers = new Set<string>();
    if (userIds.length > 0) {
      const users = await this.db.users.findMany({
        where: { id: { in: userIds }, blocked: true },
        select: { id: true }
      });
      users.forEach(u => blockedUsers.add(u.id));
    }

    return allComments.map(comment => ({
      id: comment.id,
      podcastId: comment.podcastId,
      userId: comment.userId,
      parentCommentId: comment.parentCommentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      edited: comment.edited,
      content: blockedUsers.has(comment.userId) ? "This post has been removed" : comment.content,
    })) as PodcastComment[];
  }

  async getPodcastCommentById(id: string): Promise<PodcastComment | undefined> {
    const result = await this.db.podcastComments.findUnique({ where: { id } });
    return (result as any as PodcastComment) ?? undefined;
  }

  async createPodcastComment(comment: InsertPodcastComment): Promise<PodcastComment> {
    const result = await this.db.podcastComments.create({ data: comment as any });
    return result as any as PodcastComment;
  }

  async updatePodcastComment(id: string, userId: string, content: string): Promise<PodcastComment | undefined> {
    const existing = await this.db.podcastComments.findFirst({ where: { id, userId } });
    if (!existing) return undefined;
    const result = await this.db.podcastComments.update({
      where: { id },
      data: { content, updatedAt: new Date(), edited: true }
    });
    return result as any as PodcastComment;
  }

  async deletePodcastComment(id: string, userId: string): Promise<boolean> {
    const result = await this.db.podcastComments.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async getVibes(): Promise<Vibe[]> {
    const results = await this.db.vibes.findMany({ orderBy: { createdAt: 'desc' } });
    return results as any as Vibe[];
  }

  async createVibe(vibe: InsertVibe): Promise<Vibe> {
    const result = await this.db.vibes.create({ data: vibe as any });
    return result as any as Vibe;
  }

  async deleteVibe(id: string, userId: string): Promise<boolean> {
    const result = await this.db.vibes.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async getVibeById(id: string): Promise<Vibe | undefined> {
    const result = await this.db.vibes.findUnique({ where: { id } });
    return (result as any as Vibe) ?? undefined;
  }

  async updateVibe(id: string, content: string, imageUrls?: string[]): Promise<Vibe | undefined> {
    const updateData: Record<string, unknown> = { content, updatedAt: new Date(), edited: true };
    if (imageUrls !== undefined) {
      updateData.imageUrls = imageUrls;
    }
    try {
      const result = await this.db.vibes.update({ where: { id }, data: updateData as any });
      return result as any as Vibe;
    } catch {
      return undefined;
    }
  }

  async adminUpdateVibe(id: string, content: string, imageUrls?: string[]): Promise<Vibe | undefined> {
    const updateData: Record<string, unknown> = { content, updatedAt: new Date(), edited: true };
    if (imageUrls !== undefined) {
      updateData.imageUrls = imageUrls;
    }
    try {
      const result = await this.db.vibes.update({ where: { id }, data: updateData as any });
      return result as any as Vibe;
    } catch {
      return undefined;
    }
  }

  async adminDeleteVibe(id: string): Promise<boolean> {
    await this.db.vibeReactions.deleteMany({ where: { vibeId: id } });
    await this.db.vibeComments.deleteMany({ where: { vibeId: id } });
    try {
      await this.db.vibes.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getVibeReactions(vibeId: string): Promise<VibeReaction[]> {
    const results = await this.db.vibeReactions.findMany({ where: { vibeId } });
    return results as any as VibeReaction[];
  }

  async toggleVibeReaction(vibeId: string, userId: string, reactionType: string): Promise<boolean> {
    const existing = await this.db.vibeReactions.findFirst({
      where: { vibeId, userId, reactionType }
    });

    if (existing) {
      await this.db.vibeReactions.delete({ where: { id: existing.id } });
      return false;
    } else {
      await this.db.vibeReactions.create({ data: { vibeId, userId, reactionType } });
      return true;
    }
  }

  async getVibeComments(vibeId: string): Promise<VibeComment[]> {
    const results = await this.db.vibeComments.findMany({
      where: { vibeId },
      orderBy: { createdAt: 'asc' }
    });
    return results as any as VibeComment[];
  }

  async createVibeComment(comment: InsertVibeComment): Promise<VibeComment> {
    const result = await this.db.vibeComments.create({ data: comment as any });
    return result as any as VibeComment;
  }

  async deleteVibeComment(id: string, userId: string): Promise<boolean> {
    const result = await this.db.vibeComments.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async getEventSuggestions(status?: EventSuggestionStatus): Promise<EventSuggestion[]> {
    const where = status ? { status } : {};
    const results = await this.db.eventSuggestions.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return results as any as EventSuggestion[];
  }

  async getEventSuggestionById(id: string): Promise<EventSuggestion | undefined> {
    const result = await this.db.eventSuggestions.findUnique({ where: { id } });
    return (result as any as EventSuggestion) ?? undefined;
  }

  async createEventSuggestion(suggestion: InsertEventSuggestion): Promise<EventSuggestion> {
    const result = await this.db.eventSuggestions.create({ data: suggestion as any });
    return result as any as EventSuggestion;
  }

  async updateEventSuggestionStatus(
    id: string,
    status: EventSuggestionStatus,
    reviewedBy: string,
    rejectionReason?: string
  ): Promise<EventSuggestion | undefined> {
    try {
      const result = await this.db.eventSuggestions.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy,
          rejectionReason: rejectionReason || null
        }
      });
      return result as any as EventSuggestion;
    } catch {
      return undefined;
    }
  }

  async approveEventSuggestion(id: string, reviewedBy: string): Promise<Event | undefined> {
    const suggestion = await this.getEventSuggestionById(id);
    if (!suggestion) return undefined;

    await this.updateEventSuggestionStatus(id, "approved", reviewedBy);

    const newEvent = await this.createEvent({
      name: suggestion.name,
      startDate: suggestion.startDate,
      endDate: suggestion.endDate,
      venueName: suggestion.venueName,
      address: suggestion.address,
      summary: suggestion.summary,
      description: suggestion.description,
      imageUrl: suggestion.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop",
      tags: suggestion.tags,
      ticketUrl: suggestion.ticketUrl,
      isFeatured: false,
    });

    if (newEvent) {
      await this.db.eventSuggestions.update({
        where: { id },
        data: { approvedEventId: newEvent.id }
      });
    }

    return newEvent;
  }

  async deleteEventSuggestionsByGroupEventId(groupEventId: string): Promise<boolean> {
    const suggestions = await this.db.eventSuggestions.findMany({
      where: { groupEventId }
    });

    for (const suggestion of suggestions) {
      if (suggestion.status === "approved") {
        if (suggestion.approvedEventId) {
          try { await this.db.events.delete({ where: { id: suggestion.approvedEventId } }); } catch {}
        } else {
          const matchingEvents = await this.db.events.findMany({
            where: {
              name: suggestion.name,
              startDate: suggestion.startDate,
              venueName: suggestion.venueName
            }
          });
          for (const evt of matchingEvents) {
            try { await this.db.events.delete({ where: { id: evt.id } }); } catch {}
          }
        }
      }
    }

    const result = await this.db.eventSuggestions.deleteMany({ where: { groupEventId } });
    return result.count > 0;
  }

  async getEventSuggestionByGroupEventId(groupEventId: string): Promise<EventSuggestion | undefined> {
    const result = await this.db.eventSuggestions.findFirst({ where: { groupEventId } });
    return (result as any as EventSuggestion) ?? undefined;
  }

  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    const results = await this.db.eventAttendees.findMany({ where: { eventId } });
    return results as any as EventAttendee[];
  }

  async getUserAttendance(eventId: string, userId: string): Promise<EventAttendee | undefined> {
    const result = await this.db.eventAttendees.findFirst({ where: { eventId, userId } });
    return (result as any as EventAttendee) ?? undefined;
  }

  private async generateUniqueTicketNumber(): Promise<number> {
    for (let i = 0; i < 10; i++) {
      const num = Math.floor(10000 + Math.random() * 90000);
      const existing = await this.db.eventAttendees.findFirst({ where: { ticketNumber: num } });
      if (!existing) return num;
    }
    return Math.floor(10000 + Math.random() * 90000);
  }

  async setEventAttendance(eventId: string, userId: string, status: string): Promise<EventAttendee | null> {
    const existing = await this.getUserAttendance(eventId, userId);
    if (status === "not_attending") {
      if (existing) {
        await this.db.eventAttendees.deleteMany({ where: { eventId, userId } });
      }
      return null;
    }
    if (existing) {
      const updates: any = { status };
      if (status === "attending" && !existing.ticketNumber) {
        updates.ticketNumber = await this.generateUniqueTicketNumber();
      }
      const updated = await this.db.eventAttendees.update({
        where: { id: existing.id },
        data: updates
      });
      return updated as any as EventAttendee;
    } else {
      const ticketNumber = status === "attending" ? await this.generateUniqueTicketNumber() : null;
      const created = await this.db.eventAttendees.create({
        data: { eventId, userId, status, ticketNumber }
      });
      return created as any as EventAttendee;
    }
  }

  async getUserAttendingEvents(userId: string): Promise<EventAttendee[]> {
    const results = await this.db.eventAttendees.findMany({ where: { userId } });
    return results as any as EventAttendee[];
  }

  async getApprovedReviews(): Promise<MemberReview[]> {
    const results = await this.db.memberReviews.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as MemberReview[];
  }

  async getReviewsByStatus(status?: ReviewStatus): Promise<MemberReview[]> {
    const where = status ? { status } : {};
    const results = await this.db.memberReviews.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return results as any as MemberReview[];
  }

  async getReviewById(id: string): Promise<MemberReview | undefined> {
    const result = await this.db.memberReviews.findUnique({ where: { id } });
    return (result as any as MemberReview) ?? undefined;
  }

  async getReviewBySlug(slug: string): Promise<MemberReview | undefined> {
    const result = await this.db.memberReviews.findFirst({ where: { slug } });
    return (result as any as MemberReview) ?? undefined;
  }

  private generateReviewSlug(placeName: string, title: string): string {
    const base = `${placeName}-${title}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80)
      .replace(/-$/, '');
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  async createReview(review: InsertMemberReview): Promise<MemberReview> {
    const slug = this.generateReviewSlug(review.placeName, review.title);
    const result = await this.db.memberReviews.create({ data: { ...review, slug } as any });
    return result as any as MemberReview;
  }

  async updateReview(id: string, updates: Partial<InsertMemberReview>): Promise<MemberReview | undefined> {
    try {
      const allowedFields = ['category', 'placeName', 'title', 'summary', 'liked', 'disliked', 'rating', 'imageUrl', 'status', 'reviewedAt', 'reviewedBy'];
      const filtered: any = {};
      for (const key of allowedFields) {
        if (key in updates) {
          filtered[key] = (updates as any)[key];
        }
      }
      const result = await this.db.memberReviews.update({ where: { id }, data: filtered });
      return result as any as MemberReview;
    } catch (error) {
      console.error("Error in updateReview:", error);
      return undefined;
    }
  }

  async approveReview(id: string, reviewedBy: string): Promise<MemberReview | undefined> {
    try {
      const result = await this.db.memberReviews.update({
        where: { id },
        data: { status: "approved", reviewedBy, reviewedAt: new Date() }
      });
      return result as any as MemberReview;
    } catch {
      return undefined;
    }
  }

  async rejectReview(id: string, reviewedBy: string): Promise<MemberReview | undefined> {
    try {
      const result = await this.db.memberReviews.update({
        where: { id },
        data: { status: "rejected", reviewedBy, reviewedAt: new Date() }
      });
      return result as any as MemberReview;
    } catch {
      return undefined;
    }
  }

  async deleteReview(id: string): Promise<boolean> {
    try {
      await this.db.memberReviews.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getReviewLikes(reviewId: string): Promise<ReviewLike[]> {
    const results = await this.db.reviewLikes.findMany({ where: { reviewId } });
    return results as any as ReviewLike[];
  }

  async hasUserLikedReview(reviewId: string, userId: string): Promise<boolean> {
    const result = await this.db.reviewLikes.findFirst({ where: { reviewId, userId } });
    return !!result;
  }

  async toggleReviewLike(reviewId: string, userId: string): Promise<boolean> {
    const existing = await this.db.reviewLikes.findFirst({ where: { reviewId, userId } });
    if (existing) {
      await this.db.reviewLikes.delete({ where: { id: existing.id } });
      return false;
    } else {
      await this.db.reviewLikes.create({ data: { reviewId, userId } });
      return true;
    }
  }

  async getReviewComments(reviewId: string): Promise<ReviewComment[]> {
    const results = await this.db.reviewComments.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'asc' }
    });
    return results as any as ReviewComment[];
  }

  async getReviewCommentById(id: string): Promise<ReviewComment | undefined> {
    const result = await this.db.reviewComments.findUnique({ where: { id } });
    return (result as any as ReviewComment) ?? undefined;
  }

  async createReviewComment(comment: InsertReviewComment): Promise<ReviewComment> {
    const result = await this.db.reviewComments.create({ data: comment as any });
    return result as any as ReviewComment;
  }

  async updateReviewComment(id: string, userId: string, content: string): Promise<ReviewComment | undefined> {
    const existing = await this.db.reviewComments.findFirst({ where: { id, userId } });
    if (!existing) return undefined;
    const result = await this.db.reviewComments.update({
      where: { id },
      data: { content, updatedAt: new Date(), edited: true }
    });
    return result as any as ReviewComment;
  }

  async deleteReviewComment(id: string, userId: string): Promise<boolean> {
    const result = await this.db.reviewComments.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async getPolls(): Promise<Poll[]> {
    const results = await this.db.polls.findMany({ orderBy: { createdAt: 'desc' } });
    return results as any as Poll[];
  }

  async getActivePolls(): Promise<Poll[]> {
    const now = new Date();
    const allPolls = await this.db.polls.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    return (allPolls as any as Poll[]).filter(poll => now >= poll.startDate);
  }

  async getPollById(id: string): Promise<Poll | undefined> {
    const result = await this.db.polls.findUnique({ where: { id } });
    return (result as any as Poll) ?? undefined;
  }

  async getPollBySlug(slug: string): Promise<Poll | undefined> {
    const result = await this.db.polls.findFirst({ where: { slug } });
    return (result as any as Poll) ?? undefined;
  }

  private async ensureUniquePollSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await this.getPollBySlug(slug);
      if (!existing || (excludeId && existing.id === excludeId)) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const baseSlug = this.generateSlug(poll.title);
    const slug = await this.ensureUniquePollSlug(baseSlug);
    const result = await this.db.polls.create({ data: { ...poll, slug } as any });
    return result as any as Poll;
  }

  async updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined> {
    try {
      const result = await this.db.polls.update({ where: { id }, data: updates as any });
      return result as any as Poll;
    } catch {
      return undefined;
    }
  }

  async deletePoll(id: string): Promise<boolean> {
    await this.db.pollVotes.deleteMany({ where: { pollId: id } });
    await this.db.rankingVotes.deleteMany({ where: { pollId: id } });
    try {
      await this.db.polls.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getPollVotes(pollId: string): Promise<PollVote[]> {
    const results = await this.db.pollVotes.findMany({ where: { pollId } });
    return results as any as PollVote[];
  }

  async getUserVoteForPoll(pollId: string, userId: string): Promise<PollVote | undefined> {
    const result = await this.db.pollVotes.findFirst({ where: { pollId, userId } });
    return (result as any as PollVote) ?? undefined;
  }

  async votePoll(pollId: string, userId: string, optionIndex: number): Promise<PollVote> {
    const result = await this.db.pollVotes.create({
      data: { pollId, userId, optionIndex }
    });
    return result as any as PollVote;
  }

  async getRankingVotes(pollId: string): Promise<RankingVote[]> {
    const results = await this.db.rankingVotes.findMany({ where: { pollId } });
    return results as any as RankingVote[];
  }

  async getUserRankingVote(pollId: string, userId: string): Promise<RankingVote | undefined> {
    const result = await this.db.rankingVotes.findFirst({ where: { pollId, userId } });
    return (result as any as RankingVote) ?? undefined;
  }

  async voteRankingPoll(pollId: string, userId: string, ranking: number[]): Promise<RankingVote> {
    const result = await this.db.rankingVotes.create({
      data: { pollId, userId, ranking }
    });
    return result as any as RankingVote;
  }

  async getContactRequests(): Promise<ContactRequest[]> {
    const results = await this.db.contactRequests.findMany({ orderBy: { createdAt: 'desc' } });
    return results as any as ContactRequest[];
  }

  async createContactRequest(request: InsertContactRequest): Promise<ContactRequest> {
    const result = await this.db.contactRequests.create({ data: request as any });
    return result as any as ContactRequest;
  }

  async markContactRequestRead(id: string): Promise<ContactRequest | undefined> {
    try {
      const result = await this.db.contactRequests.update({
        where: { id },
        data: { isRead: true }
      });
      return result as any as ContactRequest;
    } catch {
      return undefined;
    }
  }

  async deleteContactRequest(id: string): Promise<boolean> {
    try {
      await this.db.contactRequests.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getGroups(): Promise<Group[]> {
    const results = await this.db.groups.findMany({ orderBy: { createdAt: 'desc' } });
    return results as any as Group[];
  }

  async getActiveGroups(): Promise<Group[]> {
    const results = await this.db.groups.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as Group[];
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    const result = await this.db.groups.findUnique({ where: { id } });
    return (result as any as Group) ?? undefined;
  }

  async getGroupBySlug(slug: string): Promise<Group | undefined> {
    const result = await this.db.groups.findFirst({ where: { slug } });
    return (result as any as Group) ?? undefined;
  }

  async getGroupByLinkedEventId(eventId: string): Promise<Group | undefined> {
    const result = await this.db.groups.findFirst({ where: { eventId } });
    return (result as any as Group) ?? undefined;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    let slug = group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await this.db.groups.findFirst({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
    const result = await this.db.groups.create({ data: { ...group, slug } as any });
    return result as any as Group;
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group | undefined> {
    try {
      const result = await this.db.groups.update({ where: { id }, data: updates as any });
      return result as any as Group;
    } catch {
      return undefined;
    }
  }

  async deleteGroup(id: string): Promise<boolean> {
    const groupEventsList = await this.db.groupEvents.findMany({
      where: { groupId: id },
      select: { id: true }
    });
    for (const event of groupEventsList) {
      await this.db.groupEventReactions.deleteMany({ where: { eventId: event.id } });
      await this.db.groupEventComments.deleteMany({ where: { eventId: event.id } });
    }
    await this.db.groupEvents.deleteMany({ where: { groupId: id } });

    await this.db.events.updateMany({
      where: { linkedGroupId: id },
      data: { linkedGroupId: null }
    });

    const groupPostsList = await this.db.groupPosts.findMany({
      where: { groupId: id },
      select: { id: true }
    });
    const postIds = groupPostsList.map(p => p.id);
    if (postIds.length > 0) {
      await this.db.groupPostReactions.deleteMany({ where: { postId: { in: postIds } } });
      await this.db.groupPostComments.deleteMany({ where: { postId: { in: postIds } } });
    }
    await this.db.groupPosts.deleteMany({ where: { groupId: id } });
    await this.db.groupMemberships.deleteMany({ where: { groupId: id } });
    try {
      await this.db.groups.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getGroupMemberships(groupId: string): Promise<GroupMembership[]> {
    const results = await this.db.groupMemberships.findMany({ where: { groupId } });
    return results as any as GroupMembership[];
  }

  async getGroupMembershipsByUser(userId: string): Promise<GroupMembership[]> {
    const results = await this.db.groupMemberships.findMany({ where: { userId } });
    return results as any as GroupMembership[];
  }

  async getUserApprovedGroups(userId: string): Promise<Group[]> {
    const memberships = await this.db.groupMemberships.findMany({
      where: { userId, status: "approved" }
    });
    if (memberships.length === 0) return [];
    const groupIds = memberships.map(m => m.groupId);
    const results: Group[] = [];
    for (const gId of groupIds) {
      const group = await this.getGroupById(gId);
      if (group && group.isActive) results.push(group);
    }
    return results;
  }

  async getGroupMembership(groupId: string, userId: string): Promise<GroupMembership | undefined> {
    const result = await this.db.groupMemberships.findFirst({ where: { groupId, userId } });
    return (result as any as GroupMembership) ?? undefined;
  }

  async getPendingMemberships(groupId: string): Promise<GroupMembership[]> {
    const results = await this.db.groupMemberships.findMany({
      where: { groupId, status: "pending" }
    });
    return results as any as GroupMembership[];
  }

  async requestGroupMembership(groupId: string, userId: string): Promise<GroupMembership> {
    const result = await this.db.groupMemberships.create({
      data: { groupId, userId, role: "member", status: "pending" }
    });
    return result as any as GroupMembership;
  }

  async createGroupMembership(membership: InsertGroupMembership): Promise<GroupMembership> {
    const result = await this.db.groupMemberships.create({ data: membership as any });
    return result as any as GroupMembership;
  }

  async approveMembership(id: string, approvedBy: string): Promise<GroupMembership | undefined> {
    try {
      const result = await this.db.groupMemberships.update({
        where: { id },
        data: { status: "approved", approvedAt: new Date(), approvedBy }
      });
      return result as any as GroupMembership;
    } catch {
      return undefined;
    }
  }

  async rejectMembership(id: string): Promise<boolean> {
    try {
      await this.db.groupMemberships.update({
        where: { id },
        data: { status: "rejected" }
      });
      return true;
    } catch {
      return false;
    }
  }

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const result = await this.db.groupMemberships.deleteMany({ where: { groupId, userId } });
    return result.count > 0;
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const membership = await this.getGroupMembership(groupId, userId);
    return membership?.status === "approved";
  }

  async getAllGroupPosts(): Promise<GroupPost[]> {
    const results = await this.db.groupPosts.findMany({ orderBy: { createdAt: 'desc' } });
    return results as any as GroupPost[];
  }

  async getGroupPosts(groupId: string): Promise<GroupPost[]> {
    const results = await this.db.groupPosts.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as GroupPost[];
  }

  async getGroupPostById(id: string): Promise<GroupPost | undefined> {
    const result = await this.db.groupPosts.findUnique({ where: { id } });
    return (result as any as GroupPost) ?? undefined;
  }

  async createGroupPost(post: InsertGroupPost): Promise<GroupPost> {
    const result = await this.db.groupPosts.create({ data: post as any });
    return result as any as GroupPost;
  }

  async updateGroupPost(id: string, content: string, imageUrls?: string[]): Promise<GroupPost | undefined> {
    const updates: any = { content, updatedAt: new Date(), edited: true };
    if (imageUrls !== undefined) updates.imageUrls = imageUrls;
    try {
      const result = await this.db.groupPosts.update({ where: { id }, data: updates });
      return result as any as GroupPost;
    } catch {
      return undefined;
    }
  }

  async deleteGroupPost(id: string, userId: string): Promise<boolean> {
    await this.db.groupPostReactions.deleteMany({ where: { postId: id } });
    await this.db.groupPostComments.deleteMany({ where: { postId: id } });
    const result = await this.db.groupPosts.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async adminDeleteGroupPost(id: string): Promise<boolean> {
    await this.db.groupPostReactions.deleteMany({ where: { postId: id } });
    await this.db.groupPostComments.deleteMany({ where: { postId: id } });
    try {
      await this.db.groupPosts.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getGroupPostComments(postId: string): Promise<GroupPostComment[]> {
    const results = await this.db.groupPostComments.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' }
    });
    return results as any as GroupPostComment[];
  }

  async createGroupPostComment(comment: InsertGroupPostComment): Promise<GroupPostComment> {
    const result = await this.db.groupPostComments.create({ data: comment as any });
    return result as any as GroupPostComment;
  }

  async deleteGroupPostComment(id: string, userId: string): Promise<boolean> {
    const result = await this.db.groupPostComments.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async getGroupPostReactions(postId: string): Promise<GroupPostReaction[]> {
    const results = await this.db.groupPostReactions.findMany({ where: { postId } });
    return results as any as GroupPostReaction[];
  }

  async toggleGroupPostReaction(postId: string, userId: string, reactionType: string): Promise<boolean> {
    const existing = await this.db.groupPostReactions.findFirst({
      where: { postId, userId, reactionType }
    });
    if (existing) {
      await this.db.groupPostReactions.delete({ where: { id: existing.id } });
      return false;
    } else {
      await this.db.groupPostReactions.create({ data: { postId, userId, reactionType } });
      return true;
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const results = await this.db.subscriptionPlans.findMany({ orderBy: { orderIndex: 'asc' } });
    return results as any as SubscriptionPlan[];
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const results = await this.db.subscriptionPlans.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' }
    });
    return results as any as SubscriptionPlan[];
  }

  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    const result = await this.db.subscriptionPlans.findUnique({ where: { id } });
    return (result as any as SubscriptionPlan) ?? undefined;
  }

  async getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlan | undefined> {
    const result = await this.db.subscriptionPlans.findFirst({ where: { slug } });
    return (result as any as SubscriptionPlan) ?? undefined;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    if (plan.isDefault) {
      await this.db.subscriptionPlans.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    const result = await this.db.subscriptionPlans.create({ data: plan as any });
    return result as any as SubscriptionPlan;
  }

  async updateSubscriptionPlan(id: number, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    if (updates.isDefault) {
      await this.db.subscriptionPlans.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    try {
      const result = await this.db.subscriptionPlans.update({ where: { id }, data: updates as any });
      return result as any as SubscriptionPlan;
    } catch {
      return undefined;
    }
  }

  async setDefaultSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    await this.db.subscriptionPlans.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
    try {
      const result = await this.db.subscriptionPlans.update({
        where: { id },
        data: { isDefault: true }
      });
      return result as any as SubscriptionPlan;
    } catch {
      return undefined;
    }
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    try {
      await this.db.subscriptionPlans.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getUserById(userId: string): Promise<import("@shared/schema").User | undefined> {
    const result = await this.db.users.findUnique({ where: { id: userId } });
    return (result as any) ?? undefined;
  }

  async updateUserSubscription(userId: string, planId: number): Promise<void> {
    await this.db.users.update({
      where: { id: userId },
      data: {
        subscriptionPlanId: planId.toString(),
        subscriptionStartDate: new Date()
      }
    });
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string; subscriptionEndDate?: Date; subscriptionPlanId?: string }): Promise<void> {
    await this.db.users.update({
      where: { id: userId },
      data: stripeInfo
    });
  }

  async seedDataIfEmpty(): Promise<void> {
    const existingArticles = await this.db.articles.findMany();
    const existingEvents = await this.db.events.findMany();
    if (existingArticles.length > 0 && existingEvents.length > 0) {
      return;
    }

    const articleSeeds: InsertArticle[] = [
      {
        title: "The Best Fish & Chips in Mumbles: A Local's Guide",
        slug: "best-fish-chips-mumbles",
        category: "Restaurants",
        excerpt: "From the famous Verdi's to hidden gems along the promenade, we've tasted them all so you don't have to.",
        content: "Mumbles is renowned for its exceptional fish and chip shops...",
        heroImageUrl: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=800&h=450&fit=crop",
        publishedAt: "2024-12-15",
        author: "Gareth Thomas",
        readingTime: 5,
      },
      {
        title: "Exploring Bracelet Bay: Mumbles' Hidden Paradise",
        slug: "exploring-bracelet-bay",
        category: "Beaches",
        excerpt: "A complete guide to one of Wales' most beautiful bays, including the best times to visit and what to bring.",
        content: "Bracelet Bay is a stunning natural cove...",
        heroImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=450&fit=crop",
        publishedAt: "2024-12-10",
        author: "Emma Williams",
        readingTime: 7,
      },
      {
        title: "A Walk to Mumbles Lighthouse: History & Views",
        slug: "mumbles-lighthouse-walk",
        category: "Things to Do",
        excerpt: "The iconic Mumbles Lighthouse has been guiding sailors since 1794. Here's how to make the most of your visit.",
        content: "Standing proudly on the outer island...",
        heroImageUrl: "https://images.unsplash.com/photo-1520962880247-cfaf541c8724?w=800&h=450&fit=crop",
        publishedAt: "2024-12-05",
        author: "David Evans",
        readingTime: 6,
      },
      {
        title: "Mumbles Mile: A Pub Crawl Tradition",
        slug: "mumbles-mile-pub-crawl",
        category: "Nightlife",
        excerpt: "The legendary Mumbles Mile features some of Wales' best pubs. Here's how to tackle this famous route responsibly.",
        content: "The Mumbles Mile is a legendary pub crawl...",
        heroImageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=450&fit=crop",
        publishedAt: "2024-11-28",
        author: "Owen Davies",
        readingTime: 8,
      },
      {
        title: "Oystermouth Castle: 800 Years of Welsh History",
        slug: "oystermouth-castle-history",
        category: "History",
        excerpt: "Discover the fascinating story of Oystermouth Castle, from Norman stronghold to romantic ruin.",
        content: "Perched above the village of Mumbles...",
        heroImageUrl: "https://images.unsplash.com/photo-1599413987323-b2b8c0d7d9c8?w=800&h=450&fit=crop",
        publishedAt: "2024-11-20",
        author: "Dr. Rhiannon Price",
        readingTime: 10,
      },
      {
        title: "Where Locals Really Eat in Mumbles",
        slug: "where-locals-eat-mumbles",
        category: "Local Tips",
        excerpt: "Skip the tourist traps and discover the cafes and restaurants that Mumbles residents actually love.",
        content: "While visitors flock to the main promenade...",
        heroImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=450&fit=crop",
        publishedAt: "2024-11-15",
        author: "Sarah Morgan",
        readingTime: 6,
      },
      {
        title: "Family Day Out: Mumbles with Kids",
        slug: "mumbles-family-day-out",
        category: "Family",
        excerpt: "From crabbing on the pier to ice cream at Joe's, here's how to keep the whole family entertained.",
        content: "Mumbles is a perfect destination for families...",
        heroImageUrl: "https://images.unsplash.com/photo-1476234251651-f353703a034d?w=800&h=450&fit=crop",
        publishedAt: "2024-11-10",
        author: "Lisa Jones",
        readingTime: 7,
      },
      {
        title: "Boutique Shopping in Mumbles Village",
        slug: "boutique-shopping-mumbles",
        category: "Shopping",
        excerpt: "From vintage finds to Welsh crafts, discover the unique independent shops that make Mumbles special.",
        content: "The streets of Mumbles are lined with...",
        heroImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=450&fit=crop",
        publishedAt: "2024-11-05",
        author: "Megan Lloyd",
        readingTime: 5,
      },
    ];

    const eventSeeds: InsertEvent[] = [
      {
        name: "Mumbles New Year's Day Swim",
        slug: "mumbles-new-years-day-swim",
        startDate: "2025-01-01T11:00:00",
        venueName: "Bracelet Bay",
        address: "Bracelet Bay, Mumbles, SA3 4JT",
        summary: "Join hundreds of brave swimmers for the annual New Year's Day dip in Bracelet Bay.",
        description: "A Mumbles tradition since 1984...",
        imageUrl: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=800&h=400&fit=crop",
        tags: ["Community", "Outdoor", "Sports"],
        isFeatured: true,
      },
      {
        name: "Mumbles Artisan Market",
        slug: "mumbles-artisan-market",
        startDate: "2025-01-12T09:00:00",
        endDate: "2025-01-12T15:00:00",
        venueName: "Oystermouth Square",
        address: "Oystermouth Square, Mumbles, SA3 4DA",
        summary: "Browse local crafts, artisan food, and vintage finds at our monthly market.",
        description: "The Mumbles Artisan Market brings together...",
        imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=400&fit=crop",
        tags: ["Community", "Food & Drink"],
        isFeatured: false,
      },
      {
        name: "Live Jazz at The Pilot",
        slug: "live-jazz-at-the-pilot",
        startDate: "2025-01-18T20:00:00",
        venueName: "The Pilot Inn",
        address: "726 Mumbles Road, SA3 4EL",
        summary: "Enjoy live jazz performances every Saturday at this historic Mumbles pub.",
        description: "The Pilot Inn hosts regular live music...",
        imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=400&fit=crop",
        tags: ["Music", "Arts & Culture"],
        ticketUrl: "https://example.com/tickets",
        isFeatured: false,
      },
      {
        name: "Oystermouth Castle Twilight Tours",
        slug: "oystermouth-castle-twilight-tours",
        startDate: "2025-01-25T17:30:00",
        venueName: "Oystermouth Castle",
        address: "Castle Avenue, Mumbles, SA3 4BA",
        summary: "Experience the castle after dark with lantern-lit guided tours.",
        description: "Special winter evening tours of the historic castle...",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=400&fit=crop",
        tags: ["Arts & Culture", "Family Friendly"],
        ticketUrl: "https://example.com/castle-tours",
        isFeatured: false,
      },
      {
        name: "Mumbles Food Festival",
        slug: "mumbles-food-festival",
        startDate: "2025-02-15T10:00:00",
        endDate: "2025-02-16T18:00:00",
        venueName: "Mumbles Promenade",
        address: "Mumbles Promenade, SA3 4AA",
        summary: "A celebration of Welsh food and drink with local producers and celebrity chefs.",
        description: "The annual Mumbles Food Festival returns...",
        imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop",
        tags: ["Festival", "Food & Drink", "Family Friendly"],
        isFeatured: false,
      },
    ];

    const insiderTipSeeds = [
      {
        title: "Best Time to Visit",
        tip: "Visit Mumbles in late spring or early autumn for fewer crowds and beautiful weather. The local restaurants are less busy and you'll get the true village atmosphere.",
        author: "Sarah",
        isActive: true
      },
      {
        title: "Hidden Beach Spot",
        tip: "Walk past Bracelet Bay towards Langland - there's a small cove between the two that's often empty, even in summer. Perfect for a peaceful morning swim!",
        author: "Tom",
        isActive: true
      },
      {
        title: "Sunday Market",
        tip: "The Mumbles Artisan Market runs every second Sunday at Oystermouth Square. Get there early for the best selection of local crafts and fresh produce.",
        author: "Emma",
        isActive: true
      }
    ];

    if (existingArticles.length === 0) {
      await this.db.articles.createMany({ data: articleSeeds as any });
    }
    if (existingEvents.length === 0) {
      await this.db.events.createMany({ data: eventSeeds as any });
    }
    const existingTips = await this.db.insiderTips.findMany();
    if (existingTips.length === 0) {
      await this.db.insiderTips.createMany({ data: insiderTipSeeds as any });
    }
  }

  async getSiteSettings(): Promise<SiteSettings> {
    const result = await this.db.siteSettings.findFirst();
    if (!result) {
      const newSettings = await this.db.siteSettings.create({ data: {} });
      return newSettings as any as SiteSettings;
    }
    return result as any as SiteSettings;
  }

  async updateSiteSettings(updates: UpdateSiteSettings): Promise<SiteSettings> {
    const current = await this.getSiteSettings();
    const updated = await this.db.siteSettings.update({
      where: { id: current.id },
      data: { ...updates, updatedAt: new Date() } as any
    });
    return updated as any as SiteSettings;
  }

  async getAllGroupEvents(): Promise<GroupEvent[]> {
    const results = await this.db.groupEvents.findMany({ orderBy: { createdAt: 'desc' } });
    return results as any as GroupEvent[];
  }

  async getGroupEvents(groupId: string): Promise<GroupEvent[]> {
    const results = await this.db.groupEvents.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as GroupEvent[];
  }

  async createGroupEvent(event: InsertGroupEvent): Promise<GroupEvent> {
    const result = await this.db.groupEvents.create({ data: event as any });
    return result as any as GroupEvent;
  }

  async getGroupEventById(id: string): Promise<GroupEvent | undefined> {
    const result = await this.db.groupEvents.findUnique({ where: { id } });
    return (result as any as GroupEvent) ?? undefined;
  }

  async updateGroupEvent(id: string, updates: Partial<InsertGroupEvent>): Promise<GroupEvent | undefined> {
    try {
      const result = await this.db.groupEvents.update({ where: { id }, data: updates as any });
      return result as any as GroupEvent;
    } catch {
      return undefined;
    }
  }

  async deleteGroupEvent(id: string): Promise<boolean> {
    try {
      await this.db.groupEvents.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getGroupEventComments(eventId: string): Promise<GroupEventComment[]> {
    const results = await this.db.groupEventComments.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' }
    });
    return results as any as GroupEventComment[];
  }

  async createGroupEventComment(comment: InsertGroupEventComment): Promise<GroupEventComment> {
    const result = await this.db.groupEventComments.create({ data: comment as any });
    return result as any as GroupEventComment;
  }

  async deleteGroupEventComment(id: string, userId: string): Promise<boolean> {
    const comment = await this.db.groupEventComments.findUnique({ where: { id } });
    if (!comment || comment.userId !== userId) return false;
    try {
      await this.db.groupEventComments.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getGroupEventReactions(eventId: string): Promise<GroupEventReaction[]> {
    const results = await this.db.groupEventReactions.findMany({ where: { eventId } });
    return results as any as GroupEventReaction[];
  }

  async toggleGroupEventReaction(eventId: string, userId: string, reactionType: string): Promise<boolean> {
    const existing = await this.db.groupEventReactions.findFirst({
      where: { eventId, userId, reactionType }
    });

    if (existing) {
      await this.db.groupEventReactions.delete({ where: { id: existing.id } });
      return false;
    } else {
      await this.db.groupEventReactions.create({ data: { eventId, userId, reactionType } });
      return true;
    }
  }

  async getGroupEventReactionCount(eventId: string): Promise<number> {
    return this.db.groupEventReactions.count({ where: { eventId } });
  }

  async getGroupEventCommentCount(eventId: string): Promise<number> {
    return this.db.groupEventComments.count({ where: { eventId } });
  }

  async getArticleCategories(): Promise<ArticleCategoryRecord[]> {
    const categories = await this.db.articleCategories.findMany({ orderBy: { orderIndex: 'asc' } });
    return categories as any as ArticleCategoryRecord[];
  }

  async createArticleCategory(category: InsertArticleCategory): Promise<ArticleCategoryRecord> {
    const result = await this.db.articleCategories.create({ data: category as any });
    return result as any as ArticleCategoryRecord;
  }

  async updateArticleCategory(id: number, updates: Partial<InsertArticleCategory>): Promise<ArticleCategoryRecord | undefined> {
    try {
      const result = await this.db.articleCategories.update({ where: { id }, data: updates as any });
      return result as any as ArticleCategoryRecord;
    } catch {
      return undefined;
    }
  }

  async deleteArticleCategory(id: number): Promise<boolean> {
    await this.db.articleCategories.delete({ where: { id } });
    return true;
  }

  async updateArticlesByCategory(oldName: string, newName: string): Promise<void> {
    const trimmedOld = oldName.trim().toLowerCase();
    const trimmedNew = newName.trim();
    console.log(`[Category Cascade] Updating articles from "${oldName}" to "${trimmedNew}" (matching: ${trimmedOld})`);
    const result = await this.db.$executeRawUnsafe(
      `UPDATE articles SET category = $1 WHERE LOWER(TRIM(category)) = $2`,
      trimmedNew,
      trimmedOld
    );
    console.log(`[Category Cascade] Update completed, result:`, result);
  }

  async getEventCategories(): Promise<EventCategoryRecord[]> {
    const categories = await this.db.eventCategories.findMany({ orderBy: { orderIndex: 'asc' } });
    return categories as any as EventCategoryRecord[];
  }

  async createEventCategory(category: InsertEventCategory): Promise<EventCategoryRecord> {
    const result = await this.db.eventCategories.create({ data: category as any });
    return result as any as EventCategoryRecord;
  }

  async updateEventCategory(id: number, updates: Partial<InsertEventCategory>): Promise<EventCategoryRecord | undefined> {
    try {
      const result = await this.db.eventCategories.update({ where: { id }, data: updates as any });
      return result as any as EventCategoryRecord;
    } catch {
      return undefined;
    }
  }

  async deleteEventCategory(id: number): Promise<boolean> {
    await this.db.eventCategories.delete({ where: { id } });
    return true;
  }

  async getReviewCategories(): Promise<ReviewCategoryRecord[]> {
    const categories = await this.db.reviewCategories.findMany({ orderBy: { orderIndex: 'asc' } });
    return categories as any as ReviewCategoryRecord[];
  }

  async createReviewCategory(category: InsertReviewCategory): Promise<ReviewCategoryRecord> {
    const result = await this.db.reviewCategories.create({ data: category as any });
    return result as any as ReviewCategoryRecord;
  }

  async updateReviewCategory(id: number, updates: Partial<InsertReviewCategory>): Promise<ReviewCategoryRecord | undefined> {
    try {
      const result = await this.db.reviewCategories.update({ where: { id }, data: updates as any });
      return result as any as ReviewCategoryRecord;
    } catch {
      return undefined;
    }
  }

  async deleteReviewCategory(id: number): Promise<boolean> {
    await this.db.reviewCategories.delete({ where: { id } });
    return true;
  }

  async updateReviewsByCategory(oldName: string, newName: string): Promise<void> {
    const trimmedOld = oldName.trim().toLowerCase();
    const trimmedNew = newName.trim();
    console.log(`[Review Category Cascade] Updating reviews from "${oldName}" to "${trimmedNew}"`);
    await this.db.$executeRawUnsafe(
      `UPDATE member_reviews SET category = $1 WHERE LOWER(TRIM(category)) = $2`,
      trimmedNew,
      trimmedOld
    );
  }

  async getProfileFieldDefinitions(): Promise<ProfileFieldDefinition[]> {
    const results = await this.db.profileFieldDefinitions.findMany({ orderBy: { orderIndex: 'asc' } });
    return results as any as ProfileFieldDefinition[];
  }

  async getProfileFieldDefinitionById(id: number): Promise<ProfileFieldDefinition | undefined> {
    const result = await this.db.profileFieldDefinitions.findUnique({ where: { id } });
    return (result as any as ProfileFieldDefinition) ?? undefined;
  }

  async createProfileFieldDefinition(field: InsertProfileFieldDefinition): Promise<ProfileFieldDefinition> {
    const result = await this.db.profileFieldDefinitions.create({ data: field as any });
    return result as any as ProfileFieldDefinition;
  }

  async updateProfileFieldDefinition(id: number, updates: Partial<InsertProfileFieldDefinition>): Promise<ProfileFieldDefinition | undefined> {
    try {
      const result = await this.db.profileFieldDefinitions.update({ where: { id }, data: updates as any });
      return result as any as ProfileFieldDefinition;
    } catch {
      return undefined;
    }
  }

  async deleteProfileFieldDefinition(id: number): Promise<boolean> {
    await this.deleteProfileFieldOptionsByField(id);
    await this.deleteProfileFieldSelectorValuesByField(id);
    await this.db.userProfileFieldValues.deleteMany({ where: { fieldId: id } });
    await this.db.profileFieldDefinitions.delete({ where: { id } });
    return true;
  }

  async getProfileFieldOptions(fieldId: number): Promise<ProfileFieldOption[]> {
    const results = await this.db.profileFieldOptions.findMany({
      where: { fieldId },
      orderBy: { orderIndex: 'asc' }
    });
    return results as any as ProfileFieldOption[];
  }

  async createProfileFieldOption(option: InsertProfileFieldOption): Promise<ProfileFieldOption> {
    const result = await this.db.profileFieldOptions.create({ data: option as any });
    return result as any as ProfileFieldOption;
  }

  async updateProfileFieldOption(id: number, updates: Partial<InsertProfileFieldOption>): Promise<ProfileFieldOption | undefined> {
    try {
      const result = await this.db.profileFieldOptions.update({ where: { id }, data: updates as any });
      return result as any as ProfileFieldOption;
    } catch {
      return undefined;
    }
  }

  async deleteProfileFieldOption(id: number): Promise<boolean> {
    await this.db.profileFieldOptions.delete({ where: { id } });
    return true;
  }

  async deleteProfileFieldOptionsByField(fieldId: number): Promise<boolean> {
    await this.db.profileFieldOptions.deleteMany({ where: { fieldId } });
    return true;
  }

  async getProfileFieldSelectorValues(fieldId: number): Promise<ProfileFieldSelectorValue[]> {
    const results = await this.db.profileFieldSelectorValues.findMany({
      where: { fieldId },
      orderBy: { value: 'asc' }
    });
    return results as any as ProfileFieldSelectorValue[];
  }

  async searchProfileFieldSelectorValues(fieldId: number, query: string, limit: number = 20): Promise<ProfileFieldSelectorValue[]> {
    const results = await this.db.profileFieldSelectorValues.findMany({
      where: {
        fieldId,
        value: { contains: query, mode: 'insensitive' }
      },
      orderBy: { value: 'asc' },
      take: limit
    });
    return results as any as ProfileFieldSelectorValue[];
  }

  async bulkInsertProfileFieldSelectorValues(fieldId: number, values: string[]): Promise<void> {
    await this.deleteProfileFieldSelectorValuesByField(fieldId);
    if (values.length > 0) {
      const insertData = values.map(value => ({ fieldId, value }));
      await this.db.profileFieldSelectorValues.createMany({ data: insertData });
    }
  }

  async deleteProfileFieldSelectorValuesByField(fieldId: number): Promise<boolean> {
    await this.db.profileFieldSelectorValues.deleteMany({ where: { fieldId } });
    return true;
  }

  async getUserProfileFieldValues(userId: string): Promise<UserProfileFieldValue[]> {
    const results = await this.db.userProfileFieldValues.findMany({ where: { userId } });
    return results as any as UserProfileFieldValue[];
  }

  async setUserProfileFieldValue(userId: string, fieldId: number, value: string): Promise<UserProfileFieldValue> {
    await this.db.userProfileFieldValues.deleteMany({ where: { userId, fieldId } });
    const result = await this.db.userProfileFieldValues.create({
      data: { userId, fieldId, value }
    });
    return result as any as UserProfileFieldValue;
  }

  async deleteUserProfileFieldValue(userId: string, fieldId: number): Promise<boolean> {
    await this.db.userProfileFieldValues.deleteMany({ where: { userId, fieldId } });
    return true;
  }

  async getProfilePictures(userId: string): Promise<ProfilePicture[]> {
    const results = await this.db.profilePictures.findMany({
      where: { userId },
      orderBy: { orderIndex: 'asc' }
    });
    return results as any as ProfilePicture[];
  }

  async addProfilePicture(picture: InsertProfilePicture): Promise<ProfilePicture> {
    const result = await this.db.profilePictures.create({ data: picture as any });
    return result as any as ProfilePicture;
  }

  async updateProfilePicture(id: number, updates: Partial<InsertProfilePicture>): Promise<ProfilePicture | undefined> {
    try {
      const result = await this.db.profilePictures.update({ where: { id }, data: updates as any });
      return result as any as ProfilePicture;
    } catch {
      return undefined;
    }
  }

  async deleteProfilePicture(id: number): Promise<boolean> {
    await this.db.profilePictures.delete({ where: { id } });
    return true;
  }

  async migrateProfilePicturesToTable(userId: string, imageUrls: string[]): Promise<ProfilePicture[]> {
    const pictures: ProfilePicture[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const pic = await this.db.profilePictures.create({
        data: { userId, imageUrl: imageUrls[i], orderIndex: i }
      });
      pictures.push(pic as any as ProfilePicture);
    }
    return pictures;
  }

  async createConnectionRequest(requesterId: string, receiverId: string, message?: string): Promise<UserConnection> {
    const result = await this.db.userConnections.create({
      data: { requesterId, receiverId, status: "pending", message: message || null }
    });
    return result as any as UserConnection;
  }

  async getConnectionById(id: number): Promise<UserConnection | undefined> {
    const result = await this.db.userConnections.findUnique({ where: { id } });
    return (result as any as UserConnection) ?? undefined;
  }

  async getConnections(userId: string): Promise<UserConnection[]> {
    const results = await this.db.userConnections.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { receiverId: userId }
        ],
        status: "accepted"
      },
      orderBy: { updatedAt: 'desc' }
    });
    return results as any as UserConnection[];
  }

  async getIncomingRequests(userId: string): Promise<UserConnection[]> {
    const results = await this.db.userConnections.findMany({
      where: { receiverId: userId, status: "pending" },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as UserConnection[];
  }

  async getOutgoingRequests(userId: string): Promise<UserConnection[]> {
    const results = await this.db.userConnections.findMany({
      where: { requesterId: userId, status: "pending" },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as UserConnection[];
  }

  async getConnectionBetweenUsers(userId1: string, userId2: string): Promise<UserConnection | undefined> {
    const result = await this.db.userConnections.findFirst({
      where: {
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 }
        ]
      }
    });
    return (result as any as UserConnection) ?? undefined;
  }

  async updateConnectionStatus(id: number, status: string): Promise<UserConnection | undefined> {
    try {
      const result = await this.db.userConnections.update({
        where: { id },
        data: { status, updatedAt: new Date() }
      });
      return result as any as UserConnection;
    } catch {
      return undefined;
    }
  }

  async deleteConnection(id: number): Promise<boolean> {
    await this.db.userConnections.delete({ where: { id } });
    return true;
  }

  async createConnectionNotification(data: { userId: string; type: string; connectionId?: number | null; messageId?: number | null; fromUserId?: string | null; eventId?: string | null; teamId?: string | null; matchId?: string | null; playRequestId?: number | null; metadata?: string | null }): Promise<ConnectionNotification> {
    const result = await this.db.connectionNotifications.create({
      data: {
        userId: data.userId,
        type: data.type,
        connectionId: data.connectionId || null,
        messageId: data.messageId || null,
        fromUserId: data.fromUserId || null,
        eventId: data.eventId || null,
        teamId: data.teamId || null,
        matchId: data.matchId || null,
        playRequestId: data.playRequestId || null,
        metadata: data.metadata || null
      }
    });
    return result as any as ConnectionNotification;
  }

  async getConnectionNotifications(userId: string): Promise<ConnectionNotification[]> {
    const results = await this.db.connectionNotifications.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as ConnectionNotification[];
  }

  async getUnreadConnectionNotificationCounts(userId: string): Promise<{ incomingRequests: number; acceptedRequests: number; declinedRequests: number; newMessages: number; total: number }> {
    const results: any[] = await this.db.$queryRawUnsafe(
      `SELECT
        COUNT(*) FILTER (WHERE type = 'incoming_request' AND is_read = false) as "incomingRequests",
        COUNT(*) FILTER (WHERE type = 'request_accepted' AND is_read = false) as "acceptedRequests",
        COUNT(*) FILTER (WHERE type = 'request_declined' AND is_read = false) as "declinedRequests",
        COUNT(*) FILTER (WHERE type = 'new_message' AND is_read = false) as "newMessages",
        COUNT(*) FILTER (WHERE is_read = false) as "total"
      FROM connection_notifications
      WHERE user_id = $1`,
      userId
    );
    const result = results[0];
    return {
      incomingRequests: Number(result?.incomingRequests || 0),
      acceptedRequests: Number(result?.acceptedRequests || 0),
      declinedRequests: Number(result?.declinedRequests || 0),
      newMessages: Number(result?.newMessages || 0),
      total: Number(result?.total || 0)
    };
  }

  async markConnectionNotificationsAsRead(userId: string, type?: string): Promise<void> {
    if (type) {
      await this.db.connectionNotifications.updateMany({
        where: { userId, type },
        data: { isRead: true }
      });
    } else {
      await this.db.connectionNotifications.updateMany({
        where: { userId },
        data: { isRead: true }
      });
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await this.db.connectionNotifications.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  async getUnreadMessageCountByUser(userId: string): Promise<Record<string, number>> {
    const results = await this.db.messages.groupBy({
      by: ['senderId'],
      where: { receiverId: userId, isRead: false },
      _count: { _all: true }
    });

    const countMap: Record<string, number> = {};
    for (const row of results) {
      countMap[row.senderId] = row._count._all;
    }
    return countMap;
  }

  async getTotalUnreadMessageCount(userId: string): Promise<number> {
    return this.db.messages.count({
      where: { receiverId: userId, isRead: false }
    });
  }

  async searchContent(query: string, userId?: string): Promise<SearchResults> {
    if (!query || query.trim().length === 0) {
      return {
        query: '',
        events: [],
        articles: [],
        reviews: [],
        users: [],
        groups: []
      };
    }

    const searchTerm = query.trim().toLowerCase();

    const [eventResults, articleResults, reviewResults, userResults, groupResults] = await Promise.all([
      this.db.events.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { summary: { contains: searchTerm, mode: 'insensitive' } },
            { venueName: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { id: true, name: true, slug: true, summary: true, imageUrl: true, startDate: true, venueName: true },
        take: 10
      }),

      this.db.articles.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { excerpt: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { id: true, title: true, slug: true, excerpt: true, heroImageUrl: true, category: true },
        take: 10
      }),

      this.db.memberReviews.findMany({
        where: {
          status: 'approved',
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { summary: { contains: searchTerm, mode: 'insensitive' } },
            { placeName: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { id: true, title: true, slug: true, summary: true, rating: true, category: true, imageUrl: true, placeName: true },
        take: 10
      }),

      this.db.users.findMany({
        where: {
          isProfilePublic: true,
          blocked: false,
          mumblesVibeName: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { id: true, mumblesVibeName: true, profileImageUrl: true, aboutMe: true },
        take: 10
      }),

      this.searchGroups(`%${searchTerm}%`, userId)
    ]);

    return {
      query: query.trim(),
      events: eventResults.map(e => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        summary: e.summary,
        imageUrl: e.imageUrl,
        startDate: e.startDate,
        venueName: e.venueName
      })),
      articles: articleResults.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        heroImageUrl: a.heroImageUrl,
        category: a.category
      })),
      reviews: reviewResults.map(r => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.summary || '',
        rating: r.rating,
        category: r.category,
        imageUrl: r.imageUrl,
        venueName: r.placeName
      })),
      users: await Promise.all(userResults.map(async u => {
        let connectionStatus: 'connected' | 'pending' | 'none' | null = null;
        if (userId && u.id !== userId) {
          const connection = await this.db.userConnections.findFirst({
            where: {
              OR: [
                { requesterId: userId, receiverId: u.id },
                { requesterId: u.id, receiverId: userId }
              ]
            }
          });

          if (connection) {
            connectionStatus = connection.status === 'accepted' ? 'connected' :
                               connection.status === 'pending' ? 'pending' : 'none';
          } else {
            connectionStatus = 'none';
          }
        }
        return {
          id: u.id,
          mumblesVibeName: u.mumblesVibeName,
          profileImageUrl: u.profileImageUrl,
          aboutMe: u.aboutMe,
          connectionStatus
        };
      })),
      groups: groupResults
    };
  }

  private async searchGroups(searchTerm: string, userId?: string): Promise<SearchResultGroup[]> {
    const term = searchTerm.replace(/%/g, '');
    const allGroups = await this.db.groups.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, slug: true, description: true, imageUrl: true, isPublic: true },
      take: 10
    });

    return allGroups.map(g => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      imageUrl: g.imageUrl,
      isPublic: g.isPublic ?? false
    }));
  }

  async getEventEntries(eventId: string): Promise<EventEntry[]> {
    const results = await this.db.eventEntries.findMany({
      where: { eventId },
      orderBy: { enteredAt: 'desc' }
    });
    return results as any as EventEntry[];
  }

  async getEventEntriesByUser(userId: string): Promise<EventEntry[]> {
    const results = await this.db.eventEntries.findMany({
      where: { userId },
      orderBy: { enteredAt: 'desc' }
    });
    return results as any as EventEntry[];
  }

  async getEventEntryById(entryId: string): Promise<EventEntry | undefined> {
    const result = await this.db.eventEntries.findUnique({ where: { id: entryId } });
    return (result as any as EventEntry) ?? undefined;
  }

  async getEventEntryByUserAndEvent(eventId: string, userId: string): Promise<EventEntry | undefined> {
    const result = await this.db.eventEntries.findFirst({ where: { eventId, userId } });
    return (result as any as EventEntry) ?? undefined;
  }

  async getEventEntryCount(eventId: string): Promise<number> {
    const results: any[] = await this.db.$queryRawUnsafe(
      `SELECT COALESCE(SUM(COALESCE(player_count, 1)), 0) as total FROM event_entries WHERE event_id = $1`,
      eventId
    );
    return Number(results[0]?.total || 0);
  }

  async createEventEntry(entry: InsertEventEntry): Promise<EventEntry> {
    const result = await this.db.eventEntries.create({ data: entry as any });
    return result as any as EventEntry;
  }

  async updateEventEntry(id: string, updates: Partial<InsertEventEntry>): Promise<EventEntry | undefined> {
    try {
      const result = await this.db.eventEntries.update({ where: { id }, data: updates as any });
      return result as any as EventEntry;
    } catch {
      return undefined;
    }
  }

  async deleteEventEntry(id: string): Promise<boolean> {
    try {
      await this.db.eventEntries.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getCompetitionTeams(eventId: string): Promise<CompetitionTeam[]> {
    const results = await this.db.competitionTeams.findMany({
      where: { eventId },
      orderBy: { teamNumber: 'asc' }
    });
    return results as any as CompetitionTeam[];
  }

  async createCompetitionTeam(team: InsertCompetitionTeam): Promise<CompetitionTeam> {
    const result = await this.db.competitionTeams.create({ data: team as any });
    return result as any as CompetitionTeam;
  }

  async deleteCompetitionTeams(eventId: string): Promise<boolean> {
    await this.db.competitionTeams.deleteMany({ where: { eventId } });
    return true;
  }

  async updateCompetitionTeam(teamId: string, updates: Partial<InsertCompetitionTeam>): Promise<CompetitionTeam | undefined> {
    try {
      const result = await this.db.competitionTeams.update({ where: { id: teamId }, data: updates as any });
      return result as any as CompetitionTeam;
    } catch {
      return undefined;
    }
  }

  async getCompetitionTeamById(teamId: string): Promise<CompetitionTeam | undefined> {
    const result = await this.db.competitionTeams.findUnique({ where: { id: teamId } });
    return (result as any as CompetitionTeam) ?? undefined;
  }

  async updateCompetitionTeamStableford(teamId: string, teamStableford: number, teamHandicap?: number | null): Promise<CompetitionTeam | undefined> {
    const updateData: any = { teamStableford };
    if (teamHandicap !== undefined) {
      updateData.teamHandicap = teamHandicap;
    }
    try {
      const result = await this.db.competitionTeams.update({
        where: { id: teamId },
        data: updateData
      });
      return result as any as CompetitionTeam;
    } catch {
      return undefined;
    }
  }

  async updateCompetitionTeamTeeTime(teamId: string, teeTime: string): Promise<CompetitionTeam | undefined> {
    try {
      const result = await this.db.competitionTeams.update({
        where: { id: teamId },
        data: { teeTime }
      });
      return result as any as CompetitionTeam;
    } catch {
      return undefined;
    }
  }

  async getCompetitionBracket(eventId: string): Promise<CompetitionBracket | undefined> {
    const result = await this.db.competitionBrackets.findFirst({ where: { eventId } });
    return (result as any as CompetitionBracket) ?? undefined;
  }

  async createCompetitionBracket(bracket: InsertCompetitionBracket): Promise<CompetitionBracket> {
    const result = await this.db.competitionBrackets.create({ data: bracket as any });
    return result as any as CompetitionBracket;
  }

  async deleteCompetitionBracket(eventId: string): Promise<boolean> {
    const bracket = await this.getCompetitionBracket(eventId);
    if (bracket) {
      const rounds = await this.getCompetitionRounds(bracket.id);
      for (const round of rounds) {
        await this.db.competitionMatches.deleteMany({ where: { roundId: round.id } });
      }
      await this.db.competitionRounds.deleteMany({ where: { bracketId: bracket.id } });
      await this.db.competitionBrackets.delete({ where: { id: bracket.id } });
    }
    return true;
  }

  async getCompetitionRounds(bracketId: string): Promise<CompetitionRound[]> {
    const results = await this.db.competitionRounds.findMany({
      where: { bracketId },
      orderBy: { roundNumber: 'asc' }
    });
    return results as any as CompetitionRound[];
  }

  async createCompetitionRound(round: InsertCompetitionRound): Promise<CompetitionRound> {
    const result = await this.db.competitionRounds.create({ data: round as any });
    return result as any as CompetitionRound;
  }

  async updateCompetitionRound(id: string, updates: Partial<InsertCompetitionRound>): Promise<CompetitionRound | undefined> {
    try {
      const result = await this.db.competitionRounds.update({ where: { id }, data: updates as any });
      return result as any as CompetitionRound;
    } catch {
      return undefined;
    }
  }

  async getCompetitionMatch(id: string): Promise<CompetitionMatch | undefined> {
    const result = await this.db.competitionMatches.findUnique({ where: { id } });
    return (result as any as CompetitionMatch) ?? undefined;
  }

  async getCompetitionMatches(roundId: string): Promise<CompetitionMatch[]> {
    const results = await this.db.competitionMatches.findMany({
      where: { roundId },
      orderBy: { matchNumber: 'asc' }
    });
    return results as any as CompetitionMatch[];
  }

  async getCompetitionBracketByRoundId(roundId: string): Promise<CompetitionBracket | undefined> {
    const round = await this.db.competitionRounds.findUnique({ where: { id: roundId } });
    if (!round) return undefined;
    const result = await this.db.competitionBrackets.findUnique({ where: { id: round.bracketId } });
    return (result as any as CompetitionBracket) ?? undefined;
  }

  async getCompetitionMatchesByBracket(bracketId: string): Promise<CompetitionMatch[]> {
    const rounds = await this.getCompetitionRounds(bracketId);
    const allMatches: CompetitionMatch[] = [];
    for (const round of rounds) {
      const matches = await this.getCompetitionMatches(round.id);
      allMatches.push(...matches);
    }
    return allMatches;
  }

  async createCompetitionMatch(match: InsertCompetitionMatch): Promise<CompetitionMatch> {
    const result = await this.db.competitionMatches.create({ data: match as any });
    return result as any as CompetitionMatch;
  }

  async updateCompetitionMatch(id: string, updates: Partial<InsertCompetitionMatch>): Promise<CompetitionMatch | undefined> {
    try {
      const result = await this.db.competitionMatches.update({ where: { id }, data: updates as any });
      return result as any as CompetitionMatch;
    } catch {
      return undefined;
    }
  }

  async getPlayRequests(): Promise<PlayRequest[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allRequests = await this.db.playRequests.findMany({
      where: { status: "active" },
      orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }]
    });
    return (allRequests as any as PlayRequest[]).filter(r => {
      const dateToCheck = r.endDate || r.startDate;
      return new Date(dateToCheck) >= today;
    });
  }

  async getPlayRequestById(id: number): Promise<PlayRequest | undefined> {
    const result = await this.db.playRequests.findUnique({ where: { id } });
    return (result as any as PlayRequest) ?? undefined;
  }

  async getPlayRequestsByUser(userId: string): Promise<PlayRequest[]> {
    const results = await this.db.playRequests.findMany({
      where: { userId },
      orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }]
    });
    return results as any as PlayRequest[];
  }

  async createPlayRequest(request: InsertPlayRequest): Promise<PlayRequest> {
    const result = await this.db.playRequests.create({
      data: {
        ...request,
        startDate: new Date(request.startDate),
        endDate: request.endDate ? new Date(request.endDate) : null,
      } as any
    });
    return result as any as PlayRequest;
  }

  async updatePlayRequest(id: number, data: Partial<InsertPlayRequest>): Promise<PlayRequest | undefined> {
    const updateData: any = { ...data };
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    try {
      const result = await this.db.playRequests.update({ where: { id }, data: updateData });
      return result as any as PlayRequest;
    } catch {
      return undefined;
    }
  }

  async deletePlayRequest(id: number): Promise<boolean> {
    await this.deletePlayRequestCriteriaByRequest(id);
    try {
      await this.db.playRequests.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getPlayRequestCriteria(playRequestId: number): Promise<PlayRequestCriteria[]> {
    const results = await this.db.playRequestCriteria.findMany({ where: { playRequestId } });
    return results as any as PlayRequestCriteria[];
  }

  async createPlayRequestCriteria(criteria: InsertPlayRequestCriteria): Promise<PlayRequestCriteria> {
    const result = await this.db.playRequestCriteria.create({ data: criteria as any });
    return result as any as PlayRequestCriteria;
  }

  async deletePlayRequestCriteriaByRequest(playRequestId: number): Promise<boolean> {
    await this.db.playRequestCriteria.deleteMany({ where: { playRequestId } });
    return true;
  }

  async findMatchingUsersForPlayRequest(criteria: { fieldId: number; value: string }[]): Promise<string[]> {
    if (criteria.length === 0) {
      const allProfiles = await this.db.userProfiles.findMany({ select: { userId: true } });
      return allProfiles.map(p => p.userId);
    }

    const criteriaByField = new Map<number, string[]>();
    for (const crit of criteria) {
      const existing = criteriaByField.get(crit.fieldId) || [];
      existing.push(crit.value);
      criteriaByField.set(crit.fieldId, existing);
    }

    const userSetsByField: Set<string>[] = [];

    for (const [fieldId, values] of criteriaByField.entries()) {
      const matchingUsersFromField = new Set<string>();

      for (const value of values) {
        const matches = await this.db.userProfileFieldValues.findMany({
          where: { fieldId, value },
          select: { userId: true }
        });
        matches.forEach(m => matchingUsersFromField.add(m.userId));
      }

      userSetsByField.push(matchingUsersFromField);
    }

    if (userSetsByField.length === 0) return [];
    let result = userSetsByField[0];
    for (let i = 1; i < userSetsByField.length; i++) {
      result = new Set([...result].filter(x => userSetsByField[i].has(x)));
    }

    return [...result];
  }

  async getPlayRequestOffers(playRequestId: number): Promise<PlayRequestOffer[]> {
    const results = await this.db.playRequestOffers.findMany({
      where: { playRequestId },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as PlayRequestOffer[];
  }

  async createPlayRequestOffer(offer: InsertPlayRequestOffer): Promise<PlayRequestOffer> {
    const result = await this.db.playRequestOffers.create({ data: offer as any });
    return result as any as PlayRequestOffer;
  }

  async getOffersByUser(userId: string): Promise<PlayRequestOffer[]> {
    const results = await this.db.playRequestOffers.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as PlayRequestOffer[];
  }

  async getUserOfferForRequest(playRequestId: number, userId: string): Promise<PlayRequestOffer | null> {
    const result = await this.db.playRequestOffers.findFirst({ where: { playRequestId, userId } });
    return (result as any as PlayRequestOffer) || null;
  }

  async deletePlayRequestOffer(offerId: number): Promise<void> {
    await this.db.playRequestOffers.delete({ where: { id: offerId } });
  }

  async getPlayRequestOfferById(offerId: number): Promise<PlayRequestOffer | null> {
    const result = await this.db.playRequestOffers.findUnique({ where: { id: offerId } });
    return (result as any as PlayRequestOffer) || null;
  }

  async getOfferCountsForUserRequests(userId: string): Promise<Map<number, { pending: number; accepted: number; rejected: number }>> {
    const userRequests = await this.db.playRequests.findMany({ where: { userId } });
    const requestIds = userRequests.map(r => r.id);

    if (requestIds.length === 0) {
      return new Map();
    }

    const offers = await this.db.playRequestOffers.findMany({
      where: { playRequestId: { in: requestIds } }
    });

    const countsMap = new Map<number, { pending: number; accepted: number; rejected: number }>();

    for (const offer of offers) {
      if (!countsMap.has(offer.playRequestId)) {
        countsMap.set(offer.playRequestId, { pending: 0, accepted: 0, rejected: 0 });
      }
      const counts = countsMap.get(offer.playRequestId)!;
      const status = offer.status || "pending";
      if (status === "pending") counts.pending++;
      else if (status === "accepted") counts.accepted++;
      else if (status === "rejected") counts.rejected++;
    }

    return countsMap;
  }

  async updateOfferStatus(offerId: number, status: string, responseNote?: string): Promise<PlayRequestOffer | null> {
    const updateData: any = { status };
    if (responseNote !== undefined) {
      updateData.responseNote = responseNote;
    }
    try {
      const result = await this.db.playRequestOffers.update({
        where: { id: offerId },
        data: updateData
      });
      return result as any as PlayRequestOffer;
    } catch {
      return null;
    }
  }

  async getAcceptedGamesForUser(userId: string): Promise<any[]> {
    const userRequests = await this.db.playRequests.findMany({ where: { userId } });
    const requestIds = userRequests.map(r => r.id);

    const userOffers = await this.db.playRequestOffers.findMany({
      where: { userId, status: "accepted" }
    });

    const games: any[] = [];

    if (requestIds.length > 0) {
      const acceptedOffersForUserRequests = await this.db.playRequestOffers.findMany({
        where: { playRequestId: { in: requestIds }, status: "accepted" }
      });

      for (const offer of acceptedOffersForUserRequests) {
        const request = userRequests.find(r => r.id === offer.playRequestId);
        if (request) {
          const otherPlayer = await this.db.users.findUnique({ where: { id: offer.userId } });
          games.push({
            id: offer.id,
            playRequestId: offer.playRequestId,
            startDate: request.startDate,
            startTime: request.startTime,
            endDate: request.endDate,
            endTime: request.endTime,
            isRequestOwner: true,
            otherPlayer: otherPlayer ? {
              id: otherPlayer.id,
              mumblesVibeName: otherPlayer.mumblesVibeName,
              profileImageUrl: otherPlayer.profileImageUrl
            } : null,
            clubName: offer.clubName,
            acceptedAt: offer.createdAt
          });
        }
      }
    }

    for (const offer of userOffers) {
      const request = await this.db.playRequests.findUnique({ where: { id: offer.playRequestId } });
      if (request) {
        const requestOwner = await this.db.users.findUnique({ where: { id: request.userId } });
        games.push({
          id: offer.id,
          playRequestId: offer.playRequestId,
          startDate: request.startDate,
          startTime: request.startTime,
          endDate: request.endDate,
          endTime: request.endTime,
          isRequestOwner: false,
          otherPlayer: requestOwner ? {
            id: requestOwner.id,
            mumblesVibeName: requestOwner.mumblesVibeName,
            profileImageUrl: requestOwner.profileImageUrl
          } : null,
          clubName: offer.clubName,
          acceptedAt: offer.createdAt
        });
      }
    }

    games.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return games;
  }

  async createPlayRequestOfferCriteria(criteria: InsertPlayRequestOfferCriteria): Promise<PlayRequestOfferCriteria> {
    const result = await this.db.playRequestOfferCriteria.create({ data: criteria as any });
    return result as any as PlayRequestOfferCriteria;
  }

  async getPlayRequestOfferCriteria(offerId: number): Promise<PlayRequestOfferCriteria[]> {
    const results = await this.db.playRequestOfferCriteria.findMany({
      where: { playRequestOfferId: offerId }
    });
    return results as any as PlayRequestOfferCriteria[];
  }

  async deletePlayRequestOfferCriteria(offerId: number): Promise<void> {
    await this.db.playRequestOfferCriteria.deleteMany({ where: { playRequestOfferId: offerId } });
  }

  async getTeeTimeOffers(): Promise<TeeTimeOffer[]> {
    const results = await this.db.teeTimeOffers.findMany({
      where: { status: "active", dateTime: { gte: new Date() } },
      orderBy: { dateTime: 'asc' }
    });
    return results as any as TeeTimeOffer[];
  }

  async getTeeTimeOfferById(id: number): Promise<TeeTimeOffer | undefined> {
    const result = await this.db.teeTimeOffers.findUnique({ where: { id } });
    return (result as any as TeeTimeOffer) ?? undefined;
  }

  async getTeeTimeOffersByUser(userId: string): Promise<TeeTimeOffer[]> {
    const results = await this.db.teeTimeOffers.findMany({
      where: { userId },
      orderBy: { dateTime: 'asc' }
    });
    return results as any as TeeTimeOffer[];
  }

  async createTeeTimeOffer(offer: InsertTeeTimeOffer): Promise<TeeTimeOffer> {
    const result = await this.db.teeTimeOffers.create({
      data: {
        ...offer,
        dateTime: new Date(offer.dateTime),
      } as any
    });
    return result as any as TeeTimeOffer;
  }

  async updateTeeTimeOffer(id: number, data: Partial<InsertTeeTimeOffer>): Promise<TeeTimeOffer | undefined> {
    const updateData: any = { ...data };
    if (data.dateTime) {
      updateData.dateTime = new Date(data.dateTime);
    }
    try {
      const result = await this.db.teeTimeOffers.update({ where: { id }, data: updateData });
      return result as any as TeeTimeOffer;
    } catch {
      return undefined;
    }
  }

  async deleteTeeTimeOffer(id: number): Promise<boolean> {
    await this.deleteTeeTimeOfferCriteriaByOffer(id);
    try {
      await this.db.teeTimeOffers.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getTeeTimeOfferCriteria(teeTimeOfferId: number): Promise<TeeTimeOfferCriteria[]> {
    const results = await this.db.teeTimeOfferCriteria.findMany({ where: { teeTimeOfferId } });
    return results as any as TeeTimeOfferCriteria[];
  }

  async createTeeTimeOfferCriteria(criteria: InsertTeeTimeOfferCriteria): Promise<TeeTimeOfferCriteria> {
    const result = await this.db.teeTimeOfferCriteria.create({ data: criteria as any });
    return result as any as TeeTimeOfferCriteria;
  }

  async deleteTeeTimeOfferCriteriaByOffer(teeTimeOfferId: number): Promise<boolean> {
    await this.db.teeTimeOfferCriteria.deleteMany({ where: { teeTimeOfferId } });
    return true;
  }

  async getTeeTimeReservationsByOffer(teeTimeOfferId: number): Promise<TeeTimeReservation[]> {
    const results = await this.db.teeTimeReservations.findMany({
      where: { teeTimeOfferId },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as TeeTimeReservation[];
  }

  async getTeeTimeReservationsByUser(userId: string): Promise<TeeTimeReservation[]> {
    const results = await this.db.teeTimeReservations.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return results as any as TeeTimeReservation[];
  }

  async getTeeTimeReservation(id: number): Promise<TeeTimeReservation | undefined> {
    const result = await this.db.teeTimeReservations.findUnique({ where: { id } });
    return (result as any as TeeTimeReservation) ?? undefined;
  }

  async getUserReservationForOffer(userId: string, teeTimeOfferId: number): Promise<TeeTimeReservation | undefined> {
    const result = await this.db.teeTimeReservations.findFirst({ where: { userId, teeTimeOfferId } });
    return (result as any as TeeTimeReservation) ?? undefined;
  }

  async createTeeTimeReservation(reservation: InsertTeeTimeReservation): Promise<TeeTimeReservation> {
    const result = await this.db.teeTimeReservations.create({ data: reservation as any });
    return result as any as TeeTimeReservation;
  }

  async updateTeeTimeReservation(id: number, data: { status: string; responseNote?: string }): Promise<TeeTimeReservation | undefined> {
    try {
      const result = await this.db.teeTimeReservations.update({ where: { id }, data });
      return result as any as TeeTimeReservation;
    } catch {
      return undefined;
    }
  }

  async deleteTeeTimeReservation(id: number): Promise<void> {
    await this.db.teeTimeReservations.delete({ where: { id } });
  }

  async getPodcasts(): Promise<Podcast[]> {
    const results = await this.db.podcasts.findMany({ orderBy: { publishedAt: 'desc' } });
    return results as any as Podcast[];
  }

  async getActivePodcasts(): Promise<Podcast[]> {
    const results = await this.db.podcasts.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: 'desc' }
    });
    return results as any as Podcast[];
  }

  async getPodcastById(id: string): Promise<Podcast | undefined> {
    const result = await this.db.podcasts.findUnique({ where: { id } });
    return (result as any as Podcast) ?? undefined;
  }

  async getPodcastBySlug(slug: string): Promise<Podcast | undefined> {
    const result = await this.db.podcasts.findFirst({ where: { slug } });
    return (result as any as Podcast) ?? undefined;
  }

  async createPodcast(podcast: InsertPodcast): Promise<Podcast> {
    const result = await this.db.podcasts.create({ data: podcast as any });
    return result as any as Podcast;
  }

  async updatePodcast(id: string, updates: Partial<InsertPodcast>): Promise<Podcast | undefined> {
    try {
      const result = await this.db.podcasts.update({ where: { id }, data: updates as any });
      return result as any as Podcast;
    } catch {
      return undefined;
    }
  }

  async deletePodcast(id: string): Promise<boolean> {
    try {
      await this.db.podcasts.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  async getTenants(): Promise<Tenant[]> {
    const results = await this.db.tenants.findMany({ orderBy: { createdAt: 'desc' } });
    return results as any as Tenant[];
  }

  async getTenantById(id: string): Promise<Tenant | undefined> {
    const result = await this.db.tenants.findUnique({ where: { id } });
    return (result as any as Tenant) || undefined;
  }

  async createTenant(data: { name: string; domainName?: string | null; subDomain?: string | null }): Promise<Tenant> {
    const result = await this.db.tenants.create({ data });
    return result as any as Tenant;
  }

  async updateTenant(id: string, data: Partial<{ name: string; domainName: string | null; subDomain: string | null }>): Promise<Tenant | undefined> {
    try {
      const sanitized = { ...data };
      if (sanitized.domainName === "") sanitized.domainName = null;
      if (sanitized.subDomain === "") sanitized.subDomain = null;
      const result = await this.db.tenants.update({ where: { id }, data: sanitized });
      return result as any as Tenant;
    } catch {
      return undefined;
    }
  }

  async deleteTenant(id: string): Promise<boolean> {
    try {
      await this.db.tenants.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
