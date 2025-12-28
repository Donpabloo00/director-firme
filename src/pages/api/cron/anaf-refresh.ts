import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';
import { ingestFromAnaf } from '@/server/ingestion/connectors';

/**
 * Cron job pentru refresh ANAF data
 * Schedule: Săptămânal (0 2 * * 1 = Luni, 2 AM)
 * 
 * Strategie: Refresh doar pentru firme căutate recent + monitorizate
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify Vercel CRON secret
  if (req.headers.authorization !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting ANAF refresh cron job...');

    // TODO: Fetch companies searched recently (past 7 days) + monitored
    // Pentru MVP, inainte trebuie tabel pentru tracking recent searches
    
    // Placeholder: Fetch top 100 companies din DB
    if (!db) {
      throw new Error('Database connection not available');
    }
    const companyList = await db
      .select({ cif: companies.cif })
      .from(companies)
      .limit(100);

    const cifList = companyList.map(c => c.cif);

    if (cifList.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No companies to refresh',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await ingestFromAnaf(cifList);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      stats: {
        companiesUpdated: result.companiesUpdated,
        errors: result.errorCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in anaf-refresh cron:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

