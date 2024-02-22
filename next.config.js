const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configure `pageExtensions`` to include MDX files
    pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
    reactStrictMode: true,
    swcMinify: true,
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'img.shields.io',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/en/about',
                destination: 'https://taroj1205.vercel.app/en',
                permanent: true,
            },
            {
                source: '/ja/about',
                destination: 'https://taroj1205.vercel.app/ja',
                permanent: true,
            },
            {
                source: '/about',
                destination: 'https://taroj1205.vercel.app',
                permanent: true,
            },
        ]
    },
}

module.exports = withMDX(nextConfig)

/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')(
    // This is the default (also the `src` folder is supported out of the box)
    './i18n.ts'
);

module.exports = withNextIntl();

const { withContentlayer } = require('next-contentlayer')

module.exports = withContentlayer(nextConfig)
