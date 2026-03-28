"use client";

import { useGetAuthUserQuery, useLogoutMutation, api } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";

interface AuthUser {
  id: string;
  email: string;
  mumblesVibeName: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  adminArticles?: boolean;
  adminEvents?: boolean;
  adminReviews?: boolean;
  adminPosts?: boolean;
  adminGroups?: boolean;
  adminPodcasts?: boolean;
  featureEditorial?: boolean;
  featureEventsStandard?: boolean;
  featureEventsCompetitions?: boolean;
  featureReviews?: boolean;
  featureCommunities?: boolean;
  featureConnections?: boolean;
  featurePlay?: boolean;
  featurePlayAddRequest?: boolean;
  featureSuggestEvent?: boolean;
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const { data: user, isLoading, error } = useGetAuthUserQuery(undefined, {
    pollingInterval: 0,
  });
  const [logoutTrigger, { isLoading: isLoggingOut }] = useLogoutMutation();

  const authUser = error ? null : (user as AuthUser | null | undefined);

  const logout = () => {
    logoutTrigger().then(() => {
      dispatch(api.util.resetApiState());
    });
  };

  return {
    user: authUser,
    isLoading,
    isAuthenticated: !!authUser,
    isAdmin: authUser?.isAdmin || false,
    isSuperAdmin: authUser?.isSuperAdmin || false,
    adminArticles: authUser?.adminArticles || false,
    adminEvents: authUser?.adminEvents || false,
    adminReviews: authUser?.adminReviews || false,
    adminPosts: authUser?.adminPosts || false,
    adminGroups: authUser?.adminGroups || false,
    adminPodcasts: authUser?.adminPodcasts || false,
    featureEditorial: authUser?.featureEditorial || false,
    featureEventsStandard: authUser?.featureEventsStandard || false,
    featureEventsCompetitions: authUser?.featureEventsCompetitions || false,
    featureReviews: authUser?.featureReviews || false,
    featureCommunities: authUser?.featureCommunities || false,
    featureConnections: authUser?.featureConnections || false,
    featurePlay: authUser?.featurePlay || false,
    featurePlayAddRequest: authUser?.featurePlayAddRequest || false,
    featureSuggestEvent: authUser?.featureSuggestEvent || false,
    logout,
    isLoggingOut,
  };
}
