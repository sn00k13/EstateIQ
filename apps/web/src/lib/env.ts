const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXTAUTH_URL',
    'PAYSTACK_SECRET_KEY',
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
  ]

  /** Outbound mail: either SMTP_* (invites, password reset) or MAILER_SMTP_* (contact form + same mailer). */
  function hasOutboundMailConfig(): boolean {
    const smtp =
      process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
    const mailer =
      process.env.MAILER_SMTP_HOST?.trim() &&
      process.env.MAILER_SMTP_USER?.trim() &&
      process.env.MAILER_SMTP_PASS?.trim()
    return Boolean(smtp || mailer)
  }
  
  export function validateEnv() {
    const missing = required.filter(key => !process.env[key])
  
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nAdd them to your .env.local file.`
      )
    }

    if (process.env.NODE_ENV === 'production' && !hasOutboundMailConfig()) {
      throw new Error(
        'Outbound email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (optional: SMTP_FROM), ' +
          'or set MAILER_SMTP_HOST, MAILER_SMTP_USER, and MAILER_SMTP_PASS (same as contact form).'
      )
    }
  
    if (process.env.NODE_ENV === 'production') {
      const weakSecret = process.env.AUTH_SECRET?.length ?? 0
      if (weakSecret < 32) {
        throw new Error('AUTH_SECRET must be at least 32 characters in production.')
      }
    }
  }