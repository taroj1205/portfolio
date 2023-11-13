import { generateRss } from '@/utils/generateRSS'
import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const { json } = generateRss(request)

  return new Response(json, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  })
}