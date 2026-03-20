import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

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
  console.log('=== SENDING INVITE EMAIL ===')
  console.log('To:', to)
  console.log('URL:', inviteUrl)
  console.log('===========================')

  const { data, error } = await resend.emails.send({
    from:    'EstateIQ <onboarding@resend.dev>',
    to,
    subject: `You have been invited to join ${estateName} on EstateIQ`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:#2563eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;font-size:24px;margin:0">EstateIQ</h1>
          <p style="color:#bfdbfe;margin:6px 0 0">Smart estate management</p>
        </div>

        <h2 style="color:#111827;font-size:20px">Hello, ${firstName}</h2>
        <p style="color:#4b5563;line-height:1.6">
          You have been added as a resident of <strong>${estateName}</strong> on EstateIQ.
          Click the button below to set up your password and activate your account.
        </p>

        <div style="text-align:center;margin:32px 0">
          <a href="${inviteUrl}"
            style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:10px;
                   text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
            Set up my account
          </a>
        </div>

        <p style="color:#9ca3af;font-size:13px">
          This link expires in 48 hours. If you did not expect this invitation,
          you can safely ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0"/>
        <p style="color:#d1d5db;font-size:12px;text-align:center">
          EstateIQ · Smart estate management
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error(error.message)
  }

  console.log('Email sent via Resend, ID:', data?.id)
}