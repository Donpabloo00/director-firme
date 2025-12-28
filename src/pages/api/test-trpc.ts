/**
 * Test endpoint pentru verificare tRPC
 * Testează direct API-ul tRPC fără HTTP
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { appRouter } from '@/server/trpc/root';
import { createContext } from '@/server/trpc/context';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const ctx = await createContext({ req, res });
    
    // Test direct call to router using createCaller (tRPC v10)
    const caller = appRouter.createCaller(ctx);
    const result = await caller.companies.search({
      query: 'test',
      limit: 1,
      offset: 0,
    });
    
    return res.status(200).json({
      success: true,
      message: 'tRPC works',
      result: {
        companiesFound: result.companies.length,
        total: result.total,
      },
    });
  } catch (error) {
    console.error('tRPC test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
    });
  }
}

