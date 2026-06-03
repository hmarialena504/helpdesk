# Helpdesk — Support Ticket Management System

A full-stack helpdesk application built with Next.js, Express, PostgreSQL, and Socket.IO. Built as an industry-level portfolio project demonstrating modern web development practices.

![Helpdesk Dashboard](https://via.placeholder.com/800x400?text=Helpdesk+Dashboard)

## Features

- **Ticket Management** — Create, assign, update, and resolve support tickets with priority levels and status tracking
- **Real-time Updates** — Live ticket status changes and comments via WebSockets (Socket.IO)
- **Role-based Access Control** — Admin, Agent, and Customer roles with different permissions
- **User Management** — Admin panel for managing users, roles, and account status
- **Email Notifications** — Automated emails for ticket creation, assignment, resolution, and new comments
- **File Attachments** — Upload images and documents to tickets with S3-compatible storage
- **Reporting Dashboard** — Charts and metrics showing ticket volume, status distribution, and agent performance
- **Settings** — Profile management and password change for all users

## Tech Stack

### Frontend
- **Next.js 16** with App Router and TypeScript
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time updates
- **Recharts** for data visualisation
- **Axios** for API communication

### Backend
- **Express.js** with TypeScript
- **Socket.IO** for WebSocket server
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **Nodemailer** for email notifications
- **AWS SDK / MinIO** for file storage
- **Multer** for file upload handling
- **Bcrypt** for password hashing

### Infrastructure
- **Docker + Docker Compose** for local development
- **PostgreSQL 16** database
- **MinIO** for local S3-compatible storage

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com)
- [Node.js 20+](https://nodejs.org) (for running Prisma CLI locally)

### Local Development Setup

**1. Clone the repository**

```bash
git clone https://github.com/your-username/helpdesk.git
cd helpdesk
```

**2. Create your environment file**

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. For local development the defaults work out of the box.

**3. Start the stack**

```bash
docker compose up --build
```

This starts four services:
- PostgreSQL on port 5432
- Express API on port 4000
- Next.js frontend on port 3000
- MinIO storage on ports 9000 and 9001

**4. Run the database migration and seed**

In a new terminal:

```bash
docker compose exec backend npx prisma migrate dev
docker compose exec backend npx prisma db seed
```

**5. Open the app**

Go to [http://localhost:3000](http://localhost:3000) and log in with one of the seeded accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@helpdesk.com | Password123! | Admin |
| agent@helpdesk.com | Password123! | Agent |
| customer@helpdesk.com | Password123! | Customer |

**MinIO Console** (file storage UI) is available at [http://localhost:9001](http://localhost:9001)
- Username: `minioadmin`
- Password: `minioadmin123`

### Useful Commands

```bash
# Start all services in the background
docker compose up -d

# View logs for a specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Reset everything including the database
docker compose down -v

# Run a Prisma migration after schema changes
docker compose exec backend npx prisma migrate dev --name your-migration-name

# Open Prisma Studio (database browser)
cd backend && npx prisma@6 studio
```

## Project Structure

```
helpdesk/
├── frontend/                    # Next.js application
│   ├── app/                     # App Router pages
│   │   ├── (authenticated)/     # Protected pages (dashboard, tickets, etc.)
│   │   ├── login/               # Login page
│   │   └── register/            # Register page
│   ├── components/
│   │   ├── layout/              # Navbar, Sidebar, AppShell
│   │   └── ui/                  # Reusable components (badges, attachments)
│   └── lib/                     # API clients and service functions
│
├── backend/                     # Express API
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Migration history
│   │   └── seed.ts              # Seed data
│   └── src/
│       ├── controllers/         # Route handlers
│       ├── middleware/          # Auth, error handling
│       ├── routes/              # Route definitions
│       └── lib/                 # Prisma, JWT, email, storage utilities
│
├── docker-compose.yml           # Local development orchestration
├── .env.example                 # Environment variable template
└── README.md
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`) |
| `SMTP_HOST` | SMTP server for emails (leave empty for Ethereal in dev) |
| `S3_ENDPOINT` | S3-compatible storage endpoint |
| `S3_BUCKET` | Storage bucket name |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List tickets (paginated, filterable) |
| POST | `/api/tickets` | Create a ticket |
| GET | `/api/tickets/:id` | Get ticket details |
| PATCH | `/api/tickets/:id` | Update a ticket |
| DELETE | `/api/tickets/:id` | Delete a ticket (admin only) |
| POST | `/api/tickets/:id/comments` | Add a comment |
| GET | `/api/tickets/:id/attachments` | List attachments |
| POST | `/api/tickets/:id/attachments` | Upload an attachment |
| DELETE | `/api/tickets/:id/attachments/:attachmentId` | Delete an attachment |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user details |
| PATCH | `/api/users/:id/role` | Update user role |
| PATCH | `/api/users/:id/deactivate` | Deactivate a user |
| PATCH | `/api/users/:id/reactivate` | Reactivate a user |

### Reports (Admin and Agent)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/overview` | Key metrics |
| GET | `/api/reports/by-status` | Tickets grouped by status |
| GET | `/api/reports/by-priority` | Tickets grouped by priority |
| GET | `/api/reports/volume` | Daily ticket volume (30 days) |
| GET | `/api/reports/by-agent` | Tickets per agent |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/profile` | Get own profile |
| PATCH | `/api/settings/profile` | Update name and email |
| PATCH | `/api/settings/password` | Change password |
| GET | `/api/settings/notifications` | Get notification preferences |

## WebSocket Events

The app uses Socket.IO for real-time updates on port 4000.

| Event (client → server) | Description |
|--------------------------|-------------|
| `join-ticket` | Join a ticket room to receive live updates |
| `leave-ticket` | Leave a ticket room |
| `join-tickets-list` | Join the list room for new ticket notifications |
| `leave-tickets-list` | Leave the list room |

| Event (server → client) | Description |
|--------------------------|-------------|
| `ticket-updated` | A ticket's fields were changed |
| `comment-added` | A new comment was posted |
| `ticket-created` | A new ticket was created |
| `viewer-count` | Number of users viewing a ticket changed |

