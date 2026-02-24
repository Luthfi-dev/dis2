'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, FormProvider, useFormContext, get } from 'react-hook-form';
import { FormStepper } from './form-stepper';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, CalendarIcon, UploadCloud, FileCheck2, User, ShieldCheck } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parse, isValid } from 'date-fns';
import { cn } from '../lib/utils';
import { submitStudentData } from '../lib/actions';
import { Textarea } from './ui/textarea';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Siswa } from '../lib/data';
import type { StudentFormData } from '../lib/student-data-t';
import Image from 'next/image';
import { getProvinces, getKabupatens, getKecamatans, getDesas, Wilayah } from '../lib/wilayah';
import { Combobox } from './ui/combobox';
import { Separator } from './ui/separator';
import { logActivity } from '../lib/activity-log';

const steps = [
  { id: 1, title: 'Data Siswa' },
  { id: 2, title: 'Dokumen Utama' },
  { id: 3, title: 'Data Orang Tua' },
  { id: 4, title: 'Perkembangan Siswa' },
  { id: 5, title: 'Meninggalkan Sekolah' },
  { id: 6, title: 'Laporan Belajar' },
  { id: 7, title: 'Validasi' },
];

const initialFormValues: StudentFormData = {
  siswa_namaLengkap: '',
  siswa_nis: '',
  siswa_nisn: '',
  siswa_jenisKelamin: undefined,
  siswa_tempatLahir: '',
  siswa_tanggalLahir: undefined,
  siswa_agama: undefined,
  siswa_kewarganegaraan: undefined,
};

async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', 'siswa');
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


