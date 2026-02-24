'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { FormStepper } from './form-stepper';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, UploadCloud, User, ShieldCheck } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';
import { submitPegawaiData } from '../lib/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Pegawai, PegawaiFormData } from '../lib/pegawai-data';
import Image from 'next/image';
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
    pegawai_nip: '',
    pegawai_alamatKabupaten: '',
    pegawai_alamatKecamatan: '',
    pegawai_alamatDesa: '',
    pegawai_skPengangkatan: [],
    pegawai_skFungsional: [],
    pegawai_sertifikatPelatihan: [],
    pegawai_skp: [],
};

async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', 'pegawai');
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Upload failed');
    const { url } = await response.json();
    return url;
}

export function PegawaiForm({ pegawaiData }: { pegawaiData?: Partial<Pegawai> & { id: string } }) {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam, 10) : 1);
  const [isSubmitting, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const methods = useForm<PegawaiFormData>({ mode: 'onBlur' });
  const { handleSubmit, reset } = methods;
  
  useEffect(() => {
    if (pegawaiData) reset(pegawaiData);
    else reset(initialFormValues);
  }, [pegawaiData, reset]);

  const handleNext = () => currentStep < steps.length && setCurrentStep(prev => prev + 1);
  const handlePrev = () => currentStep > 1 && setCurrentStep(prev => prev - 1);

  const processFinalSubmit = (data: PegawaiFormData) => {
    startTransition(async () => {
        const result = await submitPegawaiData(data, pegawaiData?.id);
        if (result.success) {
            toast({ title: 'Sukses!', description: result.message });
            logActivity(result.message);
            router.push('/pegawai');
            router.refresh();
        } else {
            toast({ title: 'Gagal', description: result.message, variant: 'destructive' });
        }
    });
  };

  return (
    <FormProvider {...methods}>
      <div className="mt-12"><FormStepper steps={steps} currentStep={currentStep} /></div>
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
          <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 1}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Button>
          {currentStep < steps.length ? (
            <Button type="button" onClick={handleNext}>Lanjut <ArrowRight className="ml-2 h-4 w-4" /></Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Data</Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function DataIdentitasPegawaiForm({ pegawaiData }: { pegawaiData?: Partial<Pegawai> & { id: string } }) {
  const { control, watch, setValue, getValues, formState: {isDirty} } = useFormContext<PegawaiFormData>();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(getValues('pegawai_phaspoto.fileURL') || null);
  
  const [allKabupatens, setAllKabupatens] = useState<Wilayah[]>([]);
  const [kecamatans, setKecamatans] = useState<Wilayah[]>([]);

  const alamatKabupaten = watch('pegawai_alamatKabupaten');
  
  useEffect(() => {
    getKabupatens('11').then(setAllKabupatens);
    if (pegawaiData) {
        if(pegawaiData.pegawai_alamatKabupaten) getKecamatans(pegawaiData.pegawai_alamatKabupaten).then(setKecamatans);
    }
  }, [pegawaiData]);
  
  useEffect(() => {
      if (alamatKabupaten) {
          getKecamatans(alamatKabupaten).then(data => {
              setKecamatans(data);
              if(isDirty) { setValue('pegawai_alamatKecamatan', ''); setValue('pegawai_alamatDesa', ''); }
          });
      }
  }, [alamatKabupaten, setValue, isDirty]);

  const wilayahToOptions = (wilayah: Wilayah[]) => wilayah.map(w => ({ value: w.id, label: w.name }));
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof PegawaiFormData) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fileURL = await uploadFile(file);
        setValue(fieldName as any, { fileName: file.name, fileURL }, { shouldDirty: true });
        if (fieldName === 'pegawai_phaspoto') setPreview(fileURL);
      } catch (error) {
        toast({ title: 'Gagal', description: 'Gagal unggah.', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6">
       <FormField control={control} name="pegawai_phaspoto" render={() => (
          <FormItem>
            <FormLabel>Phaspoto 3x4 cm</FormLabel>
            <div className="flex items-center gap-4">
                <div className="w-24 h-32 bg-muted flex items-center justify-center border relative">
                    {preview ? <Image src={preview} alt="Foto" fill className="object-cover" /> : <User className="w-12 h-12 text-muted-foreground" />}
                </div>
                <FormControl>
                     <Button asChild variant="outline">
                        <label htmlFor="phaspoto-upload" className="cursor-pointer">
                            <UploadCloud className="mr-2 h-4 w-4" /> Unggah <input id="phaspoto-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'pegawai_phaspoto')} />
                        </label>
                    </Button>
                </FormControl>
            </div>
          </FormItem>
        )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField control={control} name="pegawai_nama" render={({ field }) => (
            <FormItem><FormLabel>Nama *</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>
        )} />
        <FormField control={control} name="pegawai_nip" render={({ field }) => (
            <FormItem><FormLabel>NIP *</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>
        )} />
        <FormField control={control} name="pegawai_alamatKabupaten" render={({ field }) => (
            <FormItem><FormLabel>Kabupaten</FormLabel><FormControl>
                <Combobox options={wilayahToOptions(allKabupatens)} value={field.value || ''} onChange={field.onChange} placeholder="Pilih..." searchPlaceholder="Cari..." />
            </FormControl></FormItem>
        )} />
        <FormField control={control} name="pegawai_alamatKecamatan" render={({ field }) => (
            <FormItem><FormLabel>Kecamatan</FormLabel><FormControl>
                <Combobox options={wilayahToOptions(kecamatans)} value={field.value || ''} onChange={field.onChange} placeholder="Pilih..." searchPlaceholder="Cari..." disabled={!alamatKabupaten} />
            </FormControl></FormItem>
        )} />
      </div>
    </div>
  );
}

function FilePegawaiForm() {
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SingleFileUpload name="pegawai_skNipBaru" label="SK NIP Baru" />
                <SingleFileUpload name="pegawai_ktp" label="KTP" />
                <SingleFileUpload name="pegawai_kartuKeluarga" label="Kartu Keluarga" />
            </div>
        </div>
    )
}

function SingleFileUpload({ name, label }: { name: string, label: string }) {
    const { watch, setValue } = useFormContext();
    const watched = watch(name);
    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" className="w-full justify-start">
                    <label className="cursor-pointer">
                        <UploadCloud className="mr-2 h-4 w-4" /> <span className="truncate">{watched?.fileName || 'Pilih file...'}</span>
                        <input type="file" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const url = await uploadFile(file);
                                setValue(name, { fileName: file.name, fileURL: url }, { shouldDirty: true });
                            }
                        }} />
                    </label>
                </Button>
            </div>
        </FormItem>
    );
}

function DataValidasiForm() {
    const { getValues } = useFormContext();
    const values = getValues();
  return (
    <div className="flex flex-col items-center py-8 text-center space-y-6">
        <ShieldCheck className="w-16 h-16 text-primary" />
        <h2 className="text-2xl font-bold">Konfirmasi</h2>
        <p className="text-muted-foreground">Periksa kembali data Anda sebelum menyimpan.</p>
        <div className="w-full max-w-md p-4 border rounded-lg text-left">
            <p><strong>Nama:</strong> {values.pegawai_nama}</p>
            <p><strong>NIP:</strong> {values.pegawai_nip}</p>
        </div>
    </div>
  )
}