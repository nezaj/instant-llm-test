// components/LandingPage.tsx
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';

export default function LandingPage() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  // If already logged in, redirect to their blog
  if (!isLoading && user) {
    router.push('/');
    return <div className="flex justify-center p-8">Redirecting to your blog...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-12 max-w-3xl">
        <h1 className="text-6xl md:text-7xl font-serif mb-6">
          Human stories & ideas
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          A place to read, write, and deepen your understanding
        </p>

        <div>
          <Link
            href="/login"
            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-full inline-block transition-colors"
          >
            Start creating
          </Link>
        </div>
      </div>

      <div className="hidden md:block flex-1 bg-gradient-to-bl from-emerald-200 to-emerald-400 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[20%] right-[10%] w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute top-[40%] left-[20%] w-20 h-20 rounded-full bg-black"></div>
          <div className="absolute bottom-[30%] right-[30%] w-32 h-32 rounded-full bg-emerald-600"></div>

          {/* Abstract lines */}
          <div className="absolute top-[30%] left-[10%] w-[80%] h-[1px] bg-black transform rotate-12"></div>
          <div className="absolute top-[35%] left-[10%] w-[80%] h-[1px] bg-black transform rotate-[15deg]"></div>
          <div className="absolute top-[70%] left-[5%] w-[90%] h-[1px] bg-black transform -rotate-12"></div>

          {/* Stars/dots */}
          {[...Array(15)].map((_, i) => (
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
