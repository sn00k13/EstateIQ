import nodemailer from 'nodemailer'
import { getPublicAppOrigin } from '@/lib/appUrl'

/** Prefer dedicated SMTP_*; fall back to MAILER_SMTP_* (same as contact form) so Netlify can use one set of vars. */
function resolveSmtpConfig():
  | { host: string; port: number; secure: boolean; user: string; pass: string }
  | null {
  const h1 = process.env.SMTP_HOST?.trim()
  const u1 = process.env.SMTP_USER?.trim()
  const p1 = process.env.SMTP_PASS?.trim()
  if (h1 && u1 && p1) {
    return {
      host:   h1,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      user:   u1,
      pass:   p1,
    }
  }
  const h2 = process.env.MAILER_SMTP_HOST?.trim()
  const u2 = process.env.MAILER_SMTP_USER?.trim()
  const p2 = process.env.MAILER_SMTP_PASS?.trim()
  if (h2 && u2 && p2) {
    return {
      host:   h2,
      port:   Number(process.env.MAILER_SMTP_PORT ?? 465),
      secure: process.env.MAILER_SMTP_SECURE !== 'false',
      user:   u2,
      pass:   p2,
    }
  }
  return null
}

let cachedTransporter: nodemailer.Transporter | null = null
let cachedCfgKey: string | null = null

function getMailTransporter(): nodemailer.Transporter | null {
  const cfg = resolveSmtpConfig()
  if (!cfg) return null
  const key = `${cfg.host}:${cfg.port}:${cfg.secure}:${cfg.user}`
  if (cachedTransporter && cachedCfgKey === key) return cachedTransporter
  cachedTransporter = nodemailer.createTransport({
    host:   cfg.host,
    port:   cfg.port,
    secure: cfg.secure,
    auth:   { user: cfg.user, pass: cfg.pass },
    tls:    { rejectUnauthorized: false },
  })
  cachedCfgKey = key
  return cachedTransporter
}

export function getTransactionalFromAddress(): string {
  return (
    process.env.SMTP_FROM?.trim() ||
    process.env.MAILER_SMTP_FROM?.trim() ||
    `Kynjo.Homes <${process.env.CONTACT_INBOX_EMAIL?.trim() || 'contact@kynjo.homes'}>`
  )
}

function assertMailerConfigured(): nodemailer.Transporter {
  const t = getMailTransporter()
  if (!t) {
    const err = new Error('Transactional mailer is not configured (set SMTP_* or MAILER_SMTP_*)')
    ;(err as Error & { code?: string }).code = 'MAILER_UNCONFIGURED'
    throw err
  }
  return t
}

/** Logo row + Body marker — identical to invite emails (img points at public /logo.png on app origin). */
function emailLogoRowHtml(logoUrl: string) {
  return `
          <!-- Logo -->
          <tr>
            <td style="padding:24px 32px 0;text-align:center">
              <img src="${logoUrl}" alt="Kynjo.Homes" width="231" height="66" style="display:block;margin:0 auto;max-width:231px;height:auto;border-radius:4px"/>
            </td>
          </tr>

          <!-- Body -->
`
}

export async function sendInviteEmail({
  to,
  firstName,
  estateName,
  inviteUrl,
}: {
  to:          string
  firstName:   string
  estateName:  string
  inviteUrl:   string
}) {
  const baseUrl = getPublicAppOrigin()
  const logoUrl = `${baseUrl}/logo.png`

  await assertMailerConfigured().sendMail({
    from:     getTransactionalFromAddress(),
    to,
    subject:  `You have been invited to join ${estateName} on Kynjo.Homes`,
    // Plain text fallback
    text: `
Hello ${firstName},

You have been added as a resident of ${estateName} on Kynjo.Homes.

Click the link below to set up your password and activate your account:
${inviteUrl}

This link expires in 48 hours.

If you did not expect this invitation, you can ignore this email.

— Kynjo.Homes
    `.trim(),
    // HTML version
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb">${emailLogoRowHtml(logoUrl)}
          <tr>
            <td style="padding:36px 32px">
              <h2 style="font-size:20px;color:#111827;font-weight:600;margin:0 0 8px">
                Hello, ${firstName}
              </h2>
              <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px">
                You have been added as a resident of
                <strong style="color:#111827">${estateName}</strong>
                on Kynjo.Homes. Click the button below to set up your
                password and activate your account.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
                <tr>
                  <td style="background:#16a34a;border-radius:4px;padding:0">
                    <a href="${inviteUrl}"
                      style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:4px">
                      Set up my account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="font-size:13px;color:#9ca3af;margin:0 0 8px">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="font-size:12px;color:#6b7280;word-break:break-all;margin:0 0 24px;background:#f9fafb;padding:10px 12px;border-radius:4px;border:1px solid #e5e7eb">
                ${inviteUrl}
              </p>

              <p style="font-size:13px;color:#9ca3af;margin:0">
                This link expires in 48 hours. If you did not expect
                this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
              <p style="font-size:12px;color:#9ca3af;margin:0">
                Kynjo.Homes · Smart estate management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    // These headers improve deliverability significantly
    headers: {
      'X-Mailer':          'Kynjo.Homes Mailer',
      'X-Priority':        '3',
      'X-MSMail-Priority': 'Normal',
      'Importance':        'Normal',
    },
  })
}

