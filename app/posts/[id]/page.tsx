"use client";

import { use } from 'react';

import BlogPostView from '@/components/BlogPostView';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BlogPostView postId={id} />;
}
