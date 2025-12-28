import { NextApiRequest, NextApiResponse } from 'next';

// For now, we'll log to console and email support
// In production, integrate with email service (SendGrid, Mailgun, etc.)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, requestType, companyName, companyCif, message, agreed } = req.body;

    // Validate required fields
    if (!name || !email || !message || !agreed) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Log the request (in production, send email or store in DB)
    console.log('Rectification Request Received:', {
      timestamp: new Date().toISOString(),
      name,
      email,
      requestType,
      companyName,
      companyCif,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    // TODO: In production, implement:
    // 1. Send email notification to support
    // 2. Store request in audit_logs table
    // 3. Create ticket/task for manual review

    return res.status(200).json({
      success: true,
      message: 'Cererea a fost trimisă cu succes. Îți vom răspunde în curând.',
    });
  } catch (error) {
    console.error('Error processing rectification request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

