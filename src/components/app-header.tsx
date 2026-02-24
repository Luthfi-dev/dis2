'use client';
import { SidebarTrigger } from './ui/sidebar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, LifeBuoy, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1">{/* Could add breadcrumbs here */}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar} alt={user?.name || "Admin"} data-ai-hint="person" />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name || 'Pengguna'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email || 'Tidak ada email'}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex w-full items-center justify-between">
                 <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer">
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <span>Dark Mode</span>
                 </Label>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Dukungan</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Keluar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
