# Minimalist Blog Interface Redesign

**human** (Mar 12, 2025, 01:03 PM)

All the functionality looks good but now I just want to update the styles of my components. Mainly there are two many additional borders and colors. I want a very clean and minimalist blog interface. It should feel simple, clean, and zen

**assistant** (Mar 12, 2025, 01:05 PM)

 I'll help you create a more minimalist, clean, and zen-like design for your blog interface. Let's update the styles while keeping the functionality intact. I'll focus on reducing borders, simplifying colors, and creating a more elegant design.

Let's start by updating the main components that need styling changes:

First, let's update the `BlogPostList.tsx` component to make it more minimalist:

```typescript
// components/BlogPostList.tsx
"use client";

import { db, stringToColor } from '@/lib/db';
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
            <SignOutButton />
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
          <SignOutButton />
        </div>
      </div>

      <div className="space-y-10">
        {posts.map((post) => (
          <div key={post.id} className="border-b pb-8 last:border-b-0">
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
            <div className="mt-3 flex gap-4">
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
```

Now, let's update the `BlogPostView.tsx` component:

```typescript
// components/BlogPostView.tsx
"use client";

import { db } from '@/lib/db';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignOutButton } from './auth/AuthComponents';

interface BlogPostViewProps {
  postId: string;
}

export default function BlogPostView({ postId }: BlogPostViewProps) {
  const router = useRouter();
  const { isLoading: authLoading, user, error: authError } = db.useAuth();

  // Get user's profile to check ownership
  const { isLoading: profileLoading, data: profileData } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null
  );

  // Get the post with its author
  const { isLoading, error, data } = db.useQuery({
    posts: {
      $: {
        where: { id: postId }
      },
      author: {} // Include the author relationship
    }
  });

  // Determine if loading is complete and we have post data
  const hasPostData = !isLoading && data?.posts?.[0];
  const postAuthorId = hasPostData ? data.posts[0].author?.id : null;

  // Get the author's other posts for navigation (using the post's author, not the current user)
  // Only include published posts if the viewer is not the author
  const { data: postsData, isLoading: postsLoading } = db.useQuery(
    hasPostData && postAuthorId ? {
      posts: {
        $: {
          where: {
            "author.id": postAuthorId,
            // If we're not the author, only show published posts for navigation
            ...(profileData?.profiles?.[0]?.id !== postAuthorId ? { published: true } : {})
          },
          order: { createdAt: 'desc' }
        }
      }
    } : null
  );

  if (authLoading || profileLoading || isLoading || postsLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  if (error) {
    // Could be a permission error (trying to view someone else's draft)
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">Post not available</h1>
        <p className="mb-4 text-gray-500">This post may be a draft or has been removed.</p>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Return to Home
        </Link>
      </div>
    );
  }

  // If the post doesn't exist
  if (!data.posts || data.posts.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">Post not found</h1>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Return to Home
        </Link>
      </div>
    );
  }

  const post = data.posts[0];
  const authorProfile = post.author;

  // Check if the current user is the author of this post
  const isOwner = authorProfile && profileData?.profiles?.[0]?.id === authorProfile.id;

  // Get the author's posts for navigation
  const authorPosts = postsData?.posts || [];

  // Find current post index in the author's posts
  const currentIndex = authorPosts.findIndex(p => p.id === postId);

  // Determine next and previous post
  const nextPost = currentIndex > 0 ? authorPosts[currentIndex - 1] : null;
  const prevPost = currentIndex < authorPosts.length - 1 ? authorPosts[currentIndex + 1] : null;

  const handleDeletePost = async () => {
    if (!isOwner) {
      alert("You don't have permission to delete this post");
      return;
    }

    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await db.transact(db.tx.posts[postId].delete());
        router.push('/');
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-10">
        {isOwner ? (
          <Link href="/" className="text-gray-500 hover:text-gray-800">
            ← Back to My Posts
          </Link>
        ) : (
          <Link href={`/user/${authorProfile?.handle}`} className="text-gray-500 hover:text-gray-800">
            ← Back to @{authorProfile?.handle}'s Posts
          </Link>
        )}
        {user && <SignOutButton />}
      </div>

      <article className="prose max-w-none">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light mb-0">{post.title}</h1>
            {!post.published && (
              <span className="text-gray-400 text-xs">
                Draft
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-2">
            Published by {authorProfile?.handle || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString()}
            {post.updatedAt !== post.createdAt &&
              ` · Updated on ${new Date(post.updatedAt).toLocaleDateString()}`}
          </p>
        </header>

        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>

        {isOwner && (
          <div className="flex gap-3 mt-12 pt-6 border-t border-gray-100">
            <Link
              href={`/posts/edit/${postId}`}
              className="text-gray-500 hover:text-gray-900"
            >
              Edit Post
            </Link>
            <button
              onClick={handleDeletePost}
              className="text-gray-500 hover:text-gray-900"
            >
              Delete Post
            </button>
          </div>
        )}
      </article>

      {/* Post Navigation - show navigation for all author's posts that the current user can see */}
      {authorPosts.length > 1 && (
        <div className="border-t border-gray-100 pt-6 mt-12">
          <div className="flex justify-between text-sm">
            <div>
              {nextPost && (
                <Link href={`/posts/${nextPost.id}`} className="text-gray-500 hover:text-gray-800">
                  ← {nextPost.title}
                </Link>
              )}
            </div>
            <div>
              {prevPost && (
                <Link href={`/posts/${prevPost.id}`} className="text-gray-500 hover:text-gray-800">
                  {prevPost.title} →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

Now, let's update the `UserBlogPage.tsx` component:

```typescript
// components/UserBlogPage.tsx
"use client";
import { db, stringToColor } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOutButton } from '@/components/auth/AuthComponents';
import SocialLinks from '@/components/SocialLinks';

interface UserBlogPageProps {
  handle: string;
}

