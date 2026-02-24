'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useAppSettings } from '../../../hooks/use-app-settings';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid.'),
  password: z.string().min(1, 'Password tidak boleh kosong.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Illustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 0.1 }} />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>
      <rect width="400" height="300" fill="hsl(var(--background))" />
      <path d="M-50,350 Q150,50 450,250 L450,350 L-50,350 Z" fill="url(#grad1)" />
      <g transform="translate(200 150) scale(1.2)" filter="url(#glow)">
        <path d="M-40 20 L0 -50 L40 20 L0 5 Z" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="25s" repeatCount="indefinite"/>
        </path>
        <circle cx="-50" cy="-30" r="8" fill="hsl(var(--accent))" opacity="0.7">
             <animate attributeName="cy" values="-30;-40;-30" dur="5s" repeatCount="indefinite" />
        </circle>
        <path d="M50 30 L60 20 L70 30" stroke="hsl(var(--secondary-foreground))" strokeWidth="2" fill="none" opacity="0.6">
             <animateTransform attributeName="transform" type="translate" values="0 0; 5 5; 0 0" dur="7s" repeatCount="indefinite"/>
        </path>
      </g>
    </svg>
  );
}

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const { login } = useAuth();
  const { settings } = useAppSettings();
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = (data: LoginFormData) => {
    startTransition(async () => {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast({ title: 'Login Berhasil!', description: 'Anda akan diarahkan ke dashboard.' });
        router.replace('/dashboard');
      } else {
        toast({
          title: 'Login Gagal',
          description: result.error || 'Email atau password salah.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <Card className="mx-auto w-[380px] max-w-sm shadow-2xl">
          <CardHeader className="text-center">
             <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 relative overflow-hidden">
                {settings?.app_logo_url ? (
                    <Image src={settings.app_logo_url} alt="Logo Aplikasi" layout="fill" objectFit="cover" className="rounded-full" />
                ) : (
                    <GraduationCap className="h-8 w-8 text-primary" />
                )}
            </div>
            <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
            <CardDescription>
              Masuk ke akun {settings?.app_title || "EduArchive"} Anda untuk melanjutkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@gmail.com"
                  {...register('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="******"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masuk
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="h-full w-full object-cover dark:brightness-[0.8]">
          <Illustration />
        </div>
      </div>
    </div>
  );
}
