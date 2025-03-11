// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My Blog Platform',
  description: 'A simple blog platform built with Next.js, React, and InstantDB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              My Blog Platform
            </Link>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/" className="hover:text-gray-300">
                    My Blog
                  </Link>
                </li>
                <li>
                  <Link href="/users" className="hover:text-gray-300">
                    Discover Blogs
                  </Link>
                </li>
                <li>
                  <Link href="/posts/create" className="hover:text-gray-300">
                    Create Post
                  </Link>
                </li>
                <li>
                  <Link href="/profile/edit" className="hover:text-gray-300">
                    Edit Profile
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="py-8">{children}</main>
        <footer className="bg-gray-100 p-4 border-t">
          <div className="container mx-auto text-center text-gray-500">
            &copy; {new Date().getFullYear()} My Blog Platform
          </div>
        </footer>
      </body>
    </html>
  );
}
