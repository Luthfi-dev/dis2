
'use server';
import { PreviewPegawaiClient } from './preview-client';

export default async function PreviewPegawaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PreviewPegawaiClient id={id} />;
}
