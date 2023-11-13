import { generateRss } from '@/utils/generateRSS'
import { useLocale } from 'next-intl'
import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log(path)
  const locale = path.split('/')[1]
  const { json } = generateRss(request, locale)

  return new Response(json, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  })
}