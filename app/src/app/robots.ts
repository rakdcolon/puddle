import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
