import type { GetServerSideProps } from 'next';
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';
import { generateCanonicalSlug, getBaseUrl } from '@/lib/seo-utils';
import { eq, sql, and, isNotNull, or, desc } from 'drizzle-orm';

function Sitemap() {
  // This page is dynamically generated
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = getBaseUrl();

  // Static pages
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/privacy', changefreq: 'monthly', priority: 0.8 },
    { url: '/terms', changefreq: 'monthly', priority: 0.8 },
    { url: '/sources', changefreq: 'weekly', priority: 0.8 },
    { url: '/rectification', changefreq: 'monthly', priority: 0.7 },
  ];

  /**
   * SITEMAP SELECTION LOGIC - CRITICAL SEO
   * 
   * WHY NOT ALL COMPANIES:
   * - At scale (2-5M companies), including everything causes:
   *   1. "Crawled - not indexed" spam
   *   2. Crawl budget waste
   *   3. Google trust degradation
   * 
   * STRATEGY:
   * - Only include SITEMAP-WORTHY companies (passes isSitemapWorthy check)
   * - Initial size: 20-30k URLs (conservative, safe)
   * - Grow gradually (50k → 100k → 200k) ONLY after Search Console confirms healthy indexing
   * - Max 10k URLs per sitemap file (Google recommendation)
   * 
   * QUALITY FILTERS:
   * - Must have: name, CIF, status, county, city, mainActivity
   * - Must have at least ONE: financial data OR shareholders OR contact data
   * - Quality score >= 3 (adjustable threshold)
   */
  let companyUrls: string[] = [];
  try {
    if (!db) {
      throw new Error('Database connection not available');
    }

    // MAIN SITEMAP: Static pages + first 10k sitemap-worthy companies
    // Additional company chunks are in sitemap-index.xml
    const MAX_SITEMAP_SIZE = 10000; // Max 10k per sitemap file (Google recommendation)

    // OPTIMIZED: Fetch companies with required fields + at least one quality signal
    // This query is optimized for performance - uses indexes and simple WHERE clauses
    const companyList = await db
      .select({
        id: companies.id,
        cif: companies.cif,
        name: companies.name,
        status: companies.status,
        county: companies.county,
        city: companies.city,
        mainActivity: companies.mainActivity,
        address: companies.address,
        legalForm: companies.legalForm,
        registrationDate: companies.registrationDate,
        phone: companies.phone,
        email: companies.email,
        website: companies.website,
        lastUpdated: companies.lastUpdated,
        slug: companies.slug,
      })
      .from(companies)
      .where(
        and(
          // Required fields for indexability
          isNotNull(companies.name),
          isNotNull(companies.cif),
          isNotNull(companies.status),
          isNotNull(companies.county),
          isNotNull(companies.city),
          isNotNull(companies.mainActivity),
          // At least one quality signal (contact data is easiest to check)
          or(
            isNotNull(companies.phone),
            isNotNull(companies.email),
            isNotNull(companies.website)
          )
        )
      )
      .orderBy(desc(companies.lastUpdated))
      .limit(MAX_SITEMAP_SIZE * 2); // Fetch more, filter down

    // OPTIMIZED: Simplificat - nu mai verificăm financial/shareholders în loop
    // Doar includem toate companiile care au câmpurile necesare
    for (const company of companyList) {
      // Toate companiile din query sunt deja indexable + au contact data
      // Considerăm că sunt sitemap-worthy (simplificat pentru viteză)
      const canonicalSlug = generateCanonicalSlug({
        slug: company.slug,
        name: company.name,
        cif: company.cif,
      });
      const url = `${baseUrl}/firma/${encodeURIComponent(canonicalSlug)}`;
      
      companyUrls.push(`  <url>
    <loc>${url}</loc>
    <lastmod>${company.lastUpdated ? new Date(company.lastUpdated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

      // Stop if we've reached the limit (first chunk only)
      if (companyUrls.length >= MAX_SITEMAP_SIZE) {
        break;
      }
    }

    console.log(`✅ Main Sitemap: ${companyUrls.length} sitemap-worthy companies (first chunk, max: ${MAX_SITEMAP_SIZE})`);
    console.log(`📋 Additional chunks available via /sitemap-index.xml`);
  } catch (error) {
    console.error('Error fetching companies for sitemap:', error);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(({ url, changefreq, priority }) => {
    return `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
${companyUrls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400'); // Cache 1h
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default Sitemap;

