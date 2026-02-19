import { StudentForm } from '../../../../components/student-form';

export default function TambahSiswaPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tambah Data Siswa Baru</h1>
        <p className="text-muted-foreground">Lengkapi semua sesi formulir untuk menambahkan siswa baru ke dalam sistem.</p>
      </div>
      <StudentForm />
    </div>
  );
}
