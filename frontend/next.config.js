/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    workerThreads: false,
    webpackBuildWorker: false,
  },
}

module.exports = nextConfig
