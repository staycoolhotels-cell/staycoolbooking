/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['react-leaflet', 'leaflet'],
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
      'date-fns',
      'antd',
      'recharts',
      'framer-motion',
    ],
    serverActions: {
      bodySizeLimit: '100mb',
    },
    middlewareClientMaxBodySize: '100mb',
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pixabay.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.rocket.new',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dlislsrlwovcxsuqdlvy.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // 1. Global Security Headers on all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      {
        // 2. Static Assets: Aggressive Long-Term Browser Caching (1 year)
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 3. Static Next Chunks & Fonts (1 year)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 4. API Endpoints: Prevent Sensitive User Data Caching (VAPT #16, #31 protection)
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/homepage',
        permanent: false,
      },
      {
        source: '/about-us',
        destination: '/about',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
