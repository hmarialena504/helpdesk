import { PrismaClient, Role, TicketStatus, TicketPriority } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient();

const hashPassword = async (password: string) => bcrypt.hash(password, 12)

const DEFAULT_PASSWORD = 'Password123!'

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ───────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@helpdesk.com' },
    update: { password: await hashPassword(DEFAULT_PASSWORD) },
    create: {
      email: 'admin@helpdesk.com',
      name: 'Admin User',
      password: await hashPassword(DEFAULT_PASSWORD),
      role: Role.ADMIN,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@helpdesk.com' },
    update: { password: await hashPassword(DEFAULT_PASSWORD) },
    create: {
      email: 'agent@helpdesk.com',
      name: 'Support Agent',
      password: await hashPassword(DEFAULT_PASSWORD),
      role: Role.AGENT,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@helpdesk.com' },
    update: { password: await hashPassword(DEFAULT_PASSWORD) },
    create: {
      email: 'customer@helpdesk.com',
      name: 'Jane Customer',
      password: await hashPassword(DEFAULT_PASSWORD),
      role: Role.CUSTOMER,
    },
  });

  // ── Team ────────────────────────────────────────────────
  const team = await prisma.team.upsert({
    where: { name: 'Support Team' },
    update: {},
    create: {
      name: 'Support Team',
      description: 'First line customer support',
      members: {
        create: { userId: agent.id },
      },
    },
  });

  // ── Tags ────────────────────────────────────────────────
  const billingTag = await prisma.tag.upsert({
    where: { name: 'billing' },
    update: {},
    create: { name: 'billing', color: '#f59e0b' },
  });

  const bugTag = await prisma.tag.upsert({
    where: { name: 'bug' },
    update: {},
    create: { name: 'bug', color: '#ef4444' },
  });

  // ── Tickets ─────────────────────────────────────────────
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Cannot access my account',
      description: 'I have been locked out of my account since yesterday.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      createdById: customer.id,
      assignedToId: agent.id,
      teamId: team.id,
      comments: {
        create: {
          body: 'Hi, I am looking into this for you now.',
          authorId: agent.id,
          isInternal: false,
        },
      },
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Wrong amount charged on invoice #1042',
      description: 'I was charged £120 but my plan is £99 per month.',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.URGENT,
      createdById: customer.id,
      assignedToId: agent.id,
      teamId: team.id,
      tags: {
        create: { tagId: billingTag.id },
      },
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Export button not working in Firefox',
      description: 'Clicking the export button does nothing in Firefox 124.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      createdById: customer.id,
      tags: {
        create: { tagId: bugTag.id },
      },
    },
  });

  // Add more tickets with variety for better reporting data
  const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

  for (let i = 0; i < 20; i++) {
    const status = statuses[i % statuses.length]
    const priority = priorities[i % priorities.length]
    const daysAgo = Math.floor(Math.random() * 30)
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    const resolvedAt = status === 'RESOLVED'
      ? new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000)
      : null

    await prisma.ticket.create({
      data: {
        title: `Sample ticket ${i + 4}`,
        description: `This is sample ticket number ${i + 4} created for reporting data.`,
        status,
        priority,
        createdAt,
        resolvedAt,
        createdById: customer.id,
        assignedToId: i % 2 === 0 ? agent.id : null,
      },
    })
  }

  console.log('✅ Seed complete');
  console.log(`   Users:   ${admin.email}, ${agent.email}, ${customer.email}`);
  console.log(`   Team:    ${team.name}`);
  console.log(`   Tickets: 3 created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });