"use client";
import BlogPostList from '@/components/BlogPostList';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function Home() {
  return (
    <AuthGuard>
      <BlogPostList />
    </AuthGuard>
  );
}
