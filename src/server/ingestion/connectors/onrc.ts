import { db } from '@/server/db';
import { companies, shareholders, sourceProvenance } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { CompanyData, IngestResult } from '../types';
import { normalizeCif, normalizeCompanyName, hashPayload, RateLimiter } from '../utils';

/**
 * Conector pentru ONRC (Oficiul Național al Registrului Comerțului)
 * 
 * URL: https://www.onrc.ro
 * Căutare: https://www.onrc.ro/index.php/ro/online/consultare-persoane-juridice
 * 
 * Strategie: Web scraping cu Puppeteer/Playwright (respectând Terms)
 * Rate limit: 1 req/sec (politeness)
 */

const limiter = new RateLimiter(1000); // 1 req/sec

export async function ingestFromOnrc(cifList: string[]): Promise<IngestResult> {
  const result: IngestResult = {
    success: false,
    message: '',
    companiesCreated: 0,
    companiesUpdated: 0,
    financialsAdded: 0,
    errorCount: 0,
    errors: [],
  };

  try {
    console.log('Starting ONRC ingestion...');

    // TODO: Implementare web scraper cu Puppeteer
    // 1. Navigate la ONRC căutare
    // 2. Introdu CIF
    // 3. Extrage date: nume, status, dată înregistrare, acționari
    // 4. Parse și normalizare
    // 5. Insert în DB cu provenance tracking

    console.log('ONRC connector placeholder - Puppeteer implementation needed');

    result.success = true;
    result.message = 'ONRC ingestion placeholder';
    return result;
  } catch (error) {
    result.success = false;
    result.message = `Error during ONRC ingestion: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors = [result.message];
    console.error(result.message);
    return result;
  }
}

/**
 * Insert company cu all data și provenance
 */
export async function insertCompanyWithProvenance(
  company: CompanyData
): Promise<string> {
  if (!db) {
    throw new Error('Database connection not available');
  }

  try {
    const normalizedCif = normalizeCif(company.cif);
    const normalizedName = normalizeCompanyName(company.name);

    // Check if exists
    let existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.cif, normalizedCif))
      .limit(1);

    let companyId: string;

    if (existingCompany[0]) {
      // Update existing
      companyId = existingCompany[0].id;
      // Update fields (TODO: implement update logic)
    } else {
      // Insert new
      companyId = require('crypto').randomUUID();
      
      await db.insert(companies).values({
        id: companyId,
        cif: normalizedCif,
        name: normalizedName,
        registrationNumber: company.registrationNumber,
        registrationDate: company.registrationDate,
        status: company.status,
        legalForm: company.legalForm,
        address: company.address,
        city: company.city,
        county: company.county,
        mainActivity: company.mainActivity,
        capital: company.capital ? company.capital.toString() : undefined,
        lastUpdated: company.fetchedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Track provenance for all fields
    const fieldsToTrack = [
      'cif',
      'name',
      'status',
      'legalForm',
      'address',
      'city',
      'county',
      'mainActivity',
    ];

    for (const field of fieldsToTrack) {
      const value = company[field as keyof CompanyData];
      if (value) {
        const hashVal = hashPayload({ [field]: value });

        await db.insert(sourceProvenance).values({
          id: require('crypto').randomUUID(),
          entityType: 'company',
          entityId: companyId,
          fieldName: field,
          sourceName: company.source,
          sourceUrl: company.sourceUrl,
          fetchedAt: company.fetchedAt,
          hashPayload: hashVal,
        });
      }
    }

    return companyId;
  } catch (error) {
    console.error(`Error inserting company ${company.cif}:`, error);
    throw error;
  }
}

/**
 * Insert shareholders cu tracking
 */
export async function insertShareholdersWithProvenance(
  companyId: string,
  shareholderData: Array<{
    name: string;
    type?: string;
    sharePercentage?: number;
  }>,
  fetchedAt: Date
): Promise<number> {
  if (!db) {
    throw new Error('Database connection not available');
  }

  let insertedCount = 0;

  for (const shareholder of shareholderData) {
    try {
      const shareholderId = require('crypto').randomUUID();

      await db.insert(shareholders).values({
        id: shareholderId,
        companyId,
        name: shareholder.name,
        type: shareholder.type,
        sharePercentage: shareholder.sharePercentage
          ? shareholder.sharePercentage.toString()
          : undefined,
        createdAt: new Date(),
      });

      // Track provenance
      const hashVal = hashPayload(shareholder);
      
      await db.insert(sourceProvenance).values({
        id: require('crypto').randomUUID(),
        entityType: 'company',
        entityId: companyId,
        fieldName: `shareholder_${shareholder.name}`,
        sourceName: 'ONRC',
        sourceUrl: 'https://www.onrc.ro',
        fetchedAt,
        hashPayload: hashVal,
      });

      insertedCount++;
    } catch (error) {
      console.error(`Error inserting shareholder:`, error);
    }
  }

  return insertedCount;
}