export default function UserBlogPage({ handle }: UserBlogPageProps) {
  const router = useRouter();
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
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
  const isOwnBlog = currentUserProfile?.handle === handle;

  // Get the profile's posts with pagination
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

  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  if (profileError) {
    return <div className="text-red-500 p-4">Error loading profile: {profileError.message}</div>;
  }

  if (!profileData?.profiles || profileData.profiles.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">User not found</h1>
        <Link href="/users" className="text-gray-500 hover:text-gray-800">
          Back to Users
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
            ← Back to Users
          </Link>
          {isOwnBlog && (
            <Link href="/" className="text-gray-500 hover:text-gray-800">
              Switch to My View
            </Link>
          )}
        </div>
        {user && <SignOutButton />}
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
            <h1 className="text-3xl font-light">@{profile.handle}'s Blog</h1>
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
```

Let's also update the `UsersPage.tsx` component:

```typescript
// components/UsersPage.tsx
"use client";
import { db, stringToColor } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from '@/components/auth/AuthComponents';
import SocialLinks from './SocialLinks';

export default function UsersPage() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Get current user's profile to identify their own blog
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

  // Query all profiles with pagination and include avatars
  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        order: {
          createdAt: 'desc'
        }
      },
      avatar: {}
    }
  });

  if (authLoading || isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading users: {error.message}</div>;
  }

  const profiles = data?.profiles || [];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-light">Discover Blogs</h1>
          <p className="text-gray-500">Find and follow other bloggers</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-800">
            My Blog
          </Link>
          {user && <SignOutButton />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profiles.map((profile) => {
          const isCurrentUser = currentUserProfile?.id === profile.id;

          return (
            <div
              key={profile.id}
              className="group"
            >
              <div className="flex items-center space-x-3 mb-3">
                {profile.avatar ? (
                  <img
                    src={profile.avatar.url}
                    alt={`${profile.handle}'s avatar`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{
                      backgroundColor: stringToColor(profile.handle),
                    }}
                  >
                    {profile.handle.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center">
                    <h2 className="text-lg font-normal">@{profile.handle}</h2>
                    {isCurrentUser && (
                      <span className="ml-2 text-gray-400 text-xs">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="mb-4 text-gray-600 line-clamp-3">
                {profile.bio}
              </p>

              {/* Display social links */}
              {profile.socialLinks && (
                <div className="mb-4">
                  <SocialLinks links={profile.socialLinks} />
                </div>
              )}

              {isCurrentUser ? (
                <Link
                  href="/"
                  className="text-gray-500 hover:text-black"
                >
                  Go to My Blog →
                </Link>
              ) : (
                <Link
                  href={`/user/${profile.handle}`}
                  className="text-gray-500 hover:text-black"
                >
                  View Blog →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div

**human** (Mar 12, 2025, 01:06 PM)

Continue. Start UsersPage.tsx from the beginning

**assistant** (Mar 12, 2025, 01:06 PM)

 Here's the complete `UsersPage.tsx` file with a clean, minimalist design:

```typescript
// components/UsersPage.tsx
"use client";
import { db, stringToColor } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from '@/components/auth/AuthComponents';
import SocialLinks from './SocialLinks';

export default function UsersPage() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Get current user's profile to identify their own blog
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

  // Query all profiles with pagination and include avatars
  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        order: {
          createdAt: 'desc'
        }
      },
      avatar: {}
    }
  });

  if (authLoading || isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading users: {error.message}</div>;
  }

  const profiles = data?.profiles || [];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-light">Discover Blogs</h1>
          <p className="text-gray-500">Find and follow other bloggers</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-800">
            My Blog
          </Link>
          {user && <SignOutButton />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profiles.map((profile) => {
          const isCurrentUser = currentUserProfile?.id === profile.id;

          return (
            <div
              key={profile.id}
              className="group"
            >
              <div className="flex items-center space-x-3 mb-3">
                {profile.avatar ? (
                  <img
                    src={profile.avatar.url}
                    alt={`${profile.handle}'s avatar`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{
                      backgroundColor: stringToColor(profile.handle),
                    }}
                  >
                    {profile.handle.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center">
                    <h2 className="text-lg font-normal">@{profile.handle}</h2>
                    {isCurrentUser && (
                      <span className="ml-2 text-gray-400 text-xs">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="mb-4 text-gray-600 line-clamp-3">
                {profile.bio}
              </p>

              {/* Display social links */}
              {profile.socialLinks && (
                <div className="mb-4">
                  <SocialLinks links={profile.socialLinks} />
                </div>
              )}

              {isCurrentUser ? (
                <Link
                  href="/"
                  className="text-gray-500 hover:text-black"
                >
                  Go to My Blog →
                </Link>
              ) : (
                <Link
                  href={`/user/${profile.handle}`}
                  className="text-gray-500 hover:text-black"
                >
                  View Blog →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div className="text-center p-8">
          <p className="text-lg text-gray-500">No users found.</p>
        </div>
      )}

      {/* Pagination */}
      {profiles.length > 0 && (
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
            className={`px-4 py-2 ${profiles.length < PAGE_SIZE ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-black'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

Let me fix a minor issue in the code above. There's a reference to `posts.length` in the pagination section, but it should be `profiles.length`. Here's the corrected file:

```typescript
// components/UsersPage.tsx
"use client";
import { db, stringToColor } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from '@/components/auth/AuthComponents';
import SocialLinks from './SocialLinks';

export default function UsersPage() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Get current user's profile to identify their own blog
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

  // Query all profiles with pagination and include avatars
  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        order: {
          createdAt: 'desc'
        }
      },
      avatar: {}
    }
  });

  if (authLoading || isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading users: {error.message}</div>;
  }

  const profiles = data?.profiles || [];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-light">Discover Blogs</h1>
          <p className="text-gray-500">Find and follow other bloggers</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-800">
            My Blog
          </Link>
          {user && <SignOutButton />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profiles.map((profile) => {
          const isCurrentUser = currentUserProfile?.id === profile.id;

          return (
            <div
              key={profile.id}
              className="group"
            >
              <div className="flex items-center space-x-3 mb-3">
                {profile.avatar ? (
                  <img
                    src={profile.avatar.url}
                    alt={`${profile.handle}'s avatar`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{
                      backgroundColor: stringToColor(profile.handle),
                    }}
                  >
                    {profile.handle.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center">
                    <h2 className="text-lg font-normal">@{profile.handle}</h2>
                    {isCurrentUser && (
                      <span className="ml-2 text-gray-400 text-xs">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="mb-4 text-gray-600 line-clamp-3">
                {profile.bio}
              </p>

              {/* Display social links */}
              {profile.socialLinks && (
                <div className="mb-4">
                  <SocialLinks links={profile.socialLinks} />
                </div>
              )}

              {isCurrentUser ? (
                <Link
                  href="/"
                  className="text-gray-500 hover:text-black"
                >
                  Go to My Blog →
                </Link>
              ) : (
                <Link
                  href={`/user/${profile.handle}`}
                  className="text-gray-500 hover:text-black"
                >
                  View Blog →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div className="text-center p-8">
          <p className="text-lg text-gray-500">No users found.</p>
        </div>
      )}

      {/* Pagination */}
      {profiles.length > 0 && (
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
            disabled={profiles.length < PAGE_SIZE}
            className={`px-4 py-2 ${profiles.length < PAGE_SIZE ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-black'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

**human** (Mar 12, 2025, 01:07 PM)

Was this all the code for making the minimal styles or was there something else to finish?

**assistant** (Mar 12, 2025, 01:08 PM)

 I've made updates to the key components that needed styling changes for a more minimalist look, but there are a few more components that should be updated to maintain a consistent design across your blog platform:

1. **BlogPostForm.tsx** - Used for creating and editing blog posts
2. **SignOutButton** in **AuthComponents.tsx** - The styling of the sign-out button should match the new minimalist design
3. **ProfileForm.tsx** and **EditProfileForm.tsx** - For profile creation and editing

Let me provide you with complete updates for these components:

First, let's update the `BlogPostForm.tsx`:

```typescript
// components/BlogPostForm.tsx
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
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">
        {postId ? 'Edit Post' : 'Create New Post'}
      </h1>

      {error && (
        <div className="text-red-500 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block mb-2 text-gray-700 font-light">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
            required
            disabled={!!error}
          />
        </div>

        <div>
          <label htmlFor="content" className="block mb-2 text-gray-700 font-light">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400 min-h-[300px]"
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
          <label htmlFor="published" className="text-gray-700">
            Publish post
          </label>
          <span className="ml-2 text-sm text-gray-500">
            {published ? 'This post will be visible to others' : 'This post will be saved as a draft'}
          </span>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !!error}
            className={`px-4 py-2 ${isSubmitting || !!error
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-black text-white'}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Post'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

Now, let's update the `SignOutButton` in `AuthComponents.tsx`:

```typescript
// components/auth/AuthComponents.tsx (only the SignOutButton function)

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await db.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-500 hover:text-gray-800"
    >
      Sign Out
    </button>
  );
}
```

Next, let's update the `EditProfileForm.tsx`:

```typescript
// components/EditProfileForm.tsx (partial update focusing on styles)

// (imports and function declaration remain the same)

return (
  <div className="container max-w-2xl mx-auto px-4 py-8">
    <h1 className="text-3xl font-light mb-8">Edit Your Profile</h1>

    {error && (
      <div className="text-red-500 mb-6">
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar Preview"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: stringToColor(handle) }}
            >
              {handle.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center space-y-2">
          <label className="cursor-pointer bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm">
            {hasAvatar ? 'Change Avatar' : 'Upload Avatar'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              ref={fileInputRef}
            />
          </label>

          {(avatarPreview || hasAvatar) && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-gray-500 hover:text-gray-800"
            >
              Remove Avatar
            </button>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="handle" className="block mb-2 text-gray-700 font-light">
          Handle
        </label>
        <input
          id="handle"
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
          placeholder="your_handle"
          required
        />
      </div>

      <div>
        <label htmlFor="bio" className="block mb-2 text-gray-700 font-light">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400 min-h-[100px]"
          placeholder="Tell us a bit about yourself..."
          required
        />
      </div>

      <div className="pt-6 border-t border-gray-100">
        <h2 className="text-xl font-light mb-4">Social Links</h2>

        {/* Social links inputs remain the same but with updated styling for each input */}
        {/* Example for Twitter (repeat similar styling for other social links) */}
        <div className="mb-3">
          <label htmlFor="twitter" className="block mb-2 text-gray-700 font-light">
            Twitter
          </label>
          <div className="flex">
            <input
              id="twitter"
              type="text"
              value={socialLinks.twitter || ""}
              onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
              placeholder="Your Twitter username"
            />
            {socialLinks.twitter && (
              <button
                type="button"
                onClick={() => handleRemoveSocialLink("twitter")}
                className="ml-2 text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Repeat similar styling for other social links */}
      </div>

      <div className="flex gap-4 pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 ${isSubmitting
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-800 hover:bg-black text-white"}`}
        >
          {isSubmitting ? "Saving..." : "Save Profile"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
);
```

Finally, let's update the global layout to be more minimalist:

```typescript
// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'] });

export const metadata = {
  title: 'My Blog Platform',
  description: 'A simple blog platform built with Next.js, React, and InstantDB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-800`}>
        <header className="py-6 border-b border-gray-100">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-light">
              My Blog Platform
            </Link>
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link href="/" className="text-gray-500 hover:text-gray-800">
                    My Blog
                  </Link>
                </li>
                <li>
                  <Link href="/users" className="text-gray-500 hover:text-gray-800">
                    Discover
                  </Link>
                </li>
                <li>
                  <Link href="/posts/create" className="text-gray-500 hover:text-gray-800">
                    Write
                  </Link>
                </li>
                <li>
                  <Link href="/profile/edit" className="text-gray-500 hover:text-gray-800">
                    Profile
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="py-8">{children}</main>
        <footer className="py-6 text-center text-gray-400 text-sm">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} My Blog Platform
          </div>
        </footer>
      </body>
    </html>
  );
}
```

By updating these components, you'll have a consistent minimalist design across your entire blog platform. The changes emphasize:

1. Lighter font weights (font-light where appropriate)
2. Reduced border usage (mostly just border-b for separators)
3. Simplified color palette (primarily grays with black for emphasis)
4. More whitespace between elements
5. Subtle hover effects that just change text color rather than adding backgrounds
6. Consistent rounded corners (rounded-sm) and input styling
7. Simpler button designs

These changes should create a clean, zen-like blogging experience for your users.

**human** (Mar 12, 2025, 01:10 PM)

Please give me the full code for EditProfileForm.tsx

**assistant** (Mar 12, 2025, 01:11 PM)

 Here's the full code for `EditProfileForm.tsx` with the minimalist styling:

```typescript
// components/EditProfileForm.tsx
"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, updateProfile, uploadAvatar, deleteAvatar, SocialLinks, stringToColor } from "@/lib/db";

export default function EditProfileForm() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteAvatar, setIsDeleteAvatar] = useState(false);
  const [error, setError] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: "",
    github: "",
    linkedin: "",
    instagram: "",
    website: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Get user profile
  const { data, isLoading: profileLoading } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user?.id } }, avatar: {} } } : null
  );

  // Load profile data when it's available
  useEffect(() => {
    if (data?.profiles && data.profiles.length > 0) {
      const profile = data.profiles[0];
      setHandle(profile.handle);
      setBio(profile.bio || "");

      // Load avatar preview if available
      if (profile.avatar?.url) {
        setAvatarPreview(profile.avatar.url);
      }

      // Load existing social links if available
      if (profile.socialLinks) {
        setSocialLinks({
          twitter: profile.socialLinks.twitter || "",
          github: profile.socialLinks.github || "",
          linkedin: profile.socialLinks.linkedin || "",
          instagram: profile.socialLinks.instagram || "",
          website: profile.socialLinks.website || "",
          ...profile.socialLinks
        });
      }
    }
  }, [data]);

  // Redirect if user isn't authenticated
  useEffect(() => {
    if (!authLoading && !user && !profileLoading) {
      router.push("/login");
    }
  }, [user, authLoading, profileLoading, router]);

  if (authLoading || profileLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (authError) {
    return <div className="text-red-500 p-4">Error: {authError.message}</div>;
  }

  if (!user) {
    return <div className="flex justify-center p-8">Please sign in first. Redirecting...</div>;
  }

  // If user doesn't have a profile, redirect to create profile
  if (!data?.profiles || data.profiles.length === 0) {
    router.push("/create-profile");
    return <div className="flex justify-center p-8">No profile found. Redirecting to profile creation...</div>;
  }

  const profile = data.profiles[0];
  const hasAvatar = !!profile.avatar;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Avatar image must be less than 2MB.');
        return;
      }

      setAvatarFile(file);
      setIsDeleteAvatar(false);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview && !profile.avatar?.url) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setIsDeleteAvatar(true);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleRemoveSocialLink = (platform: string) => {
    setSocialLinks(prev => {
      const updated = { ...prev };
      delete updated[platform];
      return updated;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate handle (only allow letters, numbers, underscores, and hyphens)
      if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
        throw new Error("Handle can only contain letters, numbers, underscores, and hyphens");
      }

      // Clean up socialLinks by removing empty values
      const cleanedSocialLinks: SocialLinks = {};
      Object.entries(socialLinks).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          cleanedSocialLinks[key] = value.trim();
        }
      });

      // Update profile
      await updateProfile(profile.id, {
        handle,
        bio,
        socialLinks: cleanedSocialLinks
      });

      // Handle avatar
      if (isDeleteAvatar) {
        await deleteAvatar(profile.id);
      } else if (avatarFile) {
        await uploadAvatar(profile.id, avatarFile);
      }

      router.push("/");
    } catch (err: any) {
      console.error("Error updating profile:", err);

      // Handle unique constraint error for handle
      if (err.message?.includes("unique constraint")) {
        setError("This handle is already taken. Please choose another one.");
      } else {
        setError(err.message || "Failed to update profile. Please try again.");
      }

      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">Edit Your Profile</h1>

      {error && (
        <div className="text-red-500 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: stringToColor(handle) }}
              >
                {handle.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2">
            <label className="cursor-pointer bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm transition-colors">
              {hasAvatar ? 'Change Avatar' : 'Upload Avatar'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                ref={fileInputRef}
              />
            </label>

            {(avatarPreview || hasAvatar) && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-gray-500 hover:text-gray-800"
              >
                Remove Avatar
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="handle" className="block mb-2 text-gray-700 font-light">
            Handle
          </label>
          <input
            id="handle"
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
            placeholder="your_handle"
            required
          />
        </div>

        <div>
          <label htmlFor="bio" className="block mb-2 text-gray-700 font-light">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400 min-h-[100px]"
            placeholder="Tell us a bit about yourself..."
            required
          />
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-xl font-light mb-4">Social Links</h2>

          {/* Twitter */}
          <div className="mb-4">
            <label htmlFor="twitter" className="block mb-2 text-gray-700 font-light">
              Twitter
            </label>
            <div className="flex">
              <input
                id="twitter"
                type="text"
                value={socialLinks.twitter || ""}
                onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your Twitter username"
              />
              {socialLinks.twitter && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("twitter")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* GitHub */}
          <div className="mb-4">
            <label htmlFor="github" className="block mb-2 text-gray-700 font-light">
              GitHub
            </label>
            <div className="flex">
              <input
                id="github"
                type="text"
                value={socialLinks.github || ""}
                onChange={(e) => handleSocialLinkChange("github", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your GitHub username"
              />
              {socialLinks.github && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("github")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* LinkedIn */}
          <div className="mb-4">
            <label htmlFor="linkedin" className="block mb-2 text-gray-700 font-light">
              LinkedIn
            </label>
            <div className="flex">
              <input
                id="linkedin"
                type="text"
                value={socialLinks.linkedin || ""}
                onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your LinkedIn username"
              />
              {socialLinks.linkedin && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("linkedin")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Instagram */}
          <div className="mb-4">
            <label htmlFor="instagram" className="block mb-2 text-gray-700 font-light">
              Instagram
            </label>
            <div className="flex">
              <input
                id="instagram"
                type="text"
                value={socialLinks.instagram || ""}
                onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your Instagram username"
              />
              {socialLinks.instagram && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("instagram")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="mb-4">
            <label htmlFor="website" className="block mb-2 text-gray-700 font-light">
              Website
            </label>
            <div className="flex">
              <input
                id="website"
                type="text"
                value={socialLinks.website || ""}
                onChange={(e) => handleSocialLinkChange("website", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your website URL"
              />
              {socialLinks.website && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("website")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 ${isSubmitting
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gray-800 hover:bg-black text-white transition-colors"}`}
          >
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

This updated component features clean, minimalist styling with:

1. Lighter font weights for headings
2. Simplified input borders with subtle focus states
3. More breathing room between elements
4. A cleaner color palette focused on grays and black
5. Simple hover effects
6. Consistent rounded corners and button styling
7. Clear visual hierarchy

The overall design is now more zen-like and aligned with a minimalist blog aesthetic.

**human** (Mar 12, 2025, 03:10 PM)

This is a much better design! Let's make two more changes.

Right now the home page is just a login screen. It would be nicer if we could have a landing page. I've attached a screenshot with a design I like, could we do something like that?

Also I notice that the sign out button is in a weird place, it would be nicer if it was just in the profile page at the bottom

**assistant** (Mar 12, 2025, 03:11 PM)

 I'll help you create a landing page inspired by the Medium design you shared, and also relocate the sign-out button to a more appropriate location in the profile page.

First, let's create a new landing page component:

```typescript
// components/LandingPage.tsx
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';

export default function LandingPage() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  // If already logged in, redirect to their blog
  if (!isLoading && user) {
    router.push('/');
    return <div className="flex justify-center p-8">Redirecting to your blog...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-12 max-w-3xl">
        <h1 className="text-6xl md:text-7xl font-serif mb-6">
          Human stories & ideas
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          A place to read, write, and deepen your understanding
        </p>
        
        <div>
          <Link 
            href="/login" 
            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-full inline-block transition-colors"
          >
            Start reading
          </Link>
        </div>
      </div>
      
      <div className="hidden md:block flex-1 bg-gradient-to-bl from-emerald-200 to-emerald-400 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[20%] right-[10%] w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute top-[40%] left-[20%] w-20 h-20 rounded-full bg-black"></div>
          <div className="absolute bottom-[30%] right-[30%] w-32 h-32 rounded-full bg-emerald-600"></div>
          
          {/* Abstract lines */}
          <div className="absolute top-[30%] left-[10%] w-[80%] h-[1px] bg-black transform rotate-12"></div>
          <div className="absolute top-[35%] left-[10%] w-[80%] h-[1px] bg-black transform rotate-[15deg]"></div>
          <div className="absolute top-[70%] left-[5%] w-[90%] h-[1px] bg-black transform -rotate-12"></div>
          
          {/* Stars/dots */}
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-black rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Next, let's update the app's main page to show the landing page for non-authenticated users:

```typescript
// app/page.tsx
"use client";
import BlogPostList from '@/components/BlogPostList';
import LandingPage from '@/components/LandingPage';
import { AuthGuard } from '@/components/auth/AuthComponents';
import { db } from '@/lib/db';

export default function Home() {
  const { isLoading, user } = db.useAuth();

  // Show landing page for non-authenticated users
  if (!isLoading && !user) {
    return <LandingPage />;
  }

  return (
    <AuthGuard>
      <BlogPostList />
    </AuthGuard>
  );
}
```

Now, let's update the `AuthComponents.tsx` to remove the sign-out button from there and add it to the profile page:

```typescript
// components/auth/AuthComponents.tsx (modified version)
"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Call useQuery unconditionally - pass null as the query if no user
  // This ensures the hook is ALWAYS called in the same order
  const { data, isLoading: profileLoading } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null
  );

  // Handle redirection in useEffect, not during render
  useEffect(() => {
    if (user && data && (!data.profiles || data.profiles.length === 0) && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/create-profile");
    }
  }, [user, data, router, isRedirecting]);

  // Handle loading states
  if (authLoading || (user && profileLoading)) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // Handle auth errors
  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  // If no user, return login component
  if (!user) {
    return <Login />;
  }

  // Show loading if we're redirecting
  if (isRedirecting || (!data?.profiles || data.profiles.length === 0)) {
    return <div className="flex justify-center p-8">Redirecting to profile creation...</div>;
  }

  // If we have a user with a profile, render children
  return <>{children}</>;
}

export function Login() {
  const [sentEmail, setSentEmail] = useState("");

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="max-w-md w-full p-8">
        {!sentEmail ? (
          <EmailStep onSendEmail={setSentEmail} />
        ) : (
          <CodeStep sentEmail={sentEmail} />
        )}
      </div>
    </div>
  );
}

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await db.auth.sendMagicCode({ email });
      onSendEmail(email);
    } catch (err: any) {
      setError(err.body?.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-light mb-2">Sign In</h2>
        <p className="text-gray-600">
          Enter your email, and we'll send you a verification code. We'll create
          an account for you if you don't already have one.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="email" className="block mb-2 font-light">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-800 hover:bg-black text-white"
          }`}
      >
        {isLoading ? "Sending..." : "Send Code"}
      </button>
    </form>
  );
}

function CodeStep({ sentEmail }: { sentEmail: string }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const router = useRouter();

  // Handle navigation after successful login
  useEffect(() => {
    if (loginSuccess) {
      router.push(hasProfile ? "/" : "/create-profile");
    }
  }, [loginSuccess, hasProfile, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });

      // After successful sign-in, check if the user has a profile
      const userData = await db.getAuth();
      if (!userData || !userData.id) {
        throw new Error("Authentication failed");
      }

      const { data } = await db.queryOnce({
        profiles: {
          $: {
            where: { "$user.id": userData.id }
          }
        }
      });

      setHasProfile(!!data.profiles && data.profiles.length > 0);
      setLoginSuccess(true);
    } catch (err: any) {
      setError(err.body?.message || "Invalid code. Please try again.");
      setCode("");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-light mb-2">Enter Verification Code</h2>
        <p className="text-gray-600">
          We sent a code to <strong>{sentEmail}</strong>. Please check your email and enter the code below.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="code" className="block mb-2 font-light">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400"
          placeholder="Enter your code..."
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-800 hover:bg-black text-white"
          }`}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </button>
    </form>
  );
}

// The SignOutButton is still here but we'll no longer use it in other components
export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await db.auth.signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-500 hover:text-gray-800"
    >
      Sign Out
    </button>
  );
}
```

Now, let's update all components that were previously showing the SignOutButton. First, the `BlogPostList.tsx`:

```typescript
// components/BlogPostList.tsx (modified part only)
// Remove this import:
// import { SignOutButton } from './auth/AuthComponents';

// Then, remove the SignOutButton from the JSX where it appears
// In the header section, change this:
<div className="flex items-center gap-3">
  <Link
    href="/posts/create"
    className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm transition-colors"
  >
    Create New Post
  </Link>
  {/* Remove the SignOutButton from here */}
</div>
```

Similarly, update `BlogPostView.tsx` and `UserBlogPage.tsx` to remove the SignOutButton.

Finally, let's add the sign-out functionality to the EditProfileForm at the bottom:

```typescript
// components/EditProfileForm.tsx (add this at the end of the form)
// Inside the form, after the Save/Cancel buttons add:

<div className="mt-12 pt-6 border-t border-gray-100 text-center">
  <button
    type="button"
    onClick={async () => {
      if (confirm('Are you sure you want to sign out?')) {
        await db.auth.signOut();
        router.push("/");
      }
    }}
    className="text-gray-500 hover:text-gray-800"
  >
    Sign Out
  </button>
</div>
```

Now, let's create a login page for the route:

```typescript
// app/login/page.tsx
"use client";
import { Login } from '@/components/auth/AuthComponents';

export default function LoginPage() {
  return <Login />;
}
```

Finally, let's update the layout.tsx to adapt to the landing page:

```typescript
// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'] });

export const metadata = {
  title: 'My Blog Platform',
  description: 'A simple blog platform built with Next.js, React, and InstantDB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-800`}>
        <header className="py-6 border-b border-gray-100">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-light">
              My Blog Platform
            </Link>
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link href="/users" className="text-gray-500 hover:text-gray-800">
                    Discover
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-500 hover:text-gray-800">
                    Sign In
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="py-6 text-center text-gray-400 text-sm">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} My Blog Platform
          </div>
        </footer>
      </body>
    </html>
  );
}
```

These changes will:

1. Create a Medium-inspired landing page for non-authenticated users
2. Move the sign-out button to the profile page (at the bottom)
3. Clean up the navigation to make it more intuitive for both logged-in and non-logged-in users

The landing page now offers a visually appealing introduction to your blog platform, with a design inspired by Medium's minimalist aesthetic. This creates a better first impression and provides a clear path to either signing in or exploring content.

**human** (Mar 12, 2025, 03:29 PM)

This works great. One final note. I notice that going to the discover page and viewing blogs redirects to sign in. People should be able to see discover, existing blogs, and blog posts without needing to be logged in (I notice going to a single blog post causes isloading to last forever)

**assistant** (Mar 12, 2025, 03:30 PM)

 You're absolutely right! Let's make those adjustments to allow non-authenticated users to view public content like the discover page, user blogs, and individual blog posts. This is a common pattern in blogging platforms where reading content is available to everyone, but creating content requires authentication.

Here are the changes we need to make:

1. First, let's update the `AuthComponents.tsx` to create a more permissive version for public pages:

```typescript
// components/auth/AuthComponents.tsx
// Add a new component called PublicRoute

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, user } = db.useAuth();
  
  // For public routes, we don't need to check for profiles or redirect
  // We just need to pass through the children with the auth context
  
  if (authLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }
  
  // Always render children, whether user is authenticated or not
  return <>{children}</>;
}
```

2. Now, let's update the pages to use the PublicRoute instead of AuthGuard:

```typescript
// app/users/page.tsx
"use client";
import UsersPage from '@/components/UsersPage';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function UsersRoute() {
  return (
    <PublicRoute>
      <UsersPage />
    </PublicRoute>
  );
}
```

```typescript
// app/user/[handle]/page.tsx
"use client";
import { use } from 'react';
import UserBlogPage from '@/components/UserBlogPage';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function UserBlogRoute({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);

  return (
    <PublicRoute>
      <UserBlogPage handle={handle} />
    </PublicRoute>
  );
}
```

```typescript
// app/posts/[id]/page.tsx
"use client";
import { use } from 'react';
import BlogPostView from '@/components/BlogPostView';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <PublicRoute>
      <BlogPostView postId={id} />
    </PublicRoute>
  );
}
```

3. Now, let's update the corresponding components to handle both authenticated and non-authenticated users:

```typescript
// components/UsersPage.tsx (modified part only)
export default function UsersPage() {
  const { isLoading: authLoading, user } = db.useAuth();
  // Rest of component remains the same
  
  // Make sure to remove any redirects based on authentication
  // and adapt the UI to show appropriate actions for each user state
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-light">Discover Blogs</h1>
          <p className="text-gray-500">Find and follow other bloggers</p>
        </div>
        <div>
          {user ? (
            <Link href="/" className="text-gray-500 hover:text-gray-800">
              My Blog
            </Link>
          ) : (
            <Link href="/login" className="text-gray-500 hover:text-gray-800">
              Sign In
            </Link>
          )}
        </div>
      </div>
      
      {/* Rest of component remains the same */}
    </div>
  );
}
```

4. Similarly, update `UserBlogPage.tsx` to handle non-authenticated users:

```typescript
// components/UserBlogPage.tsx (modified parts)
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

  // Rest of the component...

  // In the JSX, adapt UI elements based on authentication status
  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/users" className="text-gray-500 hover:text-gray-800">
            ← Back to Users
          </Link>
          {isOwnBlog && (
            <Link href="/" className="text-gray-500 hover:text-gray-800">
              Switch to My View
            </Link>
          )}
        </div>
        {/* No sign out button here */}
        {!user && (
          <Link href="/login" className="text-gray-500 hover:text-gray-800">
            Sign In
          </Link>
        )}
      </div>

      {/* Rest of component... */}
      
      {/* Only show edit/delete options if it's the owner */}
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
      
      {/* Rest of component... */}
    </div>
  );
}
```

5. Finally, update the `BlogPostView.tsx`:

```typescript
// components/BlogPostView.tsx (modified parts)
export default function BlogPostView({ postId }: BlogPostViewProps) {
  const router = useRouter();
  const { isLoading: authLoading, user } = db.useAuth();

  // Get user's profile to check ownership (only if logged in)
  const { isLoading: profileLoading, data: profileData } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null
  );

  // Get the post with its author
  const { isLoading, error, data } = db.useQuery({
    posts: {
      $: {
        where: { id: postId }
      },
      author: {} // Include the author relationship
    }
  });

  // Determine if loading is complete and we have post data
  const hasPostData = !isLoading && data?.posts?.[0];
  const postAuthorId = hasPostData ? data.posts[0].author?.id : null;
  
  // Fix for the loading issue: Only proceed with getting related posts when we have post data
  const { data: postsData, isLoading: postsLoading } = db.useQuery(
    hasPostData && postAuthorId ? {
      posts: {
        $: {
          where: {
            "author.id": postAuthorId,
            // If we're not the author, only show published posts for navigation
            ...(!user || (profileData?.profiles?.[0]?.id !== postAuthorId) ? { published: true } : {})
          },
          order: { createdAt: 'desc' }
        }
      }
    } : null
  );

  // Simplify loading state handling to prevent infinite loading
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading post...</div>;
  }

  if (error) {
    // Could be a permission error (trying to view someone else's draft)
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">Post not available</h1>
        <p className="mb-4 text-gray-500">This post may be a draft or has been removed.</p>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Return to Home
        </Link>
      </div>
    );
  }

  // If the post doesn't exist
  if (!data.posts || data.posts.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">Post not found</h1>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Return to Home
        </Link>
      </div>
    );
  }

  const post = data.posts[0];
  
  // Check if this is a draft post and the user is not the author
  if (!post.published && (!user || profileData?.profiles?.[0]?.id !== post.author?.id)) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">Post not available</h1>
        <p className="mb-4 text-gray-500">This post is a draft and is not available for public viewing.</p>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Return to Home
        </Link>
      </div>
    );
  }
  
  const authorProfile = post.author;

  // Check if the current user is the author of this post
  const isOwner = user && authorProfile && profileData?.profiles?.[0]?.id === authorProfile.id;

  // Get the author's posts for navigation
  const authorPosts = postsData?.posts || [];

  // Only continue with navigation if we have author posts
  const currentIndex = authorPosts.findIndex(p => p.id === postId);
  const nextPost = currentIndex > 0 ? authorPosts[currentIndex - 1] : null;
  const prevPost = currentIndex < authorPosts.length - 1 ? authorPosts[currentIndex + 1] : null;

  // Rest of component...
  
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-10">
        {authorProfile ? 
          <Link href={`/user/${authorProfile.handle}`} className="text-gray-500 hover:text-gray-800">
            ← Back to @{authorProfile.handle}'s Posts
          </Link>
          :
          <Link href="/users" className="text-gray-500 hover:text-gray-800">
            ← Back to Discover
          </Link>
        }
        
        {!user && (
          <Link href="/login" className="text-gray-500 hover:text-gray-800">
            Sign In
          </Link>
        )}
      </div>

      {/* Rest of component... */}
      
      {/* Only show edit/delete buttons if user is the owner */}
      {isOwner && (
        <div className="flex gap-3 mt-12 pt-6 border-t border-gray-100">
          <Link
            href={`/posts/edit/${postId}`}
            className="text-gray-500 hover:text-gray-900"
          >
            Edit Post
          </Link>
          <button
            onClick={handleDeletePost}
            className="text-gray-500 hover:text-gray-900"
          >
            Delete Post
          </button>
        </div>
      )}
      
      {/* Rest of component... */}
    </div>
  );
}
```

6. Update the navigation in `layout.tsx` to be dynamic based on user authentication:

```typescript
// app/layout.tsx
"use client";
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { db } from '@/lib/db';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, user } = db.useAuth();
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-800`}>
        <header className="py-6 border-b border-gray-100">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-light">
              My Blog Platform
            </Link>
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link 
                    href="/users" 
                    className={`text-gray-500 hover:text-gray-800 ${pathname === '/users' ? 'text-gray-800' : ''}`}
                  >
                    Discover
                  </Link>
                </li>
                
                {!isLoading && user ? (
                  // Navigation for logged-in users
                  <>
                    <li>
                      <Link 
                        href="/" 
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/' ? 'text-gray-800' : ''}`}
                      >
                        My Blog
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/posts/create" 
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/posts/create' ? 'text-gray-800' : ''}`}
                      >
                        Write
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/profile/edit" 
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/profile/edit' ? 'text-gray-800' : ''}`}
                      >
                        Profile
                      </Link>
                    </li>
                  </>
                ) : (
                  // Navigation for guests
                  <li>
                    <Link 
                      href="/login" 
                      className={`text-gray-500 hover:text-gray-800 ${pathname === '/login' ? 'text-gray-800' : ''}`}
                    >
                      Sign In
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="py-6 text-center text-gray-400 text-sm">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} My Blog Platform
          </div>
        </footer>
      </body>
    </html>
  );
}
```

7. Make sure the permissions in `instant.perms.ts` allow public viewing of published posts:

```typescript
// instant.perms.ts (verify this part is correct)
posts: {
  allow: {
    // Posts can be viewed if they are published or if the viewer is the author
    view: "data.published == true || auth.id in data.ref('author.$user.id')",
    // Only authenticated users can create posts
    create: "auth.id != null",
    // Only the author can update their posts
    update: "auth.id in data.ref('author.$user.id')",
    // Only the author can delete their posts
    delete: "auth.id in data.ref('author.$user.id')"
  }
},
```

These changes will allow non-authenticated users to:
1. Browse the discover page and see all bloggers
2. View user blogs and their published posts
3. Read individual blog posts that are published
4. Navigate through the site with a proper UI that adapts to their non-authenticated state

At the same time, we maintain the security so that:
1. Only authenticated users can create and manage content
2. Draft posts are only visible to their authors
3. Edit/delete options are only shown to content owners

This provides a much better user experience while preserving the necessary security and access controls.

**human** (Mar 12, 2025, 03:32 PM)

You gave me some partial files, please give me the full ones

**assistant** (Mar 12, 2025, 03:33 PM)

 You're right, I apologize for providing partial files. Here are the complete files for all the components we need to modify:

First, let's start with the `components/auth/AuthComponents.tsx`:

```typescript
// components/auth/AuthComponents.tsx
"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Call useQuery unconditionally - pass null as the query if no user
  // This ensures the hook is ALWAYS called in the same order
  const { data, isLoading: profileLoading } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null
  );

  // Handle redirection in useEffect, not during render
  useEffect(() => {
    if (user && data && (!data.profiles || data.profiles.length === 0) && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/create-profile");
    }
  }, [user, data, router, isRedirecting]);

  // Handle loading states
  if (authLoading || (user && profileLoading)) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // Handle auth errors
  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  // If no user, return login component
  if (!user) {
    return <Login />;
  }

  // Show loading if we're redirecting
  if (isRedirecting || (!data?.profiles || data.profiles.length === 0)) {
    return <div className="flex justify-center p-8">Redirecting to profile creation...</div>;
  }

  // If we have a user with a profile, render children
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, user } = db.useAuth();
  
  // For public routes, we don't need to check for profiles or redirect
  // We just need to pass through the children with the auth context
  
  if (authLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }
  
  // Always render children, whether user is authenticated or not
  return <>{children}</>;
}

export function Login() {
  const [sentEmail, setSentEmail] = useState("");

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="max-w-md w-full p-8">
        {!sentEmail ? (
          <EmailStep onSendEmail={setSentEmail} />
        ) : (
          <CodeStep sentEmail={sentEmail} />
        )}
      </div>
    </div>
  );
}

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await db.auth.sendMagicCode({ email });
      onSendEmail(email);
    } catch (err: any) {
      setError(err.body?.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-light mb-2">Sign In</h2>
        <p className="text-gray-600">
          Enter your email, and we'll send you a verification code. We'll create
          an account for you if you don't already have one.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="email" className="block mb-2 font-light">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-800 hover:bg-black text-white"
          }`}
      >
        {isLoading ? "Sending..." : "Send Code"}
      </button>
    </form>
  );
}

function CodeStep({ sentEmail }: { sentEmail: string }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const router = useRouter();

  // Handle navigation after successful login
  useEffect(() => {
    if (loginSuccess) {
      router.push(hasProfile ? "/" : "/create-profile");
    }
  }, [loginSuccess, hasProfile, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });

      // After successful sign-in, check if the user has a profile
      const userData = await db.getAuth();
      if (!userData || !userData.id) {
        throw new Error("Authentication failed");
      }

      const { data } = await db.queryOnce({
        profiles: {
          $: {
            where: { "$user.id": userData.id }
          }
        }
      });

      setHasProfile(!!data.profiles && data.profiles.length > 0);
      setLoginSuccess(true);
    } catch (err: any) {
      setError(err.body?.message || "Invalid code. Please try again.");
      setCode("");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-light mb-2">Enter Verification Code</h2>
        <p className="text-gray-600">
          We sent a code to <strong>{sentEmail}</strong>. Please check your email and enter the code below.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="code" className="block mb-2 font-light">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400"
          placeholder="Enter your code..."
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-800 hover:bg-black text-white"
          }`}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </button>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await db.auth.signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-500 hover:text-gray-800"
    >
      Sign Out
    </button>
  );
}
```

Next, let's update `components/UsersPage.tsx`:

```typescript
// components/UsersPage.tsx
"use client";
import { db, stringToColor } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import SocialLinks from './SocialLinks';

