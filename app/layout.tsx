// app/layout.tsx
"use client";
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { db } from '@/lib/db';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, user } = db.useAuth();
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-800`}>
        <header className="py-6 border-b border-gray-100">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-light">
              My Blog Platform
            </Link>
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link
                    href="/users"
                    className={`text-gray-500 hover:text-gray-800 ${pathname === '/users' ? 'text-gray-800' : ''}`}
                  >
                    Discover
                  </Link>
                </li>

                {!isLoading && user ? (
                  // Navigation for logged-in users
                  <>
                    <li>
                      <Link
                        href="/"
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/' ? 'text-gray-800' : ''}`}
                      >
                        My Blog
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/posts/create"
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/posts/create' ? 'text-gray-800' : ''}`}
                      >
                        Write
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/profile/edit"
                        className={`text-gray-500 hover:text-gray-800 ${pathname === '/profile/edit' ? 'text-gray-800' : ''}`}
                      >
                        Profile
                      </Link>
                    </li>
                  </>
                ) : (
                  // Navigation for guests
                  <li>
                    <Link
                      href="/login"
                      className={`text-gray-500 hover:text-gray-800 ${pathname === '/login' ? 'text-gray-800' : ''}`}
                    >
                      Sign In
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="py-6 text-center text-gray-400 text-sm">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} My Blog Platform
          </div>
        </footer>
      </body>
    </html>
  );
}
