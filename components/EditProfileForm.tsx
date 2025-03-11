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
