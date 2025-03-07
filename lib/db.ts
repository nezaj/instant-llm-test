// lib/db.ts
import { init, id } from '@instantdb/react';
import schema from '../instant.schema';

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema,
});

// Helper functions for blog post operations
export function createPost(title: string, content: string) {
  return db.transact(
    db.tx.posts[id()].update({
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      published: true, // By default, posts are published
    })
  );
}

export function updatePost(postId: string, data: { title?: string; content?: string }) {
  const updateData: any = {
    ...data,
    updatedAt: Date.now(),
  };

  return db.transact(db.tx.posts[postId].update(updateData));
}

export function deletePost(postId: string) {
  return db.transact(db.tx.posts[postId].delete());
}

export type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  published: boolean;
};
