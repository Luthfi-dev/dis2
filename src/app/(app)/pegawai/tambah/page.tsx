import { PegawaiForm } from '../../../../components/pegawai-form';

export default function TambahPegawaiPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tambah Data Pegawai Baru</h1>
        <p className="text-muted-foreground">Lengkapi semua sesi formulir untuk menambahkan pegawai baru ke dalam sistem.</p>
      </div>
      <PegawaiForm />
    </div>
  );
}
