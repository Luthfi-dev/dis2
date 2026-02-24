
'use server';
import { LihatPegawaiClient } from './lihat-pegawai-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LihatPegawaiPage({ params }: Props) {
  const { id } = await params;
  return <LihatPegawaiClient id={id} />;
}
