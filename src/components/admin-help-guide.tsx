"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Star,
  Users,
  Settings,
  Home,
  BarChart3,
  MessageSquare,
  Handshake,
  Lock,
  CalendarPlus,
} from "lucide-react";
import { FaMicrophone } from "react-icons/fa";

interface HelpSlide {
  title: string;
  icon: any;
  accent: string;
  sections: {
    heading: string;
    content: string;
  }[];
}

const HELP_SLIDES: HelpSlide[] = [
  {
    title: "Welcome to Your Admin Panel",
    icon: Settings,
    accent: "primary",
    sections: [
      {
        heading: "Getting Started",
        content: "This guide will walk you through every section of your admin panel. Use the arrows below to navigate through each topic. Your admin panel is where you manage all the content, users, and settings for your platform.",
      },
      {
        heading: "Panel Layout",
        content: "The sidebar on the left shows all available sections. Content management tabs are at the top, and the Data Management section (for configuring your platform) is at the bottom. Click any tab to jump to that section.",
      },
      {
        heading: "Tip",
        content: "You can return to this guide anytime by clicking the Help button in the admin sidebar.",
      },
    ],
  },
  {
    title: "Articles",
    icon: FileText,
    accent: "blue",
    sections: [
      {
        heading: "What are Articles?",
        content: "Articles are the editorial content on your platform — blog posts, news, guides, features, and sponsored content. They appear on your homepage and the Articles page.",
      },
      {
        heading: "Creating an Article",
        content: "Click 'Add Article' to create new content. Fill in the title, choose a category, write an excerpt (the short preview text), and add the full content using the rich text editor. Upload a hero image to make it visually appealing.",
      },
      {
        heading: "Managing Articles",
        content: "You can edit or delete any article from the list. Articles can include video sections, image galleries, and formatted text. The reading time is calculated automatically based on content length.",
      },
    ],
  },
  {
    title: "Podcasts",
    icon: FaMicrophone,
    accent: "purple",
    sections: [
      {
        heading: "What are Podcasts?",
        content: "The Podcasts section lets you share audio and video content with your community. You can embed podcasts from external platforms or upload media directly.",
      },
      {
        heading: "Adding a Podcast",
        content: "Click 'Add Podcast' and provide a title, author, excerpt, and the media URL (YouTube, Spotify, or a direct audio link). Add a hero image for the podcast thumbnail.",
      },
      {
        heading: "Managing Podcasts",
        content: "Toggle podcasts on/off to control visibility. You can also edit details or remove podcasts that are no longer relevant.",
      },
    ],
  },
  {
    title: "Events",
    icon: Calendar,
    accent: "green",
    sections: [
      {
        heading: "What are Events?",
        content: "Events are activities, competitions, and gatherings listed on your platform. They can be standard social events or competition events with entries, teams, and scoring.",
      },
      {
        heading: "Event Types",
        content: "Standard events have a date, venue, and description. Competition events additionally support entry fees, team sizes, brackets, scoring, and league tables. You can link competitions to Stripe for paid entries.",
      },
      {
        heading: "Managing Events",
        content: "Edit event details, manage entries, and view current/past events using the tabs within the Events section. You can also feature events to highlight them on the homepage.",
      },
    ],
  },
  {
    title: "Event Suggestions",
    icon: CalendarPlus,
    accent: "emerald",
    sections: [
      {
        heading: "What are Event Suggestions?",
        content: "Members of your community can suggest events they'd like to see. These suggestions appear here for you to review.",
      },
      {
        heading: "Managing Suggestions",
        content: "Review each suggestion and either approve it (which creates a real event) or dismiss it. This lets your community have a voice in what events get organised.",
      },
    ],
  },
  {
    title: "Groups",
    icon: Lock,
    accent: "orange",
    sections: [
      {
        heading: "What are Groups?",
        content: "Groups are community spaces where members can join, post, and interact. They can be public (anyone can join) or private (approval required). Competition events automatically create linked groups.",
      },
      {
        heading: "Managing Groups",
        content: "View all groups, approve or decline membership requests for private groups, and manage group settings. You can filter groups by type: Community, Event, or Competition.",
      },
      {
        heading: "Group Events",
        content: "Groups can have their own events visible only to group members. Manage these in the Group Events tab.",
      },
    ],
  },
  {
    title: "Reviews",
    icon: Star,
    accent: "yellow",
    sections: [
      {
        heading: "What are Reviews?",
        content: "Reviews let your members share their experiences of golf courses, restaurants, hotels, or any category you define. Reviews include ratings, text, and photos.",
      },
      {
        heading: "Approval Workflow",
        content: "New reviews go through an approval process. You'll see pending reviews with a count badge. Review each submission and approve or reject it before it appears publicly.",
      },
      {
        heading: "Review Categories",
        content: "Set up review categories in Data Management to define what types of places or experiences members can review (e.g., Golf Courses, Restaurants, Hotels).",
      },
    ],
  },
  {
    title: "Polls",
    icon: BarChart3,
    accent: "indigo",
    sections: [
      {
        heading: "What are Polls?",
        content: "Polls let you engage your community with voting questions. Create multi-option polls with optional images, set durations, and see real-time results.",
      },
      {
        heading: "Creating a Poll",
        content: "Click 'Add Poll' and provide a question, options (2 or more), an optional image, and a duration. Polls automatically close after the set time period.",
      },
      {
        heading: "Viewing Results",
        content: "See vote counts and percentages for each option. Polls show on your homepage and can drive community engagement.",
      },
    ],
  },
  {
    title: "Community Posts",
    icon: MessageSquare,
    accent: "pink",
    sections: [
      {
        heading: "What are Posts?",
        content: "Posts are the community feed — short-form content that members share on the Vibe Board. Think of it like a social feed for your platform.",
      },
      {
        heading: "Moderation",
        content: "As an admin, you can review all posts, remove inappropriate content, and keep the community feed clean and relevant.",
      },
    ],
  },
  {
    title: "Play Requests & Tee Times",
    icon: Handshake,
    accent: "teal",
    sections: [
      {
        heading: "Play Requests",
        content: "Members can post requests to find playing partners. These show up in the Play section of your platform. As admin, you can manage and moderate these requests.",
      },
      {
        heading: "Tee Time Offers",
        content: "Tee Time Offers let members share available tee times at their courses. Other members can browse and connect to fill slots.",
      },
    ],
  },
  {
    title: "Users & Subscribers",
    icon: Users,
    accent: "cyan",
    sections: [
      {
        heading: "User Management",
        content: "View all registered users, their profiles, and activity. You can grant or revoke admin permissions for specific sections (Articles, Events, Reviews, Posts, Groups, Podcasts).",
      },
      {
        heading: "Newsletter Subscribers",
        content: "View everyone who has subscribed to your newsletter. You can export this list for use with your email marketing platform.",
      },
      {
        heading: "Contact Requests",
        content: "Messages submitted through your site's contact form appear here. Unread messages show a count badge. Mark them as read once you've responded.",
      },
    ],
  },
  {
    title: "Data Management: Subscriptions",
    icon: Star,
    accent: "amber",
    sections: [
      {
        heading: "What are Subscriptions?",
        content: "Subscription plans define the membership tiers for your platform. Each plan can grant different feature access levels to members.",
      },
      {
        heading: "Setting Up Plans",
        content: "Create plans with a name, price, and billing period. For each plan, toggle which features members get access to: Articles, Events, Competitions, Reviews, Communities, Connections, Play, and more.",
      },
      {
        heading: "Stripe Integration",
        content: "Plans can be linked to Stripe price IDs for automated billing. When a member subscribes, their feature access is automatically updated based on their plan.",
      },
    ],
  },
  {
    title: "Data Management: Homepage Hero",
    icon: Home,
    accent: "rose",
    sections: [
      {
        heading: "What is the Homepage Hero?",
        content: "The hero section is the large banner at the top of your homepage. It's the first thing visitors see and sets the tone for your platform.",
      },
      {
        heading: "Customising the Hero",
        content: "Set a title, subtitle, call-to-action button text, and the link it points to. Upload a hero image that represents your brand. This image should be high quality and landscape-oriented.",
      },
      {
        heading: "Tip",
        content: "Keep the title short and impactful. The subtitle can add context. Make the CTA button text action-oriented, like 'Explore Now' or 'Join the Community'.",
      },
    ],
  },
  {
    title: "Data Management: Categories",
    icon: FileText,
    accent: "violet",
    sections: [
      {
        heading: "Article Categories",
        content: "Define the categories that articles can be filed under (e.g., Golf, Restaurants, History, Local Tips). Each category has a name and icon. Drag to reorder how they appear on the site.",
      },
      {
        heading: "Event Categories",
        content: "Similar to article categories but for events. Define types like 'Tournament', 'Social', 'Charity', etc. Members can filter events by these categories.",
      },
      {
        heading: "Review Categories",
        content: "Define what types of places or experiences members can review. For a golf platform, this might include 'Golf Courses', 'Pro Shops', 'Driving Ranges', etc.",
      },
    ],
  },
  {
    title: "Data Management: User Profile Fields",
    icon: Users,
    accent: "sky",
    sections: [
      {
        heading: "What are Profile Fields?",
        content: "Profile fields are custom questions that appear on member profiles. They let you collect relevant information from your community, like handicap, home course, or favourite club brand.",
      },
      {
        heading: "Setting Up Fields",
        content: "Create fields with a label, type (text, number, dropdown, etc.), and whether they're required. Fields appear on the profile page in the order you set.",
      },
      {
        heading: "Tip",
        content: "Don't add too many required fields — keep registration easy. Focus on 3-5 key fields that help members connect with each other.",
      },
    ],
  },
  {
    title: "Data Management: Site Settings",
    icon: Settings,
    accent: "gray",
    sections: [
      {
        heading: "Branding",
        content: "Set your platform name, tagline, logo, and favicon. These appear across the site in the header, browser tab, and social sharing. You can also set your brand's primary and secondary colours.",
      },
      {
        heading: "Social Links",
        content: "Add your social media URLs (Twitter/X, Instagram, YouTube, LinkedIn, TikTok, Snapchat). These appear in the site footer.",
      },
      {
        heading: "Section Visibility",
        content: "Toggle which sections are visible on your platform: Events, Podcasts, Reviews, Communities, Connections, Play, and E-commerce. Turn off sections you don't need to keep the site focused.",
      },
      {
        heading: "CTA & Legal",
        content: "Customise the call-to-action section on the homepage. Set the heading, description, and button text. You can also edit your Terms of Service and Privacy Policy, or use the built-in templates as a starting point.",
      },
      {
        heading: "Platform Controls",
        content: "'Platform Live' controls whether your site is publicly accessible. When off, visitors see a 'Coming Soon' page (admins can still access everything). 'Allow Login from Platform' controls whether sign-in/sign-up buttons are visible to users.",
      },
    ],
  },
];

