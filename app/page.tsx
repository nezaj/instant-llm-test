// app/page.tsx
"use client";
import BlogPostList from '@/components/BlogPostList';
import LandingPage from '@/components/LandingPage';
import { AuthGuard } from '@/components/auth/AuthComponents';
import { db } from '@/lib/db';

export default function Home() {
  const { isLoading, user } = db.useAuth();

  // Show landing page for non-authenticated users
  if (!isLoading && !user) {
    return <LandingPage />;
  }

  return (
    <AuthGuard>
      <BlogPostList />
    </AuthGuard>
  );
}
