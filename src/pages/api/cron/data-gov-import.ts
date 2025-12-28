import type { NextApiRequest, NextApiResponse } from 'next';
import { ingestFromDataGov } from '@/server/ingestion/connectors';

/**
 * Cron job pentru import date din data.gov.ro
 * Schedule: Zilnic (0 1 * * * = 1 AM)
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
    console.log('Starting data.gov.ro import cron job...');

    const result = await ingestFromDataGov();

    return res.status(200).json({
      success: result.success,
      message: result.message,
      stats: {
        companiesCreated: result.companiesCreated,
        companiesUpdated: result.companiesUpdated,
        financialsAdded: result.financialsAdded,
        errors: result.errorCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in data-gov-import cron:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

