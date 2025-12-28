import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';
import { count } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Numărăm firmele din baza de date
    const [result] = await db
      .select({ count: count() })
      .from(companies);

    const companyCount = result?.count || 0;

    // Verificăm dacă există procese de import active
    // Pentru simplitate, returnăm status bazat pe timestamp-ul ultimei firme adăugate
    const [latestCompany] = await db
      .select({ createdAt: companies.createdAt })
      .from(companies)
      .orderBy(companies.createdAt)
      .limit(1);

    const now = new Date();
    const lastActivity = latestCompany?.createdAt ? new Date(latestCompany.createdAt) : null;
    const secondsSinceLastActivity = lastActivity ? (now.getTime() - lastActivity.getTime()) / 1000 : null;

    // Considerăm că importul este activ dacă au fost adăugate firme în ultimele 30 secunde
    const isImportActive = secondsSinceLastActivity !== null && secondsSinceLastActivity < 30;

    return res.status(200).json({
      success: true,
      data: {
        companyCount,
        isImportActive,
        lastActivity: lastActivity?.toISOString(),
        secondsSinceLastActivity: Math.round(secondsSinceLastActivity || 0),
      },
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Import status error:', error);
    return res.status(500).json({ error: 'Error getting import status' });
  }
}
