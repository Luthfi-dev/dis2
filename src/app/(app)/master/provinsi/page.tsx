
'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function ProvinsiMasterPage() {
    useEffect(() => {
        redirect('/dashboard');
    }, []);

    return (
        <div className="flex h-96 items-center justify-center">
            <p className="text-muted-foreground italic">Mengalihkan...</p>
        </div>
    );
}
