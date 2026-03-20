import { Resend } from 'resend';

const resend = new Resend('re_69Fs3gDd_5SJBDG2TZPK6MtW1nehhACBk');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'devops@bubblebarrel.dev',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});