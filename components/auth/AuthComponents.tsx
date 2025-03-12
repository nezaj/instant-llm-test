"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';
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
    <div className="min-h-[calc(100vh-160px)] flex">
      {/* Left side - form */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          {!sentEmail ? (
            <EmailStep onSendEmail={setSentEmail} />
          ) : (
            <CodeStep sentEmail={sentEmail} />
          )}
        </div>
      </div>

      {/* Right side - decorative graphics */}
      <div className="hidden md:block flex-1 bg-gradient-to-tr from-blue-100 to-blue-300 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {/* Circles */}
          <div className="absolute bottom-[20%] left-[10%] w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute top-[30%] right-[20%] w-24 h-24 rounded-full bg-black"></div>
          <div className="absolute top-[60%] right-[15%] w-32 h-32 rounded-full bg-blue-600"></div>

          {/* Abstract lines */}
          <div className="absolute top-[25%] left-[10%] w-[80%] h-[1px] bg-black transform -rotate-12"></div>
          <div className="absolute top-[30%] left-[10%] w-[80%] h-[1px] bg-black transform -rotate-[8deg]"></div>
          <div className="absolute top-[80%] left-[5%] w-[90%] h-[1px] bg-black transform rotate-12"></div>

          {/* Stars/dots */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-black rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            ></div>
          ))}
        </div>
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
        <h2 className="text-3xl font-light mb-2">Sign In</h2>
        <p className="text-gray-600">
          Enter your email, and we'll send you a verification code. We'll create
          an account for you if you don't already have one.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="email" className="block mb-2 font-light">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-gray-800 hover:bg-black text-white"
          }`}
      >
        {isLoading ? "Sending..." : "Send Code"}
      </button>

      <div className="text-center mt-4">
        <Link href="/" className="text-gray-500 hover:text-gray-800">
          Back to home
        </Link>
      </div>
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
        <h2 className="text-3xl font-light mb-2">Enter Verification Code</h2>
        <p className="text-gray-600">
          We sent a code to <strong>{sentEmail}</strong>. Please check your email and enter the code below.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label htmlFor="code" className="block mb-2 font-light">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400"
          placeholder="Enter your code..."
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-gray-800 hover:bg-black text-white"
          }`}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-gray-500 hover:text-gray-800"
        >
          Try a different email
        </button>
      </div>
    </form>
  );
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading } = db.useAuth();

  // For public routes, we don't need to check for profiles or redirect
  // We just need to pass through the children with the auth context

  if (authLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // Always render children, whether user is authenticated or not
  return <>{children}</>;
}
