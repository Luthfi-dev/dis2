
'use server';

import { LihatPegawaiClient } from './lihat-pegawai-client';

export default async function LihatPegawaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LihatPegawaiClient id={id} />;
}
