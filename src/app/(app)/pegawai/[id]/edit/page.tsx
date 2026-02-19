
'use server';
import { EditPegawaiForm } from './edit-form';

export default async function EditPegawaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // The client component will handle data fetching.
  return <EditPegawaiForm pegawaiId={id} />;
}
