# Implementing Social Links for Blog Platform

**human** (Mar 11, 2025, 04:14 PM)

Let's implement the next set of todos

[ ] Users can add social links (twitter, github, etc) which are displayed on their blog index page
[ ] Social links are displayed on the users blog index page
[ ] Users can edit their social links
[ ] Users can delete their social links
[ ] Permissions are set so that users can only edit their own social links

**assistant** (Mar 11, 2025, 04:16 PM)

 I'll help you implement the social links feature for the blog platform. Let's break this down into steps:

1. First, update the schema to include social links
2. Update the profile form to allow adding/editing social links
3. Display social links on the user's blog page
4. Set up proper permissions

Let's get started!

## 1. Update the Schema

First, let's modify the schema to include social links:

```typescript
// instant.schema.ts
import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
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
  },
})

// This helps TypeScript display better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
```

## 2. Update Types in lib/db.ts

Let's update our `Profile` type to include social links:

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
  $user?: {
    id: string;
    email: string;
  };
};
```

## 3. Create a EditProfilePage Component

Now let's create a page for editing the profile including social links:

```typescript
// app/profile/edit/page.tsx
"use client";
import EditProfileForm from '@/components/EditProfileForm';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <EditProfileForm />
    </AuthGuard>
  );
}
```

## 4. Create the EditProfileForm Component

```typescript
// components/EditProfileForm.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, updateProfile, SocialLinks } from "@/lib/db";

