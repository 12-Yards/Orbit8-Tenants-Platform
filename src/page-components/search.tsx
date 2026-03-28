// @ts-nocheck
"use client";

import { usePathname } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useEffect, useCallback } from "react";
import { useSearchContentQuery } from "@/store/api";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SEO } from "@/components/seo";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Calendar, 
  FileText, 
  Star, 
  User as UserIcon, 
  Users,
  MapPin,
  ArrowRight
} from "lucide-react";
import type { SearchResults } from "@shared/schema";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((item) => (
              <Skeleton key={item} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ event }: { event: SearchResults['events'][0] }) {
  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="hover-elevate cursor-pointer group overflow-visible transition-all duration-200" data-testid={`card-event-${event.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {event.imageUrl && (
              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                <img 
                  src={event.imageUrl} 
                  alt={event.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="mb-2 text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(event.startDate)}
              </Badge>
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {event.name}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {event.venueName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ArticleCard({ article }: { article: SearchResults['articles'][0] }) {
  return (
    <Link href={`/articles/${article.slug}`}>
      <Card className="hover-elevate cursor-pointer group overflow-visible transition-all duration-200" data-testid={`card-article-${article.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {article.heroImageUrl && (
              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                <img 
                  src={article.heroImageUrl} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="mb-2 text-xs capitalize">
                {article.category}
              </Badge>
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {article.excerpt}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ReviewCard({ review }: { review: SearchResults['reviews'][0] }) {
  return (
    <Link href={`/reviews/${review.slug}`}>
      <Card className="hover-elevate cursor-pointer group overflow-visible transition-all duration-200" data-testid={`card-review-${review.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {review.imageUrl && (
              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                <img 
                  src={review.imageUrl} 
                  alt={review.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs capitalize">
                  {review.category}
                </Badge>
                <div className="flex items-center text-amber-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs ml-1 font-medium">{review.rating}</span>
                </div>
              </div>
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {review.title}
              </h3>
              {review.venueName && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {review.venueName}
                </p>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {review.excerpt}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function UserCard({ user }: { user: SearchResults['users'][0] }) {
  return (
    <Link href={`/user/${user.id}`}>
      <Card className="hover-elevate cursor-pointer group overflow-visible transition-all duration-200" data-testid={`card-user-${user.id}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.mumblesVibeName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(user.mumblesVibeName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                  {user.mumblesVibeName}
                </h3>
                {user.connectionStatus === 'connected' && (
                  <Badge className="bg-green-600 text-xs" data-testid="badge-connected">Connected</Badge>
                )}
                {user.connectionStatus === 'pending' && (
                  <Badge className="bg-amber-500 text-xs" data-testid="badge-pending">Pending</Badge>
                )}
              </div>
              {user.aboutMe && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {user.aboutMe}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function GroupCard({ group }: { group: SearchResults['groups'][0] }) {
  return (
    <Link href={`/groups/${group.slug}`}>
      <Card className="hover-elevate cursor-pointer group overflow-visible transition-all duration-200" data-testid={`card-group-${group.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {group.imageUrl && (
              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                <img 
                  src={group.imageUrl} 
                  alt={group.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={group.isPublic ? "secondary" : "outline"} className="text-xs">
                  {group.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {group.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {group.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ResultSection<T>({ 
  title, 
  icon: Icon, 
  items, 
  renderItem,
  emptyMessage
}: { 
  title: string;
  icon: typeof Calendar;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}) {
  if (items.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge variant="secondary" className="ml-2">{items.length}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const router = useTenantRouter();
  const location = usePathname();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = urlParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery) {
      router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`, { replace: true });
    } else if (location.includes('?q=')) {
      router.push('/search', { replace: true });
    }
  }, [debouncedQuery, router, location]);

  const { data: results, isLoading, error } = useSearchContentQuery(debouncedQuery, { skip: !debouncedQuery.trim() }) as { data: SearchResults | undefined; isLoading: boolean; error: any };

  const totalResults = results ? 
    results.events.length + results.articles.length + results.reviews.length + 
    results.users.length + results.groups.length : 0;

  const hasResults = totalResults > 0;
  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={searchQuery ? `Search: ${searchQuery}` : "Search"} 
        description="Search across all content including events, articles, reviews, members, and groups."
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SectionHeader
          title="Search"
          description="Find events, articles, reviews, members, and groups"
        />

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-6 text-lg rounded-xl border-2 focus:border-primary"
            data-testid="input-search"
            autoFocus
          />
        </div>

        {isLoading && hasQuery && <SearchResultsSkeleton />}

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">An error occurred while searching. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && hasQuery && !hasResults && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              We couldn't find anything matching "{debouncedQuery}". Try different keywords.
            </p>
          </div>
        )}

        {!isLoading && !error && !hasQuery && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Type in the search box above to find events, articles, reviews, members, and groups.
            </p>
          </div>
        )}

        {!isLoading && !error && hasResults && results && (
          <div className="space-y-8">
            <p className="text-muted-foreground">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{debouncedQuery}"
            </p>

            <ResultSection
              title="Events"
              icon={Calendar}
              items={results.events}
              renderItem={(event, index) => <EventCard key={event.id} event={event} />}
            />

            <ResultSection
              title="Articles"
              icon={FileText}
              items={results.articles}
              renderItem={(article, index) => <ArticleCard key={article.id} article={article} />}
            />

            <ResultSection
              title="Reviews"
              icon={Star}
              items={results.reviews}
              renderItem={(review, index) => <ReviewCard key={review.id} review={review} />}
            />

            <ResultSection
              title="Members"
              icon={UserIcon}
              items={results.users}
              renderItem={(user, index) => <UserCard key={user.id} user={user} />}
            />

            <ResultSection
              title="Groups"
              icon={Users}
              items={results.groups}
              renderItem={(group, index) => <GroupCard key={group.id} group={group} />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
