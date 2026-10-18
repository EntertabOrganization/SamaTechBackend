import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedUser() {
  const email = "user@samatechs.com";
  const password = "User@1234";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "SamaTechs" },
  });

  console.log(`Seeded user: ${user.email}`);
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
  await seedUser();
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
