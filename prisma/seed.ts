import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = "admin@aramway.com";
  const password = "Admin@1234";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "aramway" },
  });

  console.log(`Seeded admin: ${admin.email}`);
}

async function seedSubscribers() {
  const subscribers = [
    {
      email: "sarah.johnson@northbridge.co",
      name: "Sarah Johnson",
      status: "ACTIVE" as const,
      subscribedAt: new Date("2025-11-02T09:15:00.000Z"),
    },
    {
      email: "michael.chen@vertexcapital.io",
      name: "Michael Chen",
      status: "ACTIVE" as const,
      subscribedAt: new Date("2025-12-14T14:32:00.000Z"),
    },
    {
      email: "priya.nair@statecraftgroup.com",
      name: "Priya Nair",
      status: "ACTIVE" as const,
      subscribedAt: new Date("2026-01-05T08:02:00.000Z"),
    },
    {
      email: "d.okafor@horizonpartners.biz",
      name: "David Okafor",
      status: "UNSUBSCRIBED" as const,
      subscribedAt: new Date("2025-08-19T11:45:00.000Z"),
      unsubscribedAt: new Date("2026-02-01T10:00:00.000Z"),
    },
    {
      email: "elena.marquez@marquezlegal.com",
      name: "Elena Marquez",
      status: "ACTIVE" as const,
      subscribedAt: new Date("2026-02-20T16:10:00.000Z"),
    },
    {
      email: "tom.reilly@reillyandco.ie",
      status: "ACTIVE" as const,
      subscribedAt: new Date("2026-03-01T07:55:00.000Z"),
    },
    {
      email: "amina.hassan@sahelventures.africa",
      name: "Amina Hassan",
      status: "UNSUBSCRIBED" as const,
      subscribedAt: new Date("2025-06-10T12:00:00.000Z"),
      unsubscribedAt: new Date("2025-12-30T09:20:00.000Z"),
    },
  ];

  for (const subscriber of subscribers) {
    await prisma.subscriber.upsert({
      where: { email: subscriber.email },
      update: {},
      create: subscriber,
    });
  }
  console.log(`Seeded ${subscribers.length} subscribers`);
}

async function seedBlogs() {
  const categories = [
    {
      name: "Business Strategy",
      slug: "business-strategy",
      description: "Insights on growth, positioning, and long-term strategic planning.",
    },
    {
      name: "Company News",
      slug: "company-news",
      description: "Announcements and updates from Aramway.",
    },
    {
      name: "Market Insights",
      slug: "market-insights",
      description: "Analysis of market trends across the regions we operate in.",
    },
  ];

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const created = await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categoryIds[category.slug] = created.id;
  }
  console.log(`Seeded ${categories.length} blog categories`);

  const blogs = [
    {
      title: "Five Pillars of a Resilient Growth Strategy",
      slug: "five-pillars-resilient-growth-strategy",
      excerpt: "How consultancies help mid-market firms build strategies that survive downturns.",
      content:
        "A resilient growth strategy rests on diversified revenue, disciplined cash management, adaptable operating models, strong governance, and a culture that treats change as routine rather than exceptional. In this article we break down each pillar with examples drawn from our client engagements over the last two years.",
      coverImage: "/mock/blog-growth-strategy.jpg",
      type: "BLOG" as const,
      status: "PUBLISHED" as const,
      tags: ["strategy", "growth", "resilience"],
      categorySlug: "business-strategy",
      authorName: "Layla Haddad",
      publishedAt: new Date("2026-01-10T08:00:00.000Z"),
    },
    {
      title: "Aramway Opens New Advisory Desk in Nairobi",
      slug: "aramway-opens-advisory-desk-nairobi",
      excerpt: "Expanding our East Africa presence to serve a fast-growing client base.",
      content:
        "We are pleased to announce the opening of a new advisory desk in Nairobi, staffed by a team of six consultants specializing in market entry and regulatory strategy. This expansion follows eighteen months of steady growth in engagements across East Africa.",
      coverImage: "/mock/news-nairobi-office.jpg",
      type: "NEWS" as const,
      status: "PUBLISHED" as const,
      tags: ["expansion", "east-africa", "announcement"],
      categorySlug: "company-news",
      authorName: "Aramway Editorial Team",
      publishedAt: new Date("2026-02-03T09:30:00.000Z"),
    },
    {
      title: "What Rising Interest Rates Mean for Mid-Market M&A",
      slug: "rising-interest-rates-mid-market-ma",
      excerpt: "A look at how financing conditions are reshaping deal structures in 2026.",
      content:
        "Deal volume in the mid-market has cooled but not stalled. Buyers are leaning more heavily on earn-outs and seller financing to bridge valuation gaps created by higher borrowing costs. We surveyed twenty of our active mandates to understand the shift.",
      type: "NEWS" as const,
      status: "PUBLISHED" as const,
      tags: ["m&a", "finance", "market-trends"],
      categorySlug: "market-insights",
      authorName: "Marcus Webb",
      publishedAt: new Date("2026-02-18T07:00:00.000Z"),
    },
    {
      title: "Building a Governance Framework That Actually Gets Used",
      slug: "governance-framework-that-gets-used",
      excerpt: "Why most governance documents gather dust, and how to design ones that don't.",
      content:
        "Draft governance frameworks fail not because they are poorly written but because they are poorly adopted. This piece walks through a lightweight rollout process we use with clients: short workshops, a single-page decision log, and a 90-day review cadence.",
      type: "BLOG" as const,
      status: "DRAFT" as const,
      tags: ["governance", "operations"],
      categorySlug: "business-strategy",
      authorName: "Layla Haddad",
    },
    {
      title: "Talent Retention Playbook for Family-Owned Businesses",
      slug: "talent-retention-playbook-family-owned-businesses",
      excerpt: "Practical steps for keeping key non-family talent engaged through succession.",
      content:
        "Family-owned businesses face a distinct retention challenge during leadership transitions. We outline compensation structures, mentorship pairing, and communication practices that reduce key-employee attrition during succession windows.",
      type: "BLOG" as const,
      status: "DRAFT" as const,
      tags: ["talent", "succession", "family-business"],
      categorySlug: "business-strategy",
    },
    {
      title: "Aramway Named to Regional Top Consultancies List",
      slug: "aramway-named-regional-top-consultancies-list",
      excerpt: "Recognition for our client work across strategy and operations mandates.",
      content:
        "We're honored to be included in this year's regional ranking of top advisory firms, a recognition we credit entirely to the trust our clients place in our teams. Read the full announcement and methodology notes.",
      type: "NEWS" as const,
      status: "PUBLISHED" as const,
      tags: ["award", "announcement"],
      categorySlug: "company-news",
      authorName: "Aramway Editorial Team",
      publishedAt: new Date("2026-03-08T10:00:00.000Z"),
    },
  ];

  for (const { categorySlug, ...blog } of blogs) {
    await prisma.blog.upsert({
      where: { slug: blog.slug },
      update: {},
      create: { ...blog, categoryId: categoryIds[categorySlug] },
    });
  }
  console.log(`Seeded ${blogs.length} blogs`);
}

