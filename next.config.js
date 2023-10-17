const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configure `pageExtensions`` to include MDX files
    pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
    reactStrictMode: true,
    swcMinify: true
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