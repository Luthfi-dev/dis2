
'use server';
import { PreviewPegawaiClient } from './preview-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PreviewPegawaiPage({ params }: Props) {
  const { id } = await params;
  return <PreviewPegawaiClient id={id} />;
}
