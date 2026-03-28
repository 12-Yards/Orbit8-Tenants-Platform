"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import Link from "@/components/tenant-link";
import { useState, useEffect } from "react";
import { useGetArticlesQuery, useGetArticleCategoriesQuery } from "@/store/api";
import { SectionHeader } from "@/components/section-header";
import { ArticleCard, ArticleCardSkeleton } from "@/components/article-card";
import { CategoryFilter } from "@/components/category-filter";
import { SEO } from "@/components/seo";
import { FeatureGate } from "@/components/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Article, ArticleCategory, ArticleCategoryRecord } from "@shared/schema";

function ScottyCameronAd() {
  return (
    <a 
      href="https://www.scottycameron.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className="block"
    >
      <Card
        className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer h-full"
        data-testid="card-ad-scotty-cameron"
      >
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-white font-bold text-2xl tracking-wider mb-1">SCOTTY</div>
              <div className="text-white font-bold text-2xl tracking-wider">CAMERON</div>
              <div className="text-zinc-400 text-xs mt-2 tracking-widest">BY TITLEIST</div>
            </div>
          </div>
        </div>
        <CardContent className="p-4 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              Sponsored
            </Badge>
          </div>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
            Precision Crafted Putters
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            Experience the art of putting with handcrafted precision. Every stroke counts on the greens.
          </p>
          <div className="flex items-center justify-end text-sm">
            <span className="text-primary flex items-center gap-1 font-medium">
              Shop Now <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

export default function ArticlesPage() {
  const location = usePathname();
  const searchParamsHook = useSearchParams();
  const searchString = searchParamsHook.toString();
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null);
  
  const { data: categories } = useGetArticleCategoriesQuery();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(searchString);
    const categoryParam = urlParams.get("category");
    
    if (categoryParam && categories?.some(c => c.name === categoryParam)) {
      setSelectedCategory(categoryParam);
    } else if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory(null);
    }
  }, [location, searchString, categories]);
  
  const handleCategorySelect = (category: ArticleCategory | null) => {
    setSelectedCategory(category);
    if (category) {
      window.history.replaceState({}, '', `/articles?category=${encodeURIComponent(category)}`);
    } else {
      window.history.replaceState({}, '', '/articles');
    }
  };

  const { data: articles, isLoading } = useGetArticlesQuery();

  const filteredArticles = selectedCategory
    ? articles?.filter((a) => a.category === selectedCategory)
    : articles;

  return (
    <FeatureGate feature="featureEditorial" featureName="Editorials">
    <div className="min-h-screen py-8 md:py-12">
      <SEO 
        title="Local Articles & Guides"
        description="Discover stories, guides, and local insights about Mumbles. From the best restaurants to hidden beaches, explore what makes this Welsh coastal village special."
        canonicalUrl="/articles"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Local Editorial"
          description="Stories, guides, and insights from the community"
        />

        <CategoryFilter
          selected={selectedCategory}
          onSelect={handleCategorySelect}
          categories={categories}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))
          ) : filteredArticles?.length ? (
            <>
              {filteredArticles.map((article, index) => (
                <ArticleCard key={article.id} article={article} />
              ))}
              {filteredArticles.length >= 1 && <ScottyCameronAd key="ad-scotty-cameron" />}
            </>
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-lg text-muted-foreground">
                No articles found in this category.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try selecting a different category or check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
