import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { companyWatches } from '@/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Cron job pentru verificare schimbări și trimitere notificări
 * Schedule: Zilnic (0 8 * * * = 8 AM)
 * 
 * Verifică companiile monitorizate pentru schimbări și trimite email notificări
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
    console.log('Starting notifications check cron job...');

    // TODO: Implementare logică de notificări
    // 1. Fetch all active watches
    // 2. Pentru fiecare, check if there are recent changes
    // 3. Construieste email cu schimbări
    // 4. Trimite via email service (SendGrid, etc.)
    // 5. Update last_notified_at

    if (!db) {
      throw new Error('Database connection not available');
    }
    const watches = await db
      .select()
      .from(companyWatches)
      .limit(100); // Procesează maxim 100 watches per run

    let notificationsSent = 0;

    for (const watch of watches) {
      try {
        // TODO: Implement notifications when companyHistory table is added
        // For now, skip notifications
        console.log(`Notifications placeholder for ${watch.email} - companyHistory table needed`);

        // Placeholder - no notifications sent
        // notificationsSent++;
      } catch (error) {
        console.error(`Error processing watch ${watch.id}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Notifications check completed',
      notificationsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in notifications-check cron:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

