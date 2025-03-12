// components/UserBlogPage.tsx
"use client";
import { db, stringToColor } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SocialLinks from '@/components/SocialLinks';

interface UserBlogPageProps {
  handle: string;
}

export default function UserBlogPage({ handle }: UserBlogPageProps) {
  const router = useRouter();
  const { isLoading: authLoading, user } = db.useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Get the profile by handle
  const { isLoading: profileLoading, error: profileError, data: profileData } = db.useQuery({
    profiles: {
      $: {
        where: { handle: handle }
      },
      avatar: {}
    }
  });

  // Get the current user's profile to check if viewing own blog
  // But only if the user is authenticated
  const { data: currentUserProfileData } = db.useQuery(
    user ? {
      profiles: {
        $: {
          where: { "$user.id": user.id }
        }
      }
    } : null
  );

  const currentUserProfile = currentUserProfileData?.profiles?.[0];
  const isOwnBlog = user && currentUserProfile?.handle === handle;

  // Get the profile's posts with pagination
  // For non-authenticated users, only show published posts
  const { isLoading: postsLoading, error: postsError, data: postsData } = db.useQuery(
    profileData?.profiles?.[0] ? {
      posts: {
        $: {
          where: {
            "author.id": profileData.profiles[0].id,
            // If it's not the owner viewing, only show published posts
            ...(isOwnBlog ? {} : { published: true })
          },
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          order: {
            createdAt: 'desc'
          }
        }
      }
    } : null
  );

  if (authLoading || profileLoading || postsLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (profileError) {
    return <div className="text-red-500 p-4">Error loading profile: {profileError.message}</div>;
  }

  if (!profileData?.profiles || profileData.profiles.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">User not found</h1>
        <Link href="/users" className="text-gray-500 hover:text-gray-800">
          Back to Discover
        </Link>
      </div>
    );
  }

  if (postsError) {
    return <div className="text-red-500 p-4">Error loading posts: {postsError.message}</div>;
  }

  const profile = profileData.profiles[0];
  const posts = postsData?.posts || [];

  async function handleDeletePost(postId: string) {
    if (!isOwnBlog) return;

    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await db.transact(db.tx.posts[postId].delete());
        // Refresh the current page
        router.refresh();
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. Please try again.');
      }
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/users" className="text-gray-500 hover:text-gray-800">
            ← Back to Discover
          </Link>
          {isOwnBlog && (
            <Link href="/" className="text-gray-500 hover:text-gray-800">
              Switch to My View
            </Link>
          )}
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center space-x-4 mb-3">
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
            <h1 className="text-3xl font-light">@{profile.handle}&apos;s Blog</h1>
            <p className="text-gray-500 mt-1">{profile.bio}</p>

            {/* Display social links */}
            {profile.socialLinks && <SocialLinks links={profile.socialLinks} className="mt-2" />}
          </div>
        </div>

        {/* Edit Profile Button (only show if it's the user's own blog) */}
        {isOwnBlog && (
          <div className="mt-4">
            <Link
              href="/profile/edit"
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Edit Profile
            </Link>
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500">
            {isOwnBlog
              ? "You don't have any published posts yet."
              : `@${profile.handle} hasn't published any posts yet.`
            }
          </p>
          {isOwnBlog && (
            <Link
              href="/posts/create"
              className="mt-4 inline-block bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm transition-colors"
            >
              Create Your First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {posts.map((post) => (
            <div key={post.id} className="border-b pb-8 last:border-b-0">
              <div className="flex justify-between">
                <h2 className="text-xl font-normal">
                  <Link href={`/posts/${post.id}`} className="hover:text-gray-500 transition-colors">
                    {post.title}
                  </Link>
                </h2>
                {!post.published && isOwnBlog && (
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
              <div className="mt-3 flex gap-4">
                <Link
                  href={`/posts/${post.id}`}
                  className="text-gray-500 hover:text-black"
                >
                  Read More
                </Link>
                {isOwnBlog && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination - only show if there are posts */}
      {posts.length > 0 && (
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
      )}
    </div>
  );
}
