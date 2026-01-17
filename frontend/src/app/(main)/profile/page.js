'use client';
import Profile from '@/components/tools/Profile';
import { useUser } from '../layout'; 

export default function ProfilePage() {
  const user = useUser();
  
  if (!user) return null; // Wait for layout to provide user
  return <Profile user={user} />;
}