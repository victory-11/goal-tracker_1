# 🎯 Goal Tracker PWA

A modern, production-ready **Progressive Web App** for tracking goals with cross-device synchronization, built with Next.js 16 and deployed on Vercel.

## ✨ Features

### Core Functionality
- **📋 Goal Management** - Create, edit, delete goals with title, description, priority, due dates, categories, and notes
- **🗂️ Goal Groups** - Nested parent-child hierarchy with unlimited nesting
- **📊 Progress Tracking** - Real-time percentage completion for groups with visual progress bars
- **🔄 Cross-Device Sync** - 6-character sync codes for instant synchronization across devices

### Additional Features
- **📈 Statistics Dashboard** - Completion rate charts, category breakdown, activity timeline, streak tracking
- **🎨 Priority System** - High (red), Medium (yellow), Low (green) with color coding
- **📅 Due Date Management** - Overdue warnings, upcoming deadline indicators
- **🌙 Dark/Light Theme** - System preference detection with manual toggle
- **🏷️ Categories** - Work, Health, Learning, Personal, Finance, Other (color-coded)
- **📱 PWA Features** - Installable, offline support via service worker

## 🛠️ Tech Stack

### Frontend
- **⚡ Next.js 16** - App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first styling
- **🧩 shadcn/ui** - Beautiful, accessible components
- **🐻 Zustand** - State management with persistence

### Backend & Database
- **🗄️ Neon PostgreSQL** - Serverless PostgreSQL via Vercel Storage
- **📊 Prisma ORM** - Type-safe database operations
- **🔄 API Routes** - RESTful endpoints for CRUD operations

### PWA Features
- **📱 Service Worker** - Offline functionality
- **💾 IndexedDB/LocalStorage** - Offline data persistence
- **🔄 Background Sync** - Sync when back online

## 🚀 Deployment Guide

### Prerequisites
- GitHub account
- Vercel account (free tier works)

### Step-by-Step Deployment

#### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Goal Tracker PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/goal-tracker-pwa.git
git push -u origin main
```

#### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Click **"Deploy"**
5. ⚠️ **The first deploy will show a warning** about missing database - this is expected!

#### 3. Add Neon Database
1. In your Vercel project, go to **Storage** tab
2. Click **Create Database**
3. Select **Neon** (PostgreSQL)
4. The `DATABASE_URL` environment variable is automatically added

#### 4. Redeploy
1. Go to **Deployments** tab
2. Click the **⋮** (three dots) on your latest deployment
3. Select **Redeploy**
4. ✅ Now the build will succeed with the database configured!

#### 5. Done! 🎉
Your app is now live with:
- ✅ Permanent PostgreSQL storage
- ✅ Cross-device sync
- ✅ Offline support

## 🔧 Local Development

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your Neon database URL

# Generate Prisma client
bunx prisma generate

# Push database schema
bunx prisma db push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 How Sync Works

### Creating a Sync Group
1. Click the **"Sync"** button in the header
2. Select **"Create New Group"**
3. Optionally enter a name for your group
4. Click **"Create"**
5. You'll receive a 6-character code (e.g., `ABC123`)

### Joining a Sync Group
1. Click the **"Sync"** button on another device
2. Select **"Join Existing Group"**
3. Enter the 6-character code
4. Click **"Join"**

All goals are now synchronized across devices in real-time!

### Offline Mode
- Goals created offline are stored locally
- When back online, changes automatically sync to the server
- "Pending Sync" badge shows when you have unsynced changes

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── layout.tsx            # PWA metadata
│   └── api/
│       ├── goals/            # Goal CRUD endpoints
│       └── sync/             # Sync group endpoints
├── components/
│   ├── goals/
│   │   ├── GoalCard.tsx      # Individual goal display
│   │   ├── GoalGroup.tsx     # Grouped goals with progress
│   │   ├── GoalForm.tsx      # Create/edit form
│   │   ├── SyncDialog.tsx    # Sync group management
│   │   └── Statistics.tsx    # Dashboard charts
│   └── ui/                   # shadcn/ui components
├── hooks/
│   ├── useGoals.ts           # Goal management hook
│   └── useOffline.ts         # Offline detection
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── sync.ts               # Sync utilities
│   └── utils.ts              # Helper functions
├── store/
│   └── goals.ts              # Zustand store with persistence
└── types/
    └── goal.ts               # TypeScript types
prisma/
└── schema.prisma             # Database schema
public/
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker
└── icons/                    # PWA icons
```

## 🎨 Database Schema

```prisma
model SyncGroup {
  id        String   @id @default(uuid())
  code      String   @unique  // 6-character sync code
  name      String?
  goals     Goal[]
}

model Goal {
  id          String   @id @default(uuid())
  title       String
  description String?
  priority    Priority @default(MEDIUM)
  status      Status   @default(PENDING)
  category    Category @default(PERSONAL)
  dueDate     DateTime?
  notes       String?
  parentId    String?
  parent      Goal?    @relation("SubGoals", ...)
  subGoals    Goal[]   @relation("SubGoals")
  syncGroupId String?
  syncGroup   SyncGroup? @relation(...)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  syncedAt    DateTime?
}
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection URL (with sslmode=require) | Yes |

This is automatically added when you create a Neon database in Vercel Storage.

## 🚫 What to Avoid (Won't Work on Vercel)

- ❌ SQLite - Data resets on each deployment
- ❌ In-memory storage - Resets on restart
- ❌ Turso/libSQL - Adapter issues
- ❌ Railway - Build errors with this stack

## 🐛 Troubleshooting

### Build fails with "Database not configured"
This is expected on the first deploy. Add the Neon database in Vercel Storage and redeploy.

### Goals not syncing
1. Check that you're online (green "Online" badge)
2. Click the "Sync" button to manually refresh
3. Verify both devices are using the same sync code

### Offline changes not syncing
1. Check for "Pending Sync" badge
2. Ensure you're back online
3. Click "Sync" button to force sync

## 📝 License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ using Next.js 16, Neon PostgreSQL, and Vercel 🚀
