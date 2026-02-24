'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, KeyRound, Copy } from 'lucide-react';
import { generateHash } from '../../../lib/auth';

export default function GeneratePasswordPage() {
    const [password, setPassword] = useState('');
    const [hashedPassword, setHashedPassword] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!password) {
            toast({
                title: 'Input Kosong',
                description: 'Silakan masukkan password untuk di-generate.',
                variant: 'destructive',
            });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateHash(password);
            if (result.success && result.hash) {
                setHashedPassword(result.hash);
                toast({
                    title: 'Sukses!',
                    description: 'Hash password berhasil dibuat.',
                });
            } else {
                 toast({
                    title: 'Gagal',
                    description: result.error || 'Terjadi kesalahan saat membuat hash.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
             toast({
                title: 'Error',
                description: 'Terjadi kesalahan pada server.',
                variant: 'destructive',
            });
        }
        setIsGenerating(false);
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(hashedPassword);
        toast({
            title: 'Tersalin!',
            description: 'Hash password berhasil disalin ke clipboard.',
        });
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Password Hash Generator</CardTitle>
                    <CardDescription>
                        Gunakan halaman ini untuk membuat hash bcrypt yang aman untuk password Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password Teks Biasa</Label>
                        <Input
                            id="password"
                            type="text"
                            placeholder="Masukkan password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Hash
                    </Button>
                </CardContent>
                {hashedPassword && (
                    <CardFooter className="flex flex-col items-start gap-2 rounded-lg border bg-muted/70 p-4">
                        <Label>Hash yang Dihasilkan:</Label>
                        <div className="relative w-full">
                             <Input
                                readOnly
                                value={hashedPassword}
                                className="pr-10 text-xs bg-background"
                            />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                       
                        <p className="text-xs text-muted-foreground">
                            Salin hash ini dan perbarui kolom 'password' di database Anda.
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
