"use client";

import Link from "@/components/tenant-link";
import {
  useGetArticlesQuery,
  useGetEventsQuery,
  useGetPollsQuery,
  useGetSiteSettingsQuery,
  useGetArticleCategoriesQuery,
  useGetGroupsQuery,
  useGetPodcastsQuery,
} from "@/store/api";
import { isEventUpcoming } from "@/lib/utils";
import { HeroSection } from "@/components/hero-section";
import { SectionHeader } from "@/components/section-header";
import { ArticleCard, ArticleCardSkeleton } from "@/components/article-card";
import { EventCard, EventCardSkeleton } from "@/components/event-card";
import { CategoryFilter } from "@/components/category-filter";
import { SEO } from "@/components/seo";
import { PollCard } from "@/components/poll-card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import type { Article, Event, ArticleCategory, Poll, SiteSettings, ArticleCategoryRecord, Group, Podcast } from "@shared/schema";
import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface PollWithVotes extends Poll {
  voteCounts: number[];
  totalVotes: number;
  actualVotes: number;
  userVoteIndex?: number | null;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null);

  const { data: articles, isLoading: articlesLoading } = useGetArticlesQuery();

  const { data: events, isLoading: eventsLoading } = useGetEventsQuery();


  const { data: polls, isLoading: pollsLoading } = useGetPollsQuery();

  const { data: siteSettings } = useGetSiteSettingsQuery();

  const { data: categories } = useGetArticleCategoriesQuery();

  const { data: groups, isLoading: groupsLoading } = useGetGroupsQuery();

  const { data: podcasts, isLoading: podcastsLoading } = useGetPodcastsQuery();

  const showEvents = siteSettings?.showEvents !== false;
  const showCommunity = siteSettings?.showCommunity !== false;
  const showPodcasts = siteSettings?.showPodcasts !== false;

  const featuredEvents = events?.filter((e) => e.isFeatured && isEventUpcoming(e)) || [];
  const upcomingEvents = events
    ?.filter((e) => isEventUpcoming(e))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  // Carousel for featured events
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);


  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const filteredArticles = selectedCategory
    ? articles?.filter((a) => a.category === selectedCategory)
    : articles;

  const displayedArticles = filteredArticles?.slice(0, 6);

  return (
    <div className="min-h-screen">
      <SEO canonicalUrl="/" />
      <HeroSection />

      <section className="py-12 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Latest Editorial"
            viewAllHref="/articles"
          />
          
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            categories={categories}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {articlesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))
            ) : displayedArticles?.length ? (
              displayedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-12">
                No articles found in this category.
              </p>
            )}
          </div>
        </div>
      </section>

      {showPodcasts && (podcastsLoading || (podcasts && podcasts.length > 0)) && (
        <section className="py-12 md:py-14 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Latest Podcasts"
              viewAllHref="/podcasts"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {podcastsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-background p-4 space-y-3">
                    <div className="aspect-video bg-muted rounded animate-pulse" />
                    <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-full" />
                  </div>
                ))
              ) : (
                podcasts?.slice(0, 3).map((podcast) => (
                  <Link key={podcast.id} href={`/podcasts/${podcast.slug}`}>
                    <div className="rounded-lg border bg-background overflow-hidden hover-elevate cursor-pointer group h-full" data-testid={`home-podcast-${podcast.id}`}>
                      {podcast.heroImageUrl ? (
                        <div className="aspect-video overflow-hidden">
                          <img src={podcast.heroImageUrl} alt={podcast.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <MessageSquare className="h-10 w-10 text-primary/40" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-2">{podcast.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{podcast.excerpt}</p>
                        <p className="text-xs text-muted-foreground">{podcast.author} · {new Date(podcast.publishedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Community Polls Section */}
      {showCommunity && (pollsLoading || (polls && polls.length > 0)) && (() => {
        const activePolls = polls?.filter((poll) => {
          const endDate = new Date(new Date(poll.startDate).getTime() + poll.durationHours * 60 * 60 * 1000);
          return new Date() <= endDate;
        }) || [];
        const endedPolls = polls?.filter((poll) => {
          const endDate = new Date(new Date(poll.startDate).getTime() + poll.durationHours * 60 * 60 * 1000);
          return new Date() > endDate;
        }).sort((a, b) => {
          const aEnd = new Date(a.startDate).getTime() + a.durationHours * 60 * 60 * 1000;
          const bEnd = new Date(b.startDate).getTime() + b.durationHours * 60 * 60 * 1000;
          return bEnd - aEnd;
        }) || [];
        const hasEndedPolls = endedPolls.length > 0;
        const showEndedPolls = activePolls.length === 0 && hasEndedPolls;
        const pollsToShow = activePolls.length > 0 ? activePolls : endedPolls.slice(0, 3);
        
        return (pollsLoading || pollsToShow.length > 0) ? (
          <section className="py-12 md:py-14 bg-card">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title={showEndedPolls ? "Recent Polls" : "What's your opinion?"}
              />
              {pollsLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
                    {pollsToShow.map((poll) => (
                      <PollCard key={poll.id} poll={poll} />
                    ))}
                  </div>
                  {hasEndedPolls && (
                    <div className="mt-6 text-center">
                      <Link href="/ended-polls">
                        <Button variant="outline" data-testid="link-view-ended-polls">
                          View Ended Polls
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        ) : null;
      })()}

      {showEvents && (
        <section className="py-12 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Upcoming Events"
              viewAllHref="/events"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <EventCardSkeleton key={i} />
                ))
              ) : (
                upcomingEvents?.map((event) => (
                  <EventCard key={event.id} event={event} variant="thumbnail" />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Latest Groups Section */}
      {showCommunity && (groupsLoading || (groups && groups.length > 0)) && (
        <section className="py-12 md:py-14 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Explore Groups"
              viewAllHref="/groups"
            />
            {groupsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups?.slice(0, 3).map((group) => (
                  <Link key={group.id} href={`/groups/${group.slug}`} onClick={() => window.scrollTo(0, 0)}>
                    <div className="group relative overflow-hidden rounded-lg border bg-background hover-elevate transition-all cursor-pointer" data-testid={`group-card-${group.id}`}>
                      <div className="aspect-video relative overflow-hidden">
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={group.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg line-clamp-1">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Vibe CTA Banner */}
      {showCommunity && (
        <section className="py-12 md:py-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#6E7560]" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-8 right-16 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/10 blur-xl" />
          </div>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary-foreground/80" />
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                {siteSettings?.ctaHeading || "Got something to say?"}
              </h2>
              <p className="text-primary-foreground/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                {siteSettings?.ctaDescription || "Have a recommendation or need one? Share with the community."}
              </p>
              <Link href="/groups" onClick={() => window.scrollTo(0, 0)}>
                <Button size="lg" variant="secondary" className="gap-2 text-base px-8" data-testid="button-vibe-cta">
                  <MessageSquare className="h-5 w-5" />
                  {siteSettings?.ctaButtonText || "Join the Conversation"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