export async function sendOnboardingWelcomeEmail({
  to,
  firstName,
  estateName,
  estateUrl,
}: {
  to: string
  firstName: string
  estateName: string
  estateUrl: string
}) {
  const baseUrl = getPublicAppOrigin()
  const logoUrl = `${baseUrl}/logo.png`

  await assertMailerConfigured().sendMail({
    from: getTransactionalFromAddress(),
    to,
    subject: `Welcome — ${estateName} is live on Kynjo.Homes`,
    text: `
Hello ${firstName},

Your estate is set up on Kynjo.Homes.

Estate: ${estateName}
Your estate URL: ${estateUrl}

Open the link above to view your estate’s public page. Sign in to manage residents, units, and more from your dashboard.

— Kynjo.Homes
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb">${emailLogoRowHtml(logoUrl)}
          <tr>
            <td style="padding:36px 32px">
              <h2 style="font-size:20px;color:#111827;font-weight:600;margin:0 0 8px">
                Welcome, ${firstName}
              </h2>
              <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 16px">
                <strong style="color:#111827">${estateName}</strong> is live on Kynjo.Homes. Your estate’s public URL is ready to share.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
                <tr>
                  <td style="background:#16a34a;border-radius:4px;padding:0">
                    <a href="${estateUrl}"
                      style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:4px">
                      Open your estate
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#9ca3af;margin:0 0 8px">
                Your estate URL (copy and share):
              </p>
              <p style="font-size:12px;color:#6b7280;word-break:break-all;margin:0 0 24px;background:#f9fafb;padding:10px 12px;border-radius:4px;border:1px solid #e5e7eb">
                ${estateUrl}
              </p>
              <p style="font-size:13px;color:#9ca3af;margin:0">
                Sign in anytime to manage residents, units, and settings from your dashboard.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
              <p style="font-size:12px;color:#9ca3af;margin:0">
                Kynjo.Homes · Smart estate management
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    headers: {
      'X-Mailer': 'Kynjo.Homes Mailer',
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      Importance: 'Normal',
    },
  })
}

export async function sendPasswordResetEmail({
  to, name, resetUrl,
}: {
  to: string; name: string; resetUrl: string
}) {
  const baseUrl = getPublicAppOrigin()
  const logoUrl = `${baseUrl}/logo.png`

  await assertMailerConfigured().sendMail({
    from:    getTransactionalFromAddress(),
    to,
    subject: 'Reset your Kynjo.Homes password',
    text: `
Hello ${name},

Click the link below to reset your password:
${resetUrl}

This link expires in 1 hour.

If you did not request a password reset, you can safely ignore this email.

— Kynjo.Homes
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb">${emailLogoRowHtml(logoUrl)}
          <tr>
            <td style="padding:36px 32px">
              <h2 style="font-size:20px;color:#111827;font-weight:600;margin:0 0 8px">
                Reset your password
              </h2>
              <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px">
                Hello ${name},<br/><br/>
                Click the button below to reset your password. This link expires in
                <strong style="color:#111827">1 hour</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
                <tr>
                  <td style="background:#16a34a;border-radius:4px;padding:0">
                    <a href="${resetUrl}"
                      style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:4px">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="font-size:13px;color:#9ca3af;margin:0 0 8px">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="font-size:12px;color:#6b7280;word-break:break-all;margin:0 0 24px;background:#f9fafb;padding:10px 12px;border-radius:4px;border:1px solid #e5e7eb">
                ${resetUrl}
              </p>

              <p style="font-size:13px;color:#9ca3af;margin:0">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
              <p style="font-size:12px;color:#9ca3af;margin:0">
                Kynjo.Homes · Smart estate management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    headers: {
      'X-Mailer':          'Kynjo.Homes Mailer',
      'X-Priority':        '3',
      'X-MSMail-Priority': 'Normal',
      'Importance':        'Normal',
    },
  })
}