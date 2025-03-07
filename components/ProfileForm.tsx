"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, createProfile, createExamplePosts } from "@/lib/db";
import { id } from "@instantdb/react";

export default function ProfileForm() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  // Redirect if already has profile
  const { data, isLoading: profileLoading } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user?.id } } } } : null
  );

  // Handle redirection in useEffect
  useEffect(() => {
    // Redirect if user already has a profile
    if (data?.profiles && data.profiles.length > 0) {
      router.push("/");
    }

    // Redirect if user isn't authenticated
    if (!authLoading && !user && !profileLoading) {
      router.push("/login");
    }

    // Handle redirection after successful profile creation
    if (shouldRedirect) {
      router.push("/");
    }
  }, [data, user, authLoading, profileLoading, router, shouldRedirect]);

  if (authLoading || profileLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (authError) {
    return <div className="text-red-500 p-4">Error: {authError.message}</div>;
  }

  if (!user) {
    return <div className="flex justify-center p-8">Please sign in first. Redirecting...</div>;
  }

  // If user already has a profile, show loading while redirecting
  if (data?.profiles && data.profiles.length > 0) {
    return <div className="flex justify-center p-8">You already have a profile. Redirecting...</div>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate handle (only allow letters, numbers, underscores, and hyphens)
      if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
        throw new Error("Handle can only contain letters, numbers, underscores, and hyphens");
      }

      // Generate the profile ID first so we can use it later
      const profileId = id();

      // Create profile
      await createProfile(user.id, handle, bio, profileId);

      // Create example posts using the same profile ID
      await createExamplePosts(profileId);

      // Set redirection flag instead of immediate navigation
      setShouldRedirect(true);
    } catch (err: any) {
      console.error("Error creating profile:", err);

      // Handle unique constraint error for handle
      if (err.message?.includes("unique constraint")) {
        setError("This handle is already taken. Please choose another one.");
      } else {
        setError(err.message || "Failed to create profile. Please try again.");
      }

      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Create Your Profile</h1>

      <p className="mb-6 text-gray-600">
        Welcome to the blog platform! Please create your profile to get started.
        We'll also create some example posts for you.
      </p>

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
            autoFocus
          />
          <p className="mt-1 text-sm text-gray-500">
            This will be your unique identifier on the platform.
          </p>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full px-4 py-2 rounded font-medium ${isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
        >
          {isSubmitting ? "Creating Profile..." : "Create Profile"}
        </button>
      </form>
    </div>
  );
}
