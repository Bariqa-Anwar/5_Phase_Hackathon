---
name: next-app-ui
description: Professional frontend development using Next.js 15+, Tailwind CSS, and Lucide icons.
---

# Next.js App Router UI

## Instructions
1. **Layout Hierarchy**: Use the App Router structure (`/app/layout.tsx`, `/app/page.tsx`).
2. **Glassmorphism Design**: Apply `backdrop-blur-md` and `bg-white/10` for a modern look.
3. **State Management**: Use React Server Components for data fetching and 'use client' for the Todo forms.
4. **Responsive Flex**: Use Tailwind's grid/flex system to ensure the Todo list looks great on mobile.

## Example Pattern
```tsx
// Use this pattern for the Task cards
<div className="p-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-lg hover:scale-[1.02] transition-transform">
  <h3 className="font-semibold text-white">{task.title}</h3>
</div>