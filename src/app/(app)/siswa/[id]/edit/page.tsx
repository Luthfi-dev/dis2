
'use server';
import { EditStudentForm } from './edit-form';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSiswaPage({ params }: Props) {
  const { id } = await params;
  return <EditStudentForm studentId={id} />;
}
