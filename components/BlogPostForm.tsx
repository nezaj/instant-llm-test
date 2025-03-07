"use client";

import { db, createPost, updatePost } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect } from 'react';

interface BlogPostFormProps {
  postId?: string; // If provided, we're editing an existing post
}

export default function BlogPostForm({ postId }: BlogPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If we're editing, fetch the post data
  const { isLoading, error, data } = db.useQuery(
    postId
      ? {
        posts: {
          $: {
            where: { id: postId }
          }
        }
      }
      : null
  );

  useEffect(() => {
    if (postId && data?.posts?.[0]) {
      const post = data.posts[0];
      setTitle(post.title);
      setContent(post.content);
    }
  }, [postId, data]);

  if (postId && isLoading) {
    return <div className="flex justify-center p-8">Loading post...</div>;
  }

  if (postId && error) {
    return <div className="text-red-500 p-4">Error: {error.message}</div>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (postId) {
        await updatePost(postId, { title, content });
        router.push(`/posts/${postId}`);
      } else {
        await createPost(title, content);
        router.push('/');
      }
    } catch (err) {
      console.error('Error saving post:', err);
      alert('Failed to save post. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">
        {postId ? 'Edit Post' : 'Create New Post'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-1 font-semibold">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block mb-1 font-semibold">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded min-h-[300px]"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Post'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
