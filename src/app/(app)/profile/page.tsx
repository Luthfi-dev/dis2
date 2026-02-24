'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, User, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';

const profileSchema = z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter.'),
    email: z.string().email('Email tidak valid.'),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    avatar: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Password tidak cocok.",
    path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

async function uploadFile(file: File, directory: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', directory);
    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error('Upload failed');
    }
    const { url } = await response.json();
    return url;
}

export default function ProfilePage() {
    const { user, updateUser, loading } = useAuth();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
    });
    
    const avatarUrl = watch('avatar');

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            });
        }
    }, [user, reset]);

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadFile(file, 'users');
            setValue('avatar', url, { shouldDirty: true });
            toast({ title: 'Sukses!', description: 'Foto profil berhasil diunggah. Klik "Simpan Perubahan" untuk menerapkan.' });
        } catch (error) {
            toast({ title: 'Gagal', description: 'Gagal mengunggah foto profil.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    }

    const onSubmit = (data: ProfileFormData) => {
        startTransition(async () => {
            const payload: any = { 
                id: user.id, 
                name: data.name, 
                email: data.email,
                avatar: data.avatar,
            };
            if (data.password) {
                payload.password = data.password;
            }

            const result = await updateUser(payload);
            if (result.success) {
                toast({
                    title: 'Sukses!',
                    description: 'Profil Anda berhasil diperbarui.',
                });
            } else {
                toast({
                    title: 'Gagal',
                    description: result.error || 'Terjadi kesalahan saat memperbarui profil.',
                    variant: 'destructive',
                });
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profil Pengguna</h1>
                    <p className="text-muted-foreground">Kelola informasi profil Anda di sini.</p>
                </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader className='items-center text-center'>
                         <div className="relative">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={avatarUrl || user.avatar} alt={user.name} data-ai-hint="person" />
                                <AvatarFallback>
                                    <User className="h-12 w-12"/>
                                </AvatarFallback>
                            </Avatar>
                            <Button asChild size="sm" variant="outline" className="absolute bottom-4 right-0 rounded-full h-8 w-8 p-0">
                                <label htmlFor="avatar-upload" className="cursor-pointer">
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                                    <span className="sr-only">Unggah Foto</span>
                                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
                                </label>
                            </Button>
                         </div>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.email} ({user.role})</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama</Label>
                            <Input id="name" {...register('name')} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" {...register('email')} disabled />
                             {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="password">Password Baru</Label>
                            <Input id="password" type="password" {...register('password')} placeholder="Kosongkan jika tidak ingin diubah" />
                             {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                            <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="Ulangi password baru" />
                            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                        </div>
                         <input type="hidden" {...register('avatar')} />
                    </CardContent>
                    <CardFooter className='border-t px-6 py-4'>
                        <Button type="submit" disabled={isPending || isUploading}>
                            {(isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
