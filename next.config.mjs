import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {};

const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  fallbacks: {
    document: '/offline', },
  runtimeCaching: [
    {urlPattern: /\.(?:css|js|woff|woff2|eot|ttf|otf)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, },},},
    {urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, },},},
    {urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, 
        },},},
    {urlPattern: /^https:\/\/xvxsfhnjxj\.execute-api\.us-east-1\.amazonaws\.com\/dev\/.*$/i,
      method: 'GET',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-get',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, 
        },
        networkTimeoutSeconds: 10,},},
    {urlPattern: /^https:\/\/xvxsfhnjxj\.execute-api\.us-east-1\.amazonaws\.com\/dev\/.*$/i,
      method: 'POST',
      handler: 'NetworkOnly',
      options: {
        backgroundSync: {
          name: 'post-queue',
          options: {
            maxRetentionTime: 24 * 60 * 60, 
          },},},},
    {urlPattern: /^https:\/\/xvxsfhnjxj\.execute-api\.us-east-1\.amazonaws\.com\/dev\/.*$/i,
      method: 'PUT',
      handler: 'NetworkOnly',
      options: {
        backgroundSync: {
          name: 'put-queue',
          options: {
            maxRetentionTime: 24 * 60 * 60, 
          },},},},
    {urlPattern: /^https:\/\/xvxsfhnjxj\.execute-api\.us-east-1\.amazonaws\.com\/dev\/.*$/i,
      method: 'DELETE',
      handler: 'NetworkOnly',
      options: {
        backgroundSync: {
          name: 'delete-queue',
          options: {
            maxRetentionTime: 24 * 60 * 60, // 24 horas (en segundos)
          },},},},
    {urlPattern: /.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hora
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});
export default withPWAConfig(nextConfig);