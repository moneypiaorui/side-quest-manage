/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath:process.env.BASE_PATH || '',
  output: 'export',
  trailingSlash: true,
  assetPrefix: process.env.ASSET_PREFIX || '',

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
 }

export default nextConfig

