/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/celikminda' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/celikminda/' : '',
  trailingSlash: true,
};

export default nextConfig;
