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
