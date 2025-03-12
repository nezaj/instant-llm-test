# User Profile Picture Functionality

**human** (Mar 11, 2025, 06:32 PM)

Let's implement the next set of todos

- [ ] Users can upload a profile picture which is displayed on their profile page
    - [ ] Profile picture is displayed on the users blog index page
    - [ ] Users can edit their profile picture
    - [ ] Users can delete their profile picture
    - [ ] When there is no profile picture, a random color and the first letter of their
      handle is displayed. This color is generated using a hash of the handle
    - [ ] Permissions are set so that users can only edit their own profile
      picture

**assistant** (Mar 11, 2025, 06:34 PM)

 I'll implement the requested features for profile picture functionality. Let's break this down into steps:

1. First, update the schema to include avatar information
2. Update the permissions
3. Add profile picture upload/edit/delete functionality to EditProfileForm
4. Update other components to display the profile picture

Let's start by updating the schema:

```typescript
// instant.schema.ts
import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    profiles: i.entity({
      handle: i.string().unique().indexed(),
      bio: i.string(),
      createdAt: i.date().indexed(),
      socialLinks: i.json(), // Add this field to store social links
    }),
    posts: i.entity({
      title: i.string().indexed(),
      content: i.string(),
      createdAt: i.date().indexed(),
      updatedAt: i.date(),
      published: i.boolean().indexed(), // For draft functionality
    }),
  },
  links: {
    // Link profiles to users (one-to-one)
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
    // Link posts to users (many-to-one)
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'posts' },
    },
    // Link profile avatars (one-to-one)
    profileAvatar: {
      forward: { on: 'profiles', has: 'one', label: 'avatar' },
      reverse: { on: '$files', has: 'one', label: 'profile' },
    },
  },
})

// This helps TypeScript display better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
```

Now, let's update the permissions to include file operations:

```typescript
// instant.perms.ts
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
      // Only the owner can create their profile
      create: "auth.id in data.ref('$user.id')",
      // Only the owner can update their profile
      update: "auth.id in data.ref('$user.id')",
      // Only the owner can delete their profile
      delete: "auth.id in data.ref('$user.id')"
    }
  },
  // Define permissions for files
  $files: {
    allow: {
      // Everyone can view files (needed for avatars to be public)
      view: "true",
      // Only authenticated users can create files
      create: "auth.id != null",
      // Only the owner of the profile can delete the avatar file
      delete: "auth.id in data.ref('profile.$user.id')"
    }
  }
} satisfies InstantRules;

export default rules;
```

Now, let's update the helper functions in `lib/db.ts` to include avatar management:

```typescript
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

export function updatePost(postId: string, data: { title?: string; content?: string; published?: boolean }) {
  const updateData: any = {
    ...data,
    updatedAt: Date.now(),
  };

  return db.transact(db.tx.posts[postId].update(updateData));
}

export function deletePost(postId: string) {
  return db.transact(db.tx.posts[postId].delete());
}

// Profile functions
export function createProfile(userId: string, handle: string, bio: string, profileId: string = id(), socialLinks: SocialLinks = {}) {
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
export function updateProfile(profileId: string, data: { handle?: string; bio?: string; socialLinks?: SocialLinks }) {
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
```

