// components/BlogPostList.tsx
"use client";

import { db, stringToColor } from '@/lib/db';
import { useState } from 'react';
import Link from 'next/link';
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
        },
        avatar: {}
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

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await db.transact(db.tx.posts[postId].delete());
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  if (posts.length === 0) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-4">
            {profile.avatar ? (
              <img
                src={profile.avatar.url}
                alt={`${profile.handle}'s avatar`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: stringToColor(profile.handle) }}
              >
                {profile.handle.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-light">My Blog</h1>
              <p className="text-gray-500">Welcome, @{profile.handle}</p>

              {/* Display social links */}
              {profile.socialLinks && <SocialLinks links={profile.socialLinks} className="mt-2" />}

              {/* Edit Profile Link */}
              <div className="mt-2">
                <Link href="/profile/edit" className="text-sm text-gray-500 hover:text-gray-800">
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/posts/create"
              className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm transition-colors"
            >
              Create New Post
            </Link>
          </div>
        </div>

        <div className="p-8 text-center">
          <p className="mb-6 text-gray-500">You don't have any blog posts yet.</p>
          <Link
            href="/posts/create"
            className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm transition-colors"
          >
            Create Your First Post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center space-x-4">
          {profile.avatar ? (
            <img
              src={profile.avatar.url}
              alt={`${profile.handle}'s avatar`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: stringToColor(profile.handle) }}
            >
              {profile.handle.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-light">My Blog</h1>
            <p className="text-gray-500">Welcome, @{profile.handle}</p>

            {/* Display social links */}
            {profile.socialLinks && <SocialLinks links={profile.socialLinks} className="mt-2" />}

            {/* Edit Profile Link */}
            <div className="mt-2">
              <Link href="/profile/edit" className="text-sm text-gray-500 hover:text-gray-800">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/posts/create"
            className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm transition-colors"
          >
            Create New Post
          </Link>
        </div>
      </div>

      <div className="space-y-10">
        {posts.map((post) => (
          <div key={post.id} className="space-y-2 pb-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-normal">
                <Link href={`/posts/${post.id}`} className="hover:text-gray-500 transition-colors">
                  {post.title}
                </Link>
              </h2>
              {!post.published && (
                <span className="text-gray-400 text-xs">
                  Draft
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-2 text-gray-600">
              {post.content.substring(0, 150)}
              {post.content.length > 150 ? '...' : ''}
            </p>
            <div className="mt-6 flex gap-4">
              <Link
                href={`/posts/${post.id}`}
                className="text-gray-500 hover:text-black"
              >
                Read More
              </Link>
              <Link
                href={`/posts/edit/${post.id}`}
                className="text-gray-500 hover:text-black"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDeletePost(post.id)}
                className="text-gray-500 hover:text-black"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-12 text-sm">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`px-4 py-2 ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-black'}`}
        >
          Previous
        </button>
        <span className="text-gray-500">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={posts.length < PAGE_SIZE}
          className={`px-4 py-2 ${posts.length < PAGE_SIZE ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-black'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
