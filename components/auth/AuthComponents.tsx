"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Call useQuery unconditionally - pass null as the query if no user
  // This ensures the hook is ALWAYS called in the same order
  const { data, isLoading: profileLoading } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null
  );

  // Handle redirection in useEffect, not during render
  useEffect(() => {
    if (user && data && (!data.profiles || data.profiles.length === 0) && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/create-profile");
    }
  }, [user, data, router, isRedirecting]);

  // Handle loading states
  if (authLoading || (user && profileLoading)) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // Handle auth errors
  if (authError) {
    return <div className="text-red-500 p-4">Authentication error: {authError.message}</div>;
  }

  // If no user, return login component
  if (!user) {
    return <Login />;
  }

  // Show loading if we're redirecting
  if (isRedirecting || (!data?.profiles || data.profiles.length === 0)) {
    return <div className="flex justify-center p-8">Redirecting to profile creation...</div>;
  }

  // If we have a user with a profile, render children
  return <>{children}</>;
}

export function Login() {
  const [sentEmail, setSentEmail] = useState("");

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="max-w-md w-full border p-8 rounded shadow-lg">
        {!sentEmail ? (
          <EmailStep onSendEmail={setSentEmail} />
        ) : (
          <CodeStep sentEmail={sentEmail} />
        )}
      </div>
    </div>
  );
}

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await db.auth.sendMagicCode({ email });
      onSendEmail(email);
    } catch (err: any) {
      setError(err.body?.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sign In</h2>
        <p className="text-gray-600">
          Enter your email, and we'll send you a verification code. We'll create
          an account for you if you don't already have one.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="email" className="block mb-1 font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 rounded font-medium ${isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
      >
        {isLoading ? "Sending..." : "Send Code"}
      </button>
    </form>
  );
}

function CodeStep({ sentEmail }: { sentEmail: string }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const router = useRouter();

  // Handle navigation after successful login
  useEffect(() => {
    if (loginSuccess) {
      router.push(hasProfile ? "/" : "/create-profile");
    }
  }, [loginSuccess, hasProfile, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });

      // After successful sign-in, check if the user has a profile
      const userData = await db.getAuth();
      if (!userData || !userData.id) {
        throw new Error("Authentication failed");
      }

      const { data } = await db.queryOnce({
        profiles: {
          $: {
            where: { "$user.id": userData.id }
          }
        }
      });

      setHasProfile(!!data.profiles && data.profiles.length > 0);
      setLoginSuccess(true);
    } catch (err: any) {
      setError(err.body?.message || "Invalid code. Please try again.");
      setCode("");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Enter Verification Code</h2>
        <p className="text-gray-600">
          We sent a code to <strong>{sentEmail}</strong>. Please check your email and enter the code below.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="code" className="block mb-1 font-medium">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter your code..."
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 rounded font-medium ${isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </button>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await db.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
    >
      Sign Out
    </button>
  );
}