Now, let's update the `EditProfileForm` component to include avatar management:

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
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Edit Your Profile</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Avatar Preview" 
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
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
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
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
                className="text-red-500 hover:text-red-700"
              >
                Remove Avatar
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="handle" className="block mb-1 font-medium">
            Handle
          </label>
          <input
            id="handle"
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="your_handle"
            required
          />
        </div>

        <div>
          <label htmlFor="bio" className="block mb-1 font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 min-h-[100px]"
            placeholder="Tell us a bit about yourself..."
            required
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h2 className="text-lg font-semibold mb-3">Social Links</h2>

          {/* Twitter */}
          <div className="mb-3">
            <label htmlFor="twitter" className="block mb-1 font-medium">
              Twitter
            </label>
            <div className="flex">
              <input
                id="twitter"
                type="text"
                value={socialLinks.twitter || ""}
                onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                className="w-full border border-gray-300 rounded-l px-3 py-2"
                placeholder="Your Twitter username"
              />
              {socialLinks.twitter && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("twitter")}
                  className="bg-red-500 text-white px-3 rounded-r"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* GitHub */}
          <div className="mb-3">
            <label htmlFor="github" className="block mb-1 font-medium">
              GitHub
            </label>
            <div className="flex">
              <input
                id="github"
                type="text"
                value={socialLinks.github || ""}
                onChange={(e) => handleSocialLinkChange("github", e.target.value)}
                className="w-full border border-gray-300 rounded-l px-3 py-2"
                placeholder="Your GitHub username"
              />
              {socialLinks.github && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("github")}
                  className="bg-red-500 text-white px-3 rounded-r"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* LinkedIn */}
          <div className="mb-3">
            <label htmlFor="linkedin" className="block mb-1 font-medium">
              LinkedIn
            </label>
            <div className="flex">
              <input
                id="linkedin"
                type="text"
                value={socialLinks.linkedin || ""}
                onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                className="w-full border border-gray-300 rounded-l px-3 py-2"
                placeholder="Your LinkedIn username"
              />
              {socialLinks.linkedin && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("linkedin")}
                  className="bg-red-500 text-white px-3 rounded-r"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Instagram */}
          <div className="mb-3">
            <label htmlFor="instagram" className="block mb-1 font-medium">
              Instagram
            </label>
            <div className="flex">
              <input
                id="instagram"
                type="text"
                value={socialLinks.instagram || ""}
                onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                className="w-full border border-gray-300 rounded-l px-3 py-2"
                placeholder="Your Instagram username"
              />
              {socialLinks.instagram && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("instagram")}
                  className="bg-red-500 text-white px-3 rounded-r"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="mb-3">
            <label htmlFor="website" className="block mb-1 font-medium">
              Website
            </label>
            <div className="flex">
              <input
                id="website"
                type="text"
                value={socialLinks.website || ""}
                onChange={(e) => handleSocialLinkChange("website", e.target.value)}
                className="w-full border border-gray-300 rounded-l px-3 py-2"
                placeholder="Your website URL"
              />
              {socialLinks.website && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("website")}
                  className="bg-red-500 text-white px-3 rounded-r"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded font-medium ${isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
          >
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

Now, let's update the `BlogPostList` component to display the avatar:

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
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
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
        <div className="flex items-center space-x-4">
          {profile.avatar ? (
            <img 
              src={profile.avatar.url} 
              alt={`${profile.handle}'s avatar`}
              className="w-16 h-16 rounded-full object-cover"
            

**human** (Mar 11, 2025, 06:35 PM)

Continue

**assistant** (Mar 11, 2025, 06:36 PM)

 Let me continue with the `BlogPostList.tsx` file and then finish the rest of the implementation:

```typescript
// components/BlogPostList.tsx (continued)
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
}
```

Now let's update the `UserBlogPage` component to display the avatar:

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

      <div className="mb-8">
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
            <h1 className="text-3xl font-bold">@{profile.handle}'s Blog</h1>
            <p className="text-gray-600 mt-1">{profile.bio}</p>

            {/* Display social links */}
            {profile.socialLinks && <SocialLinks links={profile.socialLinks} className="mt-2" />}
          </div>
        </div>

        {/* Edit Profile Button (only show if it's the user's own blog) */}
        {isOwnBlog && (
          <div className="mt-4">
            <Link
              href="/profile/edit"
              className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded border"
            >
              Edit Profile
            </Link>
          </div>
        )}
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
}
```

Finally, let's update the `UsersPage` component to display avatars:

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
              className={`border p-4 rounded shadow hover:shadow-md transition-shadow`}
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

              {/* Display social links */}
              {profile.socialLinks && (
                <div className="mb-4">
                  <SocialLinks links={profile.socialLinks} />
                </div>
              )}

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
```

These changes implement all the requested functionality:

1. Added the ability to upload a profile picture
2. Added the ability to edit and delete profile pictures
3. Added a fallback avatar display with the user's first initial on a colored background
4. Updated the profile display in all components to show the avatar
5. Implemented permissions to ensure users can only modify their own avatars
6. Added proper error handling and validation for avatar uploads
7. Made sure the avatar images are responsive and properly styled

The implementation follows best practices with InstantDB and maintains clean React component structure. The stringToColor function is used to consistently generate a background color for the fallback avatar based on the user's handle.

**human** (Mar 11, 2025, 06:37 PM)

BlogPostList.tsx got cut off, can you give me the full file

**assistant** (Mar 11, 2025, 06:37 PM)

 I apologize for not providing the complete file. Here's the full `BlogPostList.tsx` file:

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
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
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
}
```

This complete file includes all the functionality for displaying the user's blog posts with their profile avatar. If the user has uploaded an avatar, it will be displayed; otherwise, it will show a fallback avatar with their first initial on a colored background generated from their handle.
