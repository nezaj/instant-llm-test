"use client";

import { db } from '@/lib/db';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BlogPostViewProps {
  postId: string;
}

export default function BlogPostView({ postId }: BlogPostViewProps) {
  const router = useRouter();

  // Get all posts, which we'll use to find the current post and for navigation
  const { isLoading, error, data } = db.useQuery({
    posts: {
      $: {
        order: { createdAt: 'desc' }
      }
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading post...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error.message}</div>;
  }

  // Find the current post from all posts
  const post = data.posts.find(p => p.id === postId);

  // If the post doesn't exist
  if (!post) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  // Find current post index in all posts
  const currentIndex = data.posts.findIndex(p => p.id === postId);

  // Determine next and previous post
  const nextPost = currentIndex > 0 ? data.posts[currentIndex - 1] : null;
  const prevPost = currentIndex < data.posts.length - 1 ? data.posts[currentIndex + 1] : null;

  const handleDeletePost = async () => {
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
      <article>
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <p className="text-gray-500 mt-2">
            Published on {new Date(post.createdAt).toLocaleDateString()}
            {post.updatedAt !== post.createdAt &&
              ` · Updated on ${new Date(post.updatedAt).toLocaleDateString()}`}
          </p>
        </header>

        <div className="prose max-w-none mb-8 whitespace-pre-wrap">
          {post.content}
        </div>

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
      </article>

      {/* Post Navigation */}
      <div className="border-t pt-4 mt-8">
        <div className="flex justify-between">
          <div>
            {prevPost && (
              <Link href={`/posts/${prevPost.id}`} className="text-blue-500 hover:underline">
                ← {prevPost.title}
              </Link>
            )}
          </div>
          <div>
            {nextPost && (
              <Link href={`/posts/${nextPost.id}`} className="text-blue-500 hover:underline">
                {nextPost.title} →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to All Posts
        </Link>
      </div>
    </div>
  );
}
