/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Compress assets
  compress: true,
  
  // Generate ETags for cache busting
  generateEtags: true,
  
  // Exclude scripts from build (they're not part of the app)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [],
  },

  // Headers for security & SEO
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/companie/:cif',
        destination: '/firma/:cif',
        permanent: true,
      },
    ];
  },

  // Rewrite for SPA fallback
  async rewrites() {
    return {
      beforeFiles: [],
    };
  },

  // SWR cache configuration
  swcMinify: true,

  // PoweredBy header
  poweredByHeader: false,
};

export default nextConfig;

