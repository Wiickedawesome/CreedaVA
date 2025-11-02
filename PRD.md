# Planning Guide

A professional, conversion-focused website that showcases CreedaVA (Creeda Virtual Assistants) services, builds trust with potential clients, and clearly communicates service offerings and value propositions through a multi-page architecture.

**Experience Qualities**:
1. **Professional** - The site should convey expertise, reliability, and corporate credibility that enterprise clients expect
2. **Trustworthy** - Design elements that build confidence through testimonials, credentials, and clear communication
3. **Approachable** - While professional, the interface should feel warm and human, reflecting the personal service nature of virtual assistants

**Complexity Level**: Light Application (multiple features with basic state)
The site uses React Router for multi-page navigation, providing separate pages for Home, Services, About, Pricing, and Contact. Each page presents focused information with clear calls-to-action for engagement, creating a traditional website experience with modern single-page app performance.

## Essential Features

### Multi-Page Navigation System
- **Functionality**: React Router-based navigation with separate pages for Home, Services, About, Pricing, and Contact
- **Purpose**: Provide clear content organization and improved SEO potential with distinct pages
- **Trigger**: User clicks navigation links or buttons
- **Progression**: User selects page → Route changes → New page content loads → Navbar updates active state
- **Success criteria**: Smooth transitions, clear active page indication, proper back/forward browser button support

### Home Page with Hero & Overview
- **Functionality**: Eye-catching hero section, stats, service overview, testimonials, and CTA
- **Purpose**: Immediately communicate value proposition and showcase credibility
- **Trigger**: Landing on site or clicking Home link
- **Progression**: View hero → See stats → Browse services → Read testimonials → Click CTA to Contact
- **Success criteria**: Clear value proposition within 3 seconds, compelling stats, smooth scroll animations

### Services Detail Page
- **Functionality**: Comprehensive list of all 9+ service categories with detailed feature lists
- **Purpose**: Help visitors understand the full breadth and depth of offerings
- **Trigger**: Navigating to Services page
- **Progression**: View service categories → Read feature lists → Select relevant services → Navigate to Contact
- **Success criteria**: All services clearly categorized, easy to scan, detailed feature lists visible

### About Page
- **Functionality**: Company mission, values, differentiators, and team information
- **Purpose**: Build trust and establish expertise through company story
- **Trigger**: Navigating to About page
- **Progression**: Read mission → View values → See differentiators → Feel connection → Contact CTA
- **Success criteria**: Compelling story, clear values, authentic presentation

### Pricing Page
- **Functionality**: Three pricing tiers, how-it-works section, and FAQ
- **Purpose**: Qualify leads and set clear expectations with transparent pricing
- **Trigger**: Navigating to Pricing page
- **Progression**: Compare plans → Review process → Read FAQs → Select tier → Contact
- **Success criteria**: Clear tier differentiation, transparent pricing structure, answered common questions

### Contact Page
- **Functionality**: Multi-field contact form with data persistence, contact methods, and what-happens-next info
- **Purpose**: Remove friction from conversion with multiple contact options
- **Trigger**: Navigating to Contact page or clicking CTAs
- **Progression**: View form → Fill required fields → Submit → See confirmation → Data persists for future reference
- **Success criteria**: Simple form (5 fields), multiple contact methods, clear next steps, data stored securely

### Data Storage & Management
- **Functionality**: Built-in key-value data persistence using Spark's `useKV` hook for storing form submissions, user preferences, and application state
- **Purpose**: Enable contact form submissions and other data to be stored and retrieved without external services
- **Trigger**: Form submissions, user interactions, preference updates
- **Progression**: User submits data → Data stored via useKV → Accessible across sessions → Can be viewed/managed
- **Success criteria**: Data persists across page reloads, secure storage, easy retrieval

### SEO & Discoverability
- **Functionality**: Google Search Console integration with meta tags, description, and keywords
- **Purpose**: Improve search engine visibility and ranking for virtual assistant services
- **Trigger**: Search engines crawling the site
- **Progression**: Google indexes pages → Site appears in search results → Verification via Search Console
- **Success criteria**: Proper meta tags, Google verification tag in place, sitemap accessible

## Edge Case Handling

- **Page Navigation**: Browser back/forward buttons work correctly, page scrolls to top on route changes
- **Mobile Navigation**: Hamburger menu with smooth slide-in drawer, closes on route change
- **Active Page Indication**: Current page highlighted in navigation with accent color
- **404 Handling**: All undefined routes redirect to home page
- **Form Validation**: Real-time validation with helpful error messages, prevent submission of incomplete forms
- **Missing Images**: Graceful fallbacks with branded placeholders or gradient backgrounds
- **Slow Loading**: Skeleton screens for content sections, optimistic UI updates
- **External Links**: Open in new tabs with appropriate security attributes

## Design Direction

The design should feel premium, corporate, and trustworthy while maintaining warmth and approachability. Think modern SaaS aesthetic meets boutique service firm - clean lines, generous whitespace, sophisticated color palette, and subtle animations that convey professionalism without feeling sterile. The interface should be minimal yet rich where it matters (testimonials, team bios), prioritizing content hierarchy and clear user journeys.

