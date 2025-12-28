/**
 * COMPANY CHUNK SITEMAP
 * 
 * Generates a sitemap chunk for companies (max 10k URLs per chunk)
 * Route: /sitemaps/companies-[chunk].xml
 * Example: /sitemaps/companies-0.xml, /sitemaps/companies-1.xml
 */

import type { GetServerSideProps } from 'next';
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';
import { generateCanonicalSlug, getBaseUrl } from '@/lib/seo-utils';
import { and, isNotNull, or, sql, desc } from 'drizzle-orm';

function CompanyChunkSitemap() {
  // This page is dynamically generated
}

export const getServerSideProps: GetServerSideProps = async ({ res, params }) => {
  const baseUrl = getBaseUrl();
  const chunkParam = params?.chunk as string;

  if (!chunkParam || !/^\d+$/.test(chunkParam)) {
    res.statusCode = 404;
    res.end();
    return { props: {} };
  }

  const chunk = parseInt(chunkParam, 10);
  const CHUNK_SIZE = 10000; // Max 10k URLs per sitemap (Google recommendation)
  const offset = chunk * CHUNK_SIZE;

  try {
    if (!db) {
      throw new Error('Database connection not available');
    }

    // OPTIMIZED: Query simplificat fără EXISTS în COUNT (mult mai rapid)
    const sitemapWorthyCountResult = await db
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

    const sitemapWorthyCount = Number(sitemapWorthyCountResult[0]?.count || 0);
    const totalChunks = Math.ceil(sitemapWorthyCount / CHUNK_SIZE);

    // If chunk index is out of range, return 404 (no 200 empty)
    if (chunk < 0 || chunk >= totalChunks) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      res.end();
      return { props: {} };
    }

    // Also check if offset >= count (double safety)
    if (offset >= sitemapWorthyCount) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      res.end();
      return { props: {} };
    }

    // Fetch companies for this chunk (pre-filtered by required fields + quality signals)
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
          isNotNull(companies.name),
          isNotNull(companies.cif),
          isNotNull(companies.status),
          isNotNull(companies.county),
          isNotNull(companies.city),
          isNotNull(companies.mainActivity),
          or(
            isNotNull(companies.phone),
            isNotNull(companies.email),
            isNotNull(companies.website)
          )
        )
      )
      .orderBy(desc(companies.lastUpdated), desc(companies.id))
      .limit(CHUNK_SIZE)
      .offset(offset);

    if (companyList.length === 0) {
      // Empty chunk - return 404
      res.statusCode = 404;
      res.end();
      return { props: {} };
    }

    // OPTIMIZED: Simplificat - nu mai verificăm financial/shareholders în loop
    // Doar includem toate companiile care au câmpurile necesare
    const companyUrls: string[] = [];
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
    }

    // If no sitemap-worthy companies in this chunk, return 404
    if (companyUrls.length === 0) {
      res.statusCode = 404;
      res.end();
      return { props: {} };
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${companyUrls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.write(sitemap);
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Error generating company chunk:', error);
    res.statusCode = 500;
    res.end();
    return { props: {} };
  }
};

export default CompanyChunkSitemap;

