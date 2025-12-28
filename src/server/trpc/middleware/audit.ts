// import { t } from '../trpc'; // TODO: Fix import when middleware is re-enabled
import { db } from '@/server/db';
import { auditLogs } from '@/server/db/schema';
import type { Context } from '../context';

/**
 * Middleware pentru audit logging - înregistrează toate interogările pentru compliance
 * TODO: Fix import and re-enable
 */
// export const auditMiddleware = t.middleware(async ({ ctx, path, input, next }) => {
//   // Capturează IP-ul din request headers
//   let ipAddress = 'unknown';
//   if (ctx && typeof ctx === 'object') {
//     // Incearca sa gaseasca IP din context (daca e disponibil)
//     // Pentru tRPC, trebuie sa il pasam din context
//   }
//
//   // Executează procedura
//   const result = await next();
//
//   // Log asincron (nu astepta)
//   try {
//     // Log doar pentru anumite actiuni sensibile
//     const sensitiveActions = ['search', 'getByCif', 'getById', 'searchAdvanced'];
//     if (sensitiveActions.includes(path.split('.').pop() || '')) {
//       logAuditEvent(ctx as Context, path, input, ipAddress).catch(err => {
//         console.error('Failed to log audit event:', err);
//       });
//     }
//   } catch (error) {
//     // Nu bloca requestul daca logging fails
//     console.error('Audit logging error:', error);
//   }
//
// //   return result;
// // });

/**
 * Funcție pentru a înregistra evenimentul de audit
 */
async function logAuditEvent(
  ctx: Context,
  path: string,
  input: unknown,
  ipAddress: string
) {
  if (!db) {
    console.error('Database connection not available for audit logging');
    return;
  }

  try {
    // Nu loga datele sensibile in clar
    const sanitizedInput = sanitizeInput(input);

    await db.insert(auditLogs).values({
      id: require('crypto').randomUUID(),
      userId: ctx.userId || null,
      action: path.split('.').pop() || 'unknown',
      entityType: getEntityTypeFromPath(path),
      entityId: getEntityIdFromInput(input),
      queryParams: sanitizedInput,
      ipAddress: ipAddress,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Nu propaga eroarea
  }
}

/**
 * Sanitizeaza input-ul pentru audit (elimina PII)
 */
function sanitizeInput(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const obj = input as Record<string, unknown>;

  // Lista campuri care pot fi loggate cu siguranta
  const safeFields = ['cif', 'id', 'limit', 'offset', 'query', 'city', 'county', 'status', 'legalForm'];

  for (const [key, value] of Object.entries(obj)) {
    if (safeFields.includes(key)) {
      // Hash-uieste query-urile pentru privacy
      if (key === 'query' && typeof value === 'string') {
        sanitized[key] = hashString(value.substring(0, 50)); // Hash primii 50 chars
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Extrage entity type din path
 */
function getEntityTypeFromPath(path: string): string | null {
  if (path.includes('companies')) {
    return 'company';
  }
  return null;
}

/**
 * Extrage entity ID din input
 */
function getEntityIdFromInput(input: unknown): string | undefined {
  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    return (obj.id as string) || (obj.companyId as string);
  }
  return undefined;
}

/**
 * Simple hash function pentru privacy
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Converteste la 32bit integer
  }
  return Math.abs(hash).toString(16);
}