export function StudentForm({ studentData }: { studentData?: Partial<Siswa> & { id: string } }) {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam, 10) : 1);
  const [isSubmitting, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const methods = useForm<StudentFormData>({
    mode: 'onBlur', 
  });

  const { handleSubmit, reset } = methods;
  
  useEffect(() => {
    if (studentData) {
      reset(studentData);
    } else {
      reset(initialFormValues);
    }
  }, [studentData, reset]);


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

  const processFinalSubmit = (data: StudentFormData) => {
    startTransition(async () => {
        const result = await submitStudentData(data, studentData?.id);

        if (result.success && result.message) {
            toast({
                title: 'Sukses!',
                description: result.message,
            });
            logActivity(result.message);
            router.push('/siswa');
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
            {currentStep === 1 && <DataSiswaForm studentData={studentData} />}
            {currentStep === 2 && <DataDokumenUtamaForm />}
            {currentStep === 3 && <DataOrangTuaForm />}
            {currentStep === 4 && <DataPerkembanganForm />}
            {currentStep === 5 && <DataMeninggalkanSekolahForm />}
            {currentStep === 6 && <DataLaporanBelajarForm />}
            {currentStep === 7 && <DataValidasiForm />}
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
  const { control } = useFormContext<StudentFormData>();
  
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


function DataSiswaForm({ studentData }: { studentData?: Partial<Siswa> & { id: string } }) {
  const { control, watch, setValue, getValues, formState: { isDirty } } = useFormContext<StudentFormData>();
  const [preview, setPreview] = useState<string | null>(getValues('siswa_fotoProfil.fileURL') || null);
  const { toast } = useToast();
  
  useEffect(() => {
    let isMounted = true;
    const fileURL = getValues('siswa_fotoProfil.fileURL');
    if(fileURL && !preview && isMounted) {
        setPreview(fileURL);
    }
    const subscription = watch((value, { name }) => {
      if (name === 'siswa_fotoProfil' && isMounted) {
        setPreview(value.siswa_fotoProfil?.fileURL ?? null);
      }
    });
    return () => { 
        isMounted = false;
        subscription.unsubscribe();
    };
  }, [watch, getValues, preview]);

  
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [kkKabupatens, setKkKabupatens] = useState<Wilayah[]>([]);
  const [kkKecamatans, setKkKecamatans] = useState<Wilayah[]>([]);
  const [kkDesas, setKkDesas] = useState<Wilayah[]>([]);
  const [domisiliKabupatens, setDomisiliKabupatens] = useState<Wilayah[]>([]);
  const [domisiliKecamatans, setDomisiliKecamatans] = useState<Wilayah[]>([]);
  const [domisiliDesas, setDomisiliDesas] = useState<Wilayah[]>([]);

  const alamatKkProvinsi = watch('siswa_alamatKkProvinsi');
  const alamatKkKabupaten = watch('siswa_alamatKkKabupaten');
  const alamatKkKecamatan = watch('siswa_alamatKkKecamatan');
  const domisiliProvinsi = watch('siswa_domisiliProvinsi');
  const domisiliKabupaten = watch('siswa_domisiliKabupaten');
  const domisiliKecamatan = watch('siswa_domisiliKecamatan');

  useEffect(() => {
    let isMounted = true;
    getProvinces().then(data => isMounted && setProvinces(data));
    if (studentData) {
      if (studentData.siswa_alamatKkProvinsi) getKabupatens(studentData.siswa_alamatKkProvinsi).then(data => isMounted && setKkKabupatens(data));
      if (studentData.siswa_alamatKkKabupaten) getKecamatans(studentData.siswa_alamatKkKabupaten).then(data => isMounted && setKkKecamatans(data));
      if (studentData.siswa_alamatKkKecamatan) getDesas(studentData.siswa_alamatKkKecamatan).then(data => isMounted && setKkDesas(data));
      if (studentData.siswa_domisiliProvinsi) getKabupatens(studentData.siswa_domisiliProvinsi).then(data => isMounted && setDomisiliKabupatens(data));
      if (studentData.siswa_domisiliKabupaten) getKecamatans(studentData.siswa_domisiliKabupaten).then(data => isMounted && setDomisiliKecamatans(data));
      if (studentData.siswa_domisiliKecamatan) getDesas(studentData.siswa_domisiliKecamatan).then(data => isMounted && setDomisiliDesas(data));
    }
    return () => { isMounted = false };
  }, [studentData]);

  useEffect(() => {
    let isMounted = true;
    if (alamatKkProvinsi) {
        getKabupatens(alamatKkProvinsi).then(data => {
            if(isMounted) {
                setKkKabupatens(data);
                if (isDirty) {
                    setValue('siswa_alamatKkKabupaten', '');
                    setValue('siswa_alamatKkKecamatan', '');
                    setValue('siswa_alamatKkDesa', '');
                }
            }
        });
    }
    return () => { isMounted = false };
  }, [alamatKkProvinsi, setValue, isDirty]);

  useEffect(() => {
    let isMounted = true;
    if (alamatKkKabupaten) {
        getKecamatans(alamatKkKabupaten).then(data => {
            if(isMounted) {
                setKkKecamatans(data);
                if (isDirty) {
                    setValue('siswa_alamatKkKecamatan', '');
                    setValue('siswa_alamatKkDesa', '');
                }
            }
        });
    }
    return () => { isMounted = false };
  }, [alamatKkKabupaten, setValue, isDirty]);

  useEffect(() => {
    let isMounted = true;
    if (alamatKkKecamatan) {
        getDesas(alamatKkKecamatan).then(data => {
            if(isMounted) {
                setKkDesas(data);
                if (isDirty) setValue('siswa_alamatKkDesa', '');
            }
        });
    }
    return () => { isMounted = false };
  }, [alamatKkKecamatan, setValue, isDirty]);

  useEffect(() => {
    let isMounted = true;
    if (domisiliProvinsi) {
        getKabupatens(domisiliProvinsi).then(data => {
            if(isMounted) {
                setDomisiliKabupatens(data);
                if (isDirty) {
                    setValue('siswa_domisiliKabupaten', '');
                    setValue('siswa_domisiliKecamatan', '');
                    setValue('siswa_domisiliDesa', '');
                }
            }
        });
    }
    return () => { isMounted = false };
  }, [domisiliProvinsi, setValue, isDirty]);

  useEffect(() => {
    let isMounted = true;
    if (domisiliKabupaten) {
        getKecamatans(domisiliKabupaten).then(data => {
            if(isMounted) {
                setDomisiliKecamatans(data);
                if (isDirty) {
                    setValue('siswa_domisiliKecamatan', '');
                    setValue('siswa_domisiliDesa', '');
                }
            }
        });
    }
    return () => { isMounted = false };
  }, [domisiliKabupaten, setValue, isDirty]);
  
  useEffect(() => {
    let isMounted = true;
    if (domisiliKecamatan) {
        getDesas(domisiliKecamatan).then(data => {
            if(isMounted) {
                setDomisiliDesas(data);
                if (isDirty) setValue('siswa_domisiliDesa', '');
            }
        });
    }
    return () => { isMounted = false };
  }, [domisiliKecamatan, setValue, isDirty]);

  const wilayahToOptions = (wilayah: Wilayah[]) => wilayah.map(w => ({ value: w.id, label: w.name }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fileURL = await uploadFile(file);
        setValue('siswa_fotoProfil', { fileName: file.name, fileURL: fileURL }, { shouldDirty: true });
      } catch (error) {
        toast({ title: 'Upload Gagal', description: 'Gagal mengunggah file.', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6">
       <FormField
        control={control}
        name="siswa_fotoProfil"
        render={() => (
          <FormItem>
            <FormLabel>Foto Siswa (Opsional, JPG)</FormLabel>
            <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border relative">
                    {preview ? (
                        <Image src={preview} alt="Preview Foto Profil" layout="fill" objectFit="cover" className="rounded-full" />
                    ) : (
                        <User className="w-12 h-12 text-muted-foreground" />
                    )}
                </div>
                <FormControl>
                     <Button asChild variant="outline">
                        <label htmlFor="foto-profil-upload" className="cursor-pointer">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Unggah Foto
                             <input id="foto-profil-upload" type="file" accept="image/jpeg,image/jpg" className="hidden" onChange={handleFileChange} />
                        </label>
                    </Button>
                </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <Grid>
        <FormField control={control} name="siswa_namaLengkap" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">Nama <span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl><Input placeholder="Nama lengkap siswa" {...field} value={field.value ?? ''} /></FormControl><FormMessage />
            </FormItem>
        )} />
        <FormField control={control} name="siswa_nis" render={({ field }) => (
            <FormItem><FormLabel>Nomor Induk Sekolah</FormLabel><FormControl><Input placeholder="NIS" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="siswa_nisn" render={({ field }) => (
            <FormItem><FormLabel>Nomor Induk Nasional Siswa</FormLabel><FormControl><Input placeholder="10 digit NISN" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="siswa_jenisKelamin" render={({ field }) => (
            <FormItem><FormLabel>Jenis Kelamin</FormLabel><FormControl>
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4 pt-2">
                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Laki-laki" /></FormControl><FormLabel className="font-normal">Laki-laki</FormLabel></FormItem>
                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Perempuan" /></FormControl><FormLabel className="font-normal">Perempuan</FormLabel></FormItem>
            </RadioGroup>
            </FormControl><FormMessage /></FormItem>
        )} />
        <div className="md:col-span-2 space-y-2">
            <h3 className="text-sm font-medium"><FormLabel>Kelahiran Siswa</FormLabel></h3>
            <Grid>
                <FormField control={control} name="siswa_tempatLahir" render={({ field }) => (
                    <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input placeholder="Contoh: Jakarta" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <DatePickerField name="siswa_tanggalLahir" label="Tanggal Lahir" />
            </Grid>
        </div>
        <FormField control={control} name="siswa_agama" render={({ field }) => (
            <FormItem><FormLabel>Agama</FormLabel><Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Pilih Agama" /></SelectTrigger></FormControl>
            <SelectContent>
                <SelectItem value="Islam">Islam</SelectItem><SelectItem value="Kristen">Kristen</SelectItem>
                <SelectItem value="Hindu">Hindu</SelectItem><SelectItem value="Budha">Budha</SelectItem>
            </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="siswa_kewarganegaraan" render={({ field }) => (
            <FormItem><FormLabel>Kewarganegaraan</FormLabel><Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Pilih Kewarganegaraan" /></SelectTrigger></FormControl>
            <SelectContent>
                <SelectItem value="WNI">WNI</SelectItem><SelectItem value="WNA">WNA</SelectItem>
            </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="siswa_jumlahSaudara" render={({ field }) => (
             <FormItem>
                <FormLabel>Jumlah Saudara</FormLabel>
                <FormControl>
                    <Input 
                        type="number"
                        placeholder="0"
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        value={field.value ?? ''}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={control} name="siswa_bahasa" render={({ field }) => (
            <FormItem><FormLabel>Bahasa Sehari-hari</FormLabel><FormControl><Input placeholder="Contoh: Indonesia" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="siswa_golonganDarah" render={({ field }) => (
        <FormItem><FormLabel>Golongan Darah</FormLabel><Select onValueChange={field.onChange} value={field.value}>
          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Gol. Darah" /></SelectTrigger></FormControl>
          <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="AB">AB</SelectItem><SelectItem value="O">O</SelectItem></SelectContent>
        </Select><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="siswa_telepon" render={({ field }) => (
            <FormItem><FormLabel>Nomor HP/WA</FormLabel><FormControl><Input placeholder="08xxxxxxxxxx" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <div className="md:col-span-2 space-y-2">
            <h3 className="text-sm font-medium"><FormLabel>Alamat Sesuai Kartu Keluarga</FormLabel></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <FormField control={control} name="siswa_alamatKkProvinsi" render={({ field }) => (
                    <FormItem><FormLabel>Provinsi</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(provinces)}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Provinsi..."
                          searchPlaceholder="Cari provinsi..."
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_alamatKkKabupaten" render={({ field }) => (
                    <FormItem><FormLabel>Kabupaten</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(kkKabupatens)}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Kabupaten..."
                          searchPlaceholder="Cari kabupaten..."
                          disabled={!alamatKkProvinsi}
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_alamatKkKecamatan" render={({ field }) => (
                    <FormItem><FormLabel>Kecamatan</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(kkKecamatans)}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Kecamatan..."
                          searchPlaceholder="Cari kecamatan..."
                          disabled={!alamatKkKabupaten}
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_alamatKkDesa" render={({ field }) => (
                    <FormItem><FormLabel>Desa</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(kkDesas)}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Desa..."
                          searchPlaceholder="Cari desa..."
                          disabled={!alamatKkKecamatan}
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>

        <div className="md:col-span-2 space-y-2">
            <h3 className="text-sm font-medium"><FormLabel>Domisili</FormLabel></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <FormField control={control} name="siswa_domisiliProvinsi" render={({ field }) => (
                    <FormItem><FormLabel>Provinsi</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(provinces)}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Provinsi..."
                          searchPlaceholder="Cari provinsi..."
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_domisiliKabupaten" render={({ field }) => (
                    <FormItem><FormLabel>Kabupaten</FormLabel><FormControl>
                        <Combobox
                           options={wilayahToOptions(domisiliKabupatens)}
                           value={field.value}
                           onChange={field.onChange}
                           placeholder="Pilih Kabupaten..."
                           searchPlaceholder="Cari kabupaten..."
                           disabled={!domisiliProvinsi}
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_domisiliKecamatan" render={({ field }) => (
                    <FormItem><FormLabel>Kecamatan</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(domisiliKecamatans)}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Kecamatan..."
                          searchPlaceholder="Cari kecamatan..."
                          disabled={!domisiliKabupaten}
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_domisiliDesa" render={({ field }) => (
                    <FormItem><FormLabel>Desa</FormLabel><FormControl>
                        <Combobox
                          options={wilayahToOptions(domisiliDesas)}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih Desa..."
                          searchPlaceholder="Cari desa..."
                          disabled={!domisiliKecamatan}
                        />
                    </FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>
        <Separator className="md:col-span-2 my-4" />
        <div className="md:col-span-2">
            <h3 className="text-sm font-medium mb-2"><FormLabel>Kesehatan Siswa</FormLabel></h3>
            <Grid>
                 <FormField control={control} name="siswa_tinggiBadan" render={({ field }) => (
                    <FormItem><FormLabel>Tinggi Badan (cm)</FormLabel><FormControl><Input type="number" placeholder="160" {...field} onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_beratBadan" render={({ field }) => (
                    <FormItem><FormLabel>Berat Badan (kg)</FormLabel><FormControl><Input type="number" placeholder="50" {...field} onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_penyakit" render={({ field }) => (
                    <FormItem><FormLabel>Riwayat Penyakit</FormLabel><FormControl><Input placeholder="Contoh: Asma" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_kelainanJasmani" render={({ field }) => (
                    <FormItem><FormLabel>Kelainan Jasmani</FormLabel><FormControl><Input placeholder="Contoh: Tidak ada" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </Grid>
        </div>
      </Grid>
    </div>
  );
}

function DataOrangTuaForm() {
  const { control } = useFormContext<StudentFormData>();
  return (
    <div className="space-y-6">
        <div>
            <h3 className="text-md font-semibold mb-3">a. Nama Orang Tua Kandung</h3>
            <Grid>
                <FormField control={control} name="siswa_namaAyah" render={({ field }) => (
                    <FormItem><FormLabel>Nama Ayah</FormLabel><FormControl><Input placeholder="Nama lengkap ayah" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="siswa_namaIbu" render={({ field }) => (
                    <FormItem><FormLabel>Nama Ibu</FormLabel><FormControl><Input placeholder="Nama lengkap ibu" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </Grid>
        </div>
        <Separator/>
        <div>
            <h3 className="text-md font-semibold mb-3">b. Pendidikan & Pekerjaan</h3>
            <Grid>
                <FormField control={control} name="siswa_pendidikanAyah" render={({ field }) => (
                    <FormItem><FormLabel>Pendidikan Tertinggi Ayah</FormLabel><FormControl><Input placeholder="Contoh: S1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_pekerjaanAyah" render={({ field }) => (
                    <FormItem><FormLabel>Pekerjaan Ayah</FormLabel><FormControl><Input placeholder="Contoh: Wiraswasta" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="siswa_pendidikanIbu" render={({ field }) => (
                    <FormItem><FormLabel>Pendidikan Tertinggi Ibu</FormLabel><FormControl><Input placeholder="Contoh: SMA" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_pekerjaanIbu" render={({ field }) => (
                    <FormItem><FormLabel>Pekerjaan Ibu</FormLabel><FormControl><Input placeholder="Contoh: Ibu Rumah Tangga" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </Grid>
        </div>
        <Separator/>
         <div>
            <h3 className="text-md font-semibold mb-3">c. Wali Murid (jika ada)</h3>
            <Grid>
                <FormField control={control} name="siswa_namaWali" render={({ field }) => (
                    <FormItem><FormLabel>Nama Wali</FormLabel><FormControl><Input placeholder="Nama lengkap wali" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_hubunganWali" render={({ field }) => (
                    <FormItem><FormLabel>Hubungan Keluarga</FormLabel><FormControl><Input placeholder="Contoh: Paman" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="siswa_pendidikanWali" render={({ field }) => (
                    <FormItem><FormLabel>Pendidikan Terakhir</FormLabel><FormControl><Input placeholder="Pendidikan terakhir wali" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="siswa_pekerjaanWali" render={({ field }) => (
                    <FormItem><FormLabel>Pekerjaan</FormLabel><FormControl><Input placeholder="Pekerjaan wali" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </Grid>
        </div>
        <Separator/>
        <div>
             <h3 className="text-md font-semibold mb-3">d. Kontak & Alamat Orang Tua / Wali</h3>
             <Grid>
                <FormField control={control} name="siswa_alamatOrangTua" render={({ field }) => (
                    <FormItem><FormLabel>Alamat Orang Tua/Wali</FormLabel><FormControl><Textarea placeholder="Alamat lengkap orang tua/wali" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="siswa_teleponOrangTua" render={({ field }) => (
                    <FormItem><FormLabel>Telepon Orang Tua/Wali</FormLabel><FormControl><Input placeholder="Nomor telepon" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
             </Grid>
        </div>
    </div>
  );
}

function DataPerkembanganForm() {
    const { control } = useFormContext<StudentFormData>();
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-md font-semibold mb-3">a. Masuk Menjadi Siswa Baru Tingkat I</h3>
                <Grid>
                    <FormField control={control} name="siswa_asalSekolah" render={({ field }) => (
                        <FormItem><FormLabel>1. Asal Sekolah</FormLabel><FormControl><Input placeholder="Contoh: TK Tunas Bangsa" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name="siswa_nomorSttb" render={({ field }) => (
                        <FormItem><FormLabel>2. Nomor STTB</FormLabel><FormControl><Input placeholder="Nomor STTB" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DatePickerField name="siswa_tanggalSttb" label="3. Tanggal STTB" />
                </Grid>
            </div>
            <Separator/>
            <div>
                <h3 className="text-md font-semibold mb-3">b. Pindahan Dari Sekolah Lain</h3>
                <Grid>
                     <FormField control={control} name="siswa_pindahanAsalSekolah" render={({ field }) => (
                        <FormItem><FormLabel>1. Asal Sekolah</FormLabel><FormControl><Input placeholder="Nama sekolah asal" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={control} name="siswa_pindahanDariTingkat" render={({ field }) => (
                        <FormItem><FormLabel>2. Dari Tingkat</FormLabel><FormControl><Input placeholder="Contoh: Kelas 4" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DatePickerField name="siswa_pindahanDiterimaTanggal" label="3. Diterima Tanggal" />
                </Grid>
            </div>
        </div>
    );
}

function DataMeninggalkanSekolahForm() {
    const { control } = useFormContext<StudentFormData>();
    return (
        <div className="space-y-6">
             <div>
                <h3 className="text-md font-semibold mb-3">a. Tamat Belajar / Lulus</h3>
                <Grid>
                    <FormField control={control} name="siswa_lulusTahun" render={({ field }) => (
                        <FormItem><FormLabel>Tahun</FormLabel><FormControl><Input placeholder="Contoh: 2024" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name="siswa_lulusNomorIjazah" render={({ field }) => (
                        <FormItem><FormLabel>Nomor Ijazah / STTB</FormLabel><FormControl><Input placeholder="Nomor Ijazah" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name="siswa_lulusMelanjutkanKe" render={({ field }) => (
                        <FormItem><FormLabel>Melanjutkan ke sekolah</FormLabel><FormControl><Input placeholder="Nama sekolah lanjutan" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                </Grid>
            </div>
            <Separator/>
            <div>
                <h3 className="text-md font-semibold mb-3">b. Pindah Sekolah</h3>
                <Grid>
                     <FormField control={control} name="siswa_pindahTingkatKelas" render={({ field }) => (
                        <FormItem><FormLabel>Tingkat kelas yang ditinggalkan</FormLabel><FormControl><Input placeholder="Contoh: Kelas 5" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name="siswa_pindahKeSekolah" render={({ field }) => (
                        <FormItem><FormLabel>Ke sekolah</FormLabel><FormControl><Input placeholder="Nama sekolah tujuan" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={control} name="siswa_pindahKeTingkat" render={({ field }) => (
                        <FormItem><FormLabel>Ke Tingkat</FormLabel><FormControl><Input placeholder="Tingkat di sekolah baru" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                </Grid>
            </div>
            <Separator/>
            <div>
                <h3 className="text-md font-semibold mb-3">c. Keluar Sekolah</h3>
                <Grid className="md:grid-cols-1">
                    <FormField control={control} name="siswa_keluarAlasan" render={({ field }) => (
                        <FormItem><FormLabel>Alasan keluar sekolah</FormLabel><FormControl><Textarea placeholder="Jelaskan alasan keluar" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <div className='max-w-sm'>
                       <DatePickerField name="siswa_keluarTanggal" label="Hari dan tanggal keluar sekolah" />
                    </div>
                </Grid>
            </div>
        </div>
    );
}

type DocumentUploadFieldProps = {
    name: keyof NonNullable<StudentFormData['documents']>;
    label: string;
}

const documentUtamaList: DocumentUploadFieldProps[] = [
    { name: "kartuKeluarga", label: "Kartu Keluarga" },
    { name: "ktpAyah", label: "KTP Ayah" },
    { name: "ktpIbu", label: "KTP Ibu" },
    { name: "kartuIndonesiaPintar", label: "Kartu Indonesia Pintar" },
    { name: "ijazah", label: "Ijazah SD/Sederajat" },
    { name: "aktaKelahiran", label: "Akta Kelahiran" },
    { name: "akteKematianAyah", label: "Akte Kematian Ayah (opsional)" },
    { name: "akteKematianIbu", label: "Akte Kematian Ibu (opsional)" },
];

const laporanBelajarList: DocumentUploadFieldProps[] = [
    { name: "raporSmt1", label: "Rapor Semester 1" },
    { name: "raporSmt2", label: "Rapor Semester 2" },
    { name: "raporSmt3", label: "Rapor Semester 3" },
    { name: "raporSmt4", label: "Rapor Semester 4" },
    { name: "raporSmt5", label: "Rapor Semester 5" },
    { name: "raporSmt6", label: "Rapor Semester 6" },
    { name: "ijazahSmp", label: "Ijazah SMP" },
    { name: "transkripSmp", label: "Transkrip Nilai SMP" },
];


function DocumentUploadField({ name, label }: DocumentUploadFieldProps) {
    const { control, watch, setValue, formState: { errors } } = useFormContext<StudentFormData>();
    const { toast } = useToast();
    const fieldName = `documents.${name}`;
    const watchedFile = watch(fieldName as any);
    const error = get(errors, fieldName);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const fileURL = await uploadFile(file);
          setValue(fieldName as any, { fileName: file.name, fileURL: fileURL }, { shouldDirty: true });
        } catch (error) {
          toast({ title: 'Upload Gagal', description: 'Gagal mengunggah file.', variant: 'destructive' });
        }
      }
    };
  
    return (
      <FormField
        control={control}
        name={fieldName as any}
        render={() => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-4">
              <FormControl>
                  <Button asChild variant="outline" className="w-full justify-start text-left font-normal">
                      <label htmlFor={`file-upload-${name}`} className="cursor-pointer">
                          <UploadCloud className="mr-2 h-4 w-4" />
                          <span className="truncate">
                              {watchedFile?.fileName || 'Pilih file (PDF/Gambar)...'}
                          </span>
                          <input 
                              id={`file-upload-${name}`}
                              type="file" 
                              accept="application/pdf,image/*" 
                              className="hidden"
                              onChange={handleFileChange}
                          />
                      </label>
                  </Button>
              </FormControl>
              {watchedFile?.fileName ? (
                  <div className="flex items-center gap-2 text-green-600">
                      <FileCheck2 className="h-5 w-5" />
                      <span className="sr-only">Terunggah</span>
                  </div>
              ) : null}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

function DataDokumenUtamaForm() {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Silakan unggah semua berkas administrasi yang diperlukan dalam format PDF atau Gambar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {documentUtamaList.map((doc) => (
                    <DocumentUploadField key={doc.name} name={doc.name} label={doc.label} />
                ))}
            </div>
        </div>
    );
}

function DataLaporanBelajarForm() {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Silakan unggah file rapor dan ijazah dalam format PDF.
            </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {laporanBelajarList.map((doc) => (
                    <DocumentUploadField key={doc.name} name={doc.name} label={doc.label} />
                ))}
            </div>
        </div>
    );
}


function DataValidasiForm() {
    const { getValues } = useFormContext<StudentFormData>();
    const values = getValues();
    
    const allFields = [
        { label: "Nama Lengkap", value: values.siswa_namaLengkap },
        { label: "NIS", value: values.siswa_nis },
        { label: "NISN", value: values.siswa_nisn },
        { label: "Foto Profil", value: values.siswa_fotoProfil?.fileName },
        ...Object.entries(values.documents || {}).map(([key, value]) => ({
            label: `Dokumen: ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`,
            value: (value as any)?.fileName
        }))
    ].filter(field => field.value);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
        <ShieldCheck className="w-16 h-16 text-primary" />
        <h2 className="text-2xl font-bold">Konfirmasi Akhir</h2>
        <p className="text-muted-foreground max-w-md">
            Anda telah mencapai langkah terakhir. Silakan periksa kembali ringkasan data di bawah. Jika semua sudah benar, klik "Simpan Data" untuk menyelesaikan.
        </p>
        <Card className="w-full max-w-lg text-left">
            <CardHeader><CardTitle>Ringkasan Data</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm max-h-60 overflow-y-auto">
                {allFields.map((field, index) => (
                    <div key={index} className="flex justify-between items-start gap-4">
                        <span className="font-medium text-muted-foreground shrink-0">{field.label}:</span>
                        <span className="truncate text-right">{field.value}</span>
                    </div>
                ))}
                 {allFields.length === 0 && <p className="text-center text-muted-foreground">Belum ada data yang diisi.</p>}
            </CardContent>
        </Card>
    </div>
  )
}
