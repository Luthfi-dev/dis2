
'use server';

import { PreviewSiswaClient } from './preview-client';

export default async function PreviewSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PreviewSiswaClient id={id} />;
}
