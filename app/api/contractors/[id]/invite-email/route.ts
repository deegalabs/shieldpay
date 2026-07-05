import { NextRequest, NextResponse } from 'next/server';
import { requireCompany } from '@/lib/auth/server';
import { getContractor } from '@/lib/db/client';
import { signScopedToken } from '@/lib/auth/session';
import { emailConfigured, sendEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';

/**
 * POST /api/contractors/[id]/invite-email — email the invite link to an invited
 * contributor. Company-only, and the contributor must belong to the caller's
 * company. Env-gated: without Resend configured it returns 501 so the UI can
 * fall back to copy-link (#4).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCompany();
  if (!auth.ok) return auth.res;
  const company = auth.company;

  if (!emailConfigured()) {
    return NextResponse.json({ error: 'email delivery is not configured' }, { status: 501 });
  }

  const contractor = await getContractor(params.id, company.id);
  if (!contractor) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (contractor.status !== 'invited') {
    return NextResponse.json({ error: 'contractor already active' }, { status: 409 });
  }
  if (!contractor.email) {
    return NextResponse.json({ error: 'this contributor has no email on file' }, { status: 422 });
  }

  const token = await signScopedToken({ scope: 'invite', cid: contractor.id }, '30d');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const base = host ? `${proto}://${host}` : req.nextUrl.origin;
  const link = `${base}/invite/${token}`;

  const sent = await sendEmail({
    to: contractor.email,
    subject: `${company.name} invited you to ShieldPay`,
    html: inviteEmailHtml({ companyName: company.name, contributorName: contractor.name, link, baseUrl: base }),
    text: `${company.name} invited you to get paid through ShieldPay.\n\nAccept your invite and set up your wallet:\n${link}\n\nA secure wallet is created for you, no seed phrase. You keep full control; the organization never holds your keys.`,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error || 'could not send email' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

/**
 * The invite email, faithful to the ShieldPay "Confidential Ledger" identity:
 * dark-only surfaces (canvas #020617, card #0F172A, hairline #1E293B), the
 * signature 135deg indigo(#6366F1)->emerald(#10B981) gradient used once (the
 * top-edge accent and the primary action), an Inter/system wordmark, and the
 * proof/link rendered in mono. Built for email clients: table layout, inline
 * styles, solid bgcolor fallbacks under every gradient (Outlook ignores CSS
 * gradients and radius), color-scheme locked to dark so clients do not invert,
 * and the logo as a hosted PNG plus a live-text wordmark for images-off.
 * Cryptography stays invisible: no ZK/Soroban jargon.
 */
function inviteEmailHtml({
  companyName,
  contributorName,
  link,
  baseUrl,
}: {
  companyName: string;
  contributorName: string;
  link: string;
  baseUrl: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const logo = `${baseUrl}/icon-192.png`;
  const gradient = 'linear-gradient(135deg,#6366F1 0%,#10B981 100%)';
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif";
  const mono = "'SFMono-Regular',ui-monospace,'Space Mono',Menlo,Consolas,monospace";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>You have been invited to ShieldPay</title>
  </head>
  <body style="margin:0;padding:0;background:#020617;color:#F8FAFC;font-family:${font};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(companyName)} invited you to get paid through ShieldPay. Accept to set up your secure wallet.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#020617" style="background:#020617;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0F172A" style="max-width:480px;background:#0F172A;border:1px solid #1E293B;border-radius:16px;overflow:hidden;">
          <!-- Top-edge gradient accent (solid indigo fallback in Outlook). -->
          <tr><td bgcolor="#6366F1" height="3" style="height:3px;line-height:3px;font-size:0;background:${gradient};">&nbsp;</td></tr>

          <!-- Header: logo tile + wordmark + mono eyebrow. -->
          <tr><td style="padding:24px 28px 20px;border-bottom:1px solid #1E293B;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:12px;">
                <img src="${logo}" width="40" height="40" alt="ShieldPay" style="display:block;width:40px;height:40px;border-radius:10px;" />
              </td>
              <td style="vertical-align:middle;">
                <div style="font-size:17px;font-weight:600;letter-spacing:-0.01em;color:#F8FAFC;line-height:1.1;">ShieldPay</div>
                <div style="font-family:${mono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#64748B;margin-top:3px;">Secure Invite</div>
              </td>
            </tr></table>
          </td></tr>

          <!-- Body. -->
          <tr><td style="padding:28px 28px 4px;">
            <div style="font-family:${mono};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#818CF8;margin-bottom:10px;">You have been invited</div>
            <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:600;color:#F8FAFC;">${esc(companyName)} invited you to get paid</h1>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#94A3B8;">
              Hi ${esc(contributorName)}, <strong style="color:#CBD5E1;font-weight:600;">${esc(companyName)}</strong> uses ShieldPay to pay contributors.
              Accept your invite to set up your secure wallet and confirm your details.
            </p>
          </td></tr>

          <!-- Primary action: gradient button with solid indigo fallback. -->
          <tr><td style="padding:6px 28px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td bgcolor="#6366F1" style="border-radius:10px;background:${gradient};">
                <a href="${esc(link)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;">Accept invite &rarr;</a>
              </td>
            </tr></table>
            <p style="margin:18px 0 0;font-family:${mono};font-size:12px;line-height:1.6;color:#64748B;word-break:break-all;">
              Or open: ${esc(link)}
            </p>
          </td></tr>

          <!-- Reassurance footer. -->
          <tr><td style="padding:18px 28px 24px;border-top:1px solid #1E293B;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;">
              A secure Stellar wallet is created for you, no seed phrase. You keep full control; the organization never holds your keys.
            </p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#475569;">Sent by ShieldPay on behalf of ${esc(companyName)}.</p>
      </td></tr>
    </table>
  </body>
</html>`;
}