async function seedCareerApplications() {
  const applications = [
    {
      firstName: "Grace",
      lastName: "Kimani",
      email: "grace.kimani@example.com",
      phone: "+254-711-223344",
      address: "14 Riverside Drive",
      city: "Nairobi",
      country: "Kenya",
      expectedSalary: "USD 4,500 / month",
      position: "Senior Strategy Consultant",
      startDate: new Date("2026-05-01"),
      resumeUrl: "uploads/seed-grace-kimani-resume.pdf",
      coverLetterUrl: "uploads/seed-grace-kimani-cover-letter.pdf",
      status: "PENDING" as const,
    },
    {
      firstName: "Omar",
      lastName: "Farouk",
      email: "omar.farouk@example.com",
      phone: "+20-100-555-1122",
      address: "22 Tahrir Square",
      city: "Cairo",
      country: "Egypt",
      expectedSalary: "USD 3,200 / month",
      position: "Financial Analyst",
      startDate: new Date("2026-04-15"),
      resumeUrl: "uploads/seed-omar-farouk-resume.pdf",
      coverLetterUrl: "uploads/seed-omar-farouk-cover-letter.pdf",
      status: "REVIEWED" as const,
    },
    {
      firstName: "Isabelle",
      lastName: "Laurent",
      email: "isabelle.laurent@example.com",
      phone: "+33-6-12-34-56-78",
      address: "8 Rue de Rivoli",
      city: "Paris",
      country: "France",
      expectedSalary: "EUR 5,000 / month",
      position: "Marketing Manager",
      startDate: new Date("2026-06-01"),
      resumeUrl: "uploads/seed-isabelle-laurent-resume.pdf",
      coverLetterUrl: "uploads/seed-isabelle-laurent-cover-letter.pdf",
      status: "HIRED" as const,
    },
    {
      firstName: "Ravi",
      lastName: "Shankar",
      email: "ravi.shankar@example.com",
      phone: "+91-98765-43210",
      address: "45 MG Road",
      city: "Bengaluru",
      country: "India",
      expectedSalary: "USD 2,800 / month",
      position: "Junior Business Analyst",
      startDate: new Date("2026-05-20"),
      resumeUrl: "uploads/seed-ravi-shankar-resume.pdf",
      coverLetterUrl: "uploads/seed-ravi-shankar-cover-letter.pdf",
      status: "REJECTED" as const,
    },
    {
      firstName: "Chloe",
      lastName: "Bennett",
      email: "chloe.bennett@example.com",
      phone: "+44-7700-900123",
      address: "10 Baker Street",
      city: "London",
      country: "United Kingdom",
      expectedSalary: "GBP 4,200 / month",
      position: "HR Business Partner",
      startDate: new Date("2026-04-28"),
      resumeUrl: "uploads/seed-chloe-bennett-resume.pdf",
      coverLetterUrl: "uploads/seed-chloe-bennett-cover-letter.pdf",
      status: "PENDING" as const,
    },
  ];

  let created = 0;
  for (const application of applications) {
    const existing = await prisma.careerApplication.findFirst({ where: { email: application.email } });
    if (!existing) {
      await prisma.careerApplication.create({ data: application });
      created += 1;
    }
  }
  console.log(`Seeded ${created} new career applications (${applications.length} total expected)`);
}

