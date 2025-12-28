import type { GetServerSideProps } from 'next';
import { db } from '@/server/db';
import { companies, financialData, shareholders } from '@/server/db/schema';
import { getBaseUrl } from '@/lib/seo-utils';
import { sql } from 'drizzle-orm';

// CACHE pentru count (evită query lent la fiecare request)
let cachedCount: number | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 3600000; // 1 oră

async function getSitemapWorthyCount(): Promise<number> {
  const now = Date.now();
  
  // Return cached if valid
  if (cachedCount !== null && (now - cacheTime) < CACHE_TTL) {
    return cachedCount;
  }
  
  if (!db) throw new Error('Database not available');
  
  // OPTIMIZED: Query simplificat fără EXISTS în COUNT (mult mai rapid)
  // Folosim doar câmpurile directe pentru estimare rapidă
  const result = await db
    .select({
      count: sql<number>`
        COUNT(*) FILTER (
          WHERE 
            ${companies.name} IS NOT NULL AND
            ${companies.cif} IS NOT NULL AND
            ${companies.status} IS NOT NULL AND
            ${companies.county} IS NOT NULL AND
            ${companies.city} IS NOT NULL AND
            ${companies.mainActivity} IS NOT NULL AND
            (${companies.phone} IS NOT NULL OR ${companies.email} IS NOT NULL OR ${companies.website} IS NOT NULL)
        )
      `,
    })
    .from(companies);
  
  cachedCount = Number(result[0]?.count || 0);
  cacheTime = now;
  
  return cachedCount;
}

function SitemapIndex() {}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = getBaseUrl();
  
  try {
    if (!db) throw new Error('Database not available');
    
    const sitemapWorthyCount = await getSitemapWorthyCount();
    const CHUNK_SIZE = 10000;
    const totalChunks = Math.ceil(sitemapWorthyCount / CHUNK_SIZE);
    
    const sitemaps: string[] = [
      `  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`,
    ];
    
    if (totalChunks > 0) {
      for (let i = 0; i < totalChunks; i++) {
        sitemaps.push(`  <sitemap>
    <loc>${baseUrl}/sitemaps/companies-${i}.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`);
      }
    }
    
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;
    
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.write(sitemapIndex);
    res.end();
    
    return { props: {} };
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.statusCode = 500;
    res.end();
    return { props: {} };
  }
};

export default SitemapIndex;
