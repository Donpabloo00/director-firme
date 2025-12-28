import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file } = req.query;

    if (!file || typeof file !== 'string') {
      return res.status(400).json({ error: 'File parameter is required' });
    }

    // Verificare securitate - doar fișiere din directorul uploads
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.resolve(uploadsDir, path.basename(file));

    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generează ID unic pentru import
    const importId = randomUUID();

    // Pornește procesul de import în background cu import ID
    const importProcess = spawn('npm', ['run', 'import:csv', filePath, importId], {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Dezactivează procesul părinte pentru ca să ruleze independent
    importProcess.unref();

    // Returnează imediat cu redirect către pagina de progress
    return res.status(200).json({
      success: true,
      message: 'Import started successfully',
      importId,
      file: path.basename(filePath),
      processId: importProcess.pid,
      status: 'running',
      progressUrl: `/import/${importId}`,
    });

  } catch (error) {
    console.error('Import start error:', error);
    return res.status(500).json({ error: 'Error starting import process' });
  }
}
