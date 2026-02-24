
'use server';
import { LihatSiswaClient } from './lihat-siswa-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LihatSiswaPage({ params }: Props) {
  const { id } = await params;
  return <LihatSiswaClient id={id} />;
}
