"use client";
import { use } from 'react';
import BlogPostView from '@/components/BlogPostView';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Note: We don't wrap this with AuthGuard because we want to allow
  // public viewing of published posts, but the component itself
  // will handle authentication for drafts
  return <BlogPostView postId={id} />;
}
