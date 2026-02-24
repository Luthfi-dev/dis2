
'use server';
import { LihatSiswaClient } from './lihat-siswa-client';

type Props = {
  params: Promise<{ id: string }>;
}

export default async function LihatSiswaPage({ params }: Props) {
  // Next.js 15: params must be awaited
  const { id } = await params;
  return <LihatSiswaClient id={id} />;
}
