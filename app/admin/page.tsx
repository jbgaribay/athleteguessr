import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminContent from '@/components/admin-content';

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Not logged in - redirect to login
  if (!user) {
    redirect('/auth/login');
  }
  
  // Logged in but not admin - redirect to home
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/');
  }
  
  return user;
}

export default async function AdminPage() {
  const user = await checkAdmin();
  
  return <AdminContent userEmail={user.email || ''} />;
}