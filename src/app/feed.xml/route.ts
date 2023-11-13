import { generateRss } from '@/utils/generateRSS'
import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const { rss } = generateRss(request)

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}