import { NextApiRequest, NextApiResponse } from 'next';
import busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { db } from '@/server/db';

// Dezactivează body parser built-in pentru a putea procesa multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Setează header-ul Content-Type la JSON pentru a preveni Next.js să returneze HTML
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📁 Upload request received');
    console.log('Content-Type:', req.headers['content-type']);

    // Verificare conexiune DB
    if (!db) {
      console.log('❌ Database connection not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Procesează upload-ul cu busboy folosind Promise wrapper
    const uploadedFile = await new Promise<{ filepath: string; filename: string; size: number }>((resolve, reject) => {
      const bb = busboy({
        headers: req.headers,
        limits: {
          fileSize: 2 * 1024 * 1024 * 1024, // 2GB max
        },
      });

      let fileReceived = false;
      let fileInfo: { filepath: string; filename: string; size: number } | null = null;
      let writeStream: fs.WriteStream | null = null;
      let resolved = false;

      // Timeout pentru a preveni Promise-ul să aștepte la infinit
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.error('❌ Upload timeout - Promise not resolved');
          reject(new Error('Upload timeout - file processing took too long'));
        }
      }, 300000); // 5 minute timeout

      bb.on('file', (name, file, info) => {
        console.log('📁 File received:', name, info.filename, info.mimeType);

        // Verifică tipul fișierului
        if (!info.filename.toLowerCase().endsWith('.csv') && info.mimeType !== 'text/csv') {
          file.resume(); // Consumă stream-ul dar ignoră
          clearTimeout(timeout);
          reject(new Error('Only CSV files are allowed'));
          return;
        }

        fileReceived = true;
        let fileSize = 0;

        // Creează fișierul temporar
        const tempPath = path.join(process.cwd(), 'temp_' + Date.now() + '_' + info.filename);
        writeStream = fs.createWriteStream(tempPath);

        file.on('data', (chunk) => {
          fileSize += chunk.length;
        });

        file.pipe(writeStream!);

        file.on('end', () => {
          console.log('✅ File stream ended, size:', fileSize);
        });

        writeStream!.on('error', (error) => {
          console.error('Write stream error:', error);
          clearTimeout(timeout);
          reject(error);
        });

        writeStream!.on('finish', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            fileInfo = {
              filepath: tempPath,
              filename: info.filename,
              size: fileSize,
            };
            console.log('✅ File uploaded to:', tempPath, `(${fileSize} bytes)`);
            resolve(fileInfo);
          }
        });
      });

      bb.on('finish', () => {
        console.log('📋 Busboy finished parsing');
        if (!fileReceived && !resolved) {
          clearTimeout(timeout);
          reject(new Error('No file uploaded'));
        }
        // Nu rezolvăm aici - așteptăm ca writeStream.on('finish') să rezolve
      });

      bb.on('error', (error) => {
        console.error('Busboy error:', error);
        clearTimeout(timeout);
        if (!resolved) {
          reject(error);
        }
      });

      // Pipe request-ul către busboy
      req.pipe(bb);
    });

    try {
      // Verificare dimensiune fișier
      const stats = fs.statSync(uploadedFile.filepath);
      if (stats.size > 2 * 1024 * 1024 * 1024) { // 2GB
        fs.unlinkSync(uploadedFile.filepath);
        return res.status(400).json({ error: 'File too large (max 2GB)' });
      }

      // Mută fișierul în directorul uploads
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const finalPath = path.join(uploadsDir, `uploaded_${Date.now()}_${uploadedFile.filename}`);
      fs.renameSync(uploadedFile.filepath, finalPath);

      console.log('✅ File saved to:', finalPath);

      // Returnează informații despre fișier
      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          name: uploadedFile.filename,
          size: stats.size,
          path: finalPath,
          uploadedAt: new Date().toISOString(),
        },
        nextSteps: {
          importUrl: `/api/import-uploaded-csv?file=${encodeURIComponent(path.basename(finalPath))}`,
          previewUrl: `/api/preview-csv?file=${encodeURIComponent(path.basename(finalPath))}`,
        },
      });

    } catch (error) {
      console.error('File processing error:', error);
      // Șterge fișierul temporar dacă există
      if (uploadedFile && fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
      }
      return res.status(500).json({ error: 'Error processing uploaded file' });
    }

  } catch (error) {
    console.error('Upload handler error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Asigură-te că răspunsul este întotdeauna JSON
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined,
      });
    } else {
      // Dacă header-ul a fost deja trimis, loghează doar eroarea
      console.error('Response already sent, cannot send error response');
    }
  }
}
