import { TRPCError } from '@trpc/server';
// import { t } from '../trpc'; // TODO: Fix import when middleware is re-enabled
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import type { Context } from '../context';

/**
 * Rate limiting middleware - protejează API de abuse
 * 
 * Politică:
 * - 100 requests/min per IP pentru search
 * - 1000 requests/zi per IP pentru celelalte endpoints
 * - Useri autentificati: 10x mai mult (future)
 */

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minut
const RATE_LIMIT_MAX = 100; // max requests per window

interface RateLimitKey {
  type: 'search' | 'general';
  identifier: string; // IP address or user ID
}

// In-memory store pentru rate limiting (for single-instance deployment)
// TODO: Pentru multi-instance, migrați la Redis
const rateLimitStore = new Map<string, Array<{ timestamp: number }>>();

/**
 * Middleware pentru rate limiting
 * TODO: Fix import and re-enable
 */
// export const rateLimitMiddleware = t.middleware(async ({ ctx, path, next }) => {
//   // Extrage procedure name din path
//   const procedure = path.split('.').pop() || 'unknown';
//
//   // Determina tipul și limita
//   const isSearchProcedure = ['search', 'searchAdvanced', 'getAutocomplete'].includes(procedure);
//   const rateLimit = isSearchProcedure ? 100 : 1000; // per minute vs per day
//   const windowMs = isSearchProcedure ? 60 * 1000 : 24 * 60 * 60 * 1000;
//
//   // Extrage IP din context (trebuie pasat din Next.js)
//   const ipAddress = 'unknown'; // TODO: Pass from Next.js request context
//
//   // Determina cheia pentru rate limiting
//   const key = `${ipAddress}:${procedure}`;
//
//   // Verifică rate limit
//   try {
//     const allowed = checkRateLimit(key, rateLimit, windowMs);
//     if (!allowed) {
//       throw new TRPCError({
//         code: 'TOO_MANY_REQUESTS',
//         message: `Rate limit exceeded. Maximum ${rateLimit} requests per ${isSearchProcedure ? 'minute' : 'day'}.`,
//       });
//     }
//   } catch (error) {
//     // Log error dar nu bloca request (fail open)
//     console.error('Rate limit check failed:', error);
//   }
//
// //   return next();
// // });

/**
 * Verifică dacă request-ul este permis
 */
function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  // Inițializează entry dacă nu există
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key)!;

  // Elimină requests expirate
  const activeRequests = requests.filter(r => now - r.timestamp < windowMs);

  // Verifică dacă am depășit limita
  if (activeRequests.length >= maxRequests) {
    return false;
  }

  // Adaugă request curent
  activeRequests.push({ timestamp: now });
  rateLimitStore.set(key, activeRequests);

  // Cleanup: șterge entries vechi (pentru a nu acumula memorie)
  if (rateLimitStore.size > 10000) {
    cleanupOldEntries();
  }

  return true;
}

/**
 * Cleanup funcție pentru a preveni memory leaks
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const hour = 60 * 60 * 1000;

  for (const [key, requests] of rateLimitStore.entries()) {
    const activeRequests = requests.filter(r => now - r.timestamp < hour);
    if (activeRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, activeRequests);
    }
  }
}

/**
 * Alternative: Redis-based rate limiting (pentru production multi-instance)
 * 
 * Dacă deploiezi pe multiple instances, implementează cu Redis:
 * 
 * import { createClient } from 'redis';
 * 
 * const redisClient = createClient({
 *   url: process.env.REDIS_URL,
 * });
 * 
 * export async function checkRateLimitRedis(
 *   key: string,
 *   maxRequests: number,
 *   windowMs: number
 * ): Promise<boolean> {
 *   const count = await redisClient.incr(key);
 *   
 *   if (count === 1) {
 *     await redisClient.expire(key, Math.ceil(windowMs / 1000));
 *   }
 *   
 *   return count <= maxRequests;
 * }
 */

/**
 * Endpoint pentru a verifica status rate limit (admin only)
 */
export function getRateLimitStatus(ipAddress: string) {
  const stats: Record<string, { requests: number; resetIn: number }> = {};

  const now = Date.now();
  const minute = 60 * 1000;

  for (const [key, requests] of rateLimitStore.entries()) {
    if (key.startsWith(ipAddress)) {
      const activeRequests = requests.filter(r => now - r.timestamp < minute);
      const oldestRequest = requests[0]?.timestamp || now;
      const resetIn = Math.max(0, minute - (now - oldestRequest));

      stats[key] = {
        requests: activeRequests.length,
        resetIn,
      };
    }
  }

  return stats;
}
