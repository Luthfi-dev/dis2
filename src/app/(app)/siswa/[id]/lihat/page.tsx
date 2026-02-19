
'use server';

import { LihatSiswaClient } from './lihat-siswa-client';

export default async function LihatSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LihatSiswaClient id={id} />;
}
