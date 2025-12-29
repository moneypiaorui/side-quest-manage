/** @type {import('next').NextConfig} */
const nextConfig = {
  // 将管理端部署到 /admin 下并导出为静态文件
  basePath: '/admin',
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
