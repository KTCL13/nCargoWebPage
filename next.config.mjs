/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: ["@prisma/client", "prisma"],

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
