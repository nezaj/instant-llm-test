// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'] });

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
      <body className={`${inter.className} bg-white text-gray-800`}>
        <header className="py-6 border-b border-gray-100">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-light">
              My Blog Platform
            </Link>
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link href="/" className="text-gray-500 hover:text-gray-800">
                    My Blog
                  </Link>
                </li>
                <li>
                  <Link href="/users" className="text-gray-500 hover:text-gray-800">
                    Discover
                  </Link>
                </li>
                <li>
                  <Link href="/posts/create" className="text-gray-500 hover:text-gray-800">
                    Write
                  </Link>
                </li>
                <li>
                  <Link href="/profile/edit" className="text-gray-500 hover:text-gray-800">
                    Profile
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="py-8">{children}</main>
        <footer className="py-6 text-center text-gray-400 text-sm">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} My Blog Platform
          </div>
        </footer>
      </body>
    </html>
  );
}
