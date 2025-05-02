/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'i.pinimg.com',
      'lh3.googleusercontent.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'plus.unsplash.com',
      'avatars.githubusercontent.com',
    ],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // These options help with routing on Netlify
  trailingSlash: true,
  output: 'standalone',
  poweredByHeader: false,
}

module.exports = nextConfig