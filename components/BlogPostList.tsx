"use client";

import { db } from '@/lib/db';
import { useState } from 'react';
import Link from 'next/link';

export default function BlogPostList() {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { isLoading, error, data } = db.useQuery({
    posts: {
      $: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        order: {
          createdAt: 'desc' // Show newest posts first
        }
      }
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error.message}</div>;
  }

  const { posts } = data;

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">No blog posts yet.</p>
        <Link
          href="/posts/create"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Your First Post
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Link
          href="/posts/create"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create New Post
        </Link>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold">
              <Link href={`/posts/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
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
