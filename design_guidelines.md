# MumblesVibe.com Design Guidelines

## Design Approach
**Reference-Based**: Drawing from TripAdvisor's information density and review-focus, Airbnb's visual storytelling and card-based layouts, and Booking.com's search-driven interface. This hybrid approach balances community content with commercial accommodation features.

## Core Design Elements

### Typography
- **Headlines**: Bold, modern sans-serif (e.g., Inter, Plus Jakarta Sans) - 48-64px for hero, 32-40px for sections
- **Body**: Clean, readable sans-serif - 16-18px for content, 14px for metadata
- **Accents**: Slightly condensed weight for event dates, pricing, category tags

### Layout System
**Spacing Scale**: Tailwind units of 3, 4, 6, 8, 12, 16, 20, 24
- Section padding: py-16 md:py-24 for major sections
- Card spacing: p-6, gap-6 for grids
- Inline elements: space-x-3, space-y-4

### Component Library

**Navigation**
- Sticky header with logo, main nav (Explore, Events, Stay, Articles), search bar, user account
- Secondary nav for categories below main header
- Mobile: Hamburger menu with full-screen overlay

**Hero Section**
- Full-width background image showcasing Mumbles coastline/landmarks (1920x800px)
- Centered search interface overlaid with blurred background panel
- Combined search: "Where to stay" + "Check-in/out dates" + "Search" button
- Subheading: "Discover the best of Mumbles - from hidden gems to seaside stays"

**Content Cards (Articles & Listings)**
- Image-first cards with 16:9 aspect ratio thumbnails
- 3-column grid (lg), 2-column (md), 1-column (mobile)
- Card structure: Image → Category tag → Title → Brief excerpt → Read more link
- Accommodation cards add: Star rating, price range, "View Deals" CTA

**Events Section**
- 2-column layout with date pill (left) and event details (right)
- Visual hierarchy: Event date → Title → Venue → Time → "Learn More" link
- Featured event: Full-width card with background image treatment

**Search & Filter Bar**
- Horizontal pills for quick filters: "Restaurants", "Things to Do", "Beaches", "Nightlife"
- Advanced filters dropdown with checkboxes, price ranges, ratings
- Real-time result count display

**Review Components**
- Star ratings with 5-point scale
- User avatar, name, date posted
- "Verified Local" badge for community members
- Helpful/Not helpful voting buttons

**Footer**
- 4-column layout: About Mumbles, Quick Links, Popular Categories, Newsletter signup
- Social media icons, partnership logos (booking.com affiliate badge)
- Community guidelines and contributor links

**Special Elements**
- "Local Insider Tips" callout boxes with accent border
- Photo galleries: Masonry grid with lightbox capability
- Interactive map integration for locations
- "Trending Now" sidebar widget with compact listings

## Images
**Hero**: Panoramic Mumbles seafront with pier and lighthouse at golden hour (critical for establishing location identity)
**Article Cards**: Featured images for each article (lifestyle photography, local scenes)
**Accommodation**: Property photos provided via booking.com API
**Events**: Event-specific imagery or venue photos
**Background Accents**: Subtle coastal patterns or textures for section breaks

## Interactions
- Smooth scroll to sections
- Card hover: Subtle lift (translate-y-1) with shadow increase
- Image zoom on hover within cards (scale-105)
- Skeleton loaders for dynamic content
- Lazy loading for images below fold

## Accessibility
- WCAG 2.1 AA contrast ratios throughout
- Focus indicators on all interactive elements
- Semantic HTML5 structure with proper heading hierarchy
- Alt text for all imagery
- Keyboard navigation support for search and filters