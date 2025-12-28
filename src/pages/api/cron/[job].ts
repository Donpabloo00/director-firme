import { NextApiRequest, NextApiResponse } from 'next';
import { ingestFromDataGov } from '@/server/ingestion/connectors/datagov';
import { refreshCompanyMfinante } from '@/server/ingestion/connectors/mfinante';
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { job } = req.query;

  // Verifică secret-ul pentru securitate (Vercel Cron)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (job) {
      case 'data-gov-import':
        await ingestFromDataGov();
        break;

      case 'mfinante-refresh':
        // Refresh pentru ultimele 10 companii căutate/actualizate
        if (!db) {
          throw new Error('Database connection not available');
        }
        const recentCompanies = await db.select().from(companies).orderBy(desc(companies.updatedAt)).limit(10);
        for (const company of recentCompanies) {
          await refreshCompanyMfinante(company.cif);
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid job name' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Cron job ${job} failed:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

