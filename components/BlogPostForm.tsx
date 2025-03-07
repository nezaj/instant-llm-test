"use client";

import { db, createPost, updatePost } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect } from 'react';

interface BlogPostFormProps {
  postId?: string; // If provided, we're editing an existing post
}

export default function BlogPostForm({ postId }: BlogPostFormProps) {
  const router = useRouter();
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get the user's profile for post association
  const { isLoading: profileLoading, data: profileData } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null
  );

  // If we're editing, fetch the post data
  const { isLoading: postLoading, error: postError, data: postData } = db.useQuery(
    postId
      ? {
        posts: {
          $: {
            where: { id: postId }
          },
          author: {} // Include the author to verify ownership
        }
      }
      : null
  );

  useEffect(() => {
    if (postId && postData?.posts?.[0]) {
      const post = postData.posts[0];
      setTitle(post.title);
      setContent(post.content);
      setPublished(post.published);

      // Verify post ownership
      if (user && post.author && post.author.id !== profileData?.profiles?.[0]?.id) {
        setError("You don't have permission to edit this post");
      }
    }
  }, [postId, postData, user, profileData]);

  if (authLoading || profileLoading || (postId && postLoading)) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  if (postId && postError) {
    return <div className="text-red-500 p-4">Error loading post: {postError.message}</div>;
  }

  if (!user) {
    router.push("/login");
    return <div className="flex justify-center p-8">Please sign in first. Redirecting...</div>;
  }

  // If user has no profile, they shouldn't be here yet
  if (!profileData?.profiles || profileData.profiles.length === 0) {
    router.push("/create-profile");
    return <div className="flex justify-center p-8">Please create a profile first. Redirecting...</div>;
  }

  const profileId = profileData.profiles[0].id;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('Please fill in both title and content.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (postId) {
        // We're editing an existing post
        await updatePost(postId, { title, content, published });
      } else {
        // We're creating a new post
        await createPost(profileId, title, content, published);
      }
      router.push('/');
    } catch (err: any) {
      console.error('Error saving post:', err);
      setError(err.message || 'Failed to save post. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">
        {postId ? 'Edit Post' : 'Create New Post'}
      </h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-6">
          {error}
        </div>
      )}

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
            disabled={!!error}
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
            disabled={!!error}
          />
        </div>

        <div className="flex items-center">
          <input
            id="published"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="mr-2"
            disabled={!!error}
          />
          <label htmlFor="published" className="font-medium">
            Publish post
          </label>
          <span className="ml-2 text-sm text-gray-500">
            {published ? 'This post will be visible to others' : 'This post will be saved as a draft'}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !!error}
            className={`px-4 py-2 rounded ${isSubmitting || !!error
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
