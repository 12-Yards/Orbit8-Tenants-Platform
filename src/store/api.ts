"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "",
  credentials: "include",
});

const tenantAwareBaseQuery: typeof rawBaseQuery = async (queryArgs, apiObj, extraOptions) => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get("_tenantId");
    if (tenantId) {
      if (typeof queryArgs === "string") {
        if (!queryArgs.includes("_tenantId=")) {
          const separator = queryArgs.includes("?") ? "&" : "?";
          queryArgs = `${queryArgs}${separator}_tenantId=${encodeURIComponent(tenantId)}`;
        }
      } else if (typeof queryArgs === "object" && queryArgs !== null) {
        const url = (queryArgs as any).url || "";
        if (!url.includes("_tenantId=")) {
          const separator = url.includes("?") ? "&" : "?";
          queryArgs = { ...queryArgs as any, url: `${url}${separator}_tenantId=${encodeURIComponent(tenantId)}` };
        }
      }
    }
  }
  return rawBaseQuery(queryArgs, apiObj, extraOptions);
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: tenantAwareBaseQuery,
  tagTypes: [
    "Auth",
    "Articles",
    "ArticleComments",
    "ArticleLikes",
    "ArticleSections",
    "ArticleCategories",
    "Events",
    "EventEntries",
    "EventAttendance",
    "EventTeams",
    "EventBracket",
    "EventResults",
    "EventCategories",
    "EventSuggestions",
    "Groups",
    "GroupMembers",
    "GroupPosts",
    "GroupPostComments",
    "GroupEvents",
    "GroupEventComments",
    "Polls",
    "PollVotes",
    "Reviews",
    "ReviewComments",
    "ReviewLikes",
    "ReviewCategories",
    "Vibes",
    "Podcasts",
    "PodcastComments",
    "PodcastLikes",
    "Connections",
    "Messages",
    "Notifications",
    "SiteSettings",
    "HeroSettings",
    "InsiderTips",

    "SubscriptionPlans",
    "PlayRequests",
    "PlayRequestOffers",
    "TeeTimeOffers",
    "TeeTimeReservations",
    "Profile",
    "ProfileFields",
    "ProfilePictures",
    "UserProfiles",
    "AdminUsers",
    "Newsletter",
    "ContactRequests",
    "Stripe",
    "Search",
    "Calendar",
    "MyGames",
    "Tenants",
  ],
  endpoints: (builder) => ({
    // ===== AUTH =====
    getAuthUser: builder.query<any, void>({
      query: () => "/api/auth/user",
      providesTags: ["Auth"],
    }),
    login: builder.mutation<any, { email: string; password: string }>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    signup: builder.mutation<any, { email: string; password: string; mumblesVibeName: string }>({
      query: (body) => ({ url: "/api/auth/signup", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    logout: builder.mutation<any, void>({
      query: () => ({ url: "/api/auth/logout", method: "POST" }),
      invalidatesTags: ["Auth"],
    }),
    completeSsoFirstLogin: builder.mutation<any, void>({
      query: () => ({ url: "/api/auth/sso/complete-first-login", method: "POST" }),
      invalidatesTags: ["Auth"],
    }),

    // ===== SITE SETTINGS =====
    getSiteSettings: builder.query<any, void>({
      query: () => "/api/site-settings",
      providesTags: ["SiteSettings"],
    }),
    updateSiteSettings: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/site-settings", method: "PUT", body }),
      invalidatesTags: ["SiteSettings"],
    }),

    // ===== HERO SETTINGS =====
    getHeroSettings: builder.query<any, void>({
      query: () => "/api/hero-settings",
      providesTags: ["HeroSettings"],
    }),
    updateHeroSettings: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/hero-settings", method: "PUT", body }),
      invalidatesTags: ["HeroSettings"],
    }),

    // ===== ARTICLES =====
    getArticles: builder.query<any, void>({
      query: () => "/api/articles",
      providesTags: ["Articles"],
    }),
    getArticleBySlug: builder.query<any, string>({
      query: (slug) => `/api/articles/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Articles", id: slug }],
    }),
    getArticleSections: builder.query<any, string>({
      query: (articleId) => `/api/articles/${articleId}/sections`,
      providesTags: (_r, _e, id) => [{ type: "ArticleSections", id }],
    }),
    getArticleComments: builder.query<any, string>({
      query: (articleId) => `/api/articles/${articleId}/comments`,
      providesTags: (_r, _e, id) => [{ type: "ArticleComments", id }],
    }),
    getArticleLikes: builder.query<any, string>({
      query: (articleId) => `/api/articles/${articleId}/likes`,
      providesTags: (_r, _e, id) => [{ type: "ArticleLikes", id }],
    }),
    getArticleLiked: builder.query<any, string>({
      query: (articleId) => `/api/articles/${articleId}/liked`,
      providesTags: (_r, _e, id) => [{ type: "ArticleLikes", id: `liked-${id}` }],
    }),
    createArticle: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/articles", method: "POST", body }),
      invalidatesTags: ["Articles"],
    }),
    updateArticle: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/articles/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Articles"],
    }),
    deleteArticle: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/articles/${id}`, method: "DELETE" }),
      invalidatesTags: ["Articles"],
    }),
    likeArticle: builder.mutation<any, string>({
      query: (articleId) => ({ url: `/api/articles/${articleId}/like`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "ArticleLikes", id }, { type: "ArticleLikes", id: `liked-${id}` }],
    }),
    unlikeArticle: builder.mutation<any, string>({
      query: (articleId) => ({ url: `/api/articles/${articleId}/unlike`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "ArticleLikes", id }, { type: "ArticleLikes", id: `liked-${id}` }],
    }),
    createArticleComment: builder.mutation<any, { articleId: string; body: any }>({
      query: ({ articleId, body }) => ({ url: `/api/articles/${articleId}/comments`, method: "POST", body }),
      invalidatesTags: (_r, _e, { articleId }) => [{ type: "ArticleComments", id: articleId }],
    }),
    deleteArticleComment: builder.mutation<any, { articleId: string; commentId: number }>({
      query: ({ commentId }) => ({ url: `/api/comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { articleId }) => [{ type: "ArticleComments", id: articleId }],
    }),
    updateArticleSections: builder.mutation<any, { articleId: string; body: any }>({
      query: ({ articleId, body }) => ({ url: `/api/articles/${articleId}/sections`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { articleId }) => [{ type: "ArticleSections", id: articleId }],
    }),

    // ===== ARTICLE CATEGORIES =====
    getArticleCategories: builder.query<any, void>({
      query: () => "/api/article-categories",
      providesTags: ["ArticleCategories"],
    }),
    createArticleCategory: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/article-categories", method: "POST", body }),
      invalidatesTags: ["ArticleCategories"],
    }),
    updateArticleCategory: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/article-categories/${id}`, method: "PATCH", body }),
      invalidatesTags: ["ArticleCategories"],
    }),
    deleteArticleCategory: builder.mutation<any, number>({
      query: (id) => ({ url: `/api/admin/article-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["ArticleCategories"],
    }),
    reorderArticleCategories: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/article-categories/reorder", method: "POST", body }),
      invalidatesTags: ["ArticleCategories"],
    }),

    // ===== EVENTS =====
    getEvents: builder.query<any, void>({
      query: () => "/api/events",
      providesTags: ["Events"],
    }),
    getAdminEvents: builder.query<any, void>({
      query: () => "/api/admin/events",
      providesTags: ["Events"],
    }),
    getEventBySlug: builder.query<any, string>({
      query: (slug) => `/api/events/by-slug/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Events", id: slug }],
    }),
    getEventById: builder.query<any, string>({
      query: (id) => `/api/events/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Events", id }],
    }),
    getEventEntries: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/entries`,
      providesTags: (_r, _e, id) => [{ type: "EventEntries", id }],
    }),
    getEventEntryCount: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/entry-count`,
      providesTags: (_r, _e, id) => [{ type: "EventEntries", id: `count-${id}` }],
    }),
    getMyEventEntry: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/my-entry`,
      providesTags: (_r, _e, id) => [{ type: "EventEntries", id: `my-${id}` }],
    }),
    getEventTeams: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/teams`,
      providesTags: (_r, _e, id) => [{ type: "EventTeams", id }],
    }),
    getEventBracket: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/bracket`,
      providesTags: (_r, _e, id) => [{ type: "EventBracket", id }],
    }),
    getEventResults: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/results`,
      providesTags: (_r, _e, id) => [{ type: "EventResults", id }],
    }),
    getEventMembership: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/membership`,
      providesTags: (_r, _e, id) => [{ type: "Events", id: `membership-${id}` }],
    }),
    getEventAttendance: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/attendance`,
      providesTags: (_r, _e, id) => [{ type: "EventAttendance", id }],
    }),
    getMyEventAttendance: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/my-attendance`,
      providesTags: (_r, _e, id) => [{ type: "EventAttendance", id: `my-${id}` }],
    }),
    getEventAttendeesDetail: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/attendees-detail`,
      providesTags: (_r, _e, id) => [{ type: "EventAttendance", id: `detail-${id}` }],
    }),
    getMyEventMatch: builder.query<any, string>({
      query: (eventId) => `/api/events/${eventId}/my-match`,
      providesTags: (_r, _e, id) => [{ type: "EventBracket", id: `my-match-${id}` }],
    }),
    createEvent: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/events", method: "POST", body }),
      invalidatesTags: ["Events"],
    }),
    updateEvent: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/events/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Events", "EventEntries", "EventTeams", "EventBracket"],
    }),
    deleteEvent: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/events/${id}`, method: "DELETE" }),
      invalidatesTags: ["Events"],
    }),
    enterEvent: builder.mutation<any, { eventId: string; body: any }>({
      query: ({ eventId, body }) => ({ url: `/api/events/${eventId}/enter`, method: "POST", body }),
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "EventEntries", id: eventId },
        { type: "EventEntries", id: `count-${eventId}` },
        { type: "EventEntries", id: `my-${eventId}` },
      ],
    }),
    withdrawEvent: builder.mutation<any, string>({
      query: (eventId) => ({ url: `/api/events/${eventId}/withdraw`, method: "POST" }),
      invalidatesTags: (_r, _e, eventId) => [
        { type: "EventEntries", id: eventId },
        { type: "EventEntries", id: `count-${eventId}` },
        { type: "EventEntries", id: `my-${eventId}` },
      ],
    }),
    toggleEventAttendance: builder.mutation<any, string>({
      query: (eventId) => ({ url: `/api/events/${eventId}/toggle-attendance`, method: "POST" }),
      invalidatesTags: (_r, _e, eventId) => [
        { type: "EventAttendance", id: eventId },
        { type: "EventAttendance", id: `my-${eventId}` },
      ],
    }),
    updateEventMatch: builder.mutation<any, { matchId: string; body: any }>({
      query: ({ matchId, body }) => ({ url: `/api/competition-matches/${matchId}`, method: "PATCH", body }),
      invalidatesTags: ["EventBracket", "EventResults"],
    }),

    // ===== EVENT CATEGORIES =====
    getEventCategories: builder.query<any, void>({
      query: () => "/api/event-categories",
      providesTags: ["EventCategories"],
    }),
    createEventCategory: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/event-categories", method: "POST", body }),
      invalidatesTags: ["EventCategories"],
    }),
    updateEventCategory: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/event-categories/${id}`, method: "PATCH", body }),
      invalidatesTags: ["EventCategories"],
    }),
    deleteEventCategory: builder.mutation<any, number>({
      query: (id) => ({ url: `/api/admin/event-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["EventCategories"],
    }),
    reorderEventCategories: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/event-categories/reorder", method: "POST", body }),
      invalidatesTags: ["EventCategories"],
    }),

    // ===== EVENT SUGGESTIONS =====
    getEventSuggestions: builder.query<any, void>({
      query: () => "/api/event-suggestions",
      providesTags: ["EventSuggestions"],
    }),
    getPendingEventSuggestions: builder.query<any, void>({
      query: () => "/api/event-suggestions/pending",
      providesTags: [{ type: "EventSuggestions", id: "pending" }],
    }),
    createEventSuggestion: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/event-suggestions", method: "POST", body }),
      invalidatesTags: ["EventSuggestions"],
    }),
    updateEventSuggestion: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/event-suggestions/${id}`, method: "PATCH", body }),
      invalidatesTags: ["EventSuggestions"],
    }),

    // ===== GROUPS =====
    getGroups: builder.query<any, void>({
      query: () => "/api/groups",
      providesTags: ["Groups"],
    }),
    getMyGroups: builder.query<any, void>({
      query: () => "/api/groups/my",
      providesTags: [{ type: "Groups", id: "my" }],
    }),
    getMyCompetitionGroups: builder.query<any, void>({
      query: () => "/api/groups/my-competition-groups",
      providesTags: [{ type: "Groups", id: "my-competition" }],
    }),
    getMyEventGroups: builder.query<any, void>({
      query: () => "/api/groups/my-event-groups",
      providesTags: [{ type: "Groups", id: "my-event" }],
    }),
    getMyPendingGroups: builder.query<any, void>({
      query: () => "/api/groups/my-pending",
      providesTags: [{ type: "Groups", id: "my-pending" }],
    }),
    getGroupBySlug: builder.query<any, string>({
      query: (slug) => `/api/groups/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Groups", id: slug }],
    }),
    getGroupById: builder.query<any, string>({
      query: (id) => `/api/groups/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Groups", id }],
    }),
    getGroupMembers: builder.query<any, string>({
      query: (groupId) => `/api/groups/${groupId}/members`,
      providesTags: (_r, _e, id) => [{ type: "GroupMembers", id }],
    }),
    getGroupAllMembers: builder.query<any, string>({
      query: (groupId) => `/api/groups/${groupId}/all-members`,
      providesTags: (_r, _e, id) => [{ type: "GroupMembers", id: `all-${id}` }],
    }),
    getGroupMembership: builder.query<any, string>({
      query: (groupId) => `/api/groups/${groupId}/membership`,
      providesTags: (_r, _e, id) => [{ type: "GroupMembers", id: `membership-${id}` }],
    }),
    getGroupPosts: builder.query<any, string>({
      query: (groupId) => `/api/groups/${groupId}/posts`,
      providesTags: (_r, _e, id) => [{ type: "GroupPosts", id }],
    }),
    getGroupEvents: builder.query<any, string>({
      query: (groupId) => `/api/groups/${groupId}/events`,
      providesTags: (_r, _e, id) => [{ type: "GroupEvents", id }],
    }),
    getAdminGroups: builder.query<any, void>({
      query: () => "/api/admin/groups",
      providesTags: ["Groups"],
    }),
    getAdminGroupPendingCounts: builder.query<any, void>({
      query: () => "/api/admin/groups/pending-counts",
      providesTags: [{ type: "GroupMembers", id: "pending-counts" }],
    }),
    getAdminGroupPosts: builder.query<any, void>({
      query: () => "/api/admin/groups/posts",
      providesTags: ["GroupPosts"],
    }),
    getAdminGroupMembers: builder.query<any, string>({
      query: (groupId) => `/api/admin/groups/${groupId}/members`,
      providesTags: (_r, _e, id) => [{ type: "GroupMembers", id: `admin-${id}` }],
    }),
    getAdminGroupPending: builder.query<any, string>({
      query: (groupId) => `/api/admin/groups/${groupId}/pending`,
      providesTags: (_r, _e, id) => [{ type: "GroupMembers", id: `admin-pending-${id}` }],
    }),
    createAdminGroup: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/groups", method: "POST", body }),
      invalidatesTags: ["Groups"],
    }),
    joinGroup: builder.mutation<any, string>({
      query: (groupId) => ({ url: `/api/groups/${groupId}/join`, method: "POST" }),
      invalidatesTags: ["Groups", "GroupMembers"],
    }),
    leaveGroup: builder.mutation<any, string>({
      query: (groupId) => ({ url: `/api/groups/${groupId}/leave`, method: "POST" }),
      invalidatesTags: ["Groups", "GroupMembers"],
    }),
    updateGroup: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/groups/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Groups"],
    }),
    deleteGroup: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/groups/${id}`, method: "DELETE" }),
      invalidatesTags: ["Groups"],
    }),
    createGroupPost: builder.mutation<any, { groupId: string; body: any }>({
      query: ({ groupId, body }) => ({ url: `/api/groups/${groupId}/posts`, method: "POST", body }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "GroupPosts", id: groupId }],
    }),
    deleteGroupPost: builder.mutation<any, { groupId: string; postId: string }>({
      query: ({ postId }) => ({ url: `/api/group-posts/${postId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "GroupPosts", id: groupId }],
    }),
    reactToGroupPost: builder.mutation<any, { postId: string; groupId: string; body: any }>({
      query: ({ postId, body }) => ({ url: `/api/group-posts/${postId}/react`, method: "POST", body }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "GroupPosts", id: groupId }],
    }),
    getGroupPostComments: builder.query<any, string>({
      query: (postId) => `/api/group-posts/${postId}/comments`,
      providesTags: (_r, _e, id) => [{ type: "GroupPostComments", id }],
    }),
    createGroupPostComment: builder.mutation<any, { postId: string; body: any }>({
      query: ({ postId, body }) => ({ url: `/api/group-posts/${postId}/comments`, method: "POST", body }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: "GroupPostComments", id: postId }],
    }),
    deleteGroupPostComment: builder.mutation<any, { postId: string; commentId: string }>({
      query: ({ commentId }) => ({ url: `/api/group-post-comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: "GroupPostComments", id: postId }],
    }),
    approveGroupMember: builder.mutation<any, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({ url: `/api/groups/${groupId}/approve/${userId}`, method: "POST" }),
      invalidatesTags: ["GroupMembers"],
    }),
    rejectGroupMember: builder.mutation<any, { groupId: string; userId: string }>({
      query: ({ groupId, userId }) => ({ url: `/api/groups/${groupId}/reject/${userId}`, method: "POST" }),
      invalidatesTags: ["GroupMembers"],
    }),

    // ===== GROUP EVENTS =====
    getGroupEvent: builder.query<any, string>({
      query: (eventId) => `/api/group-events/${eventId}`,
      providesTags: (_r, _e, id) => [{ type: "GroupEvents", id }],
    }),
    getGroupEventComments: builder.query<any, string>({
      query: (eventId) => `/api/group-events/${eventId}/comments`,
      providesTags: (_r, _e, id) => [{ type: "GroupEventComments", id }],
    }),
    createGroupEvent: builder.mutation<any, { groupId: string; body: any }>({
      query: ({ groupId, body }) => ({ url: `/api/groups/${groupId}/events`, method: "POST", body }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "GroupEvents", id: groupId }],
    }),
    reactToGroupEvent: builder.mutation<any, { eventId: string; body: any }>({
      query: ({ eventId, body }) => ({ url: `/api/group-events/${eventId}/react`, method: "POST", body }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "GroupEvents", id: eventId }],
    }),
    createGroupEventComment: builder.mutation<any, { eventId: string; body: any }>({
      query: ({ eventId, body }) => ({ url: `/api/group-events/${eventId}/comments`, method: "POST", body }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "GroupEventComments", id: eventId }],
    }),

    // ===== POLLS =====
    getPolls: builder.query<any, void>({
      query: () => "/api/polls",
      providesTags: ["Polls"],
    }),
    getPollById: builder.query<any, string>({
      query: (id) => `/api/polls/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Polls", id }],
    }),
    getPollBySlug: builder.query<any, string>({
      query: (slug) => `/api/polls/slug/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Polls", id: slug }],
    }),
    getUserPollVote: builder.query<any, string>({
      query: (pollId) => `/api/polls/${pollId}/user-vote`,
      providesTags: (_r, _e, id) => [{ type: "PollVotes", id }],
    }),
    getAdminPolls: builder.query<any, void>({
      query: () => "/api/admin/polls",
      providesTags: ["Polls"],
    }),
    createPoll: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/polls", method: "POST", body }),
      invalidatesTags: ["Polls"],
    }),
    updatePoll: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/polls/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Polls"],
    }),
    deletePoll: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/admin/polls/${id}`, method: "DELETE" }),
      invalidatesTags: ["Polls"],
    }),
    votePoll: builder.mutation<any, { pollId: string; body: any }>({
      query: ({ pollId, body }) => ({ url: `/api/polls/${pollId}/vote`, method: "POST", body }),
      invalidatesTags: (_r, _e, { pollId }) => [{ type: "Polls", id: pollId }, "Polls", { type: "PollVotes", id: pollId }],
    }),
    rankingVotePoll: builder.mutation<any, { pollId: string; body: any }>({
      query: ({ pollId, body }) => ({ url: `/api/polls/${pollId}/ranking-vote`, method: "POST", body }),
      invalidatesTags: (_r, _e, { pollId }) => [{ type: "Polls", id: pollId }, "Polls", { type: "PollVotes", id: pollId }],
    }),

    // ===== REVIEWS =====
    getReviews: builder.query<any, void>({
      query: () => "/api/reviews",
      providesTags: ["Reviews"],
    }),
    getReviewBySlug: builder.query<any, string>({
      query: (slug) => `/api/reviews/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Reviews", id: slug }],
    }),
    getReviewComments: builder.query<any, string>({
      query: (reviewId) => `/api/reviews/${reviewId}/comments`,
      providesTags: (_r, _e, id) => [{ type: "ReviewComments", id }],
    }),
    getReviewLikes: builder.query<any, string>({
      query: (reviewId) => `/api/reviews/${reviewId}/likes`,
      providesTags: (_r, _e, id) => [{ type: "ReviewLikes", id }],
    }),
    getReviewLiked: builder.query<any, string>({
      query: (reviewId) => `/api/reviews/${reviewId}/liked`,
      providesTags: (_r, _e, id) => [{ type: "ReviewLikes", id: `liked-${id}` }],
    }),
    getAdminReviews: builder.query<any, string | void>({
      query: (status) => status ? `/api/admin/reviews?status=${status}` : "/api/admin/reviews",
      providesTags: ["Reviews"],
    }),
    getReviewCategories: builder.query<any, void>({
      query: () => "/api/review-categories",
      providesTags: ["ReviewCategories"],
    }),
    createReview: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/reviews", method: "POST", body }),
      invalidatesTags: ["Reviews"],
    }),
    updateReview: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/reviews/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Reviews"],
    }),
    deleteReview: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/reviews/${id}`, method: "DELETE" }),
      invalidatesTags: ["Reviews"],
    }),
    likeReview: builder.mutation<any, string>({
      query: (reviewId) => ({ url: `/api/reviews/${reviewId}/like`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "ReviewLikes", id }, { type: "ReviewLikes", id: `liked-${id}` }],
    }),
    unlikeReview: builder.mutation<any, string>({
      query: (reviewId) => ({ url: `/api/reviews/${reviewId}/unlike`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "ReviewLikes", id }, { type: "ReviewLikes", id: `liked-${id}` }],
    }),
    createReviewComment: builder.mutation<any, { reviewId: string; body: any }>({
      query: ({ reviewId, body }) => ({ url: `/api/reviews/${reviewId}/comments`, method: "POST", body }),
      invalidatesTags: (_r, _e, { reviewId }) => [{ type: "ReviewComments", id: reviewId }],
    }),
    deleteReviewComment: builder.mutation<any, { reviewId: string; commentId: number }>({
      query: ({ commentId }) => ({ url: `/api/review-comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { reviewId }) => [{ type: "ReviewComments", id: reviewId }],
    }),
    updateReviewComment: builder.mutation<any, { reviewId: string; commentId: number; body: any }>({
      query: ({ reviewId, commentId, body }) => ({ url: `/api/reviews/${reviewId}/comments/${commentId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { reviewId }) => [{ type: "ReviewComments", id: reviewId }],
    }),
    createReviewCategory: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/review-categories", method: "POST", body }),
      invalidatesTags: ["ReviewCategories"],
    }),
    updateReviewCategory: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/review-categories/${id}`, method: "PATCH", body }),
      invalidatesTags: ["ReviewCategories"],
    }),
    deleteReviewCategory: builder.mutation<any, number>({
      query: (id) => ({ url: `/api/admin/review-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["ReviewCategories"],
    }),
    reorderReviewCategories: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/review-categories/reorder", method: "POST", body }),
      invalidatesTags: ["ReviewCategories"],
    }),

    // ===== VIBES =====
    getVibes: builder.query<any, void>({
      query: () => "/api/vibes",
      providesTags: ["Vibes"],
    }),
    getVibeById: builder.query<any, string>({
      query: (id) => `/api/vibes/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Vibes", id }],
    }),
    getAdminVibes: builder.query<any, void>({
      query: () => "/api/admin/vibes",
      providesTags: ["Vibes"],
    }),
    createVibe: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/vibes", method: "POST", body }),
      invalidatesTags: ["Vibes"],
    }),
    updateVibe: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/vibes/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Vibes"],
    }),
    deleteVibe: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/vibes/${id}`, method: "DELETE" }),
      invalidatesTags: ["Vibes"],
    }),
    reactToVibe: builder.mutation<any, { vibeId: string; body: any }>({
      query: ({ vibeId, body }) => ({ url: `/api/vibes/${vibeId}/react`, method: "POST", body }),
      invalidatesTags: ["Vibes"],
    }),
    createVibeComment: builder.mutation<any, { vibeId: string; body: any }>({
      query: ({ vibeId, body }) => ({ url: `/api/vibes/${vibeId}/comments`, method: "POST", body }),
      invalidatesTags: ["Vibes"],
    }),
    deleteVibeComment: builder.mutation<any, { vibeId: string; commentId: number }>({
      query: ({ commentId }) => ({ url: `/api/vibe-comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: ["Vibes"],
    }),

    // ===== PODCASTS =====
    getPodcasts: builder.query<any, void>({
      query: () => "/api/podcasts",
      providesTags: ["Podcasts"],
    }),
    getPodcastBySlug: builder.query<any, string>({
      query: (slug) => `/api/podcasts/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Podcasts", id: slug }],
    }),
    getAdminPodcasts: builder.query<any, void>({
      query: () => "/api/admin/podcasts",
      providesTags: ["Podcasts"],
    }),
    getPodcastComments: builder.query<any, string>({
      query: (podcastId) => `/api/podcasts/${podcastId}/comments`,
      providesTags: (_r, _e, id) => [{ type: "PodcastComments", id }],
    }),
    getPodcastLikes: builder.query<any, string>({
      query: (podcastId) => `/api/podcasts/${podcastId}/likes`,
      providesTags: (_r, _e, id) => [{ type: "PodcastLikes", id }],
    }),
    getPodcastLiked: builder.query<any, string>({
      query: (podcastId) => `/api/podcasts/${podcastId}/liked`,
      providesTags: (_r, _e, id) => [{ type: "PodcastLikes", id: `liked-${id}` }],
    }),
    createPodcast: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/podcasts", method: "POST", body }),
      invalidatesTags: ["Podcasts"],
    }),
    updatePodcast: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/podcasts/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Podcasts"],
    }),
    deletePodcast: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/admin/podcasts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Podcasts"],
    }),
    likePodcast: builder.mutation<any, string>({
      query: (podcastId) => ({ url: `/api/podcasts/${podcastId}/like`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "PodcastLikes", id }, { type: "PodcastLikes", id: `liked-${id}` }],
    }),
    unlikePodcast: builder.mutation<any, string>({
      query: (podcastId) => ({ url: `/api/podcasts/${podcastId}/unlike`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "PodcastLikes", id }, { type: "PodcastLikes", id: `liked-${id}` }],
    }),
    createPodcastComment: builder.mutation<any, { podcastId: string; body: any }>({
      query: ({ podcastId, body }) => ({ url: `/api/podcasts/${podcastId}/comments`, method: "POST", body }),
      invalidatesTags: (_r, _e, { podcastId }) => [{ type: "PodcastComments", id: podcastId }],
    }),
    deletePodcastComment: builder.mutation<any, { podcastId: string; commentId: number }>({
      query: ({ commentId }) => ({ url: `/api/podcast-comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { podcastId }) => [{ type: "PodcastComments", id: podcastId }],
    }),

    // ===== CONNECTIONS =====
    getConnections: builder.query<any, void>({
      query: () => "/api/connections",
      providesTags: ["Connections"],
    }),
    getIncomingRequests: builder.query<any, void>({
      query: () => "/api/connections/requests/incoming",
      providesTags: [{ type: "Connections", id: "incoming" }],
    }),
    getOutgoingRequests: builder.query<any, void>({
      query: () => "/api/connections/requests/outgoing",
      providesTags: [{ type: "Connections", id: "outgoing" }],
    }),
    getConnectionStatus: builder.query<any, string>({
      query: (userId) => `/api/connections/status/${userId}`,
      providesTags: (_r, _e, id) => [{ type: "Connections", id }],
    }),
    sendConnectionRequest: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/connections/request", method: "POST", body }),
      invalidatesTags: ["Connections"],
    }),
    acceptConnection: builder.mutation<any, number>({
      query: (id) => ({ url: `/api/connections/${id}/accept`, method: "POST" }),
      invalidatesTags: ["Connections", "Notifications"],
    }),
    declineConnection: builder.mutation<any, number>({
      query: (id) => ({ url: `/api/connections/${id}/decline`, method: "POST" }),
      invalidatesTags: ["Connections", "Notifications"],
    }),
    removeConnection: builder.mutation<any, number>({
      query: (id) => ({ url: `/api/connections/${id}`, method: "DELETE" }),
      invalidatesTags: ["Connections"],
    }),

    // ===== MESSAGES =====
    getMessages: builder.query<any, { recipientId: string; context?: string }>({
      query: ({ recipientId, context }) => context ? `/api/messages/${recipientId}?context=${context}` : `/api/messages/${recipientId}`,
      providesTags: (_r, _e, { recipientId }) => [{ type: "Messages", id: recipientId }],
    }),
    sendMessage: builder.mutation<any, { recipientId: string; body: any }>({
      query: ({ recipientId, body }) => ({ url: `/api/messages/${recipientId}`, method: "POST", body }),
      invalidatesTags: (_r, _e, { recipientId }) => [{ type: "Messages", id: recipientId }, "Notifications"],
    }),

    // ===== NOTIFICATIONS =====
    getNotifications: builder.query<any, void>({
      query: () => "/api/notifications",
      providesTags: ["Notifications"],
    }),
    getNotificationCounts: builder.query<any, void>({
      query: () => "/api/notifications/counts",
      providesTags: [{ type: "Notifications", id: "counts" }],
    }),
    markNotificationsRead: builder.mutation<any, void>({
      query: () => ({ url: "/api/notifications/read-all", method: "POST" }),
      invalidatesTags: ["Notifications"],
    }),
    markConnectionNotificationsRead: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/notifications/connections/read", method: "POST", body }),
      invalidatesTags: ["Notifications"],
    }),

    // ===== INSIDER TIPS =====
    getInsiderTips: builder.query<any, void>({
      query: () => "/api/insider-tips",
      providesTags: ["InsiderTips"],
    }),
    createInsiderTip: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/insider-tips", method: "POST", body }),
      invalidatesTags: ["InsiderTips"],
    }),
    updateInsiderTip: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/insider-tips/${id}`, method: "PATCH", body }),
      invalidatesTags: ["InsiderTips"],
    }),
    deleteInsiderTip: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/insider-tips/${id}`, method: "DELETE" }),
      invalidatesTags: ["InsiderTips"],
    }),

    // ===== PROFILE =====
    getProfile: builder.query<any, void>({
      query: () => "/api/profile",
      providesTags: ["Profile"],
    }),
    getUserProfile: builder.query<any, void>({
      query: () => "/api/user-profile",
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/profile", method: "PATCH", body }),
      invalidatesTags: ["Profile", "Auth"],
    }),
    createUserProfile: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/user-profile", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),
    updateUserProfile: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/user-profile", method: "PUT", body }),
      invalidatesTags: ["Profile"],
    }),
    getProfileCustomFields: builder.query<any, void>({
      query: () => "/api/profile/custom-fields",
      providesTags: ["ProfileFields"],
    }),
    getProfilePictures: builder.query<any, void>({
      query: () => "/api/profile/pictures",
      providesTags: ["ProfilePictures"],
    }),
    uploadProfilePicture: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/profile/pictures", method: "POST", body }),
      invalidatesTags: ["ProfilePictures"],
    }),
    deleteProfilePicture: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/profile/pictures/${id}`, method: "DELETE" }),
      invalidatesTags: ["ProfilePictures"],
    }),
    getProfileFieldDefinitions: builder.query<any, void>({
      query: () => "/api/profile-field-definitions",
      providesTags: ["ProfileFields"],
    }),
    getProfileFieldOptions: builder.query<any, void>({
      query: () => "/api/profile-field-options",
      providesTags: ["ProfileFields"],
    }),
    getProfileFields: builder.query<any, void>({
      query: () => "/api/profile-fields",
      providesTags: ["ProfileFields"],
    }),
    getAdminProfileFields: builder.query<any, void>({
      query: () => "/api/admin/profile-fields",
      providesTags: ["ProfileFields"],
    }),
    createAdminProfileField: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/profile-fields", method: "POST", body }),
      invalidatesTags: ["ProfileFields"],
    }),
    updateAdminProfileField: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/profile-fields/${id}`, method: "PATCH", body }),
      invalidatesTags: ["ProfileFields"],
    }),
    deleteAdminProfileField: builder.mutation<any, number>({
      query: (id) => ({ url: `/api/admin/profile-fields/${id}`, method: "DELETE" }),
      invalidatesTags: ["ProfileFields"],
    }),
    reorderAdminProfileFields: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/profile-fields/reorder", method: "POST", body }),
      invalidatesTags: ["ProfileFields"],
    }),

    // ===== USER PROFILES (viewing other users) =====
    getUserProfileById: builder.query<any, string>({
      query: (userId) => `/api/users/${userId}/profile`,
      providesTags: (_r, _e, id) => [{ type: "UserProfiles", id }],
    }),
    getBatchUserProfiles: builder.query<any, string>({
      query: (ids) => `/api/profiles/batch/${ids}`,
      providesTags: ["UserProfiles"],
    }),
    searchUsers: builder.query<any, string>({
      query: (params) => `/api/users/search?${params}`,
      providesTags: ["UserProfiles"],
    }),

    // ===== SUBSCRIPTION / STRIPE =====
    getSubscriptionPlans: builder.query<any, void>({
      query: () => "/api/subscription-plans",
      providesTags: ["SubscriptionPlans"],
    }),
    getAdminSubscriptionPlans: builder.query<any, void>({
      query: () => "/api/admin/subscription-plans",
      providesTags: ["SubscriptionPlans"],
    }),
    getUserSubscription: builder.query<any, void>({
      query: () => "/api/user/subscription",
      providesTags: ["Stripe"],
    }),
    getStripeSubscription: builder.query<any, void>({
      query: () => "/api/stripe/subscription",
      providesTags: ["Stripe"],
    }),
    getStripeProducts: builder.query<any, void>({
      query: () => "/api/stripe/products",
      providesTags: ["Stripe"],
    }),
    createSubscriptionPlan: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/subscription-plans", method: "POST", body }),
      invalidatesTags: ["SubscriptionPlans"],
    }),
    updateSubscriptionPlan: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/subscription-plans/${id}`, method: "PATCH", body }),
      invalidatesTags: ["SubscriptionPlans"],
    }),
    deleteSubscriptionPlan: builder.mutation<any, number>({
      query: (id) => ({ url: `/api/admin/subscription-plans/${id}`, method: "DELETE" }),
      invalidatesTags: ["SubscriptionPlans"],
    }),
    setUserSubscription: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/user/subscription", method: "POST", body }),
      invalidatesTags: ["Stripe", "Auth"],
    }),
    stripeCheckout: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/stripe/checkout", method: "POST", body }),
      invalidatesTags: ["Stripe"],
    }),
    stripePortal: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/stripe/portal", method: "POST", body }),
    }),
    stripeCancel: builder.mutation<any, void>({
      query: () => ({ url: "/api/stripe/cancel", method: "POST" }),
      invalidatesTags: ["Stripe"],
    }),
    stripeReactivate: builder.mutation<any, void>({
      query: () => ({ url: "/api/stripe/reactivate", method: "POST" }),
      invalidatesTags: ["Stripe"],
    }),
    stripeChangePlan: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/stripe/change-plan", method: "POST", body }),
      invalidatesTags: ["Stripe"],
    }),
    stripeSync: builder.mutation<any, void>({
      query: () => ({ url: "/api/stripe/sync", method: "POST" }),
      invalidatesTags: ["Stripe", "Auth"],
    }),

    // ===== PLAY REQUESTS =====
    getPlayRequests: builder.query<any, void>({
      query: () => "/api/play-requests",
      providesTags: ["PlayRequests"],
    }),
    getPlayRequestById: builder.query<any, string>({
      query: (id) => `/api/play-requests/${id}`,
      providesTags: (_r, _e, id) => [{ type: "PlayRequests", id }],
    }),
    getPlayRequestOffers: builder.query<any, string>({
      query: (id) => `/api/play-requests/${id}/offers`,
      providesTags: (_r, _e, id) => [{ type: "PlayRequestOffers", id }],
    }),
    getMyPlayRequestOffer: builder.query<any, string>({
      query: (id) => `/api/play-requests/${id}/my-offer`,
      providesTags: (_r, _e, id) => [{ type: "PlayRequestOffers", id: `my-${id}` }],
    }),
    getMyPlayRequestOffers: builder.query<any, void>({
      query: () => "/api/my-play-request-offers",
      providesTags: ["PlayRequestOffers"],
    }),
    getMyPlayRequestOfferCounts: builder.query<any, void>({
      query: () => "/api/my-play-requests/offer-counts",
      providesTags: ["PlayRequestOffers"],
    }),
    getAdminPlayRequests: builder.query<any, void>({
      query: () => "/api/admin/play-requests",
      providesTags: ["PlayRequests"],
    }),
    createPlayRequest: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/play-requests", method: "POST", body }),
      invalidatesTags: ["PlayRequests"],
    }),
    updatePlayRequest: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/play-requests/${id}`, method: "PATCH", body }),
      invalidatesTags: ["PlayRequests"],
    }),
    deletePlayRequest: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/play-requests/${id}`, method: "DELETE" }),
      invalidatesTags: ["PlayRequests"],
    }),
    submitPlayRequestOffer: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/play-requests/${id}/offer`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "PlayRequestOffers", id }, { type: "PlayRequestOffers", id: `my-${id}` }],
    }),
    acceptPlayRequestOffer: builder.mutation<any, { requestId: string; offerId: string }>({
      query: ({ requestId, offerId }) => ({ url: `/api/play-requests/${requestId}/offers/${offerId}/accept`, method: "POST" }),
      invalidatesTags: ["PlayRequests", "PlayRequestOffers"],
    }),
    declinePlayRequestOffer: builder.mutation<any, { requestId: string; offerId: string }>({
      query: ({ requestId, offerId }) => ({ url: `/api/play-requests/${requestId}/offers/${offerId}/decline`, method: "POST" }),
      invalidatesTags: ["PlayRequests", "PlayRequestOffers"],
    }),

    // ===== TEE TIME OFFERS =====
    getTeeTimeOffers: builder.query<any, void>({
      query: () => "/api/tee-time-offers",
      providesTags: ["TeeTimeOffers"],
    }),
    getTeeTimeOfferById: builder.query<any, string>({
      query: (id) => `/api/tee-time-offers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "TeeTimeOffers", id }],
    }),
    getTeeTimeOfferReservations: builder.query<any, string>({
      query: (id) => `/api/tee-time-offers/${id}/reservations`,
      providesTags: (_r, _e, id) => [{ type: "TeeTimeReservations", id }],
    }),
    getMyTeeTimeReservation: builder.query<any, string>({
      query: (id) => `/api/tee-time-offers/${id}/my-reservation`,
      providesTags: (_r, _e, id) => [{ type: "TeeTimeReservations", id: `my-${id}` }],
    }),
    getMyTeeTimeOffers: builder.query<any, void>({
      query: () => "/api/my-tee-time-offers",
      providesTags: ["TeeTimeOffers"],
    }),
    getMyTeeTimeReservations: builder.query<any, void>({
      query: () => "/api/my-tee-time-reservations",
      providesTags: ["TeeTimeReservations"],
    }),
    getMyTeeTimeAcceptedGuests: builder.query<any, void>({
      query: () => "/api/my-tee-time-accepted-guests",
      providesTags: ["TeeTimeReservations"],
    }),
    getAdminTeeTimeOffers: builder.query<any, void>({
      query: () => "/api/admin/tee-time-offers",
      providesTags: ["TeeTimeOffers"],
    }),
    createTeeTimeOffer: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/tee-time-offers", method: "POST", body }),
      invalidatesTags: ["TeeTimeOffers"],
    }),
    updateTeeTimeOffer: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/tee-time-offers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["TeeTimeOffers"],
    }),
    deleteTeeTimeOffer: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/tee-time-offers/${id}`, method: "DELETE" }),
      invalidatesTags: ["TeeTimeOffers"],
    }),
    reserveTeeTime: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/tee-time-offers/${id}/reserve`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "TeeTimeReservations", id }, { type: "TeeTimeReservations", id: `my-${id}` }, "TeeTimeOffers"],
    }),
    respondToTeeTimeReservation: builder.mutation<any, { reservationId: number; body: any }>({
      query: ({ reservationId, body }) => ({ url: `/api/tee-time-reservations/${reservationId}`, method: "PATCH", body }),
      invalidatesTags: ["TeeTimeReservations", "TeeTimeOffers"],
    }),
    cancelTeeTimeReservation: builder.mutation<any, number>({
      query: (reservationId) => ({ url: `/api/tee-time-reservations/${reservationId}`, method: "DELETE" }),
      invalidatesTags: ["TeeTimeReservations", "TeeTimeOffers"],
    }),

    // ===== ADMIN USERS =====
    getAdminUsers: builder.query<any, void>({
      query: () => "/api/admin/users",
      providesTags: ["AdminUsers"],
    }),
    createAdminUser: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/admin/users", method: "POST", body }),
      invalidatesTags: ["AdminUsers"],
    }),
    updateAdminUser: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/users/${id}`, method: "PATCH", body }),
      invalidatesTags: ["AdminUsers"],
    }),
    blockAdminUser: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/users/${id}/block`, method: "PATCH", body }),
      invalidatesTags: ["AdminUsers"],
    }),
    changeAdminUserPassword: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/admin/users/${id}/password`, method: "PATCH", body }),
    }),
    deleteAdminUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/admin/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminUsers"],
    }),

    // ===== NEWSLETTER =====
    getNewsletterSubscriptions: builder.query<any, void>({
      query: () => "/api/newsletter/subscriptions",
      providesTags: ["Newsletter"],
    }),
    subscribeNewsletter: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/newsletter/subscribe", method: "POST", body }),
      invalidatesTags: ["Newsletter"],
    }),

    // ===== CONTACT =====
    getAdminContactRequests: builder.query<any, void>({
      query: () => "/api/admin/contact-requests",
      providesTags: ["ContactRequests"],
    }),
    submitContact: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/contact", method: "POST", body }),
    }),

    // ===== SEARCH =====
    searchContent: builder.query<any, string>({
      query: (q) => `/api/search?q=${encodeURIComponent(q)}`,
      providesTags: ["Search"],
    }),

    // ===== CALENDAR / MY GAMES =====
    getMyCalendar: builder.query<any, void>({
      query: () => "/api/my-calendar",
      providesTags: ["Calendar"],
    }),
    getMyGames: builder.query<any, void>({
      query: () => "/api/my-games",
      providesTags: ["MyGames"],
    }),

    // ===== MUX VIDEO =====
    createMuxUploadUrl: builder.mutation<any, void>({
      query: () => ({ url: "/api/mux/upload-url", method: "POST" }),
    }),

    // ===== GENERIC ENDPOINT for dynamic queries =====
    genericQuery: builder.query<any, string>({
      query: (url) => url,
    }),

    // ===== TENANTS =====
    getTenants: builder.query<any[], void>({
      query: () => "/api/tenants",
      providesTags: ["Tenants"],
    }),
    getTenantById: builder.query<any, string>({
      query: (id) => `/api/tenants/${id}`,
      providesTags: (result, error, id) => [{ type: "Tenants", id }],
    }),
    createTenant: builder.mutation<any, any>({
      query: (body) => ({ url: "/api/tenants", method: "POST", body }),
      invalidatesTags: ["Tenants"],
    }),
    updateTenant: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/api/tenants/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Tenants"],
    }),
    deleteTenant: builder.mutation<any, string>({
      query: (id) => ({ url: `/api/tenants/${id}`, method: "DELETE" }),
      invalidatesTags: ["Tenants"],
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useCompleteSsoFirstLoginMutation,
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
  useGetHeroSettingsQuery,
  useUpdateHeroSettingsMutation,
  useGetArticlesQuery,
  useGetArticleBySlugQuery,
  useGetArticleSectionsQuery,
  useGetArticleCommentsQuery,
  useGetArticleLikesQuery,
  useGetArticleLikedQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useLikeArticleMutation,
  useUnlikeArticleMutation,
  useCreateArticleCommentMutation,
  useDeleteArticleCommentMutation,
  useUpdateArticleSectionsMutation,
  useGetArticleCategoriesQuery,
  useCreateArticleCategoryMutation,
  useUpdateArticleCategoryMutation,
  useDeleteArticleCategoryMutation,
  useReorderArticleCategoriesMutation,
  useGetEventsQuery,
  useGetAdminEventsQuery,
  useGetEventBySlugQuery,
  useGetEventByIdQuery,
  useGetEventEntriesQuery,
  useGetEventEntryCountQuery,
  useGetMyEventEntryQuery,
  useGetEventTeamsQuery,
  useGetEventBracketQuery,
  useGetEventResultsQuery,
  useGetEventMembershipQuery,
  useGetEventAttendanceQuery,
  useGetMyEventAttendanceQuery,
  useGetEventAttendeesDetailQuery,
  useGetMyEventMatchQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useEnterEventMutation,
  useWithdrawEventMutation,
  useToggleEventAttendanceMutation,
  useUpdateEventMatchMutation,
  useGetEventCategoriesQuery,
  useCreateEventCategoryMutation,
  useUpdateEventCategoryMutation,
  useDeleteEventCategoryMutation,
  useReorderEventCategoriesMutation,
  useGetEventSuggestionsQuery,
  useGetPendingEventSuggestionsQuery,
  useCreateEventSuggestionMutation,
  useUpdateEventSuggestionMutation,
  useGetGroupsQuery,
  useGetMyGroupsQuery,
  useGetMyCompetitionGroupsQuery,
  useGetMyEventGroupsQuery,
  useGetMyPendingGroupsQuery,
  useGetGroupBySlugQuery,
  useGetGroupByIdQuery,
  useGetGroupMembersQuery,
  useGetGroupAllMembersQuery,
  useGetGroupMembershipQuery,
  useGetGroupPostsQuery,
  useGetGroupEventsQuery,
  useGetAdminGroupsQuery,
  useGetAdminGroupPendingCountsQuery,
  useGetAdminGroupPostsQuery,
  useGetAdminGroupMembersQuery,
  useGetAdminGroupPendingQuery,
  useCreateAdminGroupMutation,
  useJoinGroupMutation,
  useLeaveGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useCreateGroupPostMutation,
  useDeleteGroupPostMutation,
  useReactToGroupPostMutation,
  useGetGroupPostCommentsQuery,
  useCreateGroupPostCommentMutation,
  useDeleteGroupPostCommentMutation,
  useApproveGroupMemberMutation,
  useRejectGroupMemberMutation,
  useGetGroupEventQuery,
  useGetGroupEventCommentsQuery,
  useCreateGroupEventMutation,
  useReactToGroupEventMutation,
  useCreateGroupEventCommentMutation,
  useGetPollsQuery,
  useGetPollByIdQuery,
  useGetPollBySlugQuery,
  useGetUserPollVoteQuery,
  useGetAdminPollsQuery,
  useCreatePollMutation,
  useUpdatePollMutation,
  useDeletePollMutation,
  useVotePollMutation,
  useRankingVotePollMutation,
  useGetReviewsQuery,
  useGetReviewBySlugQuery,
  useGetReviewCommentsQuery,
  useGetReviewLikesQuery,
  useGetReviewLikedQuery,
  useGetAdminReviewsQuery,
  useGetReviewCategoriesQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useLikeReviewMutation,
  useUnlikeReviewMutation,
  useCreateReviewCommentMutation,
  useDeleteReviewCommentMutation,
  useUpdateReviewCommentMutation,
  useCreateReviewCategoryMutation,
  useUpdateReviewCategoryMutation,
  useDeleteReviewCategoryMutation,
  useReorderReviewCategoriesMutation,
  useGetVibesQuery,
  useGetVibeByIdQuery,
  useGetAdminVibesQuery,
  useCreateVibeMutation,
  useUpdateVibeMutation,
  useDeleteVibeMutation,
  useReactToVibeMutation,
  useCreateVibeCommentMutation,
  useDeleteVibeCommentMutation,
  useGetPodcastsQuery,
  useGetPodcastBySlugQuery,
  useGetAdminPodcastsQuery,
  useGetPodcastCommentsQuery,
  useGetPodcastLikesQuery,
  useGetPodcastLikedQuery,
  useCreatePodcastMutation,
  useUpdatePodcastMutation,
  useDeletePodcastMutation,
  useLikePodcastMutation,
  useUnlikePodcastMutation,
  useCreatePodcastCommentMutation,
  useDeletePodcastCommentMutation,
  useGetConnectionsQuery,
  useGetIncomingRequestsQuery,
  useGetOutgoingRequestsQuery,
  useGetConnectionStatusQuery,
  useSendConnectionRequestMutation,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
  useRemoveConnectionMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetNotificationsQuery,
  useGetNotificationCountsQuery,
  useMarkNotificationsReadMutation,
  useMarkConnectionNotificationsReadMutation,

  useGetInsiderTipsQuery,
  useCreateInsiderTipMutation,
  useUpdateInsiderTipMutation,
  useDeleteInsiderTipMutation,
  useGetProfileQuery,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useCreateUserProfileMutation,
  useUpdateUserProfileMutation,
  useGetProfileCustomFieldsQuery,
  useGetProfilePicturesQuery,
  useUploadProfilePictureMutation,
  useDeleteProfilePictureMutation,
  useGetProfileFieldDefinitionsQuery,
  useGetProfileFieldOptionsQuery,
  useGetProfileFieldsQuery,
  useGetAdminProfileFieldsQuery,
  useCreateAdminProfileFieldMutation,
  useUpdateAdminProfileFieldMutation,
  useDeleteAdminProfileFieldMutation,
  useReorderAdminProfileFieldsMutation,
  useGetUserProfileByIdQuery,
  useGetBatchUserProfilesQuery,
  useSearchUsersQuery,
  useGetSubscriptionPlansQuery,
  useGetAdminSubscriptionPlansQuery,
  useGetUserSubscriptionQuery,
  useGetStripeSubscriptionQuery,
  useGetStripeProductsQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useSetUserSubscriptionMutation,
  useStripeCheckoutMutation,
  useStripePortalMutation,
  useStripeCancelMutation,
  useStripeReactivateMutation,
  useStripeChangePlanMutation,
  useStripeSyncMutation,
  useGetPlayRequestsQuery,
  useGetPlayRequestByIdQuery,
  useGetPlayRequestOffersQuery,
  useGetMyPlayRequestOfferQuery,
  useGetMyPlayRequestOffersQuery,
  useGetMyPlayRequestOfferCountsQuery,
  useGetAdminPlayRequestsQuery,
  useCreatePlayRequestMutation,
  useUpdatePlayRequestMutation,
  useDeletePlayRequestMutation,
  useSubmitPlayRequestOfferMutation,
  useAcceptPlayRequestOfferMutation,
  useDeclinePlayRequestOfferMutation,
  useGetTeeTimeOffersQuery,
  useGetTeeTimeOfferByIdQuery,
  useGetTeeTimeOfferReservationsQuery,
  useGetMyTeeTimeReservationQuery,
  useGetMyTeeTimeOffersQuery,
  useGetMyTeeTimeReservationsQuery,
  useGetMyTeeTimeAcceptedGuestsQuery,
  useGetAdminTeeTimeOffersQuery,
  useCreateTeeTimeOfferMutation,
  useUpdateTeeTimeOfferMutation,
  useDeleteTeeTimeOfferMutation,
  useReserveTeeTimeMutation,
  useRespondToTeeTimeReservationMutation,
  useCancelTeeTimeReservationMutation,
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useBlockAdminUserMutation,
  useChangeAdminUserPasswordMutation,
  useDeleteAdminUserMutation,
  useGetNewsletterSubscriptionsQuery,
  useSubscribeNewsletterMutation,
  useGetAdminContactRequestsQuery,
  useSubmitContactMutation,
  useSearchContentQuery,
  useGetMyCalendarQuery,
  useGetMyGamesQuery,
  useCreateMuxUploadUrlMutation,
  useGenericQueryQuery,
  useGetTenantsQuery,
  useGetTenantByIdQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} = api;