export default function UsersPage() {
  const { isLoading: authLoading, user } = db.useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Get current user's profile to identify their own blog
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

  // Query all profiles with pagination and include avatars
  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        order: {
          createdAt: 'desc'
        }
      },
      avatar: {}
    }
  });

  if (authLoading || isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading users: {error.message}</div>;
  }

  const profiles = data?.profiles || [];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-light">Discover Blogs</h1>
          <p className="text-gray-500">Find and follow other bloggers</p>
        </div>
        <div>
          {user ? (
            <Link href="/" className="text-gray-500 hover:text-gray-800">
              My Blog
            </Link>
          ) : (
            <Link href="/login" className="text-gray-500 hover:text-gray-800">
              Sign In
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profiles.map((profile) => {
          const isCurrentUser = currentUserProfile?.id === profile.id;

          return (
            <div
              key={profile.id}
              className="group"
            >
              <div className="flex items-center space-x-3 mb-3">
                {profile.avatar ? (
                  <img
                    src={profile.avatar.url}
                    alt={`${profile.handle}'s avatar`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{
                      backgroundColor: stringToColor(profile.handle),
                    }}
                  >
                    {profile.handle.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center">
                    <h2 className="text-lg font-normal">@{profile.handle}</h2>
                    {isCurrentUser && (
                      <span className="ml-2 text-gray-400 text-xs">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="mb-4 text-gray-600 line-clamp-3">
                {profile.bio}
              </p>

              {/* Display social links */}
              {profile.socialLinks && (
                <div className="mb-4">
                  <SocialLinks links={profile.socialLinks} />
                </div>
              )}

              {isCurrentUser ? (
                <Link
                  href="/"
                  className="text-gray-500 hover:text-black"
                >
                  Go to My Blog →
                </Link>
              ) : (
                <Link
                  href={`/user/${profile.handle}`}
                  className="text-gray-500 hover:text-black"
                >
                  View Blog →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div className="text-center p-8">
          <p className="text-lg text-gray-500">No users found.</p>
        </div>
      )}

      {/* Pagination */}
      {profiles.length > 0 && (
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
            disabled={profiles.length < PAGE_SIZE}
            className={`px-4 py-2 ${profiles.length < PAGE_SIZE ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-black'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

Now, let's update `components/UserBlogPage.tsx`:

```typescript
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
          Back to Users
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
            ← Back to Users
          </Link>
          {isOwnBlog && (
            <Link href="/" className="text-gray-500 hover:text-gray-800">
              Switch to My View
            </Link>
          )}
        </div>
        {!user && (
          <Link href="/login" className="text-gray-500 hover:text-gray-800">
            Sign In
          </Link>
        )}
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
            <h1 className="text-3xl font-light">@{profile.handle}'s Blog</h1>
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
```

Now, let's update `components/BlogPostView.tsx`:

```typescript
// components/BlogPostView.tsx
"use client";

import { db } from '@/lib/db';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BlogPostViewProps {
  postId: string;
}

export default function BlogPostView({ postId }: BlogPostViewProps) {
  const router = useRouter();
  const { isLoading: authLoading, user } = db.useAuth();

  // Get user's profile to check ownership (only if logged in)
  const { isLoading: profileLoading, data: profileData } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null
  );

  // Get the post with its author
  const { isLoading, error, data } = db.useQuery({
    posts: {
      $: {
        where: { id: postId }
      },
      author: {} // Include the author relationship
    }
  });

  // Determine if loading is complete and we have post data
  const hasPostData = !isLoading && data?.posts?.[0];
  const postAuthorId = hasPostData ? data.posts[0].author?.id : null;
  
  // Fix for the loading issue: Only proceed with getting related posts when we have post data
  const { data: postsData, isLoading: postsLoading } = db.useQuery(
    hasPostData && postAuthorId ? {
      posts: {
        $: {
          where: {
            "author.id": postAuthorId,
            // If we're not the author, only show published posts for navigation
            ...(!user || (profileData?.profiles?.[0]?.id !== postAuthorId) ? { published: true } : {})
          },
          order: { createdAt: 'desc' }
        }
      }
    } : null
  );

  // Simplify loading state handling to prevent infinite loading
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading post...</div>;
  }

  if (error) {
    // Could be a permission error (trying to view someone else's draft)
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">Post not available</h1>
        <p className="mb-4 text-gray-500">This post may be a draft or has been removed.</p>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Return to Home
        </Link>
      </div>
    );
  }

  // If the post doesn't exist
  if (!data.posts || data.posts.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">Post not found</h1>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Return to Home
        </Link>
      </div>
    );
  }

  const post = data.posts[0];
  
  // Check if this is a draft post and the user is not the author
  if (!post.published && (!user || profileData?.profiles?.[0]?.id !== post.author?.id)) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-light mb-4">Post not available</h1>
        <p className="mb-4 text-gray-500">This post is a draft and is not available for public viewing.</p>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Return to Home
        </Link>
      </div>
    );
  }
  
  const authorProfile = post.author;

  // Check if the current user is the author of this post
  const isOwner = user && authorProfile && profileData?.profiles?.[0]?.id === authorProfile.id;

  // Get the author's posts for navigation
  const authorPosts = postsData?.posts || [];

  // Only continue with navigation if we have author posts
  const currentIndex = authorPosts.findIndex(p => p.id === postId);
  const nextPost = currentIndex > 0 ? authorPosts[currentIndex - 1] : null;
  const prevPost = currentIndex < authorPosts.length - 1 ? authorPosts[currentIndex + 1] : null;

  const handleDeletePost = async () => {
    if (!isOwner) {
      alert("You don't have permission to delete this post");
      return;
    }

    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await db.transact(db.tx.posts[postId].delete());
        router.push('/');
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-10">
        {authorProfile ? 
          <Link href={`/user/${authorProfile.handle}`} className="text-gray-500 hover:text-gray-800">
            ← Back to @{authorProfile.handle}'s Posts
          </Link>
          :
          <Link href="/users" className="text-gray-500 hover:text-gray-800">
            ← Back to Discover
          </Link>
        }
        
        {!user && (
          <Link href="/login" className="text-gray-500 hover:text-gray-800">
            Sign In
          </Link>
        )}
      </div>

      <article className="prose max-w-none">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light mb-0">{post.title}</h1>
            {!post.published && (
              <span className="text-gray-400 text-xs">
                Draft
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-2">
            Published by {authorProfile?.handle || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString()}
            {post.updatedAt !== post.createdAt &&
              ` · Updated on ${new Date(post.updatedAt).toLocaleDateString()}`}
          </p>
        </header>

        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>

        {isOwner && (
          <div className="flex gap-3 mt-12 pt-6 border-t border-gray-100">
            <Link
              href={`/posts/edit/${postId}`}
              className="text-gray-500 hover:text-gray-900"
            >
              Edit Post
            </Link>
            <button
              onClick={handleDeletePost}
              className="text-gray-500 hover:text-gray-900"
            >
              Delete Post
            </button>
          </div>
        )}
      </article>

      {/* Post Navigation - show navigation for all author's posts that the current user can see */}
      {authorPosts.length > 1 && (
        <div className="border-t border-gray-100 pt-6 mt-12">
          <div className="flex justify-between text-sm">
            <div>
              {nextPost && (
                <Link href={`/posts/${nextPost.id}`} className="text-gray-500 hover:text-gray-800">
                  ← {nextPost.title}
                </Link>
              )}

**human** (Mar 12, 2025, 03:34 PM)

Continue

**assistant** (Mar 12, 2025, 03:34 PM)

 Here's the continuation of the `BlogPostView.tsx` file:

```typescript
            </div>
            <div>
              {prevPost && (
                <Link href={`/posts/${prevPost.id}`} className="text-gray-500 hover:text-gray-800">
                  {prevPost.title} →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

Now let's update the pages that use these components, starting with `app/page.tsx`:

```typescript
// app/page.tsx
"use client";
import BlogPostList from '@/components/BlogPostList';
import LandingPage from '@/components/LandingPage';
import { AuthGuard } from '@/components/auth/AuthComponents';
import { db } from '@/lib/db';

export default function Home() {
  const { isLoading, user } = db.useAuth();

  // Show landing page for non-authenticated users
  if (!isLoading && !user) {
    return <LandingPage />;
  }

  return (
    <AuthGuard>
      <BlogPostList />
    </AuthGuard>
  );
}
```

Here's the `app/users/page.tsx`:

```typescript
// app/users/page.tsx
"use client";
import UsersPage from '@/components/UsersPage';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function UsersRoute() {
  return (
    <PublicRoute>
      <UsersPage />
    </PublicRoute>
  );
}
```

The `app/user/[handle]/page.tsx`:

```typescript
// app/user/[handle]/page.tsx
"use client";
import { use } from 'react';
import UserBlogPage from '@/components/UserBlogPage';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function UserBlogRoute({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);

  return (
    <PublicRoute>
      <UserBlogPage handle={handle} />
    </PublicRoute>
  );
}
```

The `app/posts/[id]/page.tsx`:

```typescript
// app/posts/[id]/page.tsx
"use client";
import { use } from 'react';
import BlogPostView from '@/components/BlogPostView';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <PublicRoute>
      <BlogPostView postId={id} />
    </PublicRoute>
  );
}
```

Now let's update the `components/LandingPage.tsx`:

```typescript
// components/LandingPage.tsx
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';

export default function LandingPage() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  // If already logged in, redirect to their blog
  if (!isLoading && user) {
    router.push('/');
    return <div className="flex justify-center p-8">Redirecting to your blog...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-12 max-w-3xl">
        <h1 className="text-6xl md:text-7xl font-serif mb-6">
          Human stories & ideas
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          A place to read, write, and deepen your understanding
        </p>
        
        <div>
          <Link 
            href="/login" 
            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-full inline-block transition-colors"
          >
            Start reading
          </Link>
        </div>
      </div>
      
      <div className="hidden md:block flex-1 bg-gradient-to-bl from-emerald-200 to-emerald-400 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[20%] right-[10%] w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute top-[40%] left-[20%] w-20 h-20 rounded-full bg-black"></div>
          <div className="absolute bottom-[30%] right-[30%] w-32 h-32 rounded-full bg-emerald-600"></div>
          
          {/* Abstract lines */}
          <div className="absolute top-[30%] left-[10%] w-[80%] h-[1px] bg-black transform rotate-12"></div>
          <div className="absolute top-[35%] left-[10%] w-[80%] h-[1px] bg-black transform rotate-[15deg]"></div>
          <div className="absolute top-[70%] left-[5%] w-[90%] h-[1px] bg-black transform -rotate-12"></div>
          
          {/* Stars/dots */}
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-black rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Let's update the `app/layout.tsx` to be dynamic based on authentication:

```typescript
// app/layout.tsx
"use client";
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { db } from '@/lib/db';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, user } = db.useAuth();
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-800`}>
        <header className="py-6 border-b border-gray-100">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-light">
              My Blog Platform
            </Link>
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link 
                    href="/users" 
                    className={`text-gray-500 hover:text-gray-800 ${pathname === '/users' ? 'text-gray-800' : ''}`}
                  >
                    Discover
                  </Link>
                </li>
                
                {!isLoading && user ? (
                  // Navigation for logged-in users
                  <>
                    <li>
                      <Link 
                        href="/" 
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/' ? 'text-gray-800' : ''}`}
                      >
                        My Blog
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/posts/create" 
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/posts/create' ? 'text-gray-800' : ''}`}
                      >
                        Write
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/profile/edit" 
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/profile/edit' ? 'text-gray-800' : ''}`}
                      >
                        Profile
                      </Link>
                    </li>
                  </>
                ) : (
                  // Navigation for guests
                  <li>
                    <Link 
                      href="/login" 
                      className={`text-gray-500 hover:text-gray-800 ${pathname === '/login' ? 'text-gray-800' : ''}`}
                    >
                      Sign In
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="py-6 text-center text-gray-400 text-sm">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} My Blog Platform
          </div>
        </footer>
      </body>
    </html>
  );
}
```

And finally, let's update the `components/EditProfileForm.tsx` to include the Sign Out button at the bottom:

```typescript
// components/EditProfileForm.tsx (partial update, add this at the end of the form)
// Inside the form component JSX, after the Save/Cancel buttons:

<div className="mt-12 pt-6 border-t border-gray-100 text-center">
  <button
    type="button"
    onClick={async () => {
      if (confirm('Are you sure you want to sign out?')) {
        await db.auth.signOut();
        router.push("/");
      }
    }}
    className="text-gray-500 hover:text-gray-800"
  >
    Sign Out
  </button>
</div>
```

Now we've updated all the necessary components to make sure that:

1. Non-authenticated users can view:
   - The landing page
   - The discover page with all the bloggers
   - Individual blogger pages (showing only published posts)
   - Published blog posts

2. The sign out button is now only shown in the user's profile edit page.

3. The navigation bar adapts based on whether the user is authenticated or not.

These changes create a much better user experience for both authenticated and non-authenticated users, while maintaining the right level of permission control for content access.

**human** (Mar 12, 2025, 03:40 PM)

I love the design of the landing page with the great green asset. Could we make something more lively for the login page?

**assistant** (Mar 12, 2025, 03:41 PM)

 I'd be happy to create a more lively design for the login page to match the aesthetic of your landing page! Let's update the Login component to have a similar visual appeal with a complementary design.

Here's a complete updated version of the Login component:

```typescript
// components/auth/AuthComponents.tsx (updated Login component)

export function Login() {
  const [sentEmail, setSentEmail] = useState("");

  return (
    <div className="min-h-[calc(100vh-160px)] flex">
      {/* Left side - form */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          {!sentEmail ? (
            <EmailStep onSendEmail={setSentEmail} />
          ) : (
            <CodeStep sentEmail={sentEmail} />
          )}
        </div>
      </div>
      
      {/* Right side - decorative graphics */}
      <div className="hidden md:block flex-1 bg-gradient-to-tr from-blue-100 to-blue-300 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {/* Circles */}
          <div className="absolute bottom-[20%] left-[10%] w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute top-[30%] right-[20%] w-24 h-24 rounded-full bg-black"></div>
          <div className="absolute top-[60%] right-[15%] w-32 h-32 rounded-full bg-blue-600"></div>
          
          {/* Abstract lines */}
          <div className="absolute top-[25%] left-[10%] w-[80%] h-[1px] bg-black transform -rotate-12"></div>
          <div className="absolute top-[30%] left-[10%] w-[80%] h-[1px] bg-black transform -rotate-[8deg]"></div>
          <div className="absolute top-[80%] left-[5%] w-[90%] h-[1px] bg-black transform rotate-12"></div>
          
          {/* Envelope icons scattered around */}
          <div className="absolute top-[15%] left-[25%] text-black opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
            </svg>
          </div>
          <div className="absolute top-[45%] right-[30%] text-black opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
            </svg>
          </div>
          <div className="absolute bottom-[25%] left-[35%] text-black opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
            </svg>
          </div>
          
          {/* Stars/dots */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-black rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            ></div>
          ))}
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="flex justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16" className="text-blue-800 opacity-60">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5Z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-light text-blue-900 mb-3">Welcome Back</h2>
            <p className="text-blue-800 opacity-70">Sign in to continue your writing journey</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await db.auth.sendMagicCode({ email });
      onSendEmail(email);
    } catch (err: any) {
      setError(err.body?.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div>
        <h2 className="text-3xl font-light mb-2">Sign In</h2>
        <p className="text-gray-600">
          Enter your email, and we'll send you a verification code. We'll create
          an account for you if you don't already have one.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="email" className="block mb-2 font-light">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-800 hover:bg-black text-white"
          }`}
      >
        {isLoading ? "Sending..." : "Send Code"}
      </button>
      
      <div className="text-center mt-4">
        <Link href="/" className="text-gray-500 hover:text-gray-800">
          Back to home
        </Link>
      </div>
    </form>
  );
}
```

I've also updated the `CodeStep` component to match the new design:

```typescript
function CodeStep({ sentEmail }: { sentEmail: string }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const router = useRouter();

  // Handle navigation after successful login
  useEffect(() => {
    if (loginSuccess) {
      router.push(hasProfile ? "/" : "/create-profile");
    }
  }, [loginSuccess, hasProfile, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });

      // After successful sign-in, check if the user has a profile
      const userData = await db.getAuth();
      if (!userData || !userData.id) {
        throw new Error("Authentication failed");
      }

      const { data } = await db.queryOnce({
        profiles: {
          $: {
            where: { "$user.id": userData.id }
          }
        }
      });

      setHasProfile(!!data.profiles && data.profiles.length > 0);
      setLoginSuccess(true);
    } catch (err: any) {
      setError(err.body?.message || "Invalid code. Please try again.");
      setCode("");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div>
        <h2 className="text-3xl font-light mb-2">Enter Verification Code</h2>
        <p className="text-gray-600">
          We sent a code to <strong>{sentEmail}</strong>. Please check your email and enter the code below.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="code" className="block mb-2 font-light">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400"
          placeholder="Enter your code..."
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-800 hover:bg-black text-white"
          }`}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </button>
      
      <div className="text-center mt-4">
        <button 
          type="button"
          onClick={() => window.location.reload()}
          className="text-gray-500 hover:text-gray-800"
        >
          Try a different email
        </button>
      </div>
    </form>
  );
}
```

This updated design:

1. Creates a split-screen layout like your landing page
2. Uses a complementary blue gradient on the right side (to complement the green on the landing page)
3. Adds decorative elements including:
   - Abstract circles and lines
   - Envelope icons to visually reinforce the email theme
   - Small dots/stars for visual interest
4. Includes an accent graphic in the center of the right side
5. Makes the headings larger and lighter for a more elegant look
6. Adds navigation options at the bottom of each step

The design maintains the minimalist aesthetic while providing more visual interest and making the login experience feel more cohesive with your landing page. The blue color scheme complements the green from your landing page while still maintaining a distinct identity for the login section.
