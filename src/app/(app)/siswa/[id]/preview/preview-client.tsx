'use client';
import { getSiswaById } from '@/lib/actions';
import { Siswa } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Printer, User, Calendar, MapPin, Droplet, Stethoscope, BookOpen, Building, Phone, Home, Users, Languages, HeartHandshake, Map, School, GraduationCap, History, CheckCircle2, XCircle, FileText, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getDesaName, getKecamatanName, getKabupatenName, getProvinceName } from '@/lib/wilayah';
import { cn } from '@/lib/utils';

function InfoRow({ label, value, icon, className }: { label: string, value?: React.ReactNode, icon?: React.ElementType, className?: string }) {
    const Icon = icon;
    return (
        <div className={cn("flex items-start text-sm", className)}>
            {Icon && <Icon className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground" />}
            <span className="font-medium w-40 text-muted-foreground shrink-0">{label}</span>
            <span className="mr-2">:</span>
            <span className="flex-1 break-words">{value || '-'}</span>
        </div>
    )
}

export function PreviewSiswaClient({ id }: { id: string }) {
  const [student, setStudent] = useState<Siswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [alamatKk, setAlamatKk] = useState({provinsi: '', kabupaten: '', kecamatan: '', desa: ''});
  const [domisili, setDomisili] = useState({provinsi: '', kabupaten: '', kecamatan: '', desa: ''});

  useEffect(() => {
    let isMounted = true;
    const fetchStudent = async () => {
        const result = await getSiswaById(id);
        if (result && isMounted) {
            setStudent(result);
            const [kkProv, kkKab, kkKec, kkDes, domProv, domKab, domKec, domDes] = await Promise.all([
                getProvinceName(result.siswa_alamatKkProvinsi),
                getKabupatenName(result.siswa_alamatKkKabupaten),
                getKecamatanName(result.siswa_alamatKkKecamatan),
                getDesaName(result.siswa_alamatKkDesa),
                getProvinceName(result.siswa_domisiliProvinsi),
                getKabupatenName(result.siswa_domisiliKabupaten),
                getKecamatanName(result.siswa_domisiliKecamatan),
                getDesaName(result.siswa_domisiliDesa),
            ]);
            if(isMounted) {
                setAlamatKk({provinsi: kkProv, kabupaten: kkKab, kecamatan: kkKec, desa: kkDes});
                setDomisili({provinsi: domProv, kabupaten: domKab, kecamatan: domKec, desa: domDes});
            }
        }
        if(isMounted) setLoading(false);
    };
    fetchStudent();
    return () => { isMounted = false; };
  }, [id]);


  if (loading) {
      return (
          <div className="bg-muted/30 p-4 md:p-8">
              <div className="max-w-4xl mx-auto">
                  <div className="flex justify-between items-center mb-6">
                      <Skeleton className="h-10 w-24" />
                      <Skeleton className="h-10 w-24" />
                  </div>
                  <Skeleton className="h-[800px] w-full" />
              </div>
          </div>
      )
  }

  if (!student) {
    notFound();
  }

  const formatDate = (dateString?: string | Date) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  
  const studentStatus = student.status === 'Lengkap';

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 md:p-8 print:bg-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-card rounded-xl shadow-2xl print:shadow-none print:border-none">
        <div className="p-6 sm:p-10 flex justify-between items-center print:hidden">
            <Button variant="outline" asChild>
                <Link href="/siswa">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Link>
            </Button>
            <h2 className="text-xl font-semibold text-center text-primary">Resume Buku Induk Siswa</h2>
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak
            </Button>
        </div>

        <main className="p-6 sm:p-10">
            <header className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
                {student.siswa_fotoProfil?.fileURL ? (
                    <Image src={student.siswa_fotoProfil.fileURL} alt="Foto Siswa" width={128} height={128} className="rounded-full border-4 border-primary/20 shadow-lg object-cover w-32 h-32" />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20 shadow-lg">
                        <User className="w-20 h-20 text-muted-foreground" />
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold text-card-foreground">{student.siswa_namaLengkap}</h1>
                    <p className="text-lg text-muted-foreground">NISN: {student.siswa_nisn}</p>
                     <Badge variant={studentStatus ? 'default' : 'destructive'} className="mt-2">
                        {studentStatus ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Status: {student.status}
                    </Badge>
                </div>
            </header>
            
            <Separator className="my-8" />
            
            <div className="space-y-10">
                <section>
                    <h3 className="font-bold text-xl mb-4 border-b-2 border-primary pb-2 text-primary">A. Keterangan Pribadi Siswa</h3>
                    <div className="space-y-3">
                        <InfoRow label="Nama Lengkap" value={student.siswa_namaLengkap} icon={User} />
                        <InfoRow label="NIS" value={student.siswa_nis} icon={User} />
                        <InfoRow label="NISN" value={student.siswa_nisn} icon={User} />
                        <InfoRow label="Jenis Kelamin" value={student.siswa_jenisKelamin} icon={Users} />
                        <InfoRow label="Tempat, Tgl Lahir" value={`${student.siswa_tempatLahir}, ${formatDate(student.siswa_tanggalLahir)}`} icon={Calendar} />
                        <InfoRow label="Agama" value={student.siswa_agama} icon={BookOpen} />
                        <InfoRow label="Kewarganegaraan" value={student.siswa_kewarganegaraan} icon={Map} />
                        <InfoRow label="Jumlah Saudara" value={student.siswa_jumlahSaudara} icon={Users}/>
                        <InfoRow label="Bahasa Sehari-hari" value={student.siswa_bahasa} icon={Languages}/>
                        <InfoRow label="Golongan Darah" value={student.siswa_golonganDarah} icon={Droplet} />
                        <InfoRow label="Nomor HP/WA" value={student.siswa_telepon} icon={Phone} />
                    </div>
                </section>
                
                 <section>
                    <h3 className="font-bold text-xl mb-4 border-b-2 border-primary pb-2 text-primary">B. Keterangan Tempat Tinggal</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <h4 className='font-semibold text-md'>Alamat Sesuai KK</h4>
                            <InfoRow label="Desa" value={alamatKk.desa} icon={Home} />
                            <InfoRow label="Kecamatan" value={alamatKk.kecamatan} icon={Home} />
                            <InfoRow label="Kabupaten" value={alamatKk.kabupaten} icon={Home} />
                            <InfoRow label="Provinsi" value={alamatKk.provinsi} icon={Home} />
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <h4 className='font-semibold text-md'>Domisili</h4>
                            <InfoRow label="Desa" value={domisili.desa} icon={MapPin} />
                            <InfoRow label="Kecamatan" value={domisili.kecamatan} icon={MapPin} />
                            <InfoRow label="Kabupaten" value={domisili.kabupaten} icon={MapPin} />
                            <InfoRow label="Provinsi" value={domisili.provinsi} icon={MapPin} />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-xl mb-4 border-b-2 border-primary pb-2 text-primary">C. Keterangan Kesehatan</h3>
                    <div className="space-y-3">
                         <InfoRow label="Riwayat Penyakit" value={student.siswa_penyakit} icon={Stethoscope} />
                         <InfoRow label="Kelainan Jasmani" value={student.siswa_kelainanJasmani} />
                         <InfoRow label="Tinggi & Berat Badan" value={`${student.siswa_tinggiBadan || '-'} cm / ${student.siswa_beratBadan || '-'} kg`} />
                    </div>
                </section>

                 <section>
                    <h3 className="font-bold text-xl mb-4 border-b-2 border-primary pb-2 text-primary">D. Keterangan Orang Tua</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-x-8 gap-y-3 p-4 bg-muted/50 rounded-lg">
                           <InfoRow label="Nama Ayah" value={student.siswa_namaAyah} icon={User} />
                           <InfoRow label="Pendidikan Ayah" value={student.siswa_pendidikanAyah} icon={GraduationCap} />
                           <InfoRow label="Pekerjaan Ayah" value={student.siswa_pekerjaanAyah} icon={Briefcase} />
                        </div>
                         <div className="grid grid-cols-1 gap-x-8 gap-y-3 p-4 bg-muted/50 rounded-lg">
                           <InfoRow label="Nama Ibu" value={student.siswa_namaIbu} icon={User} />
                           <InfoRow label="Pendidikan Ibu" value={student.siswa_pendidikanIbu} icon={GraduationCap} />
                           <InfoRow label="Pekerjaan Ibu" value={student.siswa_pekerjaanIbu} icon={Briefcase} />
                        </div>
                        <InfoRow label="Alamat Orang Tua" value={student.siswa_alamatOrangTua} icon={Home} />
                        <InfoRow label="Telepon Orang Tua" value={student.siswa_teleponOrangTua} icon={Phone} />
                    </div>
                </section>

                 <section>
                    <h3 className="font-bold text-xl mb-4 border-b-2 border-primary pb-2 text-primary">E. Keterangan Wali</h3>
                    <div className="space-y-3">
                       <InfoRow label="Nama Wali" value={student.siswa_namaWali} icon={HeartHandshake} />
                       <InfoRow label="Hubungan Keluarga" value={student.siswa_hubunganWali} icon={Users} />
                       <InfoRow label="Pendidikan Wali" value={student.siswa_pendidikanWali} icon={GraduationCap} />
                       <InfoRow label="Pekerjaan Wali" value={student.siswa_pekerjaanWali} icon={Briefcase} />
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-xl mb-4 border-b-2 border-primary pb-2 text-primary">F. Perkembangan Siswa</h3>
                     <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <h4 className='font-semibold text-md'>Pendidikan Sebelumnya (Siswa Baru)</h4>
                            <InfoRow label="Asal Sekolah" value={student.siswa_asalSekolah} icon={School}/>
                            <InfoRow label="Nomor STTB" value={student.siswa_nomorSttb} icon={FileText}/>
                            <InfoRow label="Tanggal STTB" value={formatDate(student.siswa_tanggalSttb)} icon={Calendar}/>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                             <h4 className='font-semibold text-md'>Pendidikan Sebelumnya (Pindahan)</h4>
                            <InfoRow label="Asal Sekolah" value={student.siswa_pindahanAsalSekolah} icon={School}/>
                            <InfoRow label="Dari Tingkat" value={student.siswa_pindahanDariTingkat} icon={GraduationCap}/>
                            <InfoRow label="Diterima Tanggal" value={formatDate(student.siswa_pindahanDiterimaTanggal)} icon={Calendar}/>
                        </div>
                    </div>
                </section>
                
                <section>
                    <h3 className="font-bold text-xl mb-4 border-b-2 border-primary pb-2 text-primary">G. Meninggalkan Sekolah</h3>
                     <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <h4 className='font-semibold text-md'>Tamat Belajar / Lulus</h4>
                            <InfoRow label="Tahun" value={student.siswa_lulusTahun} icon={Calendar}/>
                            <InfoRow label="Nomor Ijazah" value={student.siswa_lulusNomorIjazah} icon={FileText}/>
                            <InfoRow label="Melanjutkan Ke" value={student.siswa_lulusMelanjutkanKe} icon={Building}/>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                             <h4 className='font-semibold text-md'>Pindah Sekolah</h4>
                            <InfoRow label="Tingkat Kelas Ditinggalkan" value={student.siswa_pindahTingkatKelas} icon={GraduationCap}/>
                            <InfoRow label="Ke Sekolah" value={student.siswa_pindahKeSekolah} icon={Building}/>
                            <InfoRow label="Ke Tingkat" value={student.siswa_pindahKeTingkat} icon={GraduationCap}/>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                             <h4 className='font-semibold text-md'>Keluar Sekolah</h4>
                            <InfoRow label="Alasan Keluar" value={student.siswa_keluarAlasan} icon={FileText}/>
                            <InfoRow label="Tanggal Keluar" value={formatDate(student.siswa_keluarTanggal)} icon={Calendar}/>
                        </div>
                    </div>
                </section>
            </div>
        </main>
      </div>
    </div>
  );
}
