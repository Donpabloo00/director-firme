import crypto from 'crypto';

/**
 * Utility functions pentru ingestion
 */

/**
 * Hashează payload-ul pentru deduplicare și audit
 */
export function hashPayload(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Normalizează CIF la format standard (fără prefix RO dacă nu are)
 */
export function normalizeCif(cif: string): string {
  let normalized = cif.toUpperCase().trim();
  
  // Adaugă prefix RO dacă lipsește
  if (!normalized.startsWith('RO')) {
    normalized = 'RO' + normalized;
  }
  
  // Validează format: RO + 10 cifre
  if (!/^RO\d{10}$/.test(normalized)) {
    throw new Error(`Invalid CIF format: ${cif}`);
  }
  
  return normalized;
}

/**
 * Normalizează denumirea companiei
 */
export function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Elimină spații multiple
    .replace(/[^\w\s\-&.,]/gi, '') // Elimină caractere speciale
    .substring(0, 500); // Max 500 chars
}

/**
 * Rate limiter - throttle requests la 1 req/sec default
 */
export class RateLimiter {
  private lastRequest: number = 0;
  private delay: number;

  constructor(delayMs: number = 1000) {
    this.delay = delayMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.delay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.delay - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
  }
}

/**
 * Retry logic cu exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

