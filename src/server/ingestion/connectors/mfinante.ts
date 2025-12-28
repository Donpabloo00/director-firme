// import axios from 'axios'; // TODO: Install axios when implementing MFinante API calls
import { normalizeCif, hashPayload } from '../utils';
import { db } from '@/server/db';
import { companies, fiscalStatus, sourceProvenance } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// Serviciu pentru interogare date fiscale ANAF / mfinante
export async function refreshCompanyMfinante(cif: string) {
  if (!db) {
    throw new Error('Database connection not available');
  }
  const cleanCif = normalizeCif(cif);
  
  // În realitate, am face un request HTTP către mfinante.ro sau un API intermediar
  // Simulat:
  const mockScrapedData = {
    cif: cleanCif,
    vatStatus: 'PLATITOR',
    inactiveStatus: 'ACTIV',
    updatedAt: new Date(),
    address: 'Str. Exemplu Nr. 1, Bucuresti',
  };

  const company = await db
    .select()
    .from(companies)
    .where(eq(companies.cif, cleanCif))
    .limit(1);

  if (!company[0]) return;

  // 1. Update Company Address
  await db.update(companies).set({
    address: mockScrapedData.address,
    updatedAt: new Date(),
  }).where(eq(companies.id, company[0].id));

  // 2. Update Fiscal Status
  await db.insert(fiscalStatus).values({
    companyId: company[0].id,
    vatStatus: mockScrapedData.vatStatus,
    inactiveStatus: mockScrapedData.inactiveStatus,
    source: 'mfinante.ro',
    updatedAt: mockScrapedData.updatedAt,
  });

  // 3. Provenance
  await db.insert(sourceProvenance).values({
    entityType: 'fiscal_status',
    entityId: company[0].id,
    fieldName: 'vat_status',
    sourceName: 'mfinante.ro',
    hashPayload: hashPayload(mockScrapedData),
  });
}

