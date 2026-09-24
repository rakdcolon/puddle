import type { MetadataRoute } from 'next'
import { environmentName } from '@/lib/environment.mjs'

export default function robots(): MetadataRoute.Robots {
  if (environmentName() !== 'prod') return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/profile',
        '/settings',
        '/review',
        '/submit',
        '/solution',
      ],
    },
    sitemap: 'https://solvepuddle.com/sitemap.xml',
    host: 'https://solvepuddle.com',
  }
}
