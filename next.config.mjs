import withPWA from "@ducanh2912/next-pwa"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar compresión para mejor rendimiento
  compress: true,
  // Optimizar imágenes
  images: {
    formats: ["image/webp", "image/avif"],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

const withPWAConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,

  // Mejorar el manifest
  buildExcludes: [/middleware-manifest\.json$/],

  runtimeCaching: [
    // Recursos estáticos - CacheFirst (sin cambios, está bien)
    {
      urlPattern: /\.(?:css|js|woff|woff2|eot|ttf|otf)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
        },
      },
    },

    // Imágenes - CacheFirst con mejor configuración
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 150, // Aumentado para más imágenes
          maxAgeSeconds: 60 * 60 * 24 * 60, // 60 días para imágenes
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}?version=1`
        },
      },
    },

    // Google Fonts - sin cambios, está perfecto
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
        },
      },
    },

    // API GET - NetworkFirst mejorado
    {
      urlPattern: /^https:\/\/xvxsfhnjxj\.execute-api\.us-east-1\.amazonaws\.com\/dev\/.*$/i,
      method: "GET",
      handler: "NetworkFirst",
      options: {
        cacheName: "api-get",
        expiration: {
          maxEntries: 100, // Aumentado
          maxAgeSeconds: 60 * 60 * 24, // 24 horas
        },
        networkTimeoutSeconds: 10,
        // Agregar estrategia de actualización en background
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => {
              return `${request.url}`
            },
            cacheWillUpdate: async ({ response }) => {
              return response.status === 200
            },
          },
        ],
      },
    },

    // API POST - NetworkOnly con backgroundSync mejorado
    {
      urlPattern: /^https:\/\/xvxsfhnjxj\.execute-api\.us-east-1\.amazonaws\.com\/dev\/.*$/i,
      method: "POST",
      handler: "NetworkOnly",
      options: {
        backgroundSync: {
          name: "post-queue",
          options: {
            maxRetentionTime: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
          },
        },
        // Agregar plugin para manejar errores
        plugins: [
          {
            fetchDidFail: async ({ originalRequest }) => {
              console.log("POST request failed, will retry when online:", originalRequest.url)
            },
          },
        ],
      },
    },

    // API PUT - NetworkOnly con backgroundSync mejorado
    {
      urlPattern: /^https:\/\/xvxsfhnjxj\.execute-api\.us-east-1\.amazonaws\.com\/dev\/.*$/i,
      method: "PUT",
      handler: "NetworkOnly",
      options: {
        backgroundSync: {
          name: "put-queue",
          options: {
            maxRetentionTime: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
          },
        },
        plugins: [
          {
            fetchDidFail: async ({ originalRequest }) => {
              console.log("PUT request failed, will retry when online:", originalRequest.url)
            },
          },
        ],
      },
    },

    // API DELETE - NetworkOnly con backgroundSync mejorado
    {
      urlPattern: /^https:\/\/xvxsfhnjxj\.execute-api\.us-east-1\.amazonaws\.com\/dev\/.*$/i,
      method: "DELETE",
      handler: "NetworkOnly",
      options: {
        backgroundSync: {
          name: "delete-queue",
          options: {
            maxRetentionTime: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
          },
        },
        plugins: [
          {
            fetchDidFail: async ({ originalRequest }) => {
              console.log("DELETE request failed, will retry when online:", originalRequest.url)
            },
          },
        ],
      },
    },

    // Páginas de la aplicación - StaleWhileRevalidate para mejor UX
    {
      urlPattern: /^https?:\/\/localhost:3000\/.*$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
        },
      },
    },

    // Fallback para otras requests - NetworkFirst
    {
      urlPattern: /.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "others",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 2, // 2 horas (reducido)
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})

export default withPWAConfig(nextConfig)
