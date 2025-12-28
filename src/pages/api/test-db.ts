/**
 * Test endpoint pentru verificare DB connection
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not initialized',
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      });
    }

    // Test DB connection
    const result = await db.select().from(companies).limit(1);
    
    return res.status(200).json({
      success: true,
      message: 'Database connection works',
      companiesFound: result.length,
    });
  } catch (error) {
    console.error('DB test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
    });
  }
}

