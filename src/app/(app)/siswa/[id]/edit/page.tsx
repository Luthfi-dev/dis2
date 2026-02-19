
'use server';
import { EditStudentForm } from './edit-form';

export default async function EditSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // The client component will handle data fetching.
  return <EditStudentForm studentId={id} />;
}
