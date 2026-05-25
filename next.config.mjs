/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,

  serverExternalPackages: ["@prisma/client", "prisma", "pdfkit", "exceljs"],

  experimental: {
    optimizePackageImports: ['recharts']
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/uploads/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/employee',
        destination: '/employee/dashboard',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
