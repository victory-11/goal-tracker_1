# 🎯 Goal Tracker PWA

A modern, **privacy-first** Progressive Web App for tracking goals with optional cross-device synchronization, built with Next.js 16 and deployed on Vercel.

## ✨ Features

### Core Functionality
- **📋 Goal Management** - Create, edit, delete goals with title, description, priority, due dates, categories, and notes
- **🗂️ Goal Groups** - Nested parent-child hierarchy with unlimited nesting
- **📊 Progress Tracking** - Real-time percentage completion for groups with visual progress bars
- **🔄 Cross-Device Sync** - Optional 6-character sync codes for synchronization

### 🔒 Privacy-First Design
- **Local-First Storage** - Goals are stored locally by default (localStorage)
- **Opt-In Sync** - Server sync only happens when you explicitly create/join a sync group
- **Complete Isolation** - Each sync group is completely isolated from others
- **No Account Required** - No login, no tracking, your data stays yours

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

## 🔒 Privacy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Local Storage (Zustand)                 │   │
│  │  • Goals stored here by default                      │   │
│  │  • Private to this browser                           │   │
│  │  • Persists across sessions                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           │ Only if sync group exists       │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Sync Group                          │   │
│  │  • Created explicitly by user                        │   │
│  │  • 6-character code (e.g., "ABC123")                 │   │
│  │  • Only syncs to devices with same code              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Encrypted HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEON DATABASE                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Sync Group  │  │ Sync Group  │  │ Sync Group  │  ...    │
│  │   ABC123    │  │   XYZ789    │  │   DEF456    │         │
│  │  (User A)   │  │  (User B)   │  │  (User C)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│        │                  │                  │              │
│        ▼                  ▼                  ▼              │
│  Goals for A        Goals for B        Goals for C         │
│  (isolated)         (isolated)         (isolated)          │
└─────────────────────────────────────────────────────────────┘
```

**Key Privacy Features:**
- ✅ Goals without sync group → **Never leave browser**
- ✅ API returns empty array without syncGroupId
- ✅ Goals can only be created with valid syncGroupId
- ✅ Each sync group is completely isolated
- ✅ No cross-user data leakage possible

## 🚀 Deployment Guide

### Step-by-Step Deployment

#### 1. Push to GitHub
```bash
git add .
git commit -m "Goal Tracker PWA with privacy-first sync"
git push
```

#### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Click **"Deploy"**

#### 3. Add Neon Database
1. In your Vercel project, go to **Storage** tab
2. Click **Create Database**
3. Select **Neon** (PostgreSQL)
4. The `DATABASE_URL` environment variable is automatically added

#### 4. Redeploy
1. Go to **Deployments** tab
2. Click **⋮** → **Redeploy**

## 📱 How to Use

### Local Mode (Default)
1. Open the app
2. Create goals - they're stored locally in your browser
3. See "Local Only" badge in header
4. Your goals never leave your device

### Sync Across Devices
1. Click the **"Local"** button in the header
2. Choose **"Create New Group"**
3. Get a 6-character code (e.g., `ABC123`)
4. On another device, click **"Local"** → **"Join Existing Group"**
5. Enter the code
6. Goals now sync across those devices only

### What Happens When You Create a Sync Group
- Your local goals are uploaded to the new sync group
- You get a unique sync code
- Only devices with your code can see your goals
- Other users' goals are completely separate

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard
│   └── api/
│       ├── goals/            # Goal CRUD (requires syncGroupId)
│       └── sync/             # Sync group management
├── components/goals/
│   ├── GoalCard.tsx          # Individual goal display
│   ├── GoalGroup.tsx         # Grouped goals with progress
│   ├── GoalForm.tsx          # Create/edit form
│   ├── SyncDialog.tsx        # Sync group management
│   └── Statistics.tsx        # Dashboard charts
├── hooks/
│   └── useGoals.ts           # Local-first goal management
├── store/
│   └── goals.ts              # Zustand store (localStorage)
└── lib/
    ├── db.ts                 # Prisma client
    └── sync.ts               # Sync utilities
```

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection URL (auto-added by Vercel) |

## 🐛 Troubleshooting

### "My goals disappeared after joining a sync group"
This is expected - joining a sync group replaces your local goals with the group's goals. Create a new sync group instead if you want to keep your local goals.

### "Can I have multiple sync groups?"
Currently, you can only be in one sync group at a time. Leave the current group to join/create another.

### "Are my goals visible to others?"
No! Unless you share your sync code with someone, your goals are completely private.

## 📝 License

MIT License

---

Built with ❤️ using Next.js 16, Neon PostgreSQL, and Vercel 🚀
