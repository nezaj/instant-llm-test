// components/BlogPostList.tsx
"use client";

import { db } from '@/lib/db';
import { useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from './auth/AuthComponents';
import SocialLinks from './SocialLinks';

export default function BlogPostList() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Get user's profile first (without pagination)
  const { isLoading: profileLoading, error: profileError, data: profileData } = db.useQuery(
    user ? {
      profiles: {
        $: {
          where: { "$user.id": user.id }
        }
      }
    } : null
  );

  // Then get posts with pagination at the top level
  const { isLoading: postsLoading, error: postsError, data: postsData } = db.useQuery(
    profileData?.profiles?.[0] ? {
      posts: {
        $: {
          where: {
            "author.id": profileData.profiles[0].id,
            // No need for a filter here - permissions will handle visibility
            // The author can see all their posts (drafts and published)
          },
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          order: {
            createdAt: 'desc' // Show newest posts first
          }
        }
      }
    } : null
  );

  if (authLoading || profileLoading || postsLoading) {
    return <div className="flex justify-center p-8">Loading posts...</div>;
  }

  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  if (profileError) {
    return <div className="text-red-500 p-4">Error loading profile: {profileError.message}</div>;
  }

  if (postsError) {
    return <div className="text-red-500 p-4">Error loading posts: {postsError.message}</div>;
  }

  if (!user) {
    return <div className="text-center p-8">Please sign in to view your posts.</div>;
  }

  // If user has no profile, they shouldn't be here yet
  if (!profileData?.profiles || profileData.profiles.length === 0) {
    return <div className="text-center p-8">Please create a profile first.</div>;
  }

  const profile = profileData.profiles[0];
  const posts = postsData?.posts || [];

  if (posts.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Blog</h1>
            <p className="text-gray-600">Welcome, @{profile.handle}</p>

            {/* Display social links */}
            {profile.socialLinks && <SocialLinks links={profile.socialLinks} className="mt-2" />}

            {/* Edit Profile Link */}
            <div className="mt-2">
              <Link href="/profile/edit" className="text-sm text-blue-500 hover:underline">
                Edit Profile
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/posts/create"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create New Post
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="p-8 text-center">
          <p className="mb-4">You don't have any blog posts yet.</p>
          <Link
            href="/posts/create"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Your First Post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Blog</h1>
          <p className="text-gray-600">Welcome, @{profile.handle}</p>

          {/* Display social links */}
          {profile.socialLinks && <SocialLinks links={profile.socialLinks} className="mt-2" />}

          {/* Edit Profile Link */}
          <div className="mt-2">
            <Link href="/profile/edit" className="text-sm text-blue-500 hover:underline">
              Edit Profile
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/posts/create"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create New Post
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="border p-4 rounded shadow">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">
                <Link href={`/posts/${post.id}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              {!post.published && (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                  Draft
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-2 line-clamp-3">
              {post.content.substring(0, 150)}
              {post.content.length > 150 ? '...' : ''}
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/posts/${post.id}`}
                className="text-blue-500 hover:underline"
              >
                Read More
              </Link>
              <Link
                href={`/posts/edit/${post.id}`}
                className="text-green-500 hover:underline"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDeletePost(post.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`px-4 py-2 rounded ${page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={posts.length < PAGE_SIZE}
          className={`px-4 py-2 rounded ${posts.length < PAGE_SIZE ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          Next
        </button>
      </div>
    </div>
  );

  async function handleDeletePost(postId: string) {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await db.transact(db.tx.posts[postId].delete());
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. Please try again.');
      }
    }
  }
}
