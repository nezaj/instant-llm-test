"use client";
import BlogPostForm from '@/components/BlogPostForm';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function CreatePostPage() {
  return (
    <AuthGuard>
      <BlogPostForm />
    </AuthGuard>
  );
}
