# Quickstart Guide: Professional Frontend & Better Auth Integration

**Feature**: 002-frontend-better-auth
**Created**: 2026-02-05
**Prerequisites**: Feature 001 (Backend Foundation) must be running

## Overview

This guide walks you through setting up and running the Next.js 16 frontend with Better Auth authentication integrated with the FastAPI backend.

## Prerequisites

### Required Software
- **Node.js**: 18.x or later (20.x recommended)
- **npm/pnpm/bun**: Package manager of choice
- **Backend**: FastAPI backend from Feature 001 running on `http://localhost:8000`

### Environment Setup
Ensure the root `.env` file contains the shared secret:
```env
BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk
DATABASE_URL=postgresql://...  # From Feature 001
```

## Quick Start (5 minutes)

### 1. Create Next.js Application

```bash
# Navigate to repository root
cd /path/to/phase_2

# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Configuration choices**:
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ App Router (required)
- ❌ Src directory (keep flat structure)
- ✅ Import alias: `@/*`

### 2. Install Dependencies

```bash
cd frontend

# Core dependencies
npm install better-auth lucide-react

# Type definitions
npm install -D @types/node @types/react @types/react-dom
```

### 3. Configure Environment Variables

Create `frontend/.env.local`:
```env
# Better Auth Configuration
BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk
BETTER_AUTH_URL=http://localhost:3000

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database (optional, only if using Better Auth's built-in database)
DATABASE_URL=postgresql://username:password@localhost/dbname
```

**Important**:
- `BETTER_AUTH_SECRET` must match the backend's `BETTER_AUTH_SECRET`
- Use `NEXT_PUBLIC_` prefix for client-accessible variables

### 4. Start Development Server

```bash
# Terminal 1: Start backend (from root)
cd backend
uv run uvicorn main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

**Access Points**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Backend Docs: http://localhost:8000/docs

## Project Structure

```text
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages group
│   │   ├── login/
│   │   │   └── page.tsx         # Login page
│   │   └── signup/
│   │       └── page.tsx         # Signup page
│   ├── (dashboard)/              # Protected routes group
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Task dashboard
│   │   └── layout.tsx           # Dashboard layout with sidebar
│   ├── api/                      # API routes
│   │   └── auth/
│   │       └── [...all]/        # Better Auth handler
│   │           └── route.ts
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── dashboard/
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   └── CreateTaskDialog.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Card.tsx
├── lib/                          # Utilities and clients
│   ├── auth-client.ts            # Better Auth client setup
│   ├── auth-server.ts            # Better Auth server config
│   ├── api-client.ts             # Backend API client with JWT
│   └── utils.ts                  # Helper functions
├── types/                        # TypeScript type definitions
│   ├── auth.ts
│   └── task.ts
├── .env.local                    # Environment variables (gitignored)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Core Configuration Files

### Better Auth Server (`lib/auth-server.ts`)

```typescript
import { betterAuth } from "better-auth";
import Database from "better-auth/adapters/drizzle"; // or prisma/kysely

export const auth = betterAuth({
  database: Database(process.env.DATABASE_URL!),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  jwt: {
    enabled: true,
    secret: process.env.BETTER_AUTH_SECRET!,
    expiresIn: 60 * 15, // 15 minutes
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### Better Auth Client (`lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### API Client (`lib/api-client.ts`)

```typescript
import { authClient } from "./auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeader(): Promise<string> {
  const session = await authClient.getSession();
  if (!session?.accessToken) {
    throw new Error("No active session");
  }
  return `Bearer ${session.accessToken}`;
}

export const api = {
  tasks: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: {
          Authorization: await getAuthHeader(),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },

    create: async (data: { title: string; description?: string }) => {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: await getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },

    update: async (id: number, data: Partial<{ title: string; status: string }>) => {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: await getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },

    delete: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: await getAuthHeader(),
        },
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
  },
};
```

## Development Workflow

### 1. Authentication Flow Testing

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Task Operations Testing

```bash
# Get JWT token from Better Auth (login first via UI)
# Then test backend integration:

# List tasks
curl -X GET http://localhost:8000/api/tasks \
  -H "Authorization: Bearer <your-jwt-token>"

# Create task
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","status":"pending"}'
```

### 3. Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: File changes trigger automatic browser refresh
- **Backend**: FastAPI auto-reloads on file changes (with `--reload` flag)

## Common Tasks

### Adding a New Page

```bash
# Create new page
mkdir -p app/new-page
echo 'export default function NewPage() { return <div>New Page</div>; }' > app/new-page/page.tsx
```

Page automatically available at `http://localhost:3000/new-page`

### Adding a New Component

```bash
# Create component
mkdir -p components/ui
cat > components/ui/NewComponent.tsx << 'EOF'
interface NewComponentProps {
  text: string;
}

export function NewComponent({ text }: NewComponentProps) {
  return <div className="p-4">{text}</div>;
}
EOF
```

### Running Type Checks

```bash
# Type check without emitting files
npm run type-check

# Or add to package.json:
# "type-check": "tsc --noEmit"
```

## Troubleshooting

### Issue: "Module not found: Can't resolve 'better-auth'"

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: JWT token not working with backend

**Checklist**:
1. ✅ `BETTER_AUTH_SECRET` matches in both `.env` (root) and `frontend/.env.local`
2. ✅ Backend is running on expected port (8000)
3. ✅ CORS allows frontend origin (should be `*` in development)
4. ✅ JWT token includes "sub" claim with user ID

**Debug**:
```typescript
// Add to api-client.ts
console.log("JWT Token:", session?.accessToken);

// Decode JWT (development only)
const parts = session?.accessToken.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log("Token payload:", payload);
```

### Issue: "CORS policy" error

**Solution**: Verify backend CORS configuration in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Session not persisting across page refreshes

**Check**:
1. Better Auth session configuration (expiresIn, updateAge)
2. Cookie settings (HttpOnly, Secure, SameSite)
3. Browser's cookie storage (DevTools > Application > Cookies)

### Issue: Tasks not showing after creation

**Debug steps**:
1. Check browser console for API errors
2. Verify backend responds with 201 status
3. Check Network tab for proper Authorization header
4. Verify user_id in JWT matches task owner

## Next Steps

After quickstart:
1. ✅ Implement authentication pages (login/signup)
2. ✅ Create task dashboard with CRUD operations
3. ✅ Add protected route middleware
4. ✅ Implement error handling and loading states
5. ✅ Add responsive design for mobile devices

**See also**:
- [data-model.md](./data-model.md) - Type definitions
- [api-contracts.yaml](./contracts/api-contracts.yaml) - API specifications
- [research.md](./research.md) - Better Auth integration deep dive

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev)
- [Feature 001 Backend](../001-secure-backend-foundation/spec.md)
