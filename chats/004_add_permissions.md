# Implementing Draft Blog Posts

**human** (Mar 11, 2025, 02:45 PM)

blog_plan.md outlines what I'm trying to build and the next steps.

The documents in guides/*.md contain information on how to use Instant

Let's implement the next set of todos

- [ ] Be able to mark their posts as published or draft
    - [ ] Draft posts are only visible to the author
    - [ ] Draft posts don't show up in the paginated list
    - [ ] Draft posts cannot be navigated to from the next and previous post links

**assistant** (Mar 11, 2025, 02:46 PM)

 Looking at your blog_plan.md and the current implementation files, I can see that you've already completed a significant portion of the blog functionality, including authentication, profile creation, and basic CRUD operations for blog posts.

The "published or draft" feature is partially implemented - you already have a `published` field in the posts schema and UI controls in the blog post form to toggle it. However, there are still some aspects to refine:

1. Ensuring draft posts are only visible to the author
2. Filtering draft posts from the paginated list (for non-authors)
3. Excluding draft posts from the next/previous post navigation

Let's implement these features by updating your permissions and modifying relevant components:

## 1. First, let's update the permissions in `instant.perms.ts`:

#### rewrite Updated Permissions in instant.perms.ts

```typescript
// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  // Define permissions for the posts namespace
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
  // Define permissions for profiles
  profiles: {
    allow: {
      // Profiles are public
      view: "true",
      // Only the owner can update their profile
      update: "auth.id in data.ref('$user.id')",
      // Only the owner can delete their profile
      delete: "auth.id in data.ref('$user.id')"
    }
  },
  // Default permissions (restricts unknown namespaces)
  $default: {
    allow: {
      // Default to requiring authentication for all operations
      view: "auth.id != null",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null"
    }
  }
} satisfies InstantRules;

export default rules;

```



## 2. Update the BlogPostList component to filter draft posts for non-authors:

#### create Updated BlogPostList Component

```typescript
"use client";

import { db } from '@/lib/db';
import { useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from './auth/AuthComponents';

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
          <h1 className="text-3xl font-bold">My Blog</h1>
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

```




## 3. Now, let's update the BlogPostView component to handle draft visibility better:

#### create Updated BlogPostView Component

```typescript
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

  // Get user's other posts for navigation (only published ones or owned by the current user)
  const { data: postsData, isLoading: postsLoading } = db.useQuery(
    profileData?.profiles?.[0]?.id
      ? {
        posts: {
          $: {
            where: { 
              "author.id": profileData.profiles[0].id,
              // No need to filter by 'published' here - permissions will handle it
              // Owner can see all their posts in navigation
            },
            order: { createdAt: 'desc' }
          }
        }
      }
      : null
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
        <h1 className="text-2xl font-bold mb-4">Post not available</h1>
        <p className="mb-4">This post may be a draft or has been removed.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  // If the post doesn't exist
  if (!data.posts || data.posts.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const post = data.posts[0];

  // Check if this is a draft post and if the user owns it
  const isOwner = post.author && profileData?.profiles?.[0]?.id === post.author.id;

  // Only use user's posts for navigation if they're the owner
  const userPosts = isOwner && postsData?.posts ? postsData.posts : [];

  // For non-owners, filter out draft posts for navigation
  const navigationPosts = isOwner 
    ? userPosts 
    : userPosts.filter(p => p.published);

  // Find current post index in navigation posts
  const currentIndex = navigationPosts.findIndex(p => p.id === postId);

  // Determine next and previous post
  const nextPost = currentIndex > 0 ? navigationPosts[currentIndex - 1] : null;
  const prevPost = currentIndex < navigationPosts.length - 1 ? navigationPosts[currentIndex + 1] : null;

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
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to My Posts
        </Link>
        {user && <SignOutButton />}
      </div>

      <article>
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            {!post.published && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                Draft
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-2">
            Published by {post.author?.handle || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString()}
            {post.updatedAt !== post.createdAt &&
              ` · Updated on ${new Date(post.updatedAt).toLocaleDateString()}`}
          </p>
        </header>

        <div className="prose max-w-none mb-8 whitespace-pre-wrap">
          {post.content}
        </div>

        {isOwner && (
          <div className="flex gap-3 mb-8">
            <Link
              href={`/posts/edit/${postId}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Edit Post
            </Link>
            <button
              onClick={handleDeletePost}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete Post
            </button>
          </div>
        )}
      </article>

      {/* Post Navigation - only show published posts for non-owners */}
      {navigationPosts.length > 1 && (
        <div className="border-t pt-4 mt-8">
          <div className="flex justify-between">
            <div>
              {nextPost && (
                <Link href={`/posts/${nextPost.id}`} className="text-blue-500 hover:underline">
                  ← {nextPost.title}
                </Link>
              )}
            </div>
            <div>
              {prevPost && (
                <Link href={`/posts/${prevPost.id}`} className="text-blue-500 hover:underline">
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



## 4. Let's also modify the home page to make sure it only shows published posts for non-authors:

#### create Updated Home Page Component

```typescript
"use client";
import BlogPostList from '@/components/BlogPostList';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function Home() {
  return (
    <AuthGuard>
      <BlogPostList />
    </AuthGuard>
  );
}

```



## Implementation Summary and Next Steps

I've updated several components to handle draft posts properly:

1. **Updated Permissions (instant.perms.ts)**: 
   - Added rules to ensure draft posts are only visible to the author
   - Set up proper permissions for profiles and other operations

2. **Updated BlogPostList Component**:
   - Relies on permissions to filter posts, showing both published and draft posts for the owner

3. **Updated BlogPostView Component**:
   - Handles permission errors gracefully when users try to access draft posts they don't own
   - Filters navigational links to exclude draft posts for non-owners
   - Shows draft indicators for the post owner

4. **Home Page**:
   - No change needed here since the list component already works correctly

### Next steps for you to implement:

1. **Push the permission rules to InstantDB**:
   ```bash
   npx instant-cli@latest push perms
   ```

2. **Replace the existing components** with the updated versions I've provided:
   - Copy the content from the `updated-permissions` artifact to `instant.perms.ts`
   - Copy the content from the `updated-blog-post-list` artifact to `components/BlogPostList.tsx`
   - Copy the content from the `updated-blog-post-view` artifact to `components/BlogPostView.tsx`

With these changes, your blog platform will now properly handle draft posts according to your requirements:
- ✓ Draft posts are only visible to the author
- ✓ Draft posts are excluded from navigation for non-authors
- ✓ Draft UI indicators are shown to help authors identify their drafts

For future enhancements in your todo list:
- Adding social links to profiles (consider adding a JSON field to the profile schema)
- Adding profile pictures (consider using an external image hosting service and storing URLs)

Would you like me to help with any of these upcoming features as well?

**human** (Mar 11, 2025, 03:01 PM)

I think this will work but we need to add some additional features to easily test it

- [ ] Users can see a page with links to other users' blogs
- [ ] Users can see another users blog posts as a paginated list
- [ ] Users can see a single blog post from another user
    - [ ] Navigate to the next and previous post
    - [ ] Navigation respects the published/draft status of the posts, i.e. if
      the next post is a draft, it won't show up in the paginated list and
      cannot be navigated to from the next and previous post links

**assistant** (Mar 11, 2025, 03:03 PM)

 I'll help you implement these additional features to make it easier to test the blog visibility and navigation. Let's build out functionality for users to discover and view other users' blogs.

## 1. First, let's create a page that shows links to all users' blogs:

#### create Users Directory Page

```typescript
"use client";
import { db } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from '@/components/auth/AuthComponents';

export default function UsersPage() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Query all profiles with pagination
  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        order: {
          createdAt: 'desc'
        }
      }
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Discover Blogs</h1>
          <p className="text-gray-600">Find and follow other bloggers</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-blue-500 hover:underline">
            My Blog
          </Link>
          {user && <SignOutButton />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="border p-4 rounded shadow hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ 
                  backgroundColor: stringToColor(profile.handle),
                }}
              >
                {profile.handle.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">@{profile.handle}</h2>
                <p className="text-gray-500 text-sm">
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="mb-4 line-clamp-3 text-gray-700">
              {profile.bio}
            </p>
            <Link
              href={`/user/${profile.handle}`}
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              View Blog
            </Link>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center p-8">
          <p className="text-lg text-gray-500">No users found.</p>
        </div>
      )}

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
          disabled={profiles.length < PAGE_SIZE}
          className={`px-4 py-2 rounded ${profiles.length < PAGE_SIZE ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Helper function to generate a consistent color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

```



## 2. Let's create a page to view another user's blog:

#### create User Blog Page Component

```typescript
"use client";
import { db } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOutButton } from '@/components/auth/AuthComponents';

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
      }
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
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <Link href="/users" className="text-blue-500 hover:underline">
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/users" className="text-blue-500 hover:underline">
            ← Back to Users
          </Link>
          {isOwnBlog && (
            <Link href="/" className="text-blue-500 hover:underline">
              Switch to My View
            </Link>
          )}
        </div>
        {user && <SignOutButton />}
      </div>

      <div className="mb-8 flex items-center space-x-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: stringToColor(profile.handle) }}
        >
          {profile.handle.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">@{profile.handle}'s Blog</h1>
          <p className="text-gray-600 mt-1">{profile.bio}</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p className="text-lg text-gray-500">
            {isOwnBlog 
              ? "You don't have any published posts yet."
              : `@${profile.handle} hasn't published any posts yet.`
            }
          </p>
          {isOwnBlog && (
            <Link
              href="/posts/create"
              className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create Your First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border p-4 rounded shadow">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">
                  <Link href={`/posts/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                {!post.published && isOwnBlog && (
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
              <div className="mt-3">
                <Link
                  href={`/posts/${post.id}`}
                  className="text-blue-500 hover:underline"
                >
                  Read More
                </Link>
                {isOwnBlog && (
                  <>
                    <Link
                      href={`/posts/edit/${post.id}`}
                      className="ml-3 text-green-500 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="ml-3 text-red-500 hover:underline"
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
      )}
    </div>
  );

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
}

// Helper function to generate a consistent color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

```





## 3. Now, let's create the corresponding page.tsx files for routing:

#### create Users Directory Route

```typescript
"use client";
import UsersPage from '@/components/UsersPage';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function UsersRoute() {
  return (
    <AuthGuard>
      <UsersPage />
    </AuthGuard>
  );
}

```





#### create User Blog Route

```typescript
"use client";
import { use } from 'react';
import UserBlogPage from '@/components/UserBlogPage';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function UserBlogRoute({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  
  return (
    <AuthGuard>
      <UserBlogPage handle={handle} />
    </AuthGuard>
  );
}

```





## 4. Let's update the navigation in our app layout to include links to the new pages:

#### create Updated App Layout

```typescript
// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <header className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              My Blog Platform
            </Link>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/" className="hover:text-gray-300">
                    My Blog
                  </Link>
                </li>
                <li>
                  <Link href="/users" className="hover:text-gray-300">
                    Discover Blogs
                  </Link>
                </li>
                <li>
                  <Link href="/posts/create" className="hover:text-gray-300">
                    Create Post
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="py-8">{children}</main>
        <footer className="bg-gray-100 p-4 border-t">
          <div className="container mx-auto text-center text-gray-500">
            &copy; {new Date().getFullYear()} My Blog Platform
          </div>
        </footer>
      </body>
    </html>
  );
}

```






## 5. Let's add the UsersPage component:

#### create UsersPage Component

```typescript
"use client";
import { db } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from '@/components/auth/AuthComponents';

export default function UsersPage() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Query all profiles with pagination
  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        order: {
          createdAt: 'desc'
        }
      }
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Discover Blogs</h1>
          <p className="text-gray-600">Find and follow other bloggers</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-blue-500 hover:underline">
            My Blog
          </Link>
          {user && <SignOutButton />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="border p-4 rounded shadow hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ 
                  backgroundColor: stringToColor(profile.handle),
                }}
              >
                {profile.handle.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">@{profile.handle}</h2>
                <p className="text-gray-500 text-sm">
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="mb-4 line-clamp-3 text-gray-700">
              {profile.bio}
            </p>
            <Link
              href={`/user/${profile.handle}`}
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              View Blog
            </Link>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center p-8">
          <p className="text-lg text-gray-500">No users found.</p>
        </div>
      )}

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
          disabled={profiles.length < PAGE_SIZE}
          className={`px-4 py-2 rounded ${profiles.length < PAGE_SIZE ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Helper function to generate a consistent color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

```







## 6. Finally, let's add the UserBlogPage component:

#### create UserBlogPage Component

```typescript
"use client";
import { db } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOutButton } from '@/components/auth/AuthComponents';

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
      }
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
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <Link href="/users" className="text-blue-500 hover:underline">
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/users" className="text-blue-500 hover:underline">
            ← Back to Users
          </Link>
          {isOwnBlog && (
            <Link href="/" className="text-blue-500 hover:underline">
              Switch to My View
            </Link>
          )}
        </div>
        {user && <SignOutButton />}
      </div>

      <div className="mb-8 flex items-center space-x-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: stringToColor(profile.handle) }}
        >
          {profile.handle.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">@{profile.handle}'s Blog</h1>
          <p className="text-gray-600 mt-1">{profile.bio}</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p className="text-lg text-gray-500">
            {isOwnBlog 
              ? "You don't have any published posts yet."
              : `@${profile.handle} hasn't published any posts yet.`
            }
          </p>
          {isOwnBlog && (
            <Link
              href="/posts/create"
              className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create Your First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border p-4 rounded shadow">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">
                  <Link href={`/posts/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                {!post.published && isOwnBlog && (
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
              <div className="mt-3">
                <Link
                  href={`/posts/${post.id}`}
                  className="
```

**human** (Mar 11, 2025, 03:07 PM)

Continue

**assistant** (Mar 11, 2025, 03:08 PM)

 Let me fix the truncated UserBlogPage component and complete it:

#### create UserBlogPage Component (Complete)

```typescript
"use client";
import { db } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOutButton } from '@/components/auth/AuthComponents';

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
      }
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
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <Link href="/users" className="text-blue-500 hover:underline">
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/users" className="text-blue-500 hover:underline">
            ← Back to Users
          </Link>
          {isOwnBlog && (
            <Link href="/" className="text-blue-500 hover:underline">
              Switch to My View
            </Link>
          )}
        </div>
        {user && <SignOutButton />}
      </div>

      <div className="mb-8 flex items-center space-x-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: stringToColor(profile.handle) }}
        >
          {profile.handle.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">@{profile.handle}'s Blog</h1>
          <p className="text-gray-600 mt-1">{profile.bio}</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p className="text-lg text-gray-500">
            {isOwnBlog 
              ? "You don't have any published posts yet."
              : `@${profile.handle} hasn't published any posts yet.`
            }
          </p>
          {isOwnBlog && (
            <Link
              href="/posts/create"
              className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create Your First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border p-4 rounded shadow">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">
                  <Link href={`/posts/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                {!post.published && isOwnBlog && (
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
              <div className="mt-3">
                <Link
                  href={`/posts/${post.id}`}
                  className="text-blue-500 hover:underline"
                >
                  Read More
                </Link>
                {isOwnBlog && (
                  <>
                    <Link
                      href={`/posts/edit/${post.id}`}
                      className="ml-3 text-green-500 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="ml-3 text-red-500 hover:underline"
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
      )}
    </div>
  );

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
}

// Helper function to generate a consistent color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

```



## 7. Create the page.tsx routes for the new directories:

#### create Users Route File (app/users/page.tsx)

```typescript
"use client";
import UsersPage from '@/components/UsersPage';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function UsersRoute() {
  return (
    <AuthGuard>
      <UsersPage />
    </AuthGuard>
  );
}

```





#### create User Blog Route File (app/user/[handle]/page.tsx)

```typescript
"use client";
import { use } from 'react';
import UserBlogPage from '@/components/UserBlogPage';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function UserBlogRoute({ params }: { params: { handle: string } }) {
  const { handle } = params;
  
  return (
    <AuthGuard>
      <UserBlogPage handle={handle} />
    </AuthGuard>
  );
}

```






## Implementation Summary and Next Steps

I've created all the necessary files to implement the additional features for testing the blog visibility and navigation. Here's what I've added:

1. **User Directory Page** (`/users`):
   - Shows a grid of all users' profiles
   - Each profile card has a link to view that user's blog

2. **User Blog Page** (`/user/[handle]`):
   - Shows a specific user's blog posts
   - Respects draft/published status - only author can see their own drafts
   - Includes proper pagination and author controls

3. **Updated Navigation**:
   - Added links in the header to navigate between different sections
   - Added "Discover Blogs" section to find other users

4. **Permission Handling**:
   - The permissions system handles visibility of draft posts
   - When viewing another user's blog, only published posts are shown

### Files to Copy to Your Project

To implement these features, you'll need to:

1. Create these new files:
   - `components/UsersPage.tsx` (from `users-page-component` artifact)
   - `components/UserBlogPage.tsx` (from `user-blog-page-component-fixed` artifact)
   - `app/users/page.tsx` (from `users-route-file` artifact)
   - `app/user/[handle]/page.tsx` (from `user-handle-route-file` artifact)

2. Update these existing files:
   - `app/layout.tsx` (from `updated-layout` artifact)
   - `instant.perms.ts` (from `updated-permissions` artifact)
   - `components/BlogPostList.tsx` (from `updated-blog-post-list` artifact)
   - `components/BlogPostView.tsx` (from `updated-blog-post-view` artifact)

3. Push the permission rules to InstantDB:
   ```bash
   npx instant-cli@latest push perms
   ```

### Testing Your Implementation

After implementing these changes, you should be able to:

1. Create both draft and published posts as a user
2. Visit the `/users` page to see other users
3. Click on another user's profile to view their blog
4. Verify that you can only see their published posts, not their drafts
5. Verify that the next/previous post navigation only includes published posts when viewing another user's blog

This implementation satisfies all your requirements:
- ✓ Users can see a page with links to other users' blogs
- ✓ Users can see another user's blog posts as a paginated list
- ✓ Users can see a single blog post from another user
- ✓ Navigation respects the published/draft status of posts

Would you like me to make any adjustments to these components?

**human** (Mar 11, 2025, 03:19 PM)

This mostly works! One thing I notice though is when I navigate to another blog it doesn't seem to let me navigate their blog posts on the blog view page

**assistant** (Mar 11, 2025, 03:20 PM)

 I see the issue! When viewing another user's blog posts, the navigation isn't working correctly in the post view. Let's fix that by updating the BlogPostView component to properly handle navigation when viewing someone else's blog.

The problem is that the current navigation logic is looking at the logged-in user's posts for navigation rather than the post author's posts. Let's fix that:

#### rewrite Untitled

```
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
        <h1 className="text-2xl font-bold mb-4">Post not available</h1>
        <p className="mb-4">This post may be a draft or has been removed.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  // If the post doesn't exist
  if (!data.posts || data.posts.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link href="/" className="text-blue-500 hover:underline">
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
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        {isOwner ? (
          <Link href="/" className="text-blue-500 hover:underline">
            ← Back to My Posts
          </Link>
        ) : (
          <Link href={`/user/${authorProfile?.handle}`} className="text-blue-500 hover:underline">
            ← Back to @{authorProfile?.handle}'s Posts
          </Link>
        )}
        {user && <SignOutButton />}
      </div>

      <article>
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            {!post.published && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                Draft
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-2">
            Published by {authorProfile?.handle || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString()}
            {post.updatedAt !== post.createdAt &&
              ` · Updated on ${new Date(post.updatedAt).toLocaleDateString()}`}
          </p>
        </header>

        <div className="prose max-w-none mb-8 whitespace-pre-wrap">
          {post.content}
        </div>

        {isOwner && (
          <div className="flex gap-3 mb-8">
            <Link
              href={`/posts/edit/${postId}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Edit Post
            </Link>
            <button
              onClick={handleDeletePost}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete Post
            </button>
          </div>
        )}
      </article>

      {/* Post Navigation - show navigation for all author's posts that the current user can see */}
      {authorPosts.length > 1 && (
        <div className="border-t pt-4 mt-8">
          <div className="flex justify-between">
            <div>
              {nextPost && (
                <Link href={`/posts/${nextPost.id}`} className="text-blue-500 hover:underline">
                  ← {nextPost.title}
                </Link>
              )}
            </div>
            <div>
              {prevPost && (
                <Link href={`/posts/${prevPost.id}`} className="text-blue-500 hover:underline">
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



The issue has been fixed! The main problem was in how we were loading posts for navigation. Here are the key changes I made:

1. **Loading the right posts for navigation:**
   - Instead of using the logged-in user's posts, we now use the post author's posts for navigation
   - We first get the author ID from the current post, then query for that author's posts
   - This ensures that when you're viewing another user's blog post, the navigation shows their other posts

2. **Proper filtering for draft posts:**
   - We only include published posts in navigation links when viewing someone else's blog
   - If you're viewing your own blog, you'll see navigation to both published and draft posts

3. **Back button context awareness:**
   - The "Back" link now correctly points to either your own posts list or the author's blog page
   - It displays "Back to My Posts" when viewing your own post
   - It displays "Back to @username's Posts" when viewing someone else's post

These changes should make the navigation work properly when viewing other users' blogs while still maintaining the draft/published visibility rules. When viewing another user's blog post, you'll be able to navigate to their other published posts, but not their drafts.

To implement this fix, just replace your `components/BlogPostView.tsx` file with the content from the `updated-blog-post-view` artifact.

Is there anything else you'd like me to explain or adjust in this implementation?

**human** (Mar 11, 2025, 03:24 PM)

This worked great. As another touch, when we are on the discover page can we add a visual indicator for my own blog?

**assistant** (Mar 11, 2025, 03:24 PM)

 That's a great suggestion! Let's add a visual indicator on the Discover page to highlight your own blog. I'll update the UsersPage component to include this feature:

#### rewrite Updated UsersPage Component with Self-Indicator

```typescript
"use client";
import { db } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from '@/components/auth/AuthComponents';

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

  // Query all profiles with pagination
  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        order: {
          createdAt: 'desc'
        }
      }
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Discover Blogs</h1>
          <p className="text-gray-600">Find and follow other bloggers</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-blue-500 hover:underline">
            My Blog
          </Link>
          {user && <SignOutButton />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => {
          const isCurrentUser = currentUserProfile?.id === profile.id;
          
          return (
            <div 
              key={profile.id} 
              className={`border p-4 rounded shadow hover:shadow-md transition-shadow ${isCurrentUser ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ 
                    backgroundColor: stringToColor(profile.handle),
                  }}
                >
                  {profile.handle.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center">
                    <h2 className="text-xl font-semibold">@{profile.handle}</h2>
                    {isCurrentUser && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="mb-4 line-clamp-3 text-gray-700">
                {profile.bio}
              </p>
              {isCurrentUser ? (
                <Link
                  href="/"
                  className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Go to My Blog
                </Link>
              ) : (
                <Link
                  href={`/user/${profile.handle}`}
                  className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  View Blog
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
          disabled={profiles.length < PAGE_SIZE}
          className={`px-4 py-2 rounded ${profiles.length < PAGE_SIZE ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Helper function to generate a consistent color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

```



Perfect! I've added several visual indicators to help you identify your own blog on the Discover page:

1. **"You" Badge**:
   - A small blue badge that says "You" next to your handle

2. **Highlighted Card Background**:
   - Your card has a light blue background color
   - The border is also styled with a blue tint

3. **Profile Picture Highlight**:
   - Your profile picture has a blue ring around it

4. **Different Button Text**:
   - For your profile, the button says "Go to My Blog" instead of "View Blog"
   - Clicking it takes you to the "/", which is your personalized blog view, rather than the public view

These visual cues make it immediately obvious which blog is yours when browsing the list of users.

To implement this change, simply replace your `components/UsersPage.tsx` file with the content from the `updated-users-page` artifact.

Is there anything else you'd like to enhance or modify? Perhaps adding a count of published posts for each user on the discover page?
