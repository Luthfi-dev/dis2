
'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

// File ini valid namun akan mengalihkan ke dashboard jika diakses
export default function DeletedPage() {
    useEffect(() => {
        redirect('/dashboard');
    }, []);
    return null;
}
