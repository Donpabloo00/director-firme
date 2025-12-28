import { db } from '@/server/db';
import { companies, fiscalStatus, sourceProvenance } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { FiscalStatus, IngestResult } from '../types';
import { normalizeCif, hashPayload, RateLimiter } from '../utils';

/**
 * Conector pentru ANAF (Agenția Națională de Administrare Fiscală)
 * 
 * URL: https://www.anaf.ro
 * API: Dacă disponibil din ANAF (status TVA, restanțe, e-Factura)
 * 
 * Strategie: Refresh incremental zilnic pe firme căutate + monitorizate
 * Rate limit: 1 req/sec (respectare ANAF Terms)
 */

const ANAF_API_URL = 'https://www.anaf.ro/';
const limiter = new RateLimiter(1000); // 1 req/sec

export async function ingestFromAnaf(cifList?: string[]): Promise<IngestResult> {
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
    console.log('Starting ANAF ingestion...');

    // TODO: Verifică dacă ANAF expune API public pentru:
    // - Status TVA (plătitor/neplătitor)
    // - Restanțe fiscale
    // - Status inactive (pentru firme care au oprit activitatea)

    // Pentru MVP, ANAF API poate să nu fie disponibil public
    // Alterna: Web scraping (respectând robots.txt și Terms)
    
    if (!cifList || cifList.length === 0) {
      result.success = true;
      result.message = 'ANAF connector - no CIFs provided';
      return result;
    }

    for (const cif of cifList) {
      try {
        await limiter.wait(); // Rate limit

        const normalizedCif = normalizeCif(cif);
        const status = await fetchAnafStatus(normalizedCif);

        if (status) {
          await insertFiscalStatus(normalizedCif, status);
          result.companiesUpdated++;
        }
      } catch (error) {
        result.errorCount++;
        const errorMsg = `Error processing ${cif}: ${error instanceof Error ? error.message : 'Unknown'}`;
        result.errors?.push(errorMsg);
        console.error(errorMsg);
      }
    }

    result.success = result.errorCount === 0;
    result.message = `ANAF ingestion completed: ${result.companiesUpdated} updated, ${result.errorCount} errors`;
    return result;
  } catch (error) {
    result.success = false;
    result.message = `Error during ANAF ingestion: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors = [result.message];
    console.error(result.message);
    return result;
  }
}

/**
 * Fetch ANAF status pentru o firmă (placeholder)
 */
async function fetchAnafStatus(cif: string): Promise<FiscalStatus | null> {
  if (!db) {
    throw new Error('Database connection not available');
  }
  // TODO: Implementare conector real cu ANAF API
  // Pentru MVP: return null
  console.log(`ANAF lookup placeholder for ${cif}`);
  return null;
}

/**
 * Insert fiscal status cu provenance tracking
 */
export async function insertFiscalStatus(
  cif: string,
  status: FiscalStatus
): Promise<void> {
  if (!db) {
    throw new Error('Database connection not available');
  }

  try {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.cif, cif))
      .limit(1);

    if (!company[0]) {
      console.warn(`Company not found: ${cif}`);
      return;
    }

    // Insert fiscal status
    await db.insert(fiscalStatus).values({
      id: require('crypto').randomUUID(),
      companyId: company[0].id,
      vatStatus: status.vatStatus,
      inactiveStatus: status.inactiveStatus,
      updatedAt: new Date(),
      source: 'ANAF',
      fetchedAt: status.fetchedAt,
    });

    // Track provenance
    const payload = { vatStatus: status.vatStatus, inactiveStatus: status.inactiveStatus };
    const hashVal = hashPayload(payload);

    await db.insert(sourceProvenance).values({
      id: require('crypto').randomUUID(),
      entityType: 'fiscal',
      entityId: company[0].id,
      fieldName: 'fiscal_status',
      sourceName: 'ANAF',
      sourceUrl: 'https://www.anaf.ro',
      fetchedAt: status.fetchedAt,
      hashPayload: hashVal,
    });
  } catch (error) {
    console.error(`Error inserting fiscal status for ${cif}:`, error);
    throw error;
  }
}

