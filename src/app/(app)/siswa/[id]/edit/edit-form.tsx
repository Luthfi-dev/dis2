
'use client';
import { StudentForm } from '@/components/student-form';
import { getSiswaById } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Siswa } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EditStudentForm({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Siswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getSiswaById(studentId);
        if (isMounted) {
          if (result) {
            setStudent(result);
          } else {
            setError("Data siswa tidak ditemukan.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Fetch student error:", err);
          const errorMessage = `Gagal memuat data. Kesalahan: ${err.message || 'Tidak dapat terhubung ke server database.'}`;
          setError(errorMessage);
          toast({
              title: "Koneksi Gagal",
              description: err.message || "Terjadi kesalahan pada server.",
              variant: "destructive"
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudent();
    
    return () => {
        isMounted = false;
    };
  }, [studentId, toast]);

  if (error) {
    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold text-destructive">Gagal Memuat Formulir</h2>
            <p className="text-muted-foreground mt-2 mb-6">{error}</p>
            <Button asChild>
                <Link href="/siswa">
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

  if (!student) {
    // This case should be handled by the error state, but as a fallback:
    notFound();
  }
  
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Data Siswa</h1>
        <p className="text-muted-foreground">Perbarui data untuk {student.siswa_namaLengkap}.</p>
      </div>
      <StudentForm studentData={student} />
    </div>
  );
}
