import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StayCool Booking - Premium Stays & Villas',
    short_name: 'StayCool',
    description: 'Book unique stays, luxury villas, and nature lodges worldwide.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080808',
    theme_color: '#0ea5e9',
    icons: [
      {
        src: '/assets/images/logo-round.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/assets/images/logo-round.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}