export default function EditProfileForm() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: "",
    github: "",
    linkedin: "",
    instagram: "",
    website: "",
  });
  const router = useRouter();

  // Get user profile
  const { data, isLoading: profileLoading } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user?.id } } } } : null
  );

  // Load profile data when it's available
  useEffect(() => {
    if (data?.profiles && data.profiles.length > 0) {
      const profile = data.profiles[0];
      setHandle(profile.handle);
      setBio(profile.bio || "");
      
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
      await updateProfile(data.profiles[0].id, {
        handle,
        bio,
        socialLinks: cleanedSocialLinks
      });

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

## 5. Create a SocialLinks Component

Let's create a reusable component for displaying social links:

```typescript
// components/SocialLinks.tsx
"use client";

import React from 'react';
import { SocialLinks as SocialLinksType } from '@/lib/db';

interface SocialLinksProps {
  links: SocialLinksType;
  className?: string;
}

export default function SocialLinks({ links, className = "" }: SocialLinksProps) {
  if (!links || Object.keys(links).length === 0) {
    return null;
  }

  return (
    <div className={`flex space-x-3 ${className}`}>
      {links.twitter && (
        <a 
          href={`https://twitter.com/${links.twitter}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-600"
          title={`Twitter: @${links.twitter}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z" />
          </svg>
        </a>
      )}
      
      {links.github && (
        <a 
          href={`https://github.com/${links.github}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-800 hover:text-gray-600"
          title={`GitHub: ${links.github}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      )}
      
      {links.linkedin && (
        <a 
          href={`https://linkedin.com/in/${links.linkedin}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-700 hover:text-blue-900"
          title={`LinkedIn: ${links.linkedin}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </a>
      )}
      
      {links.instagram && (
        <a 
          href={`https://instagram.com/${links.instagram}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-800"
          title={`Instagram: @${links.instagram}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </a>
      )}
      
      {links.website && (
        <a 
          href={links.website.startsWith('http') ? links.website : `https://${links.website}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-800"
          title="Personal Website"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm10 12c0 .685-.07 1.354-.202 2h-3.853c.121-1.283.129-2.621 0-4h3.853c.132.646.202 1.315.202 2zm-.84-5h-3.295c-.571-2.001-1.452-3.686-2.536-4.795 2.376.577 4.466 1.85 5.831 4.795zm-10.498-4.991c1.615.373 3.091 2.399 3.936 4.991h-3.936v-4.991zm0 5.991h4.546c.144 1.273.163 2.689 0 4h-4.546v-4zm0 9h3.936c-.845 2.592-2.321 4.618-3.936 4.991v-4.991zm-2.662 4.991c-1.615-.373-3.091-2.399-3.936-4.991h3.936v4.991zm0-5.991h-4.546c-.144-1.273-.163-2.689 0-4h4.546v4zm0-9h-3.936c.845-2.592 2.321-4.618 3.936-4.991v4.991zm2.288-5.886c-1.084 1.109-1.965 2.795-2.536 4.795h-3.295c1.366-2.945 3.456-4.218 5.831-4.795zm-6.831 9.886c0-.685.07-1.354.202-2h3.853c-.121 1.283-.129 2.621 0 4h-3.853c-.132-.646-.202-1.315-.202-2zm.84 5h3.295c.571 2.001 1.452 3.686 2.536 4.795-2.376-.577-4.466-1.85-5.831-4.795z" />
          </svg>
        </a>
      )}
    </div>
  );
}
```

## 6. Update the UserBlogPage Component to Display Social Links

Now let's update `UserBlogPage.tsx` to display social links:

```typescript
// components/UserBlogPage.tsx
"use client";
import { db } from '@/lib/db';
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
      }

**human** (Mar 11, 2025, 04:17 PM)

Continue

**assistant** (Mar 11, 2025, 04:18 PM)

 Let's continue with updating the UserBlogPage component to display social links and complete the other components needed for this feature:

```typescript
// components/UserBlogPage.tsx (continued)
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

      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: stringToColor(profile.handle) }}
          >
            {profile.handle.charAt(0).toUpperCase()}
          </div>
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

## 7. Update the BlogPostList Component to Show an Edit Profile Link

```typescript
// components/BlogPostList.tsx (partial update)
"use client";

import { db } from '@/lib/db';
import { useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from './auth/AuthComponents';
import SocialLinks from './SocialLinks';

export default function BlogPostList() {
  // Existing code...

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
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

      {/* Rest of the component remains unchanged */}
    </div>
  );

  // Rest of the component...
}
```

## 8. Update the User Card in UsersPage to Show Social Links

```typescript
// components/UsersPage.tsx (partial update)
"use client";
import { db } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from '@/components/auth/AuthComponents';
import SocialLinks from './SocialLinks';

export default function UsersPage() {
  // Existing code...

  return (
    <div className="container mx-auto p-4">
      {/* Header remains unchanged */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => {
          const isCurrentUser = currentUserProfile?.id === profile.id;

          return (
            <div
              key={profile.id}
              className={`border p-4 rounded shadow hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold`}
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

      {/* Pagination remains unchanged */}
    </div>
  );

  // Rest of the component...
}
```

## 9. Update the Permissions File

Finally, let's update the permissions to ensure that only owners can edit their own profiles:

```typescript
// instant.perms.ts
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
} satisfies InstantRules;

export default rules;
```

## 10. Update the App Layout to Include Profile Edit Link

```typescript
// app/layout.tsx (partial update)
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
                <li>
                  <Link href="/profile/edit" className="hover:text-gray-300">
                    Edit Profile
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

## Summary

Here's a summary of what we've implemented:

1. Added a `socialLinks` field to the profile schema using JSON type to store social media information
2. Created an `EditProfileForm` component allowing users to add, edit, and delete their social links
3. Created a reusable `SocialLinks` component to display social media links with icons
4. Updated `UserBlogPage` to display the social links on a user's blog page
5. Updated `BlogPostList` to show social links and an edit profile link
6. Updated the `UsersPage` to show social links in user cards
7. Updated permissions to ensure that only owners can edit their own profiles
8. Added an 'Edit Profile' link to the application's navigation bar

This implementation provides a complete solution for users to:
- Add social links (Twitter, GitHub, LinkedIn, Instagram, Website)
- Edit their social links
- Delete their social links
- View social links on profile pages
- All with proper permissions to ensure security

Permissions are set up so that users can only edit their own social links, which is handled by the InstantDB permissions system.

**human** (Mar 11, 2025, 04:20 PM)

I said no partial updates, please give me full files

**assistant** (Mar 11, 2025, 04:21 PM)

 I apologize for providing partial updates. You're right, I should provide complete files. Let me provide you with the full files for each component I updated:

## 1. The schema file (instant.schema.ts)

```typescript
// instant.schema.ts
import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
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
  },
})

// This helps TypeScript display better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
```

## 2. The db.ts file with updated types

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
  $user?: {
    id: string;
    email: string;
  };
};
```

## 3. The SocialLinks component

```typescript
// components/SocialLinks.tsx
"use client";

import React from 'react';
import { SocialLinks as SocialLinksType } from '@/lib/db';

interface SocialLinksProps {
  links: SocialLinksType;
  className?: string;
}

export default function SocialLinks({ links, className = "" }: SocialLinksProps) {
  if (!links || Object.keys(links).length === 0) {
    return null;
  }

  return (
    <div className={`flex space-x-3 ${className}`}>
      {links.twitter && (
        <a 
          href={`https://twitter.com/${links.twitter}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-600"
          title={`Twitter: @${links.twitter}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z" />
          </svg>
        </a>
      )}
      
      {links.github && (
        <a 
          href={`https://github.com/${links.github}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-800 hover:text-gray-600"
          title={`GitHub: ${links.github}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      )}
      
      {links.linkedin && (
        <a 
          href={`https://linkedin.com/in/${links.linkedin}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-700 hover:text-blue-900"
          title={`LinkedIn: ${links.linkedin}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </a>
      )}
      
      {links.instagram && (
        <a 
          href={`https://instagram.com/${links.instagram}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-800"
          title={`Instagram: @${links.instagram}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </a>
      )}
      
      {links.website && (
        <a 
          href={links.website.startsWith('http') ? links.website : `https://${links.website}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-800"
          title="Personal Website"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm10 12c0 .685-.07 1.354-.202 2h-3.853c.121-1.283.129-2.621 0-4h3.853c.132.646.202 1.315.202 2zm-.84-5h-3.295c-.571-2.001-1.452-3.686-2.536-4.795 2.376.577 4.466 1.85 5.831 4.795zm-10.498-4.991c1.615.373 3.091 2.399 3.936 4.991h-3.936v-4.991zm0 5.991h4.546c.144 1.273.163 2.689 0 4h-4.546v-4zm0 9h3.936c-.845 2.592-2.321 4.618-3.936 4.991v-4.991zm-2.662 4.991c-1.615-.373-3.091-2.399-3.936-4.991h3.936v4.991zm0-5.991h-4.546c-.144-1.273-.163-2.689 0-4h4.546v4zm0-9h-3.936c.845-2.592 2.321-4.618 3.936-4.991v4.991zm2.288-5.886c-1.084 1.109-1.965 2.795-2.536 4.795h-3.295c1.366-2.945 3.456-4.218 5.831-4.795zm-6.831 9.886c0-.685.07-1.354.202-2h3.853c-.121 1.283-.129 2.621 0 4h-3.853c-.132-.646-.202-1.315-.202-2zm.84 5h3.295c.571 2.001 1.452 3.686 2.536 4.795-2.376-.577-4.466-1.85-5.831-4.795z" />
          </svg>
        </a>
      )}
    </div>
  );
}
```

## 4. The Edit Profile Page

```typescript
// app/profile/edit/page.tsx
"use client";
import EditProfileForm from '@/components/EditProfileForm';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <EditProfileForm />
    </AuthGuard>
  );
}
```

## 5. The Edit Profile Form Component

```typescript
// components/EditProfileForm.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, updateProfile, SocialLinks } from "@/lib/db";

export default function EditProfileForm() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: "",
    github: "",
    linkedin: "",
    instagram: "",
    website: "",
  });
  const router = useRouter();

  // Get user profile
  const { data, isLoading: profileLoading } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user?.id } } } } : null
  );

  // Load profile data when it's available
  useEffect(() => {
    if (data?.profiles && data.profiles.length > 0) {
      const profile = data.profiles[0];
      setHandle(profile.handle);
      setBio(profile.bio || "");
      
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
      await updateProfile(data.profiles[0].id, {
        handle,
        bio,
        socialLinks: cleanedSocialLinks
      });

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

## 6. The Updated BlogPostList Component

```typescript
// components/BlogPostList.tsx
"use client";

import { db } from '@/lib/db';
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
          order:

**human** (Mar 11, 2025, 04:22 PM)

Continue

**assistant** (Mar 11, 2025, 04:23 PM)

 Let me continue with the full BlogPostList.tsx component:

```typescript
// components/BlogPostList.tsx
"use client";

import { db } from '@/lib/db';
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
          
          {/* Display social links */}
          {profile.socialLinks && <SocialLinks links={profile.socialLinks} className="mt-2" />}
          
          {/* Edit Profile Link */}
          <div className="mt-2">
            <Link href="/profile/edit" className="text-sm text-blue-500 hover:underline">
              Edit Profile
            </Link>
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

## 7. The Updated UserBlogPage Component

```typescript
// components/UserBlogPage.tsx
"use client";
import { db } from '@/lib/db';
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

      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: stringToColor(profile.handle) }}
          >
            {profile.handle.charAt(0).toUpperCase()}
          </div>
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

## 8. The Updated UsersPage Component

```typescript
// components/UsersPage.tsx
"use client";
import { db } from '@/lib/db';
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
              className={`border p-4 rounded shadow hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold`}
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

## 9. The Updated Layout Component

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
                <li>
                  <Link href="/profile/edit" className="hover:text-gray-300">
                    Edit Profile
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

## 10. The Updated Permissions File

```typescript
// instant.perms.ts
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
} satisfies InstantRules;

export default rules;
```

Now you have all the complete files needed to implement the social links feature. The implementation covers all the requirements:

1. Users can add social links (twitter, github, etc.) which are displayed on their blog index page
2. Social links are displayed on the users blog index page 
3. Users can edit their social links
4. Users can delete their social links 
5. Permissions are set so that users can only edit their own social links

To implement this, you need to:

1. Update the schema to include the socialLinks field
2. Create/update the components to support adding, editing, and displaying social links
3. Ensure permissions are set correctly

All these pieces are provided in the full files above. Let me know if you need any clarification or have any questions!
