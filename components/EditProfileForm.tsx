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
    } catch (err) {
      console.error("Error updating profile:", err);

      // Handle unique constraint error for handle
      if (err instanceof Error && err.message?.includes("unique constraint")) {
        setError("This handle is already taken. Please choose another one.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to update profile. Please try again.");
      }

      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">Edit Your Profile</h1>

      {error && (
        <div className="text-red-500 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover"
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
            <label className="cursor-pointer bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm transition-colors">
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
                className="text-gray-500 hover:text-gray-800"
              >
                Remove Avatar
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="handle" className="block mb-2 text-gray-700 font-light">
            Handle
          </label>
          <input
            id="handle"
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
            placeholder="your_handle"
            required
          />
        </div>

        <div>
          <label htmlFor="bio" className="block mb-2 text-gray-700 font-light">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400 min-h-[100px]"
            placeholder="Tell us a bit about yourself..."
            required
          />
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-xl font-light mb-4">Social Links</h2>

          {/* Twitter */}
          <div className="mb-4">
            <label htmlFor="twitter" className="block mb-2 text-gray-700 font-light">
              Twitter
            </label>
            <div className="flex">
              <input
                id="twitter"
                type="text"
                value={socialLinks.twitter || ""}
                onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your Twitter username"
              />
              {socialLinks.twitter && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("twitter")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* GitHub */}
          <div className="mb-4">
            <label htmlFor="github" className="block mb-2 text-gray-700 font-light">
              GitHub
            </label>
            <div className="flex">
              <input
                id="github"
                type="text"
                value={socialLinks.github || ""}
                onChange={(e) => handleSocialLinkChange("github", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your GitHub username"
              />
              {socialLinks.github && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("github")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* LinkedIn */}
          <div className="mb-4">
            <label htmlFor="linkedin" className="block mb-2 text-gray-700 font-light">
              LinkedIn
            </label>
            <div className="flex">
              <input
                id="linkedin"
                type="text"
                value={socialLinks.linkedin || ""}
                onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your LinkedIn username"
              />
              {socialLinks.linkedin && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("linkedin")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Instagram */}
          <div className="mb-4">
            <label htmlFor="instagram" className="block mb-2 text-gray-700 font-light">
              Instagram
            </label>
            <div className="flex">
              <input
                id="instagram"
                type="text"
                value={socialLinks.instagram || ""}
                onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your Instagram username"
              />
              {socialLinks.instagram && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("instagram")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="mb-4">
            <label htmlFor="website" className="block mb-2 text-gray-700 font-light">
              Website
            </label>
            <div className="flex">
              <input
                id="website"
                type="text"
                value={socialLinks.website || ""}
                onChange={(e) => handleSocialLinkChange("website", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400"
                placeholder="Your website URL"
              />
              {socialLinks.website && (
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink("website")}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 ${isSubmitting
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gray-800 hover:bg-black text-white transition-colors"}`}
          >
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
      <div className="mt-12 pt-6 border-t border-gray-100 text-center">
        <button
          type="button"
          onClick={async () => {
            if (confirm('Are you sure you want to sign out?')) {
              await db.auth.signOut();
              router.push("/");
            }
          }}
          className="text-gray-500 hover:text-gray-800"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
