'use client';
import { StudentForm } from '../../../../../components/student-form';
import { getSiswaById } from '../../../../../lib/actions';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '../../../../../components/ui/skeleton';
import type { Siswa } from '../../../../../lib/data';

export function EditStudentForm({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Siswa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      const result = await getSiswaById(studentId);
      if (result) {
        setStudent(result);
      }
      setLoading(false);
    };

    fetchStudent();
  }, [studentId]);

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
