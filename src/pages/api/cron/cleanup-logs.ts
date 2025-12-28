import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { auditLogs } from '@/server/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Cleanup job pentru audit logs - runeaza zilnic
 * Sterge logs mai vechi de 1 an
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
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // Delete old audit logs
    if (!db) {
      throw new Error('Database connection not available');
    }
    await db
      .delete(auditLogs)
      .where(sql`${auditLogs.timestamp} < ${oneYearAgo}`);

    console.log('Audit logs cleanup completed', {
      timestamp: new Date().toISOString(),
      cutoffDate: oneYearAgo.toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Audit logs cleaned up successfully',
      cutoffDate: oneYearAgo.toISOString(),
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

