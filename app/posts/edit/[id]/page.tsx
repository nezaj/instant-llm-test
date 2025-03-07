"use client";

import { use } from 'react';
import BlogPostForm from '@/components/BlogPostForm';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BlogPostForm postId={id} />;
}