interface AccentStyle {
  headerGradient: string;
  iconBg: string;
  iconText: string;
  cardBorder: string;
  cardBg: string;
  headingText: string;
  progressBg: string;
}

const ACCENT_STYLES: Record<string, AccentStyle> = {
  primary:  { headerGradient: "bg-gradient-to-b from-primary/10 to-primary/[0.02] dark:from-primary/15 dark:to-primary/[0.03]", iconBg: "bg-primary/15 dark:bg-primary/25", iconText: "text-primary", cardBorder: "border-l-primary/50", cardBg: "bg-primary/[0.03] dark:bg-primary/[0.06]", headingText: "text-primary", progressBg: "bg-primary" },
  blue:     { headerGradient: "bg-gradient-to-b from-blue-100 to-blue-50/30 dark:from-blue-900/40 dark:to-blue-950/10", iconBg: "bg-blue-100 dark:bg-blue-900/50", iconText: "text-blue-600 dark:text-blue-400", cardBorder: "border-l-blue-400/60", cardBg: "bg-blue-50/50 dark:bg-blue-950/20", headingText: "text-blue-700 dark:text-blue-400", progressBg: "bg-blue-500" },
  purple:   { headerGradient: "bg-gradient-to-b from-purple-100 to-purple-50/30 dark:from-purple-900/40 dark:to-purple-950/10", iconBg: "bg-purple-100 dark:bg-purple-900/50", iconText: "text-purple-600 dark:text-purple-400", cardBorder: "border-l-purple-400/60", cardBg: "bg-purple-50/50 dark:bg-purple-950/20", headingText: "text-purple-700 dark:text-purple-400", progressBg: "bg-purple-500" },
  green:    { headerGradient: "bg-gradient-to-b from-green-100 to-green-50/30 dark:from-green-900/40 dark:to-green-950/10", iconBg: "bg-green-100 dark:bg-green-900/50", iconText: "text-green-600 dark:text-green-400", cardBorder: "border-l-green-400/60", cardBg: "bg-green-50/50 dark:bg-green-950/20", headingText: "text-green-700 dark:text-green-400", progressBg: "bg-green-500" },
  emerald:  { headerGradient: "bg-gradient-to-b from-emerald-100 to-emerald-50/30 dark:from-emerald-900/40 dark:to-emerald-950/10", iconBg: "bg-emerald-100 dark:bg-emerald-900/50", iconText: "text-emerald-600 dark:text-emerald-400", cardBorder: "border-l-emerald-400/60", cardBg: "bg-emerald-50/50 dark:bg-emerald-950/20", headingText: "text-emerald-700 dark:text-emerald-400", progressBg: "bg-emerald-500" },
  orange:   { headerGradient: "bg-gradient-to-b from-orange-100 to-orange-50/30 dark:from-orange-900/40 dark:to-orange-950/10", iconBg: "bg-orange-100 dark:bg-orange-900/50", iconText: "text-orange-600 dark:text-orange-400", cardBorder: "border-l-orange-400/60", cardBg: "bg-orange-50/50 dark:bg-orange-950/20", headingText: "text-orange-700 dark:text-orange-400", progressBg: "bg-orange-500" },
  yellow:   { headerGradient: "bg-gradient-to-b from-yellow-100 to-yellow-50/30 dark:from-yellow-900/40 dark:to-yellow-950/10", iconBg: "bg-yellow-100 dark:bg-yellow-900/50", iconText: "text-yellow-600 dark:text-yellow-400", cardBorder: "border-l-yellow-400/60", cardBg: "bg-yellow-50/50 dark:bg-yellow-950/20", headingText: "text-yellow-700 dark:text-yellow-400", progressBg: "bg-yellow-500" },
  indigo:   { headerGradient: "bg-gradient-to-b from-indigo-100 to-indigo-50/30 dark:from-indigo-900/40 dark:to-indigo-950/10", iconBg: "bg-indigo-100 dark:bg-indigo-900/50", iconText: "text-indigo-600 dark:text-indigo-400", cardBorder: "border-l-indigo-400/60", cardBg: "bg-indigo-50/50 dark:bg-indigo-950/20", headingText: "text-indigo-700 dark:text-indigo-400", progressBg: "bg-indigo-500" },
  pink:     { headerGradient: "bg-gradient-to-b from-pink-100 to-pink-50/30 dark:from-pink-900/40 dark:to-pink-950/10", iconBg: "bg-pink-100 dark:bg-pink-900/50", iconText: "text-pink-600 dark:text-pink-400", cardBorder: "border-l-pink-400/60", cardBg: "bg-pink-50/50 dark:bg-pink-950/20", headingText: "text-pink-700 dark:text-pink-400", progressBg: "bg-pink-500" },
  teal:     { headerGradient: "bg-gradient-to-b from-teal-100 to-teal-50/30 dark:from-teal-900/40 dark:to-teal-950/10", iconBg: "bg-teal-100 dark:bg-teal-900/50", iconText: "text-teal-600 dark:text-teal-400", cardBorder: "border-l-teal-400/60", cardBg: "bg-teal-50/50 dark:bg-teal-950/20", headingText: "text-teal-700 dark:text-teal-400", progressBg: "bg-teal-500" },
  cyan:     { headerGradient: "bg-gradient-to-b from-cyan-100 to-cyan-50/30 dark:from-cyan-900/40 dark:to-cyan-950/10", iconBg: "bg-cyan-100 dark:bg-cyan-900/50", iconText: "text-cyan-600 dark:text-cyan-400", cardBorder: "border-l-cyan-400/60", cardBg: "bg-cyan-50/50 dark:bg-cyan-950/20", headingText: "text-cyan-700 dark:text-cyan-400", progressBg: "bg-cyan-500" },
  amber:    { headerGradient: "bg-gradient-to-b from-amber-100 to-amber-50/30 dark:from-amber-900/40 dark:to-amber-950/10", iconBg: "bg-amber-100 dark:bg-amber-900/50", iconText: "text-amber-600 dark:text-amber-400", cardBorder: "border-l-amber-400/60", cardBg: "bg-amber-50/50 dark:bg-amber-950/20", headingText: "text-amber-700 dark:text-amber-400", progressBg: "bg-amber-500" },
  rose:     { headerGradient: "bg-gradient-to-b from-rose-100 to-rose-50/30 dark:from-rose-900/40 dark:to-rose-950/10", iconBg: "bg-rose-100 dark:bg-rose-900/50", iconText: "text-rose-600 dark:text-rose-400", cardBorder: "border-l-rose-400/60", cardBg: "bg-rose-50/50 dark:bg-rose-950/20", headingText: "text-rose-700 dark:text-rose-400", progressBg: "bg-rose-500" },
  violet:   { headerGradient: "bg-gradient-to-b from-violet-100 to-violet-50/30 dark:from-violet-900/40 dark:to-violet-950/10", iconBg: "bg-violet-100 dark:bg-violet-900/50", iconText: "text-violet-600 dark:text-violet-400", cardBorder: "border-l-violet-400/60", cardBg: "bg-violet-50/50 dark:bg-violet-950/20", headingText: "text-violet-700 dark:text-violet-400", progressBg: "bg-violet-500" },
  sky:      { headerGradient: "bg-gradient-to-b from-sky-100 to-sky-50/30 dark:from-sky-900/40 dark:to-sky-950/10", iconBg: "bg-sky-100 dark:bg-sky-900/50", iconText: "text-sky-600 dark:text-sky-400", cardBorder: "border-l-sky-400/60", cardBg: "bg-sky-50/50 dark:bg-sky-950/20", headingText: "text-sky-700 dark:text-sky-400", progressBg: "bg-sky-500" },
  gray:     { headerGradient: "bg-gradient-to-b from-gray-100 to-gray-50/30 dark:from-gray-800/40 dark:to-gray-900/10", iconBg: "bg-gray-200 dark:bg-gray-800/50", iconText: "text-gray-600 dark:text-gray-400", cardBorder: "border-l-gray-400/60", cardBg: "bg-gray-50/50 dark:bg-gray-800/20", headingText: "text-gray-700 dark:text-gray-400", progressBg: "bg-gray-500" },
};

