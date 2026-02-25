'use server';
import { LihatPegawaiClient } from './lihat-pegawai-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LihatPegawaiPage({ params }: Props) {
  // Next.js 15: params must be awaited
  const { id } = await params;
  return <LihatPegawaiClient id={id} />;
}
