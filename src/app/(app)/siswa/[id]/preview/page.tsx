
'use server';
import { PreviewSiswaClient } from './preview-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PreviewSiswaPage({ params }: Props) {
  // Next.js 15: await params
  const { id } = await params;
  return <PreviewSiswaClient id={id} />;
}
