
'use server';
import { EditPegawaiForm } from './edit-form';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPegawaiPage({ params }: Props) {
  const { id } = await params;
  return <EditPegawaiForm pegawaiId={id} />;
}
