// app/posts/[id]/page.tsx
"use client";
import { use } from 'react';
import BlogPostView from '@/components/BlogPostView';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <PublicRoute>
      <BlogPostView postId={id} />
    </PublicRoute>
  );
}
