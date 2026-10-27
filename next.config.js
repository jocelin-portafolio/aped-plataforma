/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera un servidor autónomo (.next/standalone) para la imagen Docker.
  output: 'standalone',
  serverExternalPackages: ['mongoose', 'bcryptjs'],
};

module.exports = nextConfig;
