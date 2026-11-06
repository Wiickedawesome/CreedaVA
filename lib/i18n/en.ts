const en = {
  // ─── Nav ───────────────────────────────────────
  nav: {
    home: "Home",
    services: "Services",
    pricing: "Pricing",
    about: "About",
    news: "News",
    contact: "Contact",
    signIn: "Sign In",
    getStarted: "Get Started",
  },

  // ─── Home ──────────────────────────────────────
  home: {
    heroTitle: "Real people. Real support.",
    heroTitleHighlight: "More time to grow.",
    heroDesc:
      "Creeda Virtual Assistants gives your business a dedicated human assistant who handles the daily work \u2014 inbox, calendar, customers, admin \u2014 so your hours go to the parts only you can do.",
    heroCtaPrimary: "Get started",
    heroCtaSecondary: "Explore services",
    heroProof: ["100% human", "English & Spanish", "Built around your business"],
    heroSectorsLabel: "Built for teams in",
    heroSectors:
      "Real estate \u00b7 Legal \u00b7 Insurance \u00b7 E-commerce \u00b7 Professional services",
    heroVisual: {
      windowLabel: "today.creedava.com",
      assistantName: "Maria",
      assistantRole: "Executive Assistant",
      status: "Online",
      queueTitle: "Today\u2019s queue",
      tasks: [
        "Inbox triaged \u2014 47 emails",
        "Calendar confirmed for Thursday",
        "CRM records updated",
        "Weekly summary ready to send",
      ],
      queueFooter: "12 tasks completed this week",
      inboxTitle: "Inbox",
      inboxValue: "0 unread",
      calendarMonth: "March",
      calendarDate: "Thu \u00b7 2:30 PM",
      calendarDetail: "Consultation booked",
    },
    stats: {
      flatFee: "Flat Monthly Fee",
      supportPlans: "Support Plans",
      availability: "Bilingual Support",
      onboardingDays: "Days to Onboard",
    },
    statsEyebrow: "By the numbers",
    statsTitle: "A small team you can actually afford.",
    statsLede:
      "No salaries, no benefits, no equipment. Choose the hours you need and adjust them as the work grows.",
    howItWorks: "How It Works",
    howItWorksDesc:
      "Get started with your dedicated virtual assistant in just a few steps. Most clients are fully onboarded within 5\u20137 business days.",
    processEyebrow: "How it works",
    steps: [
      {
        title: "Free Consultation",
        desc: "Schedule a discovery call to discuss your needs, goals, and the type of support that would benefit your business most.",
      },
      {
        title: "Perfect Match",
        desc: "We carefully match you with a virtual assistant whose skills, experience, and personality align with your requirements.",
      },
      {
        title: "Start Growing",
        desc: "Your VA hits the ground running. We provide onboarding support and ongoing management to ensure success.",
      },
    ],
    compareEyebrow: "The honest comparison",
    compareTitle: "Three ways to get the work done.",
    compareLede:
      "There is no magic here. The difference is who does the work, what it costs, and how fast it starts.",
    compareBadge: "Start here",
    compareResultLabel: "Result:",
    compareColumns: [
      {
        label: "Do it yourself",
        points: [
          "Your own hours are the ceiling on what the business can take on",
          "Nothing gets documented, so nothing can be handed over later",
          "Every new task competes with the work that actually earns",
        ],
        result: "your calendar decides how much you can grow.",
      },
      {
        label: "Hire in-house",
        points: [
          "Salary, benefits, equipment and office space",
          "Employer payroll tax, W-2 and 1099 filings, workers\u2019 comp",
          "Recruiting and training take weeks before any work lands",
          "One person covers one skill set, on fixed hours",
        ],
        result: "a full employment overhead, not just a salary.",
      },
      {
        label: "Work with Creeda",
        points: [
          "A dedicated bilingual assistant matched to your needs",
          "One flat monthly fee \u2014 no payroll tax, W-2, 1099 or benefits admin",
          "Onboarded and working within 5\u20137 business days",
          "NDA and documented workflows from day one",
        ],
        result: "support and a team you can afford.",
      },
    ],
    dayEyebrow: "A day with your assistant",
    dayTitle: "8:00 to 5:00. You are not in any of it.",
    dayLede:
      "This is the shape of a normal working day once the handoff is done. Your assistant works your queue, your tools and your standards \u2014 then sends you a summary.",
    dayPoints: [
      "Work reaches your inbox already triaged and prioritised",
      "Recurring tasks run on a schedule you approve",
      "You review outcomes, not process",
    ],
    dayTimelineLabel: "Tuesday",
    dayTimelineBadge: "Sample day",
    dayTimeline: [
      { time: "08:05", task: "Inbox triaged, four replies drafted", tag: "Admin" },
      { time: "09:20", task: "Three meetings confirmed, one moved", tag: "Calendar" },
      { time: "11:40", task: "CRM updated with new leads", tag: "Data" },
      { time: "14:00", task: "Weekly report sent to the team", tag: "Reporting" },
      { time: "16:30", task: "Follow-ups queued for tomorrow", tag: "Customer" },
    ],
    humanEyebrow: "Real people, not software",
    humanTitle:
      "Technology helps businesses move faster. People are what make the difference.",
    humanLede:
      "Creeda is not a chatbot and not a template. You get a named human assistant who learns your business, works inside your tools, and is accountable for the outcome.",
    humanPoints: [
      "Vetted, professionally bilingual assistants \u2014 not anonymous task workers",
      "Trained on your workflows, tone and tools before the first task",
      "Backed by a team, so cover does not vanish when someone takes a day off",
    ],
    humanChatLabel: "creedava \u00b7 messages",
    humanChatStatus: "Online now",
    humanChatFooter: "Task completed and logged",
    humanChat: [
      { from: "client", text: "Can you move my 2:30 and send the updated invite?" },
      {
        from: "assistant",
        text: "Done \u2014 moved to Thursday at 10:00. Invite sent to both attendees.",
      },
      { from: "client", text: "Perfect, thank you." },
    ],
    handoffEyebrow: "Start somewhere",
    handoffTitle: "What would you hand off first?",
    handoffLede:
      "Pick the tasks that eat your week. Nothing is sent anywhere until you choose to talk to us.",
    // Capped at 10 — measured at 1440 the list was 5 rows / 217px at 14 pills and
    // 9 rows / 397px on a phone, which is half a screen for a picker. Ten keeps
    // 4 rows desktop / 6 mobile. Order matters: the six chore-shaped pain points
    // lead, the generic categories fill the remainder.
    handoffTasks: [
      "Chasing late payments",
      "Following up on leads",
      "Answering the phone",
      "Inbox management",
      "Calendar & scheduling",
      "Appointment reminders",
      "Customer replies",
      "Data entry & CRM",
      "Meeting notes & follow-ups",
      "Invoicing & expenses",
    ],
    handoffEmpty: "Select the tasks you would hand off first.",
    handoffSelectedSuffix: "recurring tasks ready to delegate",
    handoffSelectedSuffixOne: "recurring task ready to delegate",
    handoffClear: "Clear",
    handoffCta: "Talk it through",
    faqEyebrow: "Questions",
    faqTitle: "The things people ask before starting.",
    faqLede:
      "If something is missing, ask us directly \u2014 we answer every inquiry within 24 hours.",
    finalEyebrow: "Next step",
    finalTitle: "Ready to get more done without doing it all yourself?",
    finalLede:
      "Book a free consultation. Tell us what is slowing you down, and we will tell you honestly whether a virtual assistant is the right fix.",
    finalPrimary: "Book a consultation",
    finalSecondary: "See packages",
    finalTrust: [
      "Free 30-minute consultation",
      "Reply within 24 hours",
      "English & Spanish support",
    ],
  },

  // ─── Services ──────────────────────────────────
  services: {
    directoryTitle: "A closer look at what we do.",
    directoryDesc:
      "Each service in turn \u2014 what it covers, why it helps, and what the work looks like. Read straight through or jump to the one you need.",
    detailIncludes: "What it covers",
    detailWhy: "Why it matters",
    detailStart: "Start with this one",
    detailMockupNote: "An illustration of the work, not a live screenshot.",
    mockup: {
      inbox: {
        label: "Inbox",
        search: "Search mail",
        from: ["Marisol R.", "A. Grant", "D. Osei", "Priya N."],
        subject: [
          "Re: March supplier invoice",
          "Contract renewal \u2014 signature",
          "Travel dates confirmed",
          "Q2 report, first draft",
        ],
        replied: "Replied",
        caption: "Nothing left unread",
      },
      calendar: {
        label: "This week",
        days: ["M", "T", "W", "T", "F"],
        events: [
          { time: "09:00", title: "Board sync" },
          { time: "11:30", title: "1:1 with ops" },
          { time: "14:00", title: "Investor call" },
          { time: "All day", title: "Flight to Atlanta" },
        ],
        caption: "Deadlines and meetings in one calendar",
      },
      hiring: {
        label: "Now hiring",
        live: "Live",
        role: "Operations Coordinator",
        meta: "Remote \u00b7 Full time",
        stages: ["Applied", "Screening", "Interview"],
        counts: ["24", "8", "3"],
        caption: "Shortlist ready to interview",
      },
      documents: {
        label: "Documents",
        matter: "Matter 2026-014",
        files: [
          "Motion to compel",
          "Exhibit A \u2014 Bates 001-148",
          "Engagement letter",
          "Client intake form",
        ],
        stamp: "Filed",
        caption: "Filed before the deadline",
      },
      conversation: {
        label: "Conversation",
        customer: "Customer",
        agent: "Assistant",
        message: [
          "My order was meant to arrive Monday and nobody has replied.",
          "Sorry about the wait \u2014 the courier has it out for delivery today. I have refunded the shipping.",
        ],
        typing: "typing",
        resolved: "Resolved",
      },
      published: {
        label: "Published",
        posts: [
          "New season, new menu.",
          "Behind the scenes at the studio.",
          "Doors open Saturday \u2014 come by.",
        ],
        caption: "Scheduled and published in hours",
      },
      report: {
        label: "Report",
        title: "Channel performance \u2014 Q2",
        findings: [
          "Organic search brings in most sign-ups",
          "Churn concentrates in month two",
          "Two segments explain nearly all revenue",
        ],
        caption: "Findings, not raw data",
      },
      invoices: {
        label: "Invoices",
        outstanding: "Outstanding",
        paidThisMonth: "Paid this month",
        rows: [
          { id: "INV-1042", client: "Acme Ltd", amount: "$2,400", paid: true },
          { id: "INV-1039", client: "Northwind", amount: "$1,150", paid: true },
          { id: "INV-1045", client: "Bell & Co", amount: "$3,600", paid: false },
        ],
        paid: "Paid",
        overdue: "Overdue",
        caption: "Invoices chased to paid",
      },
      draft: {
        label: "Draft",
        title: "Five ways to cut admin time",
        body: "Most owners lose their week to the same three tasks. Here is where to start.",
        publish: "Publish",
        caption: "Written, formatted, ready",
      },
      listing: {
        label: "Listing",
        address: "18 Harbour View, Unit 4",
        price: "$325,000",
        meta: "3 bed \u00b7 2 bath",
        badge: "Under contract",
        caption: "Open house booked",
      },
      claim: {
        label: "Claim",
        id: "Claim #4471",
        policy: "Policy HO-88213",
        badge: "Claim filed",
        files: [
          "Damage photos",
          "Repair estimate",
          "Policy declaration",
          "Signed statement",
        ],
        caption: "Documents attached, nothing chased",
      },
      process: {
        label: "Process",
        steps: [
          "New client intake",
          "Kickoff call and notes",
          "Handover to delivery",
        ],
        caption: "Written down and repeatable",
      },
    },
    detailPricingLink: "See what it costs",
    detail: {
      administrative: {
        headline: "Your inbox, calendar, and paperwork, cleared before they reach you.",
        why: [
          "One assistant who learns your priorities instead of a shared queue",
          "Works inside the tools you already use, with no new system to learn",
          "Handles the same tasks in English and Spanish",
        ],
      },
      executive: {
        headline: "Senior support that protects your calendar and prepares your meetings.",
        why: [
          "Filters what reaches you, so the day is not run by whoever emailed last",
          "Has the brief ready before the meeting starts, not after",
          "Treats board and investor material with discretion",
        ],
      },
      "hr-recruiting": {
        headline: "Roles posted, candidates screened, onboarding paperwork done.",
        why: [
          "A hiring push keeps moving without taking your attention with it",
          "Every candidate gets an answer instead of silence",
          "Records stay current for compliance, without a catch-up day",
        ],
      },
      legal: {
        headline: "Files organised, deadlines tracked, documents ready for review.",
        why: [
          "Clerical work stays clerical, so attorney time goes to lawyering",
          "Every deadline lives in one calendar instead of three",
          "Discovery indexing and Bates numbering done to a standard, not ad hoc",
        ],
      },
      customer: {
        headline: "Every call, chat, and ticket answered before the customer asks twice.",
        why: [
          "Coverage from a person during your working hours, not a bot loop",
          "Escalations reach you with the context already attached",
          "English and Spanish customers get the same standard of service",
        ],
      },
      social: {
        headline: "Posts scheduled, comments answered, results reported.",
        why: [
          "Content is produced inside your monthly hours, not billed per post",
          "One person owns the calendar end to end, so nothing is orphaned",
          "You see what was published and what it did",
        ],
      },
      data: {
        headline: "Clean records and straight answers, ready for a decision.",
        why: [
          "Lists are built and de-duplicated, not scraped and dumped",
          "CRM records stay current as a habit rather than a quarterly clean-up",
          "Research arrives summarised, with the sources kept",
        ],
      },
      bookkeeping: {
        headline: "Books current and paperwork ready, every month.",
        why: [
          "Invoices go out and get chased on a schedule, not when there is time",
          "Reconciliation is finished before your accountant asks for it",
          "Documents are handed over in the format they actually need",
        ],
      },
      web: {
        headline: "Website and email marketing kept current.",
        why: [
          "Publishing stops waiting for whoever has a spare hour",
          "SEO is watched and reported, not assumed to be fine",
          "Landing pages and forms are set up and tested, not left half-built",
        ],
      },
      "real-estate": {
        headline: "Listings live, leads followed up, transactions moving.",
        why: [
          "New enquiries are answered the same day, while the interest is warm",
          "MLS entries stay accurate, so listings are not quietly wrong",
          "Transaction paperwork is tracked through to closing",
        ],
      },
      insurance: {
        headline: "Policies entered, certificates issued, renewals tracked.",
        why: [
          "Certificates go out the day they are requested",
          "Renewals surface before they lapse, not after",
          "Compliance files stay complete for audit",
        ],
      },
      "workflow-optimization": {
        headline: "Your processes written down, so work can be handed off.",
        why: [
          "One page a new person can follow without asking you",
          "Tools are configured and tested, not just recommended",
          "The delegation playbooks stay yours, whatever happens next",
        ],
      },
    },
    industriesEyebrow: "Our services",
    industriesTitle: "Built around your sector,",
    industriesTitleHighlight: "not a generic list.",
    industriesDesc:
      "Most of what a business needs is the same everywhere. The vocabulary, the filings, and the deadlines are not. Pick your sector and jump straight to the work that fits it.",
    industries: [
      {
        title: "Agencies & marketing",
        desc: "Studios and in-house marketing teams running several channels at once.",
      },
      {
        title: "Small business",
        desc: "Owner-led businesses where the same person answers the phone, sends the invoice, and does the work.",
      },
      {
        title: "HR & recruiting",
        desc: "Teams hiring in bursts that need postings, screening, and onboarding paperwork kept moving.",
      },
      {
        title: "Insurance",
        desc: "Brokers and agencies where policy entry, certificates, and renewals cannot slip.",
      },
      {
        title: "Real estate",
        desc: "Agents and small teams with listings, leads, and transactions to keep moving.",
      },
      {
        title: "Legal",
        desc: "Solo and small law firms that need filing, docketing, and document work kept current.",
      },
    ],
    groupIndustryTitle: "Services by industry",
    groupIndustryDesc:
      "Sector-specific support, with the vocabulary and the filing habits already in place.",
    groupFunctionTitle: "Services by function",
    groupFunctionDesc: "The day-to-day work, whichever business you happen to run.",
    categories: [
      {
        title: "Administrative Support",
        desc: "Day-to-day admin handled for you \u2014 inbox, calendar, documents, and data entry \u2014 so nothing slips and your week stays clear.",
        features: [
          "Email and inbox management",
          "Calendar and appointment scheduling",
          "Data entry and CRM updates",
          "Document preparation and formatting",
          "Travel booking and itineraries",
          "File organization and cloud storage",
        ],
      },
      {
        title: "Executive & C-Suite Support",
        desc: "A senior assistant for founders and executives \u2014 your inbox filtered, your calendar protected, and your meetings prepared.",
        features: [
          "Inbox triage and priority filtering",
          "Complex calendar and meeting coordination",
          "Board and investor meeting preparation",
          "Travel planning and itinerary management",
          "Expense reports and receipt tracking",
          "Confidential document handling",
        ],
      },
      {
        title: "HR & Recruiting Support",
        desc: "Fill roles faster and keep employee admin compliant \u2014 sourcing, scheduling, and onboarding handled end to end.",
        features: [
          "Job posting and candidate sourcing",
          "Resume screening and shortlisting",
          "Interview scheduling and coordination",
          "Offer letters and onboarding paperwork",
          "Benefits enrollment support",
          "Employee records and compliance files",
        ],
      },
      {
        title: "Legal Administrative Support",
        desc: "Clerical support for solo and small law firms \u2014 files organized, deadlines tracked, and documents ready for attorney review.",
        features: [
          "Client intake and conflict-check data entry",
          "Document assembly and formatting",
          "Discovery indexing and Bates numbering",
          "Docket and deadline calendar management",
          "Filing preparation and court logistics",
          "Time entry and billing support",
        ],
      },
      {
        title: "Customer Service",
        desc: "Answer every call, chat, and ticket \u2014 and keep customers updated before they have to ask.",
        features: [
          "Email and helpdesk ticket response",
          "Live chat and phone coverage",
          "Order status and returns support",
          "Complaint resolution and escalation",
          "Appointment and booking support",
          "Customer satisfaction follow-up",
        ],
      },
      {
        title: "Social Media Management",
        desc: "Stay consistent on the platforms that matter \u2014 posts scheduled, comments answered, and results reported.",
        features: [
          "Content calendar and post scheduling",
          "Comment and DM responses",
          "Community moderation",
          "Ad campaign coordination",
          "Monthly performance reporting",
          "Influencer and partnership outreach",
        ],
      },
      {
        title: "Data & Research",
        desc: "Get clean data and straight answers \u2014 lead lists built, records cleaned, and research summarized for decisions.",
        features: [
          "Lead list building and enrichment",
          "Data entry, cleanup, and validation",
          "CRM maintenance and updates",
          "Market and competitor research",
          "Report and dashboard preparation",
          "Ongoing industry monitoring",
        ],
      },
      {
        title: "Bookkeeping",
        desc: "Keep the books current and the paperwork ready \u2014 invoicing, expenses, and reconciliation handled every month.",
        features: [
          "Invoice creation and AR follow-up",
          "Expense tracking and receipt capture",
          "Bank and credit card reconciliation",
          "Accounts payable support",
          "Monthly financial report prep",
          "Document prep for your accountant",
        ],
      },
      {
        title: "Web & Digital Support",
        desc: "Keep your website and email marketing current \u2014 content updated, campaigns built, and SEO watched.",
        features: [
          "Website content and CMS updates",
          "Blog publishing and formatting",
          "Email newsletter builds",
          "SEO monitoring and reporting",
          "Landing page and form setup",
          "Google Business Profile updates",
        ],
      },
      {
        title: "Real Estate Virtual Assistant",
        desc: "Support for agents and small teams \u2014 listings live, leads followed up, and transactions moving.",
        features: [
          "Listing creation and coordination",
          "Lead follow-up and qualification",
          "MLS data entry and updates",
          "Transaction coordination",
          "Open house scheduling and promotion",
          "Client communication and nurture",
        ],
      },
      {
        title: "Insurance Processing",
        desc: "Clerical support for insurance teams \u2014 policies entered, certificates issued, and renewals tracked on time.",
        features: [
          "Policy data entry and updates",
          "Certificates of insurance issuance",
          "Claims documentation and follow-up",
          "Renewal tracking and reminders",
          "Client communication and support",
          "Compliance file maintenance",
        ],
      },
      {
        title: "Process & Workflow Optimization",
        desc: "Document how your business runs so work can be handed off cleanly \u2014 written down, tooled up, and repeatable.",
        features: [
          "Workflow mapping and documentation",
          "SOP writing and process guides",
          "Tool setup and integration support",
          "Task delegation playbooks",
          "New hire onboarding documents",
          "Team training on new processes",
        ],
      },
    ],
    packages: {
      title: "Service Packages",
      description:
        "Three ways to work with us. Every package is staffed by a dedicated bilingual assistant \u2014 tell us what you need and we\u2019ll send a tailored quote.",
      ctaButton: "Get a quote",
      items: [
        {
          id: "starter",
          name: "Starter",
          hours: "80 hours/month",
          desc: "Part-time dedicated support for businesses that need consistent assistance",
          features: [
            "Dedicated part-time VA",
            "Bilingual support available",
            "Priority response",
            "Advanced task management",
            "Weekly progress reports",
            "Process documentation",
            "Team collaboration tools",
          ],
        },
        {
          id: "professional",
          badge: "Most Popular",
          name: "Professional",
          hours: "160 hours/month",
          desc: "Premium full-time support with senior VAs and specialized expertise",
          features: [
            "Dedicated senior VA",
            "Bilingual support available",
            "Priority support 24/7",
            "Weekly sync meetings",
            "Advanced reporting & analytics",
            "Process optimization",
            "Specialized skills & training",
            "Account manager",
          ],
        },
        {
          id: "enterprise",
          name: "Enterprise",
          hours: "Custom hours",
          desc: "Tailored solutions for organizations with complex needs",
          features: [
            "Multiple VAs & specialists",
            "Bilingual & multilingual support",
            "24/7 priority support",
            "Dedicated account manager",
            "Custom workflows & integrations",
            "Team lead coordination",
            "SLA guarantees",
            "Onboarding & training support",
          ],
        },
      ],
    },
    ctaTitle: "Need a Custom Solution?",
    ctaDesc:
      "We can tailor our services to meet your specific business requirements. Let\u2019s discuss what you need.",
    ctaButton: "Contact Us Today",
    ctaSecondary: "See what it costs",
  },

  // ─── Pricing ───────────────────────────────
  //
  // Every claim below is traceable to copy that already existed: the package
  // feature lists, or the FAQ (setup quoted, one-year commitment, plan changes,
  // payment methods, 5\u20137 day onboarding). No prices are published \u2014 packages
  // are quoted per client, which is also what the admin AI guardrails require.
  pricing: {
    eyebrow: "Pricing",
    heroTitle: "The help you need,",
    heroTitleHighlight: "without the hiring.",
    heroDesc:
      "Every plan is staffed by a dedicated bilingual assistant and quoted for your business \u2014 so you know the cost before you commit, not after.",
    heroCtaPrimary: "Book a free consultation",
    heroCtaSecondary: "Compare the plans",
    closingTitle: "Not sure which plan fits?",
    closingDesc:
      "Tell us how your week runs and we\u2019ll recommend the hours. No pressure, no obligation.",
    closingCta: "Book a free consultation",
    plansEyebrow: "Plans",
    plansNote: "Hours are set by the plan you choose.",
    extrasTitle: "All plans integrate with the workflow you already use.",
    extras: [
      "Gmail",
      "Outlook",
      "Google Calendar",
      "Shopify",
      "WooCommerce",
      "Salesforce",
      "HubSpot",
      "Slack",
      "Notion",
      "Asana",
    ],
    includedEyebrow: "What you get",
    includedTitle: "Every plan includes",
    includedDesc:
      "The same foundation whether you take eighty hours a month or a full team.",
    includedItems: [
      "A dedicated assistant assigned to your business",
      "English and Spanish, with no translation layer",
      "Documented processes, so work survives a handoff",
      "Hours set by your plan: 80, 160, or custom",
      "Setup work quoted before it begins",
    ],
    includedMockupLabel: "your-month.creedava.com",
    hoursTitle: "A month of hours",
    hoursPlanLabel: "Professional \u00b7 160 hours",
    hoursTotalLabel: "Allocated",
    hoursUnit: "h",
    hoursBreakdown: [
      { label: "Inbox & calendar", hours: 48 },
      { label: "Customer support", hours: 40 },
      { label: "Data & admin", hours: 40 },
      { label: "Projects & reporting", hours: 32 },
    ],
    hoursFootnote:
      "Illustrative split. Your mix is agreed with your assistant in the first week, and can change month to month.",
    termsEyebrow: "Why it\u2019s different",
    termsTitle: "What you\u2019re not paying for.",
    termsDesc:
      "A hire, an answering service, and a freelancer all charge for things this does not. Here is what stays off your invoice.",
    termsItems: [
      {
        title: "A person answers, not a bot",
        desc: "No AI auto-replies and no phone tree. Your clients reach a named assistant who already knows your business.",
      },
      {
        title: "No per-minute meters",
        desc: "You buy hours inside a plan, not a ticking clock. Nobody is counting the seconds on a call.",
      },
      {
        title: "One plan, one invoice",
        desc: "Hours, tools, and oversight sit in a single price. No per-task line items arriving at month end.",
      },
      {
        title: "No employer overhead",
        desc: "No payroll tax, benefits, equipment, or recruitment cost. You pay for the work, not the headcount.",
      },
      {
        title: "No hiring cycle",
        desc: "Capacity moves by changing plan, not by writing a job post and waiting a quarter for someone to start.",
      },
      {
        title: "Setup is quoted, not sprung",
        desc: "Where a workflow needs setup work, you see the figure in writing and approve it before anything starts.",
      },
    ],
  },

  // ─── About ─────────────────────────────────────
  about: {
    eyebrow: "About Creeda",
    heroTitle: "One country. Two languages.",
    heroTitleHighlight: "Your whole back office.",
    heroDesc:
      "Founded in 2023, Creeda Virtual Assistants (CreedaVA) is a Belize-based virtual assistant agency built to connect outstanding talent with global opportunity.",
    heroFacts: ["Founded in 2023", "English & Spanish", "Belize, Central America"],
    heroCtaPrimary: "Work with Creeda",
    heroCtaSecondary: "Explore services",
    mapCaptionLabel: "Belize \u00b7 Central America",
    mapCaptionMeta: "UTC\u22126 \u00b7 English and Spanish",
    whyEyebrow: "Why Belize",
    whyTitle: "The only English-speaking country in Central America.",
    whyP1:
      "Belize\u2019s highly educated, professionally bilingual workforce represents a new standard in remote professional support \u2014 and we\u2019re proud to bring that talent to businesses around the world.",
    whyP2:
      "Belize sits at the crossroads of cultures. Our team is fluent in English and Spanish, and rich in adaptability, communication, and professionalism \u2014 delivering world-class virtual support across industries.",
    whyFacts: [
      {
        title: "English by default",
        desc: "Belize is the only English-speaking country in Central America, so your team writes and calls in your language without translation overhead.",
      },
      {
        title: "Spanish without a handoff",
        desc: "Bilingual is the norm here, not a premium add-on. The same assistant can serve both audiences.",
      },
      {
        title: "Your working day",
        desc: "Belize runs on Central time year-round, so your assistant is online while your customers are.",
      },
    ],
    approachEyebrow: "How we work",
    approachTitle: "A partnership, not a task queue.",
    approachDesc:
      "We take a partnership approach with every client. From our initial discovery call through ongoing support, we invest time in understanding your business, your challenges, and your goals. This allows us to match you with the perfect virtual assistant and create workflows that truly enhance your productivity. We\u2019re not just completing tasks \u2014 we\u2019re helping you build systems that scale.",
    standards: [
      {
        title: "Documented SOPs",
        desc: "Every recurring task is written down before it is handed over, so nothing depends on memory.",
      },
      {
        title: "A named owner",
        desc: "Each workstream has one accountable person \u2014 no shared inboxes and no \u201csomeone will get to it.\u201d",
      },
      {
        title: "Recurring reviews",
        desc: "Performance is reviewed on a schedule, not only when something goes wrong.",
      },
      {
        title: "Measured service",
        desc: "Response times, completion rates and client feedback are tracked and reported.",
      },
    ],
    purposeEyebrow: "Mission & vision",
    missionTitle: "Our Mission",
    missionDesc:
      "To bridge opportunity and talent by connecting Belize\u2019s highly skilled workforce with global businesses, creating sustainable remote career pathways while delivering exceptional virtual assistant services that empower companies to achieve more.",
    visionTitle: "Our Vision",
    visionDesc:
      "Creeda is more than a service \u2014 it\u2019s a movement to empower Belize\u2019s workforce, foster remote career growth, and create sustainable pathways for global collaboration. By hiring through Creeda, companies don\u2019t just get exceptional talent \u2014 they invest in a vision of progress, purpose, and partnership.",
    valuesEyebrow: "What we stand on",
    valuesTitle: "Our Values",
    valuesDesc: "The principles that guide everything we do.",
    values: [
      { title: "Excellence", desc: "We hold ourselves to the highest standards in every task, no matter how small." },
      { title: "Reliability", desc: "Your deadlines are our deadlines. We deliver consistently, on time, every time." },
      { title: "Transparency", desc: "Clear communication, honest pricing, and no surprises. You always know where you stand." },
      { title: "Growth", desc: "We\u2019re committed to helping your business grow while continuously improving our own skills." },
    ],
    ctaTitle: "Let\u2019s Work Together",
    ctaDesc: "Ready to take your business to the next level? We\u2019d love to hear from you.",
    ctaButton: "Get in Touch",
  },

  // ─── Contact ───────────────────────────────────
  contact: {
    heroTitle: "Get in Touch",
    heroDesc:
      "Have a question or ready to get started? We\u2019d love to hear from you. Fill out the form below and we\u2019ll get back to you within 24 hours.",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    company: "Company",
    message: "Message",
    firstNamePlaceholder: "John",
    lastNamePlaceholder: "Doe",
    emailPlaceholder: "john@company.com",
    companyPlaceholder: "Company Name",
    messagePlaceholder: "Tell us about your needs...",
    sendMessage: "Send Message",
    sending: "Sending...",
    successTitle: "Message Sent!",
    successDesc: "Thank you for reaching out. We\u2019ll get back to you within 24 hours.",
    sendAnother: "Send Another Message",
    contactInfoTitle: "Contact Information",
    contactInfoDesc:
      "Prefer to reach us directly? Contact us through any of the channels below. Our team is available Monday through Friday, 9am to 6pm EST.",
    emailLabel: "Email",
    emailValue: "contact@creedava.com",
    phoneLabel: "Phone",
    phoneValue: "+1 844-702-2202",
    hoursLabel: "Business Hours",
    hoursValue: "Monday - Friday, 9:00 AM - 6:00 PM EST",
    responseLabel: "Response Time",
    responseValue: "We respond to all inquiries within 24 hours",
    bookTitle: "Want to schedule a call?",
    bookDesc: "Book a free 30-minute consultation to discuss your needs.",
    bookLink: "Book a Consultation",
  },

  // ─── FAQ ───────────────────────────────────────
  faq: {
    heroTitle: "Frequently Asked Questions",
    heroDesc: "Everything you need to know about our virtual assistant services. Can\u2019t find what you\u2019re looking for?",
    heroLink: "Contact us",
    categories: [
      {
        name: "General",
        questions: [
          {
            q: "What is a virtual assistant?",
            a: "A virtual assistant (VA) is a trained remote professional who provides administrative, technical, or specialized support to businesses. They work from a remote location and handle tasks ranging from email management to customer service, bookkeeping, and more.",
          },
          {
            q: "How is Creeda different from other VA companies?",
            a: "Creeda provides bilingual (English/Spanish) virtual assistants who are carefully matched to your business needs. We offer dedicated support, ongoing quality management, and flexible plans \u2014 whether you need a few hours a week or a full-time team.",
          },
          {
            q: "What industries do you serve?",
            a: "We work with businesses across many industries including real estate, insurance, e-commerce, healthcare, legal, finance, and more. Our VAs are trained to adapt to your specific industry requirements.",
          },
        ],
      },
      {
        name: "Services",
        questions: [
          {
            q: "What tasks can a virtual assistant handle?",
            a: "Our VAs can handle administrative support, customer service, social media management, data entry and research, bookkeeping, real estate support, insurance processing, and web/digital tasks. We can also train VAs on custom workflows specific to your business.",
          },
          {
            q: "Can I get a VA for a specific project?",
            a: "Yes! We offer flexible arrangements \u2014 from ongoing support to project-based work. Whether you need help with a one-time data migration or a recurring weekly schedule, we can accommodate your needs.",
          },
          {
            q: "Do you offer bilingual services?",
            a: "Absolutely. Our team includes bilingual virtual assistants fluent in English and Spanish, making us a great fit for businesses serving diverse markets.",
          },
        ],
      },
      {
        name: "Getting Started",
        questions: [
          {
            q: "How do I get started?",
            a: "It\u2019s simple: schedule a free consultation through our Contact page. We\u2019ll discuss your needs, match you with the right VA, and get you fully onboarded \u2014 typically within 5\u20137 business days.",
          },
          {
            q: "Is there a minimum commitment?",
            a: "An initial commitment of one year is required to ensure we can deliver consistent, high-quality support. After the first year, services continue under the same agreement with 30 days\u2019 written notice to end. If your needs change, you can move up or down between plans \u2014 hours are set by the plan you are on, not adjusted within it.",
          },
          {
            q: "How long does onboarding take?",
            a: "Most clients are fully onboarded within 5\u20137 business days. This includes matching you with the right VA, tailoring their training to your brand, and setting up all communication and workflow channels.",
          },
        ],
      },
      {
        name: "Pricing & Billing",
        questions: [
          {
            q: "How much do your services cost?",
            a: "Our pricing depends on the package and hours you need. See the plans on our Pricing page, or contact us for a custom quote tailored to your requirements.",
          },
          {
            q: "Are there any setup fees?",
            a: "Sometimes, but never by surprise. Most clients need no setup work at all. Where a workflow does need it \u2014 migrations, integrations, custom tooling \u2014 we quote it in writing and you approve it before anything starts.",
          },
          {
            q: "What payment methods do you accept?",
            a: "We accept major credit cards, bank transfers, and can set up recurring billing for your convenience.",
          },
        ],
      },
      {
        name: "Quality & Security",
        questions: [
          {
            q: "How do you ensure quality?",
            a: "Every VA goes through a rigorous vetting process. We provide ongoing training, regular performance reviews, and a dedicated account manager to ensure consistent quality. If you\u2019re ever unsatisfied, we\u2019ll find a replacement at no extra cost.",
          },
          {
            q: "Is my data secure?",
            a: "Yes. All our VAs sign NDAs and follow strict data security protocols. We use encrypted communication channels and can comply with your organization\u2019s specific security requirements.",
          },
          {
            q: "What happens if my VA is unavailable?",
            a: "We have backup systems in place. If your VA is unavailable due to illness or time off, we\u2019ll provide a trained replacement to ensure continuity of service.",
          },
        ],
      },
    ],
    ctaTitle: "Still Have Questions?",
    ctaDesc: "Our team is ready to help. Reach out and we\u2019ll get back to you within 24 hours.",
    ctaButton: "Contact Us",
  },

  // ─── Footer ────────────────────────────────────
  footer: {
    tagline: "Professional virtual assistant services that help businesses save time, reduce costs, and scale operations.",
    servicesCol: "Services",
    companyCol: "Company",
    supportCol: "Support",
    serviceLinks: [
      "Administrative Support",
      "Executive & C-Suite Support",
      "HR & Recruiting Support",
      "Legal Administrative Support",
      "Customer Service",
      "Social Media Management",
      "Data Entry & Research",
      "Bookkeeping",
      "Web & Digital Support",
      "Real Estate VA",
      "Insurance Processing",
      "Process & Workflow Optimization",
    ],
    companyLinks: {
      about: "About Us",
      news: "News & Blog",
      contact: "Contact",
    },
    supportLinks: {
      faq: "FAQ",
      forum: "Forum",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
    copyright: "Creeda Virtual Assistants. All rights reserved.",
    followLinkedIn: "Follow us on LinkedIn",
  },

  // ─── News ──────────────────────────────────────
  news: {
    heroTitle: "News & Insights",
    heroDesc: "Tips, trends, and insights to help you get the most out of virtual assistant services.",
    postCountLabel: "published posts",
    readArticle: "Read article",
    morePosts: "More posts",
    byAuthor: "By",
    noPostsYet: "No published posts yet. Check back soon.",
    minRead: "min read",
    backToNews: "Back to News",
    postNotFound: "Post Not Found",
    postNotFoundDesc: "This post may have been removed or is no longer available.",
    ctaTitle: "Ready to Get Started?",
    ctaDesc: "Let Creeda handle the tasks that slow you down so you can focus on growing your business.",
    ctaButton: "Contact Us",
    stayConnected: "Stay Connected",
    stayConnectedDesc: "Follow us on LinkedIn for industry insights, tips, and company updates.",
    inThisArticle: "In this article",
    share: "Share",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    relatedPosts: "Related reading",
  },

  // ─── Forum ─────────────────────────────────────
  forum: {
    title: "Forum",
    subtitle: "Ask questions, share insights, discuss.",
    noThreads: "No posts yet. Be the first!",
    newPost: "New Post",
    replies: "replies",
    reply: "reply",
    comments: "comments",
    comment: "comment",
    open: "Open",
    closed: "Closed",
    by: "by",
    postedBy: "Posted by",
    ago: "ago",
    justNow: "just now",
    minutesAgo: "m ago",
    hoursAgo: "h ago",
    daysAgo: "d ago",
    backToForum: "\u2190 All Posts",
    threadNotFound: "Post Not Found",
    threadNotFoundDesc: "This post may have been removed.",
    like: "Like",
    liked: "Liked",
    addComment: "Add a comment",
    writeReply: "What are your thoughts?",
    postReply: "Reply",
    deleteConfirm: "Delete this?",
    deleted: "[deleted]",
    sortNew: "New",
    sortTop: "Top",
    sortOld: "Old",
    // Auth
    signIn: "Sign In",
    signUp: "Sign Up",
    logOut: "Log Out",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    displayName: "Display Name",
    firstName: "First Name",
    lastName: "Last Name",
    company: "Company (optional)",
    country: "Country",
    phone: "Phone (optional)",
    share: "Share",
    linkCopied: "Link copied!",
    signInToReply: "Sign in to reply",
    signInToPost: "Sign in to post",
    signInToLike: "Sign in to like",
    noAccount: "No account?",
    hasAccount: "Already have an account?",
    createAccount: "Create one",
    signInHere: "Sign in",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    authError: "Authentication failed. Please try again.",
    // New post form
    postTitle: "Title",
    postTitlePlaceholder: "What\u2019s on your mind?",
    postContent: "Body",
    postContentPlaceholder: "Share details, ask a question, or start a discussion...",
    postTags: "Tags (comma separated)",
    postTagsPlaceholder: "e.g. virtual-assistant, business, tips",
    submitPost: "Post",
    cancel: "Cancel",
    // Media
    images: "Images",
    upload: "Upload",
    noImages: "No images",
    links: "Links",
    addLink: "+ Add",
    noLinks: "No links",
    signUpSubtitle: "Create a free account to post, reply, and like.",
    autoTranslated: "Auto-translated",
    // Profile
    profile: "Profile",
    editProfile: "Edit Profile",
    bio: "Bio",
    posts: "posts",
    joined: "Joined",
    save: "Save",
  },

  // ─── Join / Book ───────────────────────────────
  join: {
    heroTitle: "Book a Free Consultation",
    heroDesc: "Choose a date and time, fill in your details, and we\u2019ll send you a calendar invite.",
    step1: "Pick a Time",
    step2: "Your Details",
    selectDateTime: "Select a Date & Time",
    timezoneNote: "All times shown in Belize Time (CST). Monday\u2013Friday, 9 AM\u20135 PM.",
    noTimesAvailable: "No times available",
    selectDatePrompt: "Select a date to see available times",
    continue: "Continue",
    retry: "Retry",
    slotsError: "Unable to load calendar availability. Please try again later.",
    yourDetails: "Your Details",
    change: "Change",
    atTime: "at",
    belizeTime: "(Belize Time)",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    service: "Service",
    notes: "Notes (optional)",
    notesPlaceholder: "Anything you\u2019d like us to know before the call?",
    back: "Back",
    bookConsultation: "Book Consultation",
    submitError: "Something went wrong. Please try again.",
    successTitle: "You\u2019re All Set!",
    successBooked: "Your consultation is booked for",
    successInvite: "You\u2019ll receive a calendar invite at",
    successShortly: "shortly.",
    backToHome: "Back to Home",
    generalConsultation: "General Consultation",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const,
    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ] as const,
  },

  // ─── Privacy Policy ─────────────────────────────
  privacy: {
    heroTitle: "Privacy Policy",
    lastUpdated: "Last updated: February 14, 2026",
    sections: [
      {
        title: "1. Information We Collect",
        paragraphs: [
          "We collect information you provide directly to us, such as when you fill out a contact form, request a consultation, or create an account. This may include:",
        ],
        list: [
          "Name, email address, and phone number",
          "Company name and job title",
          "Billing and payment information",
          "Any other information you choose to provide",
        ],
      },
      {
        title: "2. How We Use Your Information",
        paragraphs: [
          "We use the information we collect to:",
        ],
        list: [
          "Provide, maintain, and improve our services",
          "Process transactions and send related information",
          "Send promotional communications (you can opt out at any time)",
          "Respond to your comments, questions, and customer service requests",
          "Monitor and analyze trends, usage, and activities in connection with our services",
        ],
      },
      {
        title: "3. Information Sharing",
        paragraphs: [
          "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as necessary to provide our services or as required by law. We may share information with trusted service providers who assist us in operating our business, provided they agree to keep your information confidential.",
        ],
      },
      {
        title: "4. Data Security",
        paragraphs: [
          "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All virtual assistants sign non-disclosure agreements (NDAs), and we use encrypted communication channels for all client interactions.",
        ],
      },
      {
        title: "5. Cookies and Tracking",
        paragraphs: [
          "Our website may use cookies and similar tracking technologies to enhance your experience, analyze site traffic, and understand where our visitors come from. You can control cookie preferences through your browser settings.",
        ],
      },
      {
        title: "6. Your Rights",
        paragraphs: [
          "You have the right to access, correct, or delete your personal information at any time. You may also opt out of receiving marketing communications from us. To exercise any of these rights, please contact us at",
        ],
        contactEmail: "privacy@creedava.com",
      },
      {
        title: "7. Changes to This Policy",
        paragraphs: [
          "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the \"Last updated\" date. We encourage you to review this page periodically for any changes.",
        ],
      },
      {
        title: "8. Contact Us",
        paragraphs: [
          "If you have questions or concerns about this privacy policy, please contact us at",
        ],
        contactEmail: "privacy@creedava.com",
      },
    ],
  },

  // ─── Terms of Service ─────────────────────────
  terms: {
    heroTitle: "Terms of Service",
    lastUpdated: "Last updated: February 14, 2026",
    sections: [
      {
        title: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing or using CreedaVA\u2019s services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and your continued use of our services constitutes acceptance of any changes.",
        ],
      },
      {
        title: "2. Services",
        paragraphs: [
          "CreedaVA provides virtual assistant services including but not limited to administrative support, customer service, social media management, data entry, bookkeeping, real estate support, insurance processing, and enterprise solutions. The specific scope of services will be defined in your service agreement.",
        ],
      },
      {
        title: "3. Client Responsibilities",
        paragraphs: [
          "As a client, you agree to:",
        ],
        list: [
          "Provide clear instructions and necessary resources for task completion",
          "Respond to communications in a timely manner",
          "Make payments according to the agreed-upon schedule",
          "Not request our VAs to perform illegal or unethical activities",
          "Maintain the confidentiality of any login credentials shared",
        ],
      },
      {
        title: "4. Payment Terms",
        paragraphs: [
          "Payment is due according to the terms specified in your service plan. We accept major credit cards and bank transfers. Late payments may result in suspension of services. All fees are non-refundable unless otherwise stated in your service agreement.",
        ],
      },
      {
        title: "5. Confidentiality",
        paragraphs: [
          "All virtual assistants sign non-disclosure agreements (NDAs) to protect your business information. We treat all client data as confidential and will not share it with third parties without your explicit consent, except as required by law.",
        ],
      },
      {
        title: "6. Intellectual Property",
        paragraphs: [
          "All work product created by our virtual assistants on your behalf becomes your intellectual property upon payment. CreedaVA retains no rights to work created specifically for clients.",
        ],
      },
      {
        title: "7. Limitation of Liability",
        paragraphs: [
          "CreedaVA\u2019s liability is limited to the amount paid for services in the preceding 30-day period. We are not liable for any indirect, incidental, consequential, or punitive damages arising from the use of our services. We will make reasonable efforts to ensure quality and accuracy but cannot guarantee error-free service.",
        ],
      },
      {
        title: "8. Termination",
        paragraphs: [
          "Either party may terminate services with 14 days\u2019 written notice. CreedaVA reserves the right to terminate services immediately if the client violates these terms. Upon termination, any outstanding balances become immediately due, and we will return all client materials and data.",
        ],
      },
      {
        title: "9. Dispute Resolution",
        paragraphs: [
          "Any disputes arising from these terms or our services will first be addressed through good-faith negotiation. If a resolution cannot be reached, the matter will be submitted to binding arbitration in accordance with applicable laws.",
        ],
      },
      {
        title: "10. Contact",
        paragraphs: [
          "For questions about these Terms of Service, please contact us at",
        ],
        contactEmail: "legal@creedava.com",
      },
    ],
  },

  // ─── Common ────────────────────────────────────
  common: {
    contactUs: "Contact Us",
    learnMore: "Learn More",
    backToTop: "Back to top",
  },
} as const;

// Recursively widen literal string types so translated dictionaries can use
// different string values while preserving the same structure.
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends object
      ? { readonly [K in keyof T]: Widen<T[K]> }
      : T;

export default en;
export type Dictionary = Widen<typeof en>;
