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
