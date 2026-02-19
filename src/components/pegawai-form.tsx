'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { FormStepper } from './form-stepper';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, CalendarIcon, UploadCloud, User, FileCheck2, Trash2, ShieldCheck } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel as RadixSelectLabel } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { submitPegawaiData } from '../lib/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Pegawai, PegawaiFormData } from '../lib/pegawai-data';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { getKabupatens, getKecamatans, getDesas, Wilayah } from '../lib/wilayah';
import { Combobox } from './ui/combobox';
import { logActivity } from '../lib/activity-log';

const steps = [
  { id: 1, title: 'Identitas Pegawai' },
  { id: 2, title: 'File Pegawai' },
  { id: 3, title: 'Validasi' },
];

const initialFormValues: PegawaiFormData = {
    pegawai_nama: '',
    pegawai_jenisKelamin: undefined,
    pegawai_tempatLahir: '',
    pegawai_tanggalLahir: undefined,
    pegawai_statusPerkawinan: undefined,
    pegawai_jabatan: '',
    pegawai_terhitungMulaiTanggal: undefined,
    pegawai_phaspoto: undefined,
    pegawai_nip: '',
    pegawai_nuptk: '',
    pegawai_nrg: '',
    pegawai_tanggalPerkawinan: undefined,
    pegawai_namaPasangan: '',
    pegawai_jumlahAnak: null,
    pegawai_bidangStudi: '',
    pegawai_tugasTambahan: '',
    pegawai_alamatKabupaten: '',
    pegawai_alamatKecamatan: '',
    pegawai_alamatDesa: '',
    pegawai_alamatDusun: '',
    pegawai_pendidikanSD: { tamatTahun: '', ijazah: undefined },
    pegawai_pendidikanSMP: { tamatTahun: '', ijazah: undefined },
    pegawai_pendidikanSMA: { tamatTahun: '', ijazah: undefined },
    pegawai_pendidikanDiploma: { tamatTahun: '', ijazah: undefined },
    pegawai_pendidikanS1: { tamatTahun: '', ijazah: undefined },
    pegawai_pendidikanS2: { tamatTahun: '', ijazah: undefined },
    pegawai_skPengangkatan: [],
    pegawai_skNipBaru: undefined,
    pegawai_skFungsional: [],
    pegawai_beritaAcaraSumpah: undefined,
    pegawai_sertifikatPendidik: undefined,
    pegawai_sertifikatPelatihan: [],
    pegawai_skp: [],
    pegawai_karpeg: undefined,
    pegawai_karisKarsu: undefined,
    pegawai_bukuNikah: undefined,
    pegawai_kartuKeluarga: undefined,
    pegawai_ktp: undefined,
    pegawai_akteKelahiran: undefined,
    pegawai_kartuTaspen: undefined,
    pegawai_npwp: undefined,
    pegawai_kartuBpjs: undefined,
    pegawai_bukuRekening: undefined,
};

async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', 'pegawai');
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

const dateStringToDate = (dateString?: string | Date): Date | undefined => {
    if (!dateString) return undefined;
    if (dateString instanceof Date) return dateString;
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (year && month && day) {
        return new Date(Date.UTC(year, month - 1, day));
    }
    return undefined;
};


