/**
 * INDEXABILITY LOGIC - CRITICAL SEO ARCHITECTURE
 * 
 * WHY THIS EXISTS:
 * - At scale (2-5M companies), indexing everything causes:
 *   1. "Crawled - not indexed" spam in Search Console
 *   2. Crawl budget waste
 *   3. Thin/duplicate content penalties
 *   4. Google trust degradation
 * 
 * STRATEGY:
 * - Only index companies with COMPLETE, QUALITY data
 * - Category/list pages are PRIMARY SEO targets (not individual companies)
 * - Company pages support long-tail queries ("Firma X CUI Y"), not volume SEO
 * - Sitemap includes only TOP-QUALITY companies (20-30k initially)
 * 
 * SCALING APPROACH:
 * - Start conservative (20-30k indexed)
 * - Grow gradually (50k → 100k → 200k) ONLY after Search Console confirms healthy indexing
 * - Never index "everything" - quality over quantity
 */

import { companies } from '@/server/db/schema';

type Company = typeof companies.$inferSelect;

/**
 * MINIMUM REQUIREMENTS FOR INDEXING:
 * A company MUST have ALL of these to be indexable:
 * - name (non-empty)
 * - cif (valid CUI)
 * - status (active/inactive - must be set)
 * - county (județ - required for location context)
 * - city (localitate - required for location context)
 * - mainActivity (CAEN code - required for business context)
 * 
 * WHY EACH FIELD:
 * - name + cif: Basic identification (non-negotiable)
 * - status: Users need to know if company is active
 * - county + city: Location is critical for local SEO and user intent
 * - mainActivity: Business context prevents thin content
 * 
 * If ANY of these are missing, the page is too thin to index.
 */
export function isIndexableCompany(company: Company | null | undefined): boolean {
  if (!company) return false;

  // CRITICAL: All required fields must be present and non-empty
  const hasName = !!(company.name && company.name.trim().length > 0);
  const hasCif = !!(company.cif && company.cif.trim().length > 0);
  const hasStatus = !!(company.status && company.status.trim().length > 0);
  const hasCounty = !!(company.county && company.county.trim().length > 0);
  const hasCity = !!(company.city && company.city.trim().length > 0);
  const hasMainActivity = !!(company.mainActivity && company.mainActivity.trim().length > 0);

  // ALL must be true for indexability
  return hasName && hasCif && hasStatus && hasCounty && hasCity && hasMainActivity;
}

/**
 * QUALITY SCORING SYSTEM (0-6 scale)
 * 
 * Deterministic quality score for sitemap selection:
 * +1: status (required for indexability, but counts as quality signal)
 * +1: county + city (location completeness)
 * +1: CAEN (main activity - business context)
 * +1: financial data (shows business activity)
 * +1: administrators/shareholders (shows structure)
 * +1: contact data (website OR phone OR email - shows legitimacy)
 * 
 * Maximum score: 6
 * Minimum for sitemap: 4 (or 5 if data allows - adjustable)
 * 
 * WHY THIS SCORING:
 * - Deterministic and transparent
 * - Easy to adjust thresholds
 * - Clear quality signals
 */
export function calculateQualityScore(
  company: Company | null | undefined,
  hasFinancialData: boolean = false,
  hasShareholders: boolean = false,
  hasContactData: boolean = false
): number {
  if (!company) return 0;

  let score = 0;

  // +1: status (required for indexability)
  if (company.status && company.status.trim().length > 0) {
    score += 1;
  }

  // +1: county + city (location completeness)
  if (company.county && company.county.trim().length > 0 &&
      company.city && company.city.trim().length > 0) {
    score += 1;
  }

  // +1: CAEN (main activity - business context)
  if (company.mainActivity && company.mainActivity.trim().length > 0) {
    score += 1;
  }

  // +1: financial data (shows business activity)
  if (hasFinancialData) {
    score += 1;
  }

  // +1: administrators/shareholders (shows structure)
  if (hasShareholders) {
    score += 1;
  }

  // +1: contact data (website OR phone OR email)
  if (hasContactData) {
    score += 1;
  }

  return score; // Max 6
}

/**
 * SITEMAP-WORTHY LOGIC (STRICTER THAN INDEXABLE):
 * 
 * A company is sitemap-worthy ONLY if:
 * 1. It passes isIndexableCompany() check (all required fields)
 * 2. AND quality score >= 4 (or >= 5 if data allows - adjustable)
 * 
 * WHY SEPARATE FROM INDEXABLE:
 * - Indexable = can be indexed if discovered (via internal links, search, etc.)
 * - Sitemap-worthy = actively promoted to Google via sitemap
 * - Sitemap is a "recommendation" to Google - only recommend the BEST
 * 
 * INITIAL SITEMAP SIZE: 20-30k URLs max
 * - This is conservative and safe
 * - Grow to 50k → 100k → 200k ONLY after Search Console confirms:
 *   - High indexing rate (>80%)
 *   - Low "Crawled - not indexed" rate (<20%)
 *   - No crawl budget warnings
 */
export function isSitemapWorthy(
  company: Company | null | undefined,
  hasFinancialData: boolean = false,
  hasShareholders: boolean = false,
  hasContactData: boolean = false
): boolean {
  // Must be indexable first
  if (!isIndexableCompany(company)) {
    return false;
  }

  // Calculate quality score
  const qualityScore = calculateQualityScore(company, hasFinancialData, hasShareholders, hasContactData);

  // Minimum quality score for sitemap (adjustable threshold)
  // Start conservative: require score >= 4
  // Can increase to 5 if we have enough high-quality companies
  const MIN_QUALITY_SCORE = 4;
  return qualityScore >= MIN_QUALITY_SCORE;
}

/**
 * Get robots meta tag value based on indexability
 */
export function getRobotsMetaTag(company: Company | null | undefined): string {
  if (isIndexableCompany(company)) {
    return 'index, follow';
  }
  return 'noindex, follow'; // Follow allows crawling but prevents indexing
}

/**
 * Check if company should have full SEO content generated
 * Only generate long SEO text for indexable companies
 */
export function shouldGenerateFullSEOContent(company: Company | null | undefined): boolean {
  return isIndexableCompany(company);
}

/**
 * Get priority for sitemap (0.0 - 1.0)
 * Higher priority = more important for indexing
 */
export function getSitemapPriority(
  company: Company | null | undefined,
  hasFinancialData: boolean = false,
  hasShareholders: boolean = false,
  hasContactData: boolean = false
): number {
  if (!isIndexableCompany(company) || !company) {
    return 0.0; // Not indexable = no priority
  }

  // Base priority for indexable companies
  let priority = 0.6;

  // Boost for quality signals
  if (hasFinancialData) priority += 0.1;
  if (hasShareholders) priority += 0.05;
  if (hasContactData) priority += 0.1;
  if (company.address && company.address.trim().length > 0) priority += 0.05;
  if (company.registrationDate) priority += 0.05;

  // Cap at 0.9 (homepage/category pages are 1.0)
  return Math.min(priority, 0.9);
}

