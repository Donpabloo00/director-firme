import { db } from '@/server/db';
import { legalCases, sourceProvenance } from '@/server/db/schema';
import { normalizeCif, hashPayload } from '../utils';

// Interogare on-demand Portal Just
export async function fetchLegalCasesPortalJust(companyId: string, companyName: string) {
  if (!db) {
    throw new Error('Database connection not available');
  }
  // Simulăm interogare portal.just.ro după nume firmă
  // Atenție: rate limiting și respectare termeni!
  
  const mockCases = [
    { number: '123/1/2024', court: 'Tribunalul Bucuresti', status: 'Fond', type: 'Litigiu cu profesionişti' },
  ];

  for (const c of mockCases) {
    const caseRecord = {
      companyId,
      caseNumber: c.number,
      court: c.court,
      status: c.status,
      caseType: c.type,
      startDate: new Date(),
    };

    await db.insert(legalCases).values(caseRecord).onConflictDoNothing();

    await db.insert(sourceProvenance).values({
      entityType: 'legal_cases',
      entityId: companyId,
      fieldName: 'case_details',
      sourceName: 'portal.just.ro',
      sourceUrl: `https://portal.just.ro/cautare?nume=${encodeURIComponent(companyName)}`,
      hashPayload: hashPayload(c),
    });
  }
}

