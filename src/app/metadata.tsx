'use client';
import { useAppSettings } from "../hooks/use-app-settings";
import { useEffect } from "react";

export function AppMetadata() {
    const { settings } = useAppSettings();

    useEffect(() => {
        let isMounted = true;
        if (settings && isMounted) {
            document.title = settings.app_title || 'EduArchive';
            
            let descriptionTag = document.querySelector('meta[name="description"]');
            if (!descriptionTag) {
                descriptionTag = document.createElement('meta');
                descriptionTag.setAttribute('name', 'description');
                document.head.appendChild(descriptionTag);
            }
            descriptionTag.setAttribute('content', settings.app_description || 'Aplikasi Buku Induk Siswa Digital');

            let iconTag = document.querySelector('link[rel="icon"]');
            if(!iconTag) {
                iconTag = document.createElement('link');
                iconTag.setAttribute('rel', 'icon');
                document.head.appendChild(iconTag);
            }
            iconTag.setAttribute('href', settings.app_logo_url || '/favicon.ico');
        }
        return () => { isMounted = false; };
    }, [settings]);

    return null;
}
