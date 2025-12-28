/**
 * Types și interfaces pentru ingestion pipeline
 */

export interface CompanyData {
  cif: string;
  name: string;
  registrationNumber?: string;
  registrationDate?: Date;
  status?: string;
  legalForm?: string;
  address?: string;
  city?: string;
  county?: string;
  mainActivity?: string;
  capital?: number;
  source: string;
  sourceUrl?: string;
  fetchedAt: Date;
  rawData?: Record<string, unknown>;
}

export interface FinancialData {
  companyCif: string;
  year: number;
  turnover?: number;
  profit?: number;
  employees?: number;
  assets?: number;
  debts?: number;
  source: string;
  fetchedAt: Date;
}

export interface FiscalStatus {
  companyCif: string;
  vatStatus?: string;
  inactiveStatus?: string;
  source: string;
  fetchedAt: Date;
}

export interface SourceProvenance {
  entityType: 'company' | 'financial' | 'fiscal';
  entityId: string;
  fieldName: string;
  sourceName: string;
  sourceUrl?: string;
  fetchedAt: Date;
  hashPayload?: string;
}

export interface IngestResult {
  success: boolean;
  message: string;
  companiesCreated: number;
  companiesUpdated: number;
  financialsAdded: number;
  errorCount: number;
  errors?: string[];
}

