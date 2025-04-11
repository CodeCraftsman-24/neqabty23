/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['pdfkit'],
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