export function PegawaiForm({ pegawaiData }: { pegawaiData?: Partial<Pegawai> & { id: string } }) {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam, 10) : 1);
  const [isSubmitting, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const methods = useForm<PegawaiFormData>({
    mode: 'onBlur',
  });

  const { handleSubmit, reset } = methods;
  
   useEffect(() => {
    if (pegawaiData) {
        reset(pegawaiData);
    } else {
        reset(initialFormValues);
    }
  }, [pegawaiData, reset]);


  const handleNext = async () => {
    if (currentStep < steps.length) {
        setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const processFinalSubmit = (data: PegawaiFormData) => {
    startTransition(async () => {
        const result = await submitPegawaiData(data, pegawaiData?.id);

        if (result.success && result.message) {
            toast({
                title: 'Sukses!',
                description: result.message,
            });
            logActivity(result.message);
            router.push('/pegawai');
            router.refresh();
        } else {
             toast({
                title: 'Gagal Menyimpan',
                description: result.message || 'Terjadi kesalahan di server.',
                variant: 'destructive',
            });
        }
    });
  };


  return (
    <FormProvider {...methods}>
      <div className="mt-12">
        <FormStepper steps={steps} currentStep={currentStep} />
      </div>
      <form onSubmit={handleSubmit(processFinalSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>Sesi {currentStep} dari {steps.length}.</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <DataIdentitasPegawaiForm pegawaiData={pegawaiData} />}
            {currentStep === 2 && <FilePegawaiForm />}
            {currentStep === 3 && <DataValidasiForm />}
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-between">
          <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {currentStep < steps.length ? (
            <Button type="button" onClick={handleNext}>
              Lanjut
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Data
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function Grid({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4", className)}>{children}</div>;
}

function DatePickerField({ name, label }: { name: any, label: string }) {
    const { control } = useFormContext<PegawaiFormData>();
    
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(dateStringToDate(field.value)!, 'dd-MM-yyyy')
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateStringToDate(field.value)}
                  onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

function DataIdentitasPegawaiForm({ pegawaiData }: { pegawaiData?: Partial<Pegawai> & { id: string } }) {
  const { control, watch, setValue, getValues, formState: {isDirty} } = useFormContext<PegawaiFormData>();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(getValues('pegawai_phaspoto.fileURL') || null);
  
  useEffect(() => {
    let isMounted = true;
    const fileURL = getValues('pegawai_phaspoto.fileURL');
    if(fileURL && !preview && isMounted) {
        setPreview(fileURL);
    }
    const subscription = watch((value, { name }) => {
      if (name === 'pegawai_phaspoto' && isMounted) {
        setPreview(value.pegawai_phaspoto?.fileURL ?? null);
      }
    });
    return () => { 
        isMounted = false;
        subscription.unsubscribe();
     };
  }, [watch, getValues, preview]);

  const [allKabupatens, setAllKabupatens] = useState<Wilayah[]>([]);
  const [kecamatans, setKecamatans] = useState<Wilayah[]>([]);
  const [desas, setDesas] = useState<Wilayah[]>([]);

  const alamatKabupaten = watch('pegawai_alamatKabupaten');
  const alamatKecamatan = watch('pegawai_alamatKecamatan');
  
  useEffect(() => {
    let isMounted = true;
    getKabupatens('11').then(data => isMounted && setAllKabupatens(data));
    if (pegawaiData) {
        if(pegawaiData.pegawai_alamatKabupaten) getKecamatans(pegawaiData.pegawai_alamatKabupaten).then(data => isMounted && setKecamatans(data));
        if(pegawaiData.pegawai_alamatKecamatan) getDesas(pegawaiData.pegawai_alamatKecamatan).then(data => isMounted && setDesas(data));
    }
    return () => { isMounted = false };
  }, [pegawaiData]);
  
  useEffect(() => {
      let isMounted = true;
      const fetchWilayah = async () => {
        if (alamatKabupaten) {
          const newKecamatans = await getKecamatans(alamatKabupaten);
          if (isMounted) {
            setKecamatans(newKecamatans);
            if(isDirty) {
              setValue('pegawai_alamatKecamatan', '');
              setValue('pegawai_alamatDesa', '');
            }
          }
        } else if (isMounted) {
          setKecamatans([]);
        }
      };
      fetchWilayah();
      return () => { isMounted = false };
  }, [alamatKabupaten, setValue, isDirty]);

  useEffect(() => {
      let isMounted = true;
      const fetchWilayah = async () => {
          if (alamatKecamatan) {
            const newDesas = await getDesas(alamatKecamatan);
            if(isMounted) {
                setDesas(newDesas);
                if(isDirty) {
                setValue('pegawai_alamatDesa', '');
                }
            }
          } else if(isMounted) {
            setDesas([]);
          }
      };
      fetchWilayah();
      return () => { isMounted = false };
  }, [alamatKecamatan, setValue, isDirty]);

  const wilayahToOptions = (wilayah: Wilayah[]) => wilayah.map(w => ({ value: w.id, label: w.name }));
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof PegawaiFormData) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fileURL = await uploadFile(file);
        setValue(fieldName as any, { fileName: file.name, fileURL: fileURL }, { shouldValidate: true, shouldDirty: true });
        setPreview(fileURL);
      } catch (error) {
        toast({ title: 'Upload Gagal', description: 'Gagal mengunggah file.', variant: 'destructive' });
      }
    }
  };

  const handlePendidikanFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: any) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fileURL = await uploadFile(file);
        const currentPendidikan = getValues(fieldName as any);
        setValue(fieldName as any, { ...currentPendidikan, ijazah: { fileName: file.name, fileURL: fileURL } }, { shouldDirty: true });
      } catch (error) {
         toast({ title: 'Upload Gagal', description: 'Gagal mengunggah file.', variant: 'destructive' });
      }
    }
  };

  const jabatanOptions = {
    pendidik: [
        'Guru Mata Pelajaran',
        'Guru Bimbingan dan Konseling',
    ],
    kependidikan: [
        'Kepala Tenaga Administrasi',
        'Pelaksana Urusan Administrasi Kepegawaian',
        'Pelaksana Urusan Administrasi Keuangan',
        'Pelaksana Urusan Administrasi Persuratan',
        'Pelaksana Urusan Administrasi Kesiswaan',
        'Pelaksana Urusan Administrasi Kurikulum',
        'Pelaksana Urusan Administrasi Sarana dan Prasarana',
        'Pelaksana Urusan Administrasi Hubungan Masyarakat',
        'Tenaga Kebersihan',
        'Tenaga Keamanan / Satpam',
        'Tukang Kebun',
        'Pesuruh',
        'Sopir / Pengemudi',
        'Penjaga Malam',
    ]
  }

  return (
    <div className="space-y-6">
       <FormField
        control={control}
        name="pegawai_phaspoto"
        render={() => (
          <FormItem>
            <FormLabel>Phaspoto 3x4 cm</FormLabel>
            <div className="flex items-center gap-4">
                <div className="w-24 h-32 bg-muted flex items-center justify-center border relative">
                    {preview ? (
                        <Image src={preview} alt="Preview Phaspoto" layout="fill" objectFit="cover" />
                    ) : (
                        <User className="w-12 h-12 text-muted-foreground" />
                    )}
                </div>
                <FormControl>
                     <Button asChild variant="outline">
                        <label htmlFor="phaspoto-upload" className="cursor-pointer">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Unggah Foto
                             <input id="phaspoto-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'pegawai_phaspoto')} />
                        </label>
                    </Button>
                </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <Grid>
        <FormField control={control} name="pegawai_nama" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">Nama <span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl><Input placeholder="Nama lengkap pegawai" {...field} value={field.value ?? ''} /></FormControl><FormMessage />
            </FormItem>
        )} />
        <FormField control={control} name="pegawai_jenisKelamin" render={({ field }) => (
            <FormItem><FormLabel>Jenis Kelamin</FormLabel><FormControl>
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4 pt-2">
                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Laki-laki" /></FormControl><FormLabel className="font-normal">Laki-laki</FormLabel></FormItem>
                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Perempuan" /></FormControl><FormLabel className="font-normal">Perempuan</FormLabel></FormItem>
            </RadioGroup>
            </FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="pegawai_tempatLahir" render={({ field }) => (
            <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input placeholder="Contoh: Jakarta" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <DatePickerField name="pegawai_tanggalLahir" label="Tanggal Lahir" />
        <FormField control={control} name="pegawai_nip" render={({ field }) => (
            <FormItem><FormLabel>NIP</FormLabel><FormControl><Input placeholder="Nomor Induk Pegawai" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="pegawai_nuptk" render={({ field }) => (
            <FormItem><FormLabel>NUPTK</FormLabel><FormControl><Input placeholder="Nomor Unik Pendidik dan Tenaga Kependidikan" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
         <FormField control={control} name="pegawai_nrg" render={({ field }) => (
            <FormItem><FormLabel>NRG</FormLabel><FormControl><Input placeholder="Nomor Registrasi Guru" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="pegawai_statusPerkawinan" render={({ field }) => (
            <FormItem><FormLabel>Status Perkawinan</FormLabel><Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger></FormControl>
            <SelectContent>
                <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                <SelectItem value="Kawin">Kawin</SelectItem>
                <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
            </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
         <DatePickerField name="pegawai_tanggalPerkawinan" label="Tanggal Perkawinan" />
        <FormField control={control} name="pegawai_namaPasangan" render={({ field }) => (
            <FormItem><FormLabel>Nama Istri / Suami</FormLabel><FormControl><Input placeholder="Nama lengkap pasangan" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="pegawai_jumlahAnak" render={({ field }) => (
            <FormItem>
                <FormLabel>Jumlah Anak</FormLabel>
                <FormControl>
                    <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        value={field.value ?? ''}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={control} name="pegawai_jabatan" render={({ field }) => (
            <FormItem><FormLabel>Jabatan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectGroup>
                            <RadixSelectLabel>Tenaga Pendidik</RadixSelectLabel>
                            {jabatanOptions.pendidik.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                        </SelectGroup>
                        <SelectGroup>
                             <RadixSelectLabel>Tenaga Kependidikan</RadixSelectLabel>
                             {jabatanOptions.kependidikan.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            <FormMessage /></FormItem>
        )} />
        <FormField control={control} name="pegawai_bidangStudi" render={({ field }) => (
            <FormItem><FormLabel>Mengampu Bidang Studi</FormLabel><FormControl><Input placeholder="Contoh: Matematika" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="pegawai_tugasTambahan" render={({ field }) => (
            <FormItem><FormLabel>Tugas Tambahan</FormLabel><Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Pilih Tugas Tambahan" /></SelectTrigger></FormControl>
            <SelectContent>
                <SelectItem value="Kepala Sekolah">Kepala Sekolah</SelectItem>
                <SelectItem value="Wakasek Bidang Kesiswaan">Wakasek Bidang Kesiswaan</SelectItem>
                <SelectItem value="Wakasek Bidang Kurikulum">Wakasek Bidang Kurikulum</SelectItem>
                <SelectItem value="Wakasek Bidang Sarana">Wakasek Bidang Sarana</SelectItem>
                <SelectItem value="Wakasek Bidang Humas">Wakasek Bidang Humas</SelectItem>
                <SelectItem value="Kepala LAB">Kepala LAB</SelectItem>
                <SelectItem value="Kepala Perpustakaan">Kepala Perpustakaan</SelectItem>
            </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <DatePickerField name="pegawai_terhitungMulaiTanggal" label="Terhitung Mulai Tanggal" />
      </Grid>
      <Separator className="my-6" />
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Alamat Rumah</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField control={control} name="pegawai_alamatKabupaten" render={({ field }) => (
                    <FormItem><FormLabel>Kabupaten</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(allKabupatens)}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Pilih Kabupaten..."
                          searchPlaceholder="Cari kabupaten..."
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="pegawai_alamatKecamatan" render={({ field }) => (
                    <FormItem><FormLabel>Kecamatan</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(kecamatans)}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Pilih Kecamatan..."
                          searchPlaceholder="Cari kecamatan..."
                          disabled={!alamatKabupaten}
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="pegawai_alamatDesa" render={({ field }) => (
                    <FormItem><FormLabel>Desa</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(desas)}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Pilih Desa..."
                          searchPlaceholder="Cari desa..."
                          disabled={!alamatKecamatan}
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="pegawai_alamatDusun" render={({ field }) => (
                    <FormItem><FormLabel>Dusun</FormLabel><FormControl><Input placeholder="Nama Dusun" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>
        <Separator className="my-6" />
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pendidikan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                {/* SD/MI */}
                <div className="space-y-2">
                    <FormLabel>SD/MI</FormLabel>
                    <div className="flex gap-4">
                        <FormField control={control} name="pegawai_pendidikanSD.tamatTahun" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input placeholder="Tamat tahun..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="pegawai_pendidikanSD.ijazah" render={() => (
                             <FormItem><FormControl>
                                <Button asChild variant="outline"><label htmlFor="ijazah-sd-upload" className="cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" /> Ijazah <input id="ijazah-sd-upload" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handlePendidikanFileChange(e, 'pegawai_pendidikanSD')} />
                                </label></Button>
                            </FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <p className="text-xs text-muted-foreground">{watch('pegawai_pendidikanSD.ijazah.fileName')}</p>
                </div>
                {/* SMP/MTs */}
                <div className="space-y-2">
                    <FormLabel>SMP/MTs</FormLabel>
                    <div className="flex gap-4">
                        <FormField control={control} name="pegawai_pendidikanSMP.tamatTahun" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input placeholder="Tamat tahun..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="pegawai_pendidikanSMP.ijazah" render={() => (
                             <FormItem><FormControl>
                                <Button asChild variant="outline"><label htmlFor="ijazah-smp-upload" className="cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" /> Ijazah <input id="ijazah-smp-upload" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handlePendidikanFileChange(e, 'pegawai_pendidikanSMP')} />
                                </label></Button>
                            </FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <p className="text-xs text-muted-foreground">{watch('pegawai_pendidikanSMP.ijazah.fileName')}</p>
                </div>
                {/* SMA/MA */}
                 <div className="space-y-2">
                    <FormLabel>SMA/MA</FormLabel>
                    <div className="flex gap-4">
                        <FormField control={control} name="pegawai_pendidikanSMA.tamatTahun" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input placeholder="Tamat tahun..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="pegawai_pendidikanSMA.ijazah" render={() => (
                             <FormItem><FormControl>
                                <Button asChild variant="outline"><label htmlFor="ijazah-sma-upload" className="cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" /> Ijazah <input id="ijazah-sma-upload" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handlePendidikanFileChange(e, 'pegawai_pendidikanSMA')} />
                                </label></Button>
                            </FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <p className="text-xs text-muted-foreground">{watch('pegawai_pendidikanSMA.ijazah.fileName')}</p>
                </div>
                {/* Diploma */}
                 <div className="space-y-2">
                    <FormLabel>Diploma</FormLabel>
                    <div className="flex gap-4">
                        <FormField control={control} name="pegawai_pendidikanDiploma.tamatTahun" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input placeholder="Tamat tahun..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="pegawai_pendidikanDiploma.ijazah" render={() => (
                             <FormItem><FormControl>
                                <Button asChild variant="outline"><label htmlFor="ijazah-diploma-upload" className="cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" /> Ijazah <input id="ijazah-diploma-upload" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handlePendidikanFileChange(e, 'pegawai_pendidikanDiploma')} />
                                </label></Button>
                            </FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <p className="text-xs text-muted-foreground">{watch('pegawai_pendidikanDiploma.ijazah.fileName')}</p>
                </div>
                {/* S1 */}
                <div className="space-y-2">
                    <FormLabel>S1</FormLabel>
                    <div className="flex gap-4">
                        <FormField control={control} name="pegawai_pendidikanS1.tamatTahun" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input placeholder="Tamat tahun..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="pegawai_pendidikanS1.ijazah" render={() => (
                             <FormItem><FormControl>
                                <Button asChild variant="outline"><label htmlFor="ijazah-s1-upload" className="cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" /> Ijazah <input id="ijazah-s1-upload" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handlePendidikanFileChange(e, 'pegawai_pendidikanS1')} />
                                </label></Button>
                            </FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <p className="text-xs text-muted-foreground">{watch('pegawai_pendidikanS1.ijazah.fileName')}</p>
                </div>
                {/* S2 */}
                <div className="space-y-2">
                    <FormLabel>S2</FormLabel>
                    <div className="flex gap-4">
                        <FormField control={control} name="pegawai_pendidikanS2.tamatTahun" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input placeholder="Tamat tahun..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="pegawai_pendidikanS2.ijazah" render={() => (
                             <FormItem><FormControl>
                                <Button asChild variant="outline"><label htmlFor="ijazah-s2-upload" className="cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" /> Ijazah <input id="ijazah-s2-upload" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handlePendidikanFileChange(e, 'pegawai_pendidikanS2')} />
                                </label></Button>
                            </FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <p className="text-xs text-muted-foreground">{watch('pegawai_pendidikanS2.ijazah.fileName')}</p>
                </div>
            </div>
        </div>
    </div>
  );
}

function SingleFileUpload({ name, label }: { name: any, label: string }) {
    const { control, watch, setValue } = useFormContext<PegawaiFormData>();
    const { toast } = useToast();
    const watchedFile = watch(name as any);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const fileURL = await uploadFile(file);
                setValue(name as any, { fileName: file.name, fileURL: fileURL }, { shouldDirty: true });
            } catch (error) {
                 toast({ title: 'Upload Gagal', description: 'Gagal mengunggah file.', variant: 'destructive' });
            }
        }
    };

    return (
        <FormField
            control={control}
            name={name as any}
            render={() => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <div className="flex items-center gap-4">
                        <FormControl>
                            <Button asChild variant="outline" className="w-full justify-start text-left font-normal">
                                <label htmlFor={`file-upload-${name}`} className="cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    <span className="truncate">
                                        {watchedFile?.fileName || 'Pilih file...'}
                                    </span>
                                    <input
                                        id={`file-upload-${name}`}
                                        type="file"
                                        accept=".pdf,image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </Button>
                        </FormControl>
                        {watchedFile?.fileName && (
                            <div className="flex items-center gap-2 text-green-600">
                                <FileCheck2 className="h-5 w-5" />
                                <span className="sr-only">Terunggah</span>
                            </div>
                        )}
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function MultiFileUpload({ name, label }: { name: any, label: string }) {
    const { control, getValues, setValue } = useFormContext<PegawaiFormData>();
    const { toast } = useToast();
    const { fields, append, remove } = useFieldArray({
        control,
        name: name,
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const fileURL = await uploadFile(file);
                append({ fileName: file.name, fileURL: fileURL });
                setValue(name, getValues(name), { shouldDirty: true });
            } catch (error) {
                 toast({ title: 'Upload Gagal', description: 'Gagal mengunggah file.', variant: 'destructive' });
            }
        }
        e.target.value = '';
    };

    return (
        <div className="md:col-span-2 space-y-2">
            <FormLabel>{label}</FormLabel>
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <FileCheck2 className="h-5 w-5 text-green-600" />
                        <a href={getValues(`${name}.${index}.fileURL`)} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm truncate hover:underline">
                            {getValues(`${name}.${index}.fileName`)}
                        </a>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-2">
                <label htmlFor={`multifile-upload-${name}`} className="cursor-pointer">
                    <UploadCloud className="mr-2 h-4 w-4" /> Tambah File
                    <input
                        id={`multifile-upload-${name}`}
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            </Button>
        </div>
    );
}


function FilePegawaiForm() {
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <MultiFileUpload name="pegawai_skPengangkatan" label="SK Pengangkatan Pegawai (dari 80% s.d Sekarang)" />
                <SingleFileUpload name="pegawai_skNipBaru" label="SK NIP Baru" />
                <MultiFileUpload name="pegawai_skFungsional" label="SK Fungsional" />
                <SingleFileUpload name="pegawai_beritaAcaraSumpah" label="Berita Acara Pengambilan Sumpah PNS" />
                <SingleFileUpload name="pegawai_sertifikatPendidik" label="Sertifikat Pendidik" />
                <MultiFileUpload name="pegawai_sertifikatPelatihan" label="Sertifikat Pelatihan" />
                <MultiFileUpload name="pegawai_skp" label="SKP" />
                <SingleFileUpload name="pegawai_karpeg" label="Karpeg" />
                <SingleFileUpload name="pegawai_karisKarsu" label="Karis/Karsu" />
                <SingleFileUpload name="pegawai_bukuNikah" label="Buku Nikah" />
                <SingleFileUpload name="pegawai_kartuKeluarga" label="Kartu Keluarga" />
                <SingleFileUpload name="pegawai_ktp" label="KTP" />
                <SingleFileUpload name="pegawai_akteKelahiran" label="Akte Kelahiran" />
                <SingleFileUpload name="pegawai_kartuTaspen" label="Kartu Peserta Taspen" />
                <SingleFileUpload name="pegawai_npwp" label="NPWP" />
                <SingleFileUpload name="pegawai_kartuBpjs" label="Kartu BPJS / ASKES" />
                <SingleFileUpload name="pegawai_bukuRekening" label="Buku Rekening Gaji" />
            </div>
        </div>
    )
}

function DataValidasiForm() {
    const { getValues } = useFormContext<PegawaiFormData>();
    const values = getValues();
    
    const allFields = [
        { label: "Nama Lengkap", value: values.pegawai_nama },
        { label: "NIP", value: values.pegawai_nip },
        { label: "Jabatan", value: values.pegawai_jabatan },
        { label: "Foto Profil", value: values.pegawai_phaspoto?.fileName },
    ].filter(field => field.value);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
        <ShieldCheck className="w-16 h-16 text-primary" />
        <h2 className="text-2xl font-bold">Konfirmasi Akhir</h2>
        <p className="text-muted-foreground max-w-md">
            Anda telah mencapai langkah terakhir. Silakan periksa kembali ringkasan data. Jika semua sudah benar, klik "Simpan Data" untuk menyelesaikan.
        </p>
         <Card className="w-full max-w-lg text-left">
            <CardHeader><CardTitle>Ringkasan Data</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm max-h-60 overflow-y-auto">
                {allFields.map((field, index) => (
                    <div key={index} className="flex justify-between items-start gap-4">
                        <span className="font-medium text-muted-foreground shrink-0">{field.label}:</span>
                        <span className="truncate text-right">{field.value as string}</span>
                    </div>
                ))}
                 {allFields.length === 0 && <p className="text-center text-muted-foreground">Belum ada data yang diisi.</p>}
            </CardContent>
        </Card>
    </div>
  )
}