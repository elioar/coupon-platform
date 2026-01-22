import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.lagonika.gr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lagonika.gr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.happydeals.gr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'happydeals.gr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.lagonika.gr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.lagonika.gr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.happydeals.gr',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
