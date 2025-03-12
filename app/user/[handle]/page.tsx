// app/user/[handle]/page.tsx
"use client";
import { use } from 'react';
import UserBlogPage from '@/components/UserBlogPage';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function UserBlogRoute({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);

  return (
    <PublicRoute>
      <UserBlogPage handle={handle} />
    </PublicRoute>
  );
}
