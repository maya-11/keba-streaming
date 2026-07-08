'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth';
import { FullPageLoader } from '@/components/ui/loading-spinner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  );
}