## Color Selection

Complementary color scheme with warm and cool tones that balance professionalism with approachability.

- **Primary Color**: Deep Navy Blue (oklch(0.25 0.05 250)) - Conveys trust, professionalism, and corporate credibility
- **Secondary Colors**: Soft Slate (oklch(0.45 0.02 250)) for supporting elements; Light Gray (oklch(0.96 0.005 250)) for backgrounds
- **Accent Color**: Vibrant Coral (oklch(0.68 0.18 25)) - Creates warmth, energy, and draws attention to CTAs and important elements
- **Foreground/Background Pairings**:
  - Background (Light Warm White oklch(0.98 0.01 80)): Dark Navy text (oklch(0.25 0.05 250)) - Ratio 12.1:1 ✓
  - Card (Pure White oklch(1 0 0)): Dark Navy text (oklch(0.25 0.05 250)) - Ratio 13.5:1 ✓
  - Primary (Deep Navy oklch(0.25 0.05 250)): White text (oklch(1 0 0)) - Ratio 13.5:1 ✓
  - Secondary (Soft Slate oklch(0.45 0.02 250)): White text (oklch(1 0 0)) - Ratio 7.2:1 ✓
  - Accent (Vibrant Coral oklch(0.68 0.18 25)): White text (oklch(1 0 0)) - Ratio 4.8:1 ✓
  - Muted (Light Gray oklch(0.96 0.005 250)): Medium Gray text (oklch(0.50 0.02 250)) - Ratio 6.8:1 ✓

## Font Selection

Typography should convey modern professionalism with excellent readability across all devices. Using a sans-serif for its clean, contemporary feel that works well for both headlines and body copy.

- **Typographic Hierarchy**:
  - H1 (Hero Headline): Inter Bold/48px/tight letter-spacing (-0.02em)
  - H2 (Section Headers): Inter SemiBold/36px/tight letter-spacing (-0.01em)
  - H3 (Subsection Headers): Inter SemiBold/24px/normal letter-spacing
  - H4 (Card Titles): Inter Medium/20px/normal letter-spacing
  - Body (Primary Text): Inter Regular/16px/relaxed line-height (1.6)
  - Body Small (Captions): Inter Regular/14px/relaxed line-height (1.5)
  - CTA Buttons: Inter SemiBold/16px/slight letter-spacing (0.01em)

## Animations

Animations should be subtle and purposeful, enhancing the premium feel without distracting from content. Focus on micro-interactions that provide feedback and smooth transitions between states. The balance leans toward functionality with moments of delight during key interactions (hover states on CTAs, smooth scroll reveals).

- **Purposeful Meaning**: Smooth fade-ins as sections enter viewport communicate polish and attention to detail; button hover states with subtle scale and shadow changes reinforce interactivity
- **Hierarchy of Movement**: Primary CTAs deserve subtle pulse or glow animations; section reveals should be staggered by 100ms for a cascading effect; testimonial cards can have gentle hover lifts to encourage interaction

## Component Selection

- **Components**:
  - **Card**: Service offerings, testimonials, team member profiles (with subtle shadow and hover lift effects)
  - **Button**: Primary CTAs with accent color, secondary actions with outline style
  - **Form** + **Input** + **Label** + **Textarea**: Contact form with clean, modern inputs
  - **Avatar**: Team member photos in circular frames
  - **Badge**: Service tags, feature highlights
  - **Separator**: Visual breaks between major sections
  - **Sheet**: Mobile navigation drawer
  - **Scroll-area**: If testimonials or services need horizontal scrolling
  - **Accordion**: FAQ section if needed

- **Customizations**:
  - Hero section with gradient background overlay
  - Custom service cards with icon integration from Phosphor
  - Testimonial cards with quote styling and client attribution
  - Statistics counter section with animated numbers (using framer-motion)
  - Custom sticky navigation with logo and CTA

- **States**:
  - Buttons: Default with solid accent color → Hover with slight scale (1.02) and deeper shadow → Active with scale (0.98) → Disabled with reduced opacity
  - Cards: Default with subtle shadow → Hover with lifted shadow and slight translation (-2px Y)
  - Form inputs: Default with border → Focus with accent color ring and border → Error with destructive color → Success with checkmark
  - Navigation links: Default underline on hover, smooth color transition

- **Icon Selection**:
  - **UserCircle/UsersThree**: Team/about section
  - **Briefcase**: Professional services
  - **ChartLineUp**: Growth/success metrics
  - **Calendar**: Scheduling
  - **EnvelopeSimple**: Contact
  - **Phone**: Phone contact option
  - **CheckCircle**: Service features, completed tasks
  - **Star**: Ratings, premium features
  - **ArrowRight**: CTA arrows, next steps
  - **List**: Menu hamburger

- **Spacing**: Use consistent spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96px) with sections using 64-96px vertical padding, cards with 24-32px internal padding, and 16-24px gaps between related elements

- **Mobile**: Mobile-first approach with hamburger navigation, stacked service cards (grid becomes single column), hero text size reduces from 48px to 32px, section padding reduces from 96px to 48px, touch-friendly button sizes (min 44px height)
