import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: false,
  poweredByHeader: false,
  images: {
    // Permettre les URLs locales
    localPatterns: [
      {
        pathname: '/api/**',
      },
      {
        pathname: '/images/**',
      },
      {
        pathname: '/uploads/**',
      },
      {
        pathname: '/*.png',
      },
      {
        pathname: '/*.jpg',
      },
      {
        pathname: '/*.svg',
      },
    ],
    remotePatterns: [
      // Localhost pour les images générées (développement uniquement)
      ...(isDev ? [
        {
          protocol: 'http' as const,
          hostname: 'localhost',
          port: '3005',
          pathname: '/api/**',
        },
        {
          protocol: 'http' as const,
          hostname: 'localhost',
          port: '3000',
          pathname: '/api/**',
        },
        {
          protocol: 'http' as const,
          hostname: 'localhost',
          port: '',
          pathname: '/api/**',
        },
      ] : []),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Madagascar news sources
      {
        protocol: 'https',
        hostname: 'midi-madagasikara.mg',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.midi-madagasikara.mg',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.24hmada.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.24hmada.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'newsmada.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.newsmada.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'newsmada.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.lagazette-dgi.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.lagazette-dgi.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lexpress.mg',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.lexpress.mg',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'actu.orange.mg',
        port: '',
        pathname: '/**',
      },
      // Allow all .mg domains for Madagascar sources
      {
        protocol: 'https',
        hostname: '**.mg',
        port: '',
        pathname: '/**',
      },
      // Gemini generated images (for future integration)
      {
        protocol: 'https',
        hostname: 'generativelanguage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      // Wikipedia/Wikimedia for real photos
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.wikipedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      // Pollinations AI (generated images)
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      // Pixabay (stock photos)
      {
        protocol: 'https',
        hostname: 'pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      // Pexels (stock photos)
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      // Cloudinary (image CDN)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Augmenter la limite de taille pour les uploads
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
