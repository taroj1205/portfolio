import { Feed } from 'feed'
import { allPosts } from 'contentlayer/generated'
import { ownerConfigs, ownerMetaData } from '@/utils/ownerConfigs'
import { NextRequest } from 'next/server'

export function generateRss(request: NextRequest) {
  const feed = new Feed({
    title: ownerConfigs.name,
    description: ownerMetaData.description,
    id: request.nextUrl.origin,
    link: request.nextUrl.origin,
    language: 'en',
    image: `${request.nextUrl.origin}${ownerMetaData.image.url}`,
    favicon: `${request.nextUrl.origin}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${ownerConfigs.name}`,
    updated: new Date(),
    feedLinks: {
      json: `${request.nextUrl.origin}/feed.json`,
      atom: `${request.nextUrl.origin}/feed.atom`,
      rss: `${request.nextUrl.origin}/feed.xml`,
    },
    author: {
      name: ownerConfigs.name,
      email: ownerConfigs.githubLink,
      link: ownerConfigs.githubLink,
    },
  })

  allPosts.map((post) => {
    return feed.addItem({
      title: post.title,
      id: `${request.nextUrl.origin}${post.slug}`,
      guid: `${request.nextUrl.origin}${post.slug}`,
      link: `${request.nextUrl.origin}${post.slug}`,
      date: new Date(post.publishedAt),
      description: post.description || post.body.raw.slice(0, 300),
      author: [{ name: post.author.name, link: ownerConfigs.githubLink, email: ownerConfigs.githubLink }],
      content: post.description || post.body.raw,
      image: request.nextUrl.origin + post.image,
    })
  })

  return {
    rss: feed.rss2(),
    atom: feed.atom1(),
    json: feed.json1(),
  }
}