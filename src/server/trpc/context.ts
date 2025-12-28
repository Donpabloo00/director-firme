import { db } from '@/server/db';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

/**
 * Context pentru tRPC - simplificat pentru MVP (fără auth)
 * Auth va fi adăugat în Faza 2 când facem login/dashboard
 */
export async function createContext(opts?: CreateNextContextOptions) {
  try {
    // Verifică dacă db este disponibil
    if (!db) {
      console.error('⚠️ Database connection not available - check DATABASE_URL');
      console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
      // Nu aruncăm eroare, returnăm context cu db null
      // Query-urile vor gestiona acest caz
    }
    
    return {
      db: db!,
      userId: null, // TODO: Extract from JWT token în production
      req: opts?.req,
    };
  } catch (error) {
    console.error('❌ Error creating tRPC context:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    // Returnăm context minim pentru a preveni crash
    return {
      db: null as any,
      userId: null,
      req: opts?.req,
    };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
