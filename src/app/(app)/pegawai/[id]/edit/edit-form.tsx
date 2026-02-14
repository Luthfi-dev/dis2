
'use client';
import { PegawaiForm } from '@/components/pegawai-form';
import { getPegawaiById } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Pegawai } from '@/lib/pegawai-data';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EditPegawaiForm({ pegawaiId }: { pegawaiId: string }) {
  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchPegawai = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPegawaiById(pegawaiId);
        if (isMounted) {
          if (result) {
            setPegawai(result);
          } else {
            setError("Data pegawai tidak ditemukan.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Fetch pegawai error:", err);
          toast({
              title: "Gagal Mengambil Data",
              description: "Tidak dapat mengambil data pegawai.",
              variant: "destructive"
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPegawai();

    return () => {
      isMounted = false;
    };
  }, [pegawaiId, toast]);
  
  if (error) {
    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold text-destructive">Gagal Memuat Formulir</h2>
            <p className="text-muted-foreground mt-2 mb-6">{error}</p>
            <Button asChild>
                <Link href="/pegawai">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Daftar
                </Link>
            </Button>
        </div>
    )
  }

  if (loading) {
    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-6">
                <Skeleton className="h-9 w-1/2 mb-2" />
                <Skeleton className="h-5 w-1/3" />
            </div>
            <Skeleton className="h-[600px] w-full" />
        </div>
    )
  }

  if (!pegawai) {
    notFound();
  }
  
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Data Pegawai</h1>
        <p className="text-muted-foreground">Perbarui data untuk {pegawai.pegawai_nama}.</p>
      </div>
      <PegawaiForm pegawaiData={pegawai} />
    </div>
  );
}
