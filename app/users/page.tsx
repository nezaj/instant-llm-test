"use client";
import UsersPage from '@/components/UsersPage';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function UsersRoute() {
  return (
    <AuthGuard>
      <UsersPage />
    </AuthGuard>
  );
}
