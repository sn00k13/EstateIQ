import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: {
    user: 'gocitek@gmail.com',       // ← your Gmail
    pass: 'sxod ncgn yrhw jtwa',      // ← your App Password
  },
})

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection failed:', error.message)
  } else {
    console.log('SMTP connection successful ✓')
  }
})

await transporter.sendMail({
  from:    'EstateIQ <gocitek@gmail.com>',
  to:      'gocitek@gmail.com',      // ← send to yourself to test
  subject: 'EstateIQ test email',
  text:    'If you see this, SMTP is working.',
})

console.log('Test email sent ✓')