/**
 * Minimal Resend client over the REST API (no SDK dependency). Env-gated: when
 * RESEND_API_KEY is unset the app degrades gracefully (callers surface a "email
 * not configured" message and fall back to copy-link), so nothing breaks in
 * local or preview environments without a key.
 *
 * Env:
 *   RESEND_API_KEY  the Resend API key (required to actually send)
 *   RESEND_FROM     the verified From address, e.g. "ShieldPay <invites@shieldpay.deegalabs.com>"
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return { ok: false, error: 'email not configured' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ from, to: args.to, subject: args.subject, html: args.html, text: args.text }),
    });
    if (!res.ok) {
      // Do not leak provider internals to the caller; log the detail server-side.
      const detail = await res.text().catch(() => '');
      console.error('Resend send failed', res.status, detail);
      return { ok: false, error: 'could not send email' };
    }
    return { ok: true };
  } catch (e) {
    console.error('Resend send error', e);
    return { ok: false, error: 'could not send email' };
  }
}
