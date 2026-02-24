'use client';
import { PegawaiForm } from '../../../../../components/pegawai-form';
import { getPegawaiById } from '../../../../../lib/actions';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '../../../../../components/ui/skeleton';
import type { Pegawai } from '../../../../../lib/pegawai-data';

export function EditPegawaiForm({ pegawaiId }: { pegawaiId: string }) {
  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPegawai = async () => {
      const result = await getPegawaiById(pegawaiId);
      if (result) {
        setPegawai(result);
      }
      setLoading(false);
    };

    fetchPegawai();
  }, [pegawaiId]);

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
