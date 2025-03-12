// lib/db.ts
import { init, id } from '@instantdb/react';
import schema from '../instant.schema';

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema,
});

// Helper functions for blog post operations
export function createPost(profileId: string, title: string, content: string, published: boolean = true) {
  const postId = id();
  return db.transact([
    db.tx.posts[postId].update({
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      published,
    }),
    db.tx.posts[postId].link({ author: profileId }),
  ]);
}

export function updatePost(
  postId: string,
  data: { title?: string; content?: string; published?: boolean }
) {
  const updateData = {
    ...data,
    updatedAt: Date.now(),
  };

  return db.transact(db.tx.posts[postId].update(updateData));
}

export function deletePost(postId: string) {
  return db.transact(db.tx.posts[postId].delete());
}

// Profile functions
export function createProfile(
  userId: string,
  handle: string,
  bio: string,
  profileId: string = id(),
  socialLinks: SocialLinks = {}
) {
  return db.transact([
    db.tx.profiles[profileId].update({
      handle,
      bio,
      createdAt: Date.now(),
      socialLinks
    }),
    // Link profile to user
    db.tx.profiles[profileId].link({ $user: userId }),
  ]);
}

// Update profile function
export function updateProfile(
  profileId: string,
  data: { handle?: string; bio?: string; socialLinks?: SocialLinks }
) {
  return db.transact(db.tx.profiles[profileId].update(data));
}

// Avatar functions
export async function uploadAvatar(profileId: string, file: File) {
  try {
    // Get existing avatar to delete it if it exists
    const { data: profileData } = await db.queryOnce({
      profiles: {
        $: { where: { id: profileId } },
        avatar: {}
      }
    });

    const profile = profileData.profiles[0];
    const existingAvatar = profile?.avatar;

    // Generate a unique path for the avatar
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `avatars/${profileId}/${Date.now()}.${extension}`;

    // Upload the new file
    const { data: fileData } = await db.storage.uploadFile(path, file, {
      contentType: file.type || 'image/jpeg'
    });

    // Delete the old avatar file if it exists
    if (existingAvatar) {
      try {
        // Unlink the old avatar from the profile
        await db.transact(db.tx.profiles[profileId].unlink({ avatar: existingAvatar.id }));
        // Delete the old file
        await db.storage.delete(existingAvatar.path);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
        // Continue even if deleting the old avatar fails
      }
    }

    // Link the new avatar to the profile
    await db.transact(db.tx.profiles[profileId].link({ avatar: fileData.id }));

    return fileData;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

export async function deleteAvatar(profileId: string) {
  try {
    // Get the avatar
    const { data } = await db.queryOnce({
      profiles: {
        $: { where: { id: profileId } },
        avatar: {}
      }
    });

    const profile = data.profiles[0];
    const avatar = profile?.avatar;

    if (!avatar) {
      // No avatar to delete
      return null;
    }

    // Unlink the avatar from the profile
    await db.transact(db.tx.profiles[profileId].unlink({ avatar: avatar.id }));

    // Delete the file
    await db.storage.delete(avatar.path);

    return true;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
}

// Function to create example posts for new users
export async function createExamplePosts(profileId: string) {
  const post1Id = id();
  const post2Id = id();
  const post3Id = id();

  return db.transact([
    // Example post 1
    db.tx.posts[post1Id].update({
      title: "Welcome to My Blog",
      content: "This is my first blog post! I'm excited to share my thoughts and ideas here.\n\nFeel free to browse around and check out my content.",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      published: true,
    }),
    db.tx.posts[post1Id].link({ author: profileId }),

    // Example post 2
    db.tx.posts[post2Id].update({
      title: "Getting Started with Blogging",
      content: "Blogging is a great way to express yourself and share your knowledge with the world.\n\nHere are some tips to get started:\n- Choose topics you're passionate about\n- Write regularly\n- Engage with your readers\n- Don't be afraid to show your personality",
      createdAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      updatedAt: Date.now() - 1000 * 60 * 30,
      published: true,
    }),
    db.tx.posts[post2Id].link({ author: profileId }),

    // Example post 3
    db.tx.posts[post3Id].update({
      title: "My First Draft",
      content: "This is a draft post that only I can see. I'll continue working on it later.",
      createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
      updatedAt: Date.now() - 1000 * 60 * 60,
      published: false, // Draft post
    }),
    db.tx.posts[post3Id].link({ author: profileId }),
  ]);
}

// Helper function to generate a consistent color from a string
export function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

// Define the structure of social links
export interface SocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
  [key: string]: string | undefined;
}

export type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  published: boolean;
  author?: {
    id: string;
    handle: string;
  };
};

export type Profile = {
  id: string;
  handle: string;
  bio: string;
  createdAt: number;
  socialLinks?: SocialLinks;
  avatar?: {
    id: string;
    path: string;
    url: string;
  };
  $user?: {
    id: string;
    email: string;
  };
};