async function seedContactMessages() {
  const messages = [
    {
      name: "Henry Osei",
      email: "henry.osei@example.com",
      phone: "+233-24-555-0101",
      service: "Business Strategy Advisory",
      message:
        "We're a manufacturing SME in Accra looking for help defining a 3-year growth plan. Could someone reach out to schedule an intro call?",
      status: "NEW" as const,
    },
    {
      name: "Yuki Tanaka",
      email: "yuki.tanaka@example.com",
      phone: "+81-90-1234-5678",
      service: "Market Entry Consulting",
      message:
        "Interested in your market entry services for expanding our retail brand into Southeast Asia. What's the typical engagement timeline?",
      status: "READ" as const,
    },
    {
      name: "Carla Mendez",
      email: "carla.mendez@example.com",
      program: "Executive Leadership Program",
      message:
        "Can you send more details about enrollment dates and pricing for the next cohort of the Executive Leadership Program?",
      status: "RESPONDED" as const,
    },
    {
      name: "Nadia Petrova",
      email: "nadia.petrova@example.com",
      phone: "+7-916-555-0199",
      service: "Financial Restructuring",
      message:
        "Our board is evaluating restructuring options and we'd like a confidential consultation. Please advise on next steps.",
      status: "NEW" as const,
    },
  ];

  let created = 0;
  for (const message of messages) {
    const existing = await prisma.contactMessage.findFirst({ where: { email: message.email } });
    if (!existing) {
      await prisma.contactMessage.create({ data: message });
      created += 1;
    }
  }
  console.log(`Seeded ${created} new contact messages (${messages.length} total expected)`);
}

async function seedConsultations() {
  const consultations = [
    {
      name: "Robert Kim",
      company: "Kim Textiles Ltd.",
      email: "robert.kim@kimtextiles.com",
      phone: "+82-10-2222-3333",
      service: "Operations Optimization",
      notes: "Wants to discuss reducing lead times across two factories.",
      date: new Date("2026-03-15"),
      time: "10:00",
      status: "CONFIRMED" as const,
    },
    {
      name: "Fatima Zahra",
      company: "Zahra Holdings",
      email: "fatima.zahra@zahraholdings.ma",
      phone: "+212-661-234567",
      service: "Business Strategy Advisory",
      notes: "Follow-up session after initial strategy workshop.",
      date: new Date("2026-03-20"),
      time: "14:30",
      status: "PENDING" as const,
    },
    {
      name: "James O'Sullivan",
      email: "james.osullivan@example.com",
      phone: "+353-87-123-4567",
      service: "Market Entry Consulting",
      date: new Date("2026-02-28"),
      time: "09:00",
      status: "COMPLETED" as const,
    },
    {
      name: "Ana Beatriz Costa",
      company: "Costa & Partners",
      email: "ana.costa@costapartners.com.br",
      phone: "+55-11-98888-7777",
      service: "Financial Restructuring",
      notes: "Requested a reschedule; original slot conflicted with board meeting.",
      date: new Date("2026-03-10"),
      time: "16:00",
      status: "CANCELLED" as const,
    },
  ];

  let created = 0;
  for (const consultation of consultations) {
    const existing = await prisma.consultation.findFirst({ where: { email: consultation.email } });
    if (!existing) {
      await prisma.consultation.create({ data: consultation });
      created += 1;
    }
  }
  console.log(`Seeded ${created} new consultations (${consultations.length} total expected)`);
}

async function main() {
  await seedAdmin();
  await seedSubscribers();
  await seedBlogs();
  await seedCareerApplications();
  await seedContactMessages();
  await seedConsultations();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
