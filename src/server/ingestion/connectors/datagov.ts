import { db } from '@/server/db';
import { companies, financialData, sourceProvenance } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { FinancialData, IngestResult } from '../types';
import { normalizeCif, hashPayload } from '../utils';
// import axios from 'axios'; // TODO: Install axios when implementing data.gov.ro API calls

/**
 * Conector pentru data.gov.ro - Dataseturi Open Data
 * 
 * URL: https://data.gov.ro
 * Dataseturi: Situații financiare anuale pe ani, CSV/TXT format
 * 
 * Strategie: Import bulk periodic (anual/trimestrial)
 */

const DATA_GOV_SOURCES = [
  'https://data.gov.ro/api/datasets', // Cauta datasets de situatii financiare
];

export async function ingestFromDataGov(): Promise<IngestResult> {
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
    console.log('Starting data.gov.ro ingestion...');

    // TODO: Implementare conector real
    // Pentru MVP, se poate face manual prin:
    // 1. Download CSV din data.gov.ro
    // 2. Parse și normalizare
    // 3. Insert în DB

    // Placeholder pentru demonstrație
    console.log('data.gov.ro connector placeholder - manual implementation needed');

    result.success = true;
    result.message = 'data.gov.ro ingestion placeholder';
    return result;
  } catch (error) {
    result.success = false;
    result.message = `Error during data.gov.ro ingestion: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors = [result.message];
    console.error(result.message);
    return result;
  }
}

/**
 * Parse CSV data din data.gov.ro format
 */
export async function parseDataGovCsv(csvData: string): Promise<FinancialData[]> {
  const lines = csvData.split('\n');
  const financials: FinancialData[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Expected format: CIF,Year,Turnover,Profit,Employees,Assets,Debts
      const [cif, year, turnover, profit, employees, assets, debts] = line.split(',');

      const financialRecord: FinancialData = {
        companyCif: normalizeCif(cif),
        year: parseInt(year),
        turnover: turnover ? parseFloat(turnover) : undefined,
        profit: profit ? parseFloat(profit) : undefined,
        employees: employees ? parseInt(employees) : undefined,
        assets: assets ? parseFloat(assets) : undefined,
        debts: debts ? parseFloat(debts) : undefined,
        source: 'data.gov.ro',
        fetchedAt: new Date(),
      };

      financials.push(financialRecord);
    } catch (error) {
      console.error(`Error parsing line ${i}: ${line}`, error);
    }
  }

  return financials;
}

/**
 * Insert financial data cu provenance tracking
 */
export async function insertFinancialDataWithProvenance(
  financials: FinancialData[]
): Promise<number> {
  if (!db) {
    throw new Error('Database connection not available');
  }

  let addedCount = 0;

  for (const financial of financials) {
    try {
      // Gaseste company din DB
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.cif, financial.companyCif))
        .limit(1);

      if (!company[0]) {
        console.warn(`Company not found: ${financial.companyCif}`);
        continue;
      }

      // Insert financial data
      await db.insert(financialData).values({
        id: require('crypto').randomUUID(),
        companyId: company[0].id,
        year: financial.year,
        turnover: financial.turnover ? financial.turnover.toString() : undefined,
        profit: financial.profit ? financial.profit.toString() : undefined,
        employees: financial.employees,
        assets: financial.assets ? financial.assets.toString() : undefined,
        debts: financial.debts ? financial.debts.toString() : undefined,
        source: financial.source,
        fetchedAt: financial.fetchedAt,
      });

      // Track source provenance
      const payload = { ...financial };
      const hashVal = hashPayload(payload);

      await db.insert(sourceProvenance).values({
        id: require('crypto').randomUUID(),
        entityType: 'financial',
        entityId: company[0].id,
        fieldName: `financial_${financial.year}`,
        sourceName: 'data.gov.ro',
        sourceUrl: 'https://data.gov.ro',
        fetchedAt: financial.fetchedAt,
        hashPayload: hashVal,
      });

      addedCount++;
    } catch (error) {
      console.error(`Error inserting financial data for ${financial.companyCif}:`, error);
    }
  }

  return addedCount;
}