export function AdminHelpGuide({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const slide = HELP_SLIDES[currentSlide];
  const Icon = slide.icon;
  const totalSlides = HELP_SLIDES.length;
  const styles = ACCENT_STYLES[slide.accent] || ACCENT_STYLES.primary;
  const progressPercent = ((currentSlide + 1) / totalSlides) * 100;

  const goNext = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
    setSlideKey((k) => k + 1);
  };
  const goPrev = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
    setSlideKey((k) => k + 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setCurrentSlide(0); setSlideKey(0); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0" data-testid="dialog-admin-help">
        <div className={`px-6 pt-6 pb-5 rounded-t-lg transition-all duration-500 ${styles.headerGradient}`}>
          <DialogHeader>
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`p-4 rounded-full ${styles.iconBg} ${styles.iconText} transition-colors duration-300 shadow-sm`}>
                <Icon className="h-8 w-8" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">{slide.title}</DialogTitle>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${styles.iconBg} ${styles.iconText}`}>
                  {currentSlide + 1} / {totalSlides}
                </span>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pt-3 pb-2">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${styles.progressBg}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="sr-only" aria-hidden="true">
            {HELP_SLIDES.map((_, i) => (
              <button
                key={i}
                tabIndex={-1}
                onClick={() => { setCurrentSlide(i); setSlideKey((k) => k + 1); }}
                data-testid={`dot-help-slide-${i}`}
              />
            ))}
          </div>
        </div>

        <div key={slideKey} className="space-y-3 px-6 pb-2 helpSlideContent">
          {slide.sections.map((section, i) => (
            <div
              key={`${currentSlide}-${i}`}
              className={`p-4 rounded-lg border border-l-[3px] transition-colors duration-300 ${styles.cardBorder} ${styles.cardBg}`}
              style={{ animation: `helpCardIn 0.35s ease-out ${i * 0.07}s both` }}
            >
              <h4 className={`font-semibold text-sm mb-1.5 ${styles.headingText} transition-colors duration-300`}>{section.heading}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="gap-1"
            data-testid="button-help-prev"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-xs text-muted-foreground font-medium tabular-nums">
            Step {currentSlide + 1} of {totalSlides}
          </span>

          {currentSlide < totalSlides - 1 ? (
            <Button
              size="sm"
              onClick={goNext}
              className="gap-1"
              data-testid="button-help-next"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => { onOpenChange(false); setCurrentSlide(0); setSlideKey(0); }}
              data-testid="button-help-done"
            >
              Done
            </Button>
          )}
        </div>

        <style jsx>{`
          .helpSlideContent {
            animation: helpSlideIn 0.3s ease-out;
          }
          @keyframes helpSlideIn {
            from {
              opacity: 0;
              transform: translateX(12px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes helpCardIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .helpSlideContent {
              animation: none;
            }
            @keyframes helpCardIn {
              from { opacity: 1; transform: none; }
              to { opacity: 1; transform: none; }
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
