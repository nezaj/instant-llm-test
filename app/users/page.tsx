// app/users/page.tsx
"use client";
import UsersPage from '@/components/UsersPage';
import { PublicRoute } from '@/components/auth/AuthComponents';

export default function UsersRoute() {
  return (
    <PublicRoute>
      <UsersPage />
    </PublicRoute>
  );
}
