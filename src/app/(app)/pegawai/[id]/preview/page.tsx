'use server';
import { PreviewPegawaiClient } from './preview-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PreviewPegawaiPage({ params }: Props) {
  // Next.js 15: await params to get the dynamic ID
  const { id } = await params;
  return <PreviewPegawaiClient id={id} />;
}
