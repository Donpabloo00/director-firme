import { z } from 'zod';
import type { CompanyData, FinancialData, FiscalStatus } from './types';

/**
 * Schema validare pentru company data
 */
const CompanyDataSchema = z.object({
  cif: z.string().min(1),
  name: z.string().min(1).max(500),
  registrationNumber: z.string().optional(),
  registrationDate: z.date().optional(),
  status: z.enum(['activ', 'inactiv', 'in_lichidare', 'suspendat']).optional(),
  legalForm: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  mainActivity: z.string().optional(),
  capital: z.number().optional(),
  source: z.string().min(1),
  sourceUrl: z.string().optional(),
  fetchedAt: z.date(),
  rawData: z.record(z.unknown()).optional(),
});

const FinancialDataSchema = z.object({
  companyCif: z.string().min(1),
  year: z.number().min(1900).max(2100),
  turnover: z.number().optional(),
  profit: z.number().optional(),
  employees: z.number().optional(),
  assets: z.number().optional(),
  debts: z.number().optional(),
  source: z.string().min(1),
  fetchedAt: z.date(),
});

const FiscalStatusSchema = z.object({
  companyCif: z.string().min(1),
  vatStatus: z.enum(['platitor', 'neplatitor']).optional(),
  inactiveStatus: z.string().optional(),
  source: z.string().min(1),
  fetchedAt: z.date(),
});

/**
 * Validează și normalizează company data
 */
export function validateCompanyData(data: unknown): CompanyData {
  try {
    return CompanyDataSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid company data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validează și normalizează financial data
 */
export function validateFinancialData(data: unknown): FinancialData {
  try {
    return FinancialDataSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid financial data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validează și normalizează fiscal status
 */
export function validateFiscalStatus(data: unknown): FiscalStatus {
  try {
    return FiscalStatusSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid fiscal status: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Batch normalize și validează array de company data
 */
export function normalizeCompanyBatch(items: unknown[]): {
  valid: CompanyData[];
  errors: Array<{ index: number; error: string }>;
} {
  const valid: CompanyData[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  items.forEach((item, index) => {
    try {
      valid.push(validateCompanyData(item));
    } catch (error) {
      errors.push({
        index,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return { valid, errors };
}
