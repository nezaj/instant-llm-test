// app/profile/edit/page.tsx
"use client";
import EditProfileForm from '@/components/EditProfileForm';
import { AuthGuard } from '@/components/auth/AuthComponents';

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <EditProfileForm />
    </AuthGuard>
  );
}
