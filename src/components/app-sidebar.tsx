'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from './ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { Button } from './ui/button';
import { BookCopy, GraduationCap, Plus, Users, Settings, LogOut, ChevronsUpDown, Database, ShieldCheck, Briefcase, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/use-auth';
import { useAppSettings } from '../hooks/use-app-settings';
import Image from 'next/image';


const bukuIndukMenuItems = [
  { href: '/siswa', label: 'Lihat Daftar Siswa', icon: Users },
  { href: '/siswa/tambah', label: 'Tambah Data Siswa', icon: Plus },
];

const bukuIndukPegawaiMenuItems = [
    { href: '/pegawai', label: 'Lihat Daftar Pegawai', icon: Users },
    { href: '/pegawai/tambah', label: 'Tambah Data Pegawai', icon: Plus },
];

const adminMenuItems = [
    { href: '/admin/users', label: 'Kelola Pengguna', icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();
  const router = useRouter();
  const [isBukuIndukOpen, setIsBukuIndukOpen] = useState(pathname.startsWith('/siswa'));
  const [isBukuIndukPegawaiOpen, setIsBukuIndukPegawaiOpen] = useState(pathname.startsWith('/pegawai'));
  const [isAdminOpen, setIsAdminOpen] = useState(pathname.startsWith('/admin'));
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (setOpenMobile) {
      setOpenMobile(false);
    }
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={handleLinkClick}>
          <div
            className={cn(
                "h-10 w-10 shrink-0 rounded-full group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
                "flex items-center justify-center bg-primary/10 border border-primary/20 relative overflow-hidden"
            )}
          >
            {settings?.app_logo_url ? (
                <Image src={settings.app_logo_url} alt="Logo Aplikasi" fill objectFit="cover" />
            ) : (
                <GraduationCap className="h-6 w-6 text-primary" />
            )}
          </div>
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            {settings?.app_title || 'EduArchive'}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
            <SidebarMenuItem>
                 <Link href="/dashboard" className="w-full" onClick={handleLinkClick}>
                    <SidebarMenuButton
                        isActive={pathname === '/dashboard'}
                        tooltip={{
                            children: 'Dashboard',
                            className: 'group-data-[collapsible=icon]:flex hidden',
                        }}
                    >
                         <LayoutDashboard />
                         <span>Dashboard</span>
                    </SidebarMenuButton>
                 </Link>
            </SidebarMenuItem>
        </SidebarMenu>

        <Collapsible open={isBukuIndukOpen} onOpenChange={setIsBukuIndukOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className="w-full justify-between"
              isActive={pathname.startsWith('/siswa')}
              tooltip={{
                children: 'Buku Induk Siswa',
                className: 'group-data-[collapsible=icon]:flex hidden',
              }}
            >
              <div className="flex items-center gap-2">
                <BookCopy />
                <span>Buku Induk Siswa</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu className="ml-4 mt-1 space-y-1 border-l border-sidebar-border py-1 pl-4">
              {bukuIndukMenuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <Link href={item.href} className="w-full" onClick={handleLinkClick}>
                    <SidebarMenuButton
                      variant="ghost"
                      size="sm"
                      isActive={pathname === item.href}
                       className={cn(
                        'w-full justify-start',
                        pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </Collapsible>
        
        <Collapsible open={isBukuIndukPegawaiOpen} onOpenChange={setIsBukuIndukPegawaiOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className="w-full justify-between"
              isActive={pathname.startsWith('/pegawai')}
              tooltip={{
                children: 'Buku Induk Pegawai',
                className: 'group-data-[collapsible=icon]:flex hidden',
              }}
            >
              <div className="flex items-center gap-2">
                <Briefcase />
                <span>Buku Induk Pegawai</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu className="ml-4 mt-1 space-y-1 border-l border-sidebar-border py-1 pl-4">
              {bukuIndukPegawaiMenuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <Link href={item.href} className="w-full" onClick={handleLinkClick}>
                    <SidebarMenuButton
                      variant="ghost"
                      size="sm"
                      isActive={pathname === item.href}
                       className={cn(
                        'w-full justify-start',
                        pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </Collapsible>

         {user?.role === 'superadmin' && (
            <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen} className="w-full">
            <CollapsibleTrigger asChild>
                <SidebarMenuButton
                className="w-full justify-between"
                isActive={pathname.startsWith('/admin')}
                tooltip={{
                    children: 'Administrasi',
                    className: 'group-data-[collapsible=icon]:flex hidden',
                }}
                >
                <div className="flex items-center gap-2">
                    <ShieldCheck />
                    <span>Administrasi</span>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                <SidebarMenu className="ml-4 mt-1 space-y-1 border-l border-sidebar-border py-1 pl-4">
                {adminMenuItems.map((item, index) => (
                    <SidebarMenuItem key={index}>
                    <Link href={item.href} className="w-full" onClick={handleLinkClick}>
                        <SidebarMenuButton
                        variant="ghost"
                        size="sm"
                        isActive={pathname === item.href}
                        className={cn(
                            'w-full justify-start',
                            pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground'
                        )}
                        >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </CollapsibleContent>
            </Collapsible>
        )}
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
