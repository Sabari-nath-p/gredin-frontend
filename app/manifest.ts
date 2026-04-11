import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Gredin',
        short_name: 'Gredin',
        description: 'Gredin trading journal app',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0e14',
        theme_color: '#0a0e14',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
