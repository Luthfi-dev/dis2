'use client';
import { AppHeader } from '../../components/app-header';
import { AppSidebar } from '../../components/app-sidebar';
import { SidebarProvider, SidebarInset } from '../../components/ui/sidebar';
import { useAuth } from '../../hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    if (!loading && !user && isMounted) {
      router.replace('/login');
    }
    return () => {
      isMounted = false;
    };
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="print:hidden">
        <AppSidebar />
      </div>
      <SidebarInset className="bg-background flex flex-col">
        <div className="print:hidden">
          <AppHeader />
        </div>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
