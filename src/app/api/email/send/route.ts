import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';

// Email sending route — 3 strategies:
// 1. Resend API (RESEND_API_KEY)
// 2. HTTP relay (SMTP_API_URL)
// 3. SMTP via nodemailer (SMTP_HOST + SMTP_USER + SMTP_PASS)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const { to, subject, html, secret } = body;

    // Basic auth - only internal calls
    const emailSecret = process.env.EMAIL_SECRET;
    if (!emailSecret || secret !== emailSecret) {
      return apiError('Non autorisé', 401);
    }

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Option 1: Use Resend API (recommended, no dependency needed)
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            from: process.env.RESEND_FROM || process.env.SMTP_FROM || 'Mada Spot <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
          }),
        });

        const resText = await res.text();
        if (res.ok) {
          logger.info('[EMAIL] Resend sent successfully to:', to);
          return NextResponse.json({ success: true, sent: true });
        }
        console.error(`[EMAIL] ❌ Resend ERREUR (${res.status}):`, resText);
        logger.error(`[EMAIL] Resend error (${res.status}):`, resText);
        // Don't fall through silently — return the error
        return NextResponse.json({ success: false, sent: false, error: `Resend error: ${res.status}`, details: resText }, { status: 502 });
      } catch (err) {
        console.error('[EMAIL] ❌ Resend fetch error:', err);
        logger.error('[EMAIL] Resend fetch error:', err);
      }
    }

    // Option 2: Use any HTTP email API (Mailgun, SendGrid, etc.)
    if (process.env.SMTP_API_URL) {
      try {
        const res = await fetch(process.env.SMTP_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({ to, subject, html }),
        });

        if (res.ok) {
          return NextResponse.json({ success: true, sent: true });
        }
      } catch (err) {
        logger.error('[EMAIL] HTTP API error:', err);
      }
    }

    // Option 3: SMTP via nodemailer (Gmail, Outlook, custom SMTP)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `Mada Spot <${process.env.SMTP_USER}>`,
          to,
          subject,
          html,
        });

        return NextResponse.json({ success: true, sent: true });
      } catch (err) {
        logger.error('[EMAIL] SMTP/nodemailer error:', err);
      }
    }

    // Fallback: Log to console (development)
    logger.info(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return NextResponse.json({
      success: true,
      queued: true,
      message: 'Email not configured. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS in .env',
    });
  } catch (error) {
    logger.error('Email send error:', error);
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
  }
}
