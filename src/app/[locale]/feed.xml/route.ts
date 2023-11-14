import { generateRss } from '@/utils/generateRSS'
import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log(path)
  const locale = path.split('/')[1]
  const { rss } = generateRss(request, locale)

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}