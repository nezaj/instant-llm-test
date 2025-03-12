// components/UsersPage.tsx
"use client";
import { db, stringToColor } from '@/lib/db';
import Link from 'next/link';
import { useState } from 'react';
import SocialLinks from './SocialLinks';

export default function UsersPage() {
  const { isLoading: authLoading, user } = db.useAuth();
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

  if (error) {
    return <div className="text-red-500 p-4">Error loading users: {error.message}</div>;
  }

  const profiles = data?.profiles || [];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-light">Discover Blogs</h1>
          <p className="text-gray-500">Find and follow other bloggers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profiles.map((profile) => {
          const isCurrentUser = currentUserProfile?.id === profile.id;

          return (
            <div
              key={profile.id}
              className="group"
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
                    <h2 className="text-lg font-normal">@{profile.handle}</h2>
                    {isCurrentUser && (
                      <span className="ml-2 text-gray-400 text-xs">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="mb-4 text-gray-600 line-clamp-3">
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
                  className="text-gray-500 hover:text-black"
                >
                  Go to My Blog →
                </Link>
              ) : (
                <Link
                  href={`/user/${profile.handle}`}
                  className="text-gray-500 hover:text-black"
                >
                  View Blog →
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
      {profiles.length > 0 && (
        <div className="flex justify-between items-center mt-12 text-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-black'}`}
          >
            Previous
          </button>
          <span className="text-gray-500">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={profiles.length < PAGE_SIZE}
            className={`px-4 py-2 ${profiles.length < PAGE_SIZE ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-black'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
