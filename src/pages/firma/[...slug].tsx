/**
 * Pagină SEO-optimizată pentru firme
 * URL format: /firma/{slug-nume}-{cui}
 * Suportă și /firma/{cif} pentru backwards compatibility
 */

import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '@/server/db';
import { companies, financialData, fiscalStatus, shareholders, sourceProvenance } from '@/server/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { generateSEOContent, generateCompanyFAQs, generateFactSheet, generateCompanySlugOnly, normalizeCifForUrl, getBaseUrl } from '@/lib/seo-utils';
import { isIndexableCompany, isSitemapWorthy, getRobotsMetaTag, shouldGenerateFullSEOContent } from '@/lib/indexability';
import { AdSenseBanner } from '@/components/ads/AdSenseBanner';
import { AdSenseSkyscraper } from '@/components/ads/AdSenseSkyscraper';

interface CompanyPageProps {
  company: any;
  slug: string;
  canonicalPath: string; // Canonical path for this company
}

export default function CompanyPage({ company, slug, canonicalPath }: CompanyPageProps) {
  if (!company) {
    return (
      <>
        <Head>
          <title>Compania nu a fost găsită - Director Firme</title>
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href={`https://director-firme.ro/firma/${slug}`} />
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Compania nu a fost găsită</h1>
            <p className="text-gray-600 mb-6">Slug: {slug}</p>
            <Link href="/" className="text-blue-600 hover:underline">
              ← Înapoi la căutare
            </Link>
          </div>
        </div>
      </>
    );
  }

  // CRITICAL SEO: Content rules based on indexability and sitemap-worthiness
  // 1. sitemapWorthy: factual content only, optional short explanatory section
  // 2. indexable but NOT sitemapWorthy: minimal factual content only
  // 3. non-indexable: noindex,follow, no SEO text, no FAQ schema
  
  // Fetch quality signals for sitemap-worthiness check
  const hasFinancialData = company.financials && company.financials.length > 0;
  const hasShareholders = company.shareholders && company.shareholders.length > 0;
  const hasContactData = !!(company.phone || company.email || company.website);
  
  const isIndexable = isIndexableCompany(company);
  const isSitemapWorthyCompany = isSitemapWorthy(company, hasFinancialData, hasShareholders, hasContactData);
  
  // Content generation rules:
  // - sitemapWorthy: factual tables + optional short explanatory text (if data is unique)
  // - indexable but NOT sitemapWorthy: minimal factual content only
  // - non-indexable: no SEO text, no FAQ
  const shouldGenerateFullContent = isSitemapWorthyCompany; // Only sitemap-worthy get full content
  const seoContent = shouldGenerateFullContent 
    ? (company.seoContent || generateSEOContent(company))
    : null;
  const faqs = isSitemapWorthyCompany ? generateCompanyFAQs(company) : []; // Only sitemap-worthy get FAQs
  const factSheet = generateFactSheet(company); // Fact sheet is always useful (structured data)

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{company.name.length > 40 ? `${company.name.substring(0, 40)}...` : company.name} - CIF {company.cif} | Director Firme</title>
        <meta name="title" content={`${company.name.length > 50 ? `${company.name.substring(0, 50)}...` : company.name} - CIF ${company.cif}`} />
        <meta 
          name="description" 
          content={(() => {
            const base = `Informații despre ${company.name}, CIF ${company.cif}`;
            const location = company.city ? ` în ${company.city}` : '';
            const county = company.county ? `, ${company.county}` : '';
            const details = '. Date financiare, juridice și contact.';
            const full = base + location + county + details;
            return full.length > 160 ? full.substring(0, 157) + '...' : full;
          })()} 
        />
        <meta name="keywords" content={`${company.name}, CIF ${company.cif}, ${company.city || ''}, ${company.county || ''}, verificare firma, date firma, firma romania, companie romania, onrc, anaf`} />
        <meta name="robots" content={getRobotsMetaTag(company)} />
        <link rel="canonical" href={`${getBaseUrl()}${canonicalPath}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://director-firme.ro/firma/${company.slug || company.cif}`} />
        <meta property="og:title" content={`${company.name} - CIF ${company.cif}`} />
        <meta property="og:description" content={`Informații complete despre ${company.name}. Date financiare, juridice și de contact.`} />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: company.name,
              identifier: company.cif,
              taxID: company.cif,
              ...(company.address && {
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: company.address,
                  addressLocality: company.city,
                  addressRegion: company.county,
                  addressCountry: 'RO',
                }
              }),
              ...(company.registrationDate && { foundingDate: company.registrationDate }),
              ...(company.legalForm && { legalForm: company.legalForm }),
              ...(company.website && { url: company.website }),
              ...(company.phone && { telephone: company.phone }),
              ...(company.email && { email: company.email }),
            }),
          }}
        />
        
        {/* Structured Data - FAQPage (pentru AI/Google SGE) */}
        {faqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map(faq => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                  },
                })),
              }),
            }}
          />
        )}
        
        {/* Structured Data - Dataset (pentru Google Open Data) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Dataset',
              name: `Date despre ${company.name}`,
              description: `Informații oficiale despre ${company.name}, CIF ${company.cif}`,
              identifier: company.cif,
              keywords: `${company.name}, ${company.cif}, firma romania`,
              license: 'https://creativecommons.org/licenses/by/4.0/',
              creator: {
                '@type': 'Organization',
                name: 'ONRC',
              },
            }),
          }}
        />
      </Head>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold">DF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Director Firme</span>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition">
            ← Înapoi la căutare
          </Link>
        </div>
      </nav>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Company Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{company.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              <div>
                <span className="font-semibold">CIF:</span> <span className="font-mono">{company.cif}</span>
              </div>
              {company.registrationNumber && (
                <div>
                  <span className="font-semibold">Nr. Reg. Com.:</span> {company.registrationNumber}
                </div>
              )}
              {company.status && (
                <div>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    company.status === 'activ' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {company.status}
                  </span>
                </div>
              )}
            </div>

            {/* Fact Sheet pentru AI/Google SGE */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                📋 Fact Sheet
              </h2>
              <ul className="space-y-2">
                {factSheet.map((fact, idx) => (
                  <li key={idx} className="text-sm text-blue-900 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Date de Contact */}
            {(company.phone || company.email || company.website || company.address) && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  📞 Date de Contact
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {company.phone && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📱</span>
                      <div>
                        <div className="text-xs font-semibold text-green-700 uppercase">Telefon</div>
                        <a href={`tel:${company.phone}`} className="text-lg font-semibold text-green-900 hover:underline">
                          {company.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✉️</span>
                      <div>
                        <div className="text-xs font-semibold text-green-700 uppercase">Email</div>
                        <a href={`mailto:${company.email}`} className="text-lg font-semibold text-green-900 hover:underline break-all">
                          {company.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🌐</span>
                      <div>
                        <div className="text-xs font-semibold text-green-700 uppercase">Website</div>
                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-lg font-semibold text-green-900 hover:underline break-all">
                          {company.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <span className="text-2xl">📍</span>
                      <div>
                        <div className="text-xs font-semibold text-green-700 uppercase">Adresă</div>
                        <div className="text-lg font-semibold text-green-900">{company.address}</div>
                        {(company.city || company.county) && (
                          <div className="text-sm text-green-700 mt-1">
                            {[company.city, company.county].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Google AdSense Banner */}
            <AdSenseBanner />
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Left Column - Main Info */}
            <div className="md:col-span-2 space-y-6">
              {/* Content Rules:
                  - sitemapWorthy: factual tables + optional short explanatory text
                  - indexable but NOT sitemapWorthy: minimal factual content only
                  - non-indexable: no SEO text (handled below) */}
              {seoContent && isSitemapWorthyCompany && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Despre {company.name}</h2>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    {/* Short explanatory section - only if data is unique/valuable */}
                    {seoContent.split('\n').slice(0, 2).map((para: string, idx: number) => (
                      <p key={idx} className="mb-4">{para}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Minimal factual content for indexable but NOT sitemap-worthy companies */}
              {isIndexable && !isSitemapWorthyCompany && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Informații despre {company.name}</h2>
                  <p className="text-gray-700">
                    {company.name} (CIF: {company.cif}){company.city && company.county ? ` este localizată în ${company.city}, județul ${company.county}` : ''}.
                    {company.status && ` Status: ${company.status}.`}
                    {company.mainActivity && ` Activitate: ${company.mainActivity}.`}
                  </p>
                </div>
              )}
              
              {/* No SEO content for non-indexable companies */}
              {!isIndexable && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Informații despre {company.name}</h2>
                  <p className="text-gray-700 text-sm">
                    Date limitate disponibile pentru această companie.
                  </p>
                </div>
              )}

              {/* Identification Details */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Detalii de Identificare</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {company.legalForm && (
                    <>
                      <dt className="text-sm font-semibold text-gray-600">Formă Juridică</dt>
                      <dd className="text-sm text-gray-900">{company.legalForm}</dd>
                    </>
                  )}
                  {company.registrationDate && (
                    <>
                      <dt className="text-sm font-semibold text-gray-600">Data Înființării</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(company.registrationDate as string).toLocaleDateString('ro-RO')}
                      </dd>
                    </>
                  )}
                  {company.city && (
                    <>
                      <dt className="text-sm font-semibold text-gray-600">Oraș</dt>
                      <dd className="text-sm text-gray-900">{company.city}</dd>
                    </>
                  )}
                  {company.county && (
                    <>
                      <dt className="text-sm font-semibold text-gray-600">Județ</dt>
                      <dd className="text-sm text-gray-900">{company.county}</dd>
                    </>
                  )}
                  {company.mainActivity && (
                    <>
                      <dt className="text-sm font-semibold text-gray-600">Activitate Principală</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{company.mainActivity}</dd>
                    </>
                  )}
                </dl>
                {company.address && (
                  <dl className="mt-4 pt-4 border-t border-gray-200">
                    <dt className="text-sm font-semibold text-gray-600 mb-1">Adresă</dt>
                    <dd className="text-sm text-gray-900">{company.address}</dd>
                  </dl>
                )}
              </div>

              {/* FAQ Section (pentru AI/Google SGE) - ONLY for sitemap-worthy companies */}
              {isSitemapWorthyCompany && faqs.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Întrebări Frecvente</h2>
                  <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                        <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-sm text-gray-700">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Data */}
              {company.financials && company.financials.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Date Financiare</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-semibold text-gray-700">An</th>
                          <th className="text-right py-2 font-semibold text-gray-700">Cifră de Afaceri</th>
                          <th className="text-right py-2 font-semibold text-gray-700">Profit Net</th>
                          <th className="text-right py-2 font-semibold text-gray-700">Angajați</th>
                        </tr>
                      </thead>
                      <tbody>
                        {company.financials.map((financial: any) => (
                          <tr key={financial.id} className="border-b border-gray-100">
                            <td className="py-2 font-medium">{financial.year}</td>
                            <td className="text-right py-2">
                              {financial.turnover ? parseFloat(financial.turnover).toLocaleString('ro-RO') + ' RON' : '-'}
                            </td>
                            <td className="text-right py-2">
                              {financial.profit ? parseFloat(financial.profit).toLocaleString('ro-RO') + ' RON' : '-'}
                            </td>
                            <td className="text-right py-2">{financial.employees || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Acționari */}
              {company.shareholders && company.shareholders.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 Acționari / Asociați</h2>
                  <div className="space-y-4">
                    {company.shareholders.map((shareholder: any) => (
                      <div key={shareholder.id} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-lg">{shareholder.name}</div>
                            {shareholder.type && (
                              <div className="text-sm text-gray-600 mt-1">
                                Tip: <span className="font-medium">{shareholder.type}</span>
                              </div>
                            )}
                          </div>
                          {shareholder.sharePercentage && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {parseFloat(shareholder.sharePercentage).toFixed(2)}%
                              </div>
                              <div className="text-xs text-gray-500">Participație</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Google AdSense Sidebar */}
              <AdSenseSkyscraper />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string[] };
  const fullSlug = slug.join('/');

  try {
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Încearcă să găsească după slug sau CIF
    let companyResult;
    
    // Normalizează CIF pentru căutare
    const normalizeCIF = (input: string): string => {
      let cif = input.toUpperCase().trim();
      // Dacă nu începe cu RO, adaugă-l
      if (!cif.startsWith('RO')) {
        cif = 'RO' + cif;
      }
      return cif;
    };

    // Dacă slug-ul este direct un CIF (format RO12345678 sau 12345678)
    if (/^(RO)?\d{2,10}$/i.test(fullSlug)) {
      const cif = normalizeCIF(fullSlug);
      if (!db) {
        throw new Error('Database connection not available');
      }
      companyResult = await db
        .select()
        .from(companies)
        .where(eq(companies.cif, cif))
        .limit(1);
    } 
    // Dacă slug-ul conține CIF la final (format nume-firma-12345678 sau nume-firma-RO12345678)
    else {
      // Încearcă să extragă CIF din slug (ultimul segment după cratimă)
      const parts = fullSlug.split('-');
      const lastPart = parts[parts.length - 1];
      
      // Verifică dacă ultimul segment este un CIF
      if (/^(RO)?\d{2,10}$/i.test(lastPart)) {
        const cif = normalizeCIF(lastPart);
        companyResult = await db
          .select()
          .from(companies)
          .where(eq(companies.cif, cif))
          .limit(1);
      } else {
        // Fallback: caută după slug sau CIF direct
        companyResult = await db
          .select()
          .from(companies)
          .where(
            or(
              eq(companies.slug, fullSlug),
              ilike(companies.slug, `%${fullSlug}%`),
              eq(companies.cif, normalizeCIF(fullSlug))
            )
          )
          .limit(1);
      }
    }

    if (!companyResult[0]) {
      // Return 404 Not Found - do not return 200 OK for missing companies
      return {
        notFound: true,
      };
    }

    const company = companyResult[0];

    // CRITICAL SEO: Canonical format is ALWAYS /firma/{slug}-{cif}
    // Normalize path to remove trailing slashes
    const normalizePath = (p: string) => p.replace(/\/+$/, '');

    // Normalize CIF to consistent format (numeric only, no RO prefix)
    const urlCif = normalizeCifForUrl(company.cif);

    // CRITICAL: Do not redirect if CIF is empty/invalid (corrupted data)
    // Return 404 instead of redirecting to invalid canonical
    if (!urlCif || urlCif.trim() === '') {
      return {
        notFound: true,
      };
    }

    // Ensure slug always exists (generate if missing, but without CIF since we add it separately)
    let baseSlug: string;
    if (company.slug) {
      const slugStr = String(company.slug);
      baseSlug = slugStr;

      // Remove "-<cif>" only if it matches the actual normalized cif
      // This prevents cutting legitimate numbers from slug (e.g., "studio-54-srl", "firma-2020-srl")
      if (urlCif && baseSlug.toLowerCase().endsWith(`-${urlCif.toLowerCase()}`)) {
        baseSlug = baseSlug.slice(0, -(urlCif.length + 1));
      }
    } else {
      // Generate slug from name (without CIF)
      baseSlug = generateCompanySlugOnly(company.name);
    }

    const canonicalSlug = `${baseSlug}-${urlCif}`;
    const canonicalPath = normalizePath(`/firma/${canonicalSlug}`);
    const currentPath = normalizePath(((context.resolvedUrl || '').split('?')[0] || `/firma/${fullSlug}`));

    // If current URL is not canonical, redirect 301 to canonical
    // This handles cases like /firma/RO12345678 or /firma/old-slug → /firma/new-slug-12345678
    if (currentPath !== canonicalPath) {
      return {
        redirect: {
          destination: canonicalPath,
          permanent: true, // 301 redirect
        },
      };
    }

    // Fetch related data
    const [financials, fiscal, sources, companyShareholders] = await Promise.all([
      db
        .select()
        .from(financialData)
        .where(eq(financialData.companyId, company.id))
        .orderBy(financialData.year),
      db
        .select()
        .from(fiscalStatus)
        .where(eq(fiscalStatus.companyId, company.id))
        .limit(1),
      db
        .select()
        .from(sourceProvenance)
        .where(eq(sourceProvenance.entityId, company.id)),
      db
        .select()
        .from(shareholders)
        .where(eq(shareholders.companyId, company.id)),
    ]);

    // Serialize Date objects
    const serializedCompany = {
      ...company,
      registrationDate: company.registrationDate ? new Date(company.registrationDate).toISOString() : null,
      lastUpdated: company.lastUpdated ? new Date(company.lastUpdated).toISOString() : null,
      createdAt: company.createdAt ? new Date(company.createdAt).toISOString() : null,
      updatedAt: company.updatedAt ? new Date(company.updatedAt).toISOString() : null,
      financials: financials.map(f => ({
        ...f,
        fetchedAt: f.fetchedAt ? new Date(f.fetchedAt).toISOString() : null,
      })),
      fiscal: fiscal[0] ? {
        ...fiscal[0],
        updatedAt: fiscal[0].updatedAt ? new Date(fiscal[0].updatedAt).toISOString() : null,
        fetchedAt: fiscal[0].fetchedAt ? new Date(fiscal[0].fetchedAt).toISOString() : null,
      } : null,
      _sources: sources.map(s => ({
        ...s,
        fetchedAt: s.fetchedAt ? new Date(s.fetchedAt).toISOString() : null,
      })),
      shareholders: companyShareholders,
    };

    // Set cache headers
    context.res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=172800'
    );

    return {
      props: {
        company: serializedCompany,
        slug: fullSlug,
        canonicalPath: canonicalPath, // Pass canonical path to component
      },
    };
  } catch (error) {
    console.error('Error fetching company:', error);
    return {
      props: {
        company: null,
        slug: fullSlug,
        canonicalPath: `/firma/${fullSlug}`, // Fallback canonical
      },
    };
  }
};

