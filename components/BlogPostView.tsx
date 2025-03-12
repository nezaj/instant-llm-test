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
  const { user } = db.useAuth();

  // Get user's profile to check ownership (only if logged in)
  const { data: profileData } = db.useQuery(
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
  const { data: postsData } = db.useQuery(
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
            ← Back to @{authorProfile.handle}&apos;s Posts
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
