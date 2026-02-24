
'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DeletedPage() {
    useEffect(() => {
        redirect('/dashboard');
    }, []);
    return null;
}
