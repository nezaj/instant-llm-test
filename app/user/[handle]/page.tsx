"use client";
import { use } from 'react';
import UserBlogPage from '@/components/UserBlogPage';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function UserBlogRoute({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);

  return (
    <AuthGuard>
      <UserBlogPage handle={handle} />
    </AuthGuard>
  );
}
