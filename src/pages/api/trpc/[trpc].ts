import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/trpc/root';
import { createContext } from '@/server/trpc/context';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = createNextApiHandler({
  router: appRouter,
  createContext: async (opts) => {
    try {
      return await createContext(opts);
    } catch (error) {
      console.error('Error creating context:', error);
      // Returnează context minim cu DB null pentru a preveni crash
      return {
        db: null as any,
        userId: null,
        req: opts?.req,
      };
    }
  },
  onError: ({ error, path, type, ctx }) => {
    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error);
    
    // Log error details pentru debugging
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      cause: error.cause,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      path,
      type,
    });
  },
});

export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers pentru JSON - CRITICAL pentru a preveni HTML responses
  // IMPORTANT: Setează headers înainte de orice altceva
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
  }
  
  try {
    // Handler-ul tRPC va gestiona răspunsul
    await handler(req, res);
  } catch (error) {
    console.error('❌ tRPC handler wrapper error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
    });
    
    // Returnează JSON chiar dacă există o eroare fatală
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      });
    }
  }
}

