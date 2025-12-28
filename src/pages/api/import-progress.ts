import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { importId } = req.query;

    if (!importId || typeof importId !== 'string') {
      return res.status(400).json({ error: 'Import ID is required' });
    }

    // Verificare securitate - doar ID-uri valide
    if (!/^[a-f0-9-]{36}$/i.test(importId)) {
      return res.status(400).json({ error: 'Invalid import ID format' });
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    const progressFile = path.join(tmpDir, `import-${importId}.json`);

    if (!fs.existsSync(progressFile)) {
      return res.status(404).json({ 
        error: 'Import progress not found',
        importId 
      });
    }

    const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));

    return res.status(200).json({
      success: true,
      progress: progressData,
    });

  } catch (error) {
    console.error('Error fetching import progress:', error);
    return res.status(500).json({ 
      error: 'Error fetching import progress',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

