"use client";
import { use } from 'react';
import BlogPostForm from '@/components/BlogPostForm';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <BlogPostForm postId={id} />
    </AuthGuard>
  );
}
