
'use server';
import { PreviewSiswaClient } from './preview-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PreviewSiswaPage({ params }: Props) {
  const { id } = await params;
  return <PreviewSiswaClient id={id} />;
}
