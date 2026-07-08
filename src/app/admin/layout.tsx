'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { FullPageLoader } from '@/components/ui/loading-spinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();

  if (pathname === '/admin/login') return <>{children}</>;
  if (loading) return <FullPageLoader />;

  return (
    <div className="flex min-h-screen bg-dark-950">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 md:ml-64">{children}</main>
    </div>
  );
}
