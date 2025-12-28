import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

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

    // Citește primele 10 linii pentru preview
    const fileStream = fs.createReadStream(filePath);
    const chunks: Buffer[] = [];

    for await (const chunk of fileStream) {
      chunks.push(chunk);
      // Limitează la ~100KB pentru preview
      if (Buffer.concat(chunks).length > 100 * 1024) {
        break;
      }
    }

    const buffer = Buffer.concat(chunks);
    const content = iconv.decode(buffer, 'win1250');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

    // Parsează header și primele 5 linii de date
    const headers = lines[0]?.split('^').map(h =>
      h.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
    ) || [];

    const sampleRows = lines.slice(1, 6).map(line =>
      line.split('^').map(cell => cell.trim())
    );

    // Statistici fișier
    const stats = fs.statSync(filePath);
    const estimatedRows = Math.floor(stats.size / 300); // ~300 bytes per row estimate

    return res.status(200).json({
      success: true,
      file: {
        name: path.basename(filePath),
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        estimatedRows: estimatedRows.toLocaleString(),
      },
      preview: {
        headers,
        sampleRows,
        totalPreviewRows: sampleRows.length,
      },
    });

  } catch (error) {
    console.error('Preview error:', error);
    return res.status(500).json({ error: 'Error generating preview' });
  }
}
