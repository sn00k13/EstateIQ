import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import contactBackground from '@/components/images/contactBackground.webp'
import logo from '@/components/images/logo.webp'
import ContactDetails from './ContactDetails'
import ContactForm from './ContactForm'
import NewsletterForm from '@/components/NewsletterForm'

export const metadata: Metadata = {
  title: 'Contact — Kynjo.Homes',
  description: 'Get in touch with the Kynjo.Homes team.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <Image
          src={contactBackground}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-black/50"
          aria-hidden
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center mb-10">
          <Image
            src={logo}
            alt="Kynjo.Homes"
            height={64}
            width={224}
            className="h-16 w-auto object-contain drop-shadow-sm"
          />
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">
            Contact us
          </h1>
          <p className="text-white/95 text-sm mt-1 drop-shadow-sm">
            We typically respond within one business day.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-xl p-6 md:p-8 h-full shadow-lg shadow-black/10">
              <h2 className="text-lg font-semibold text-white mb-4">Contact details</h2>
              <ContactDetails />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-xl p-6 md:p-8 shadow-lg shadow-black/10">
              <h2 className="text-lg font-semibold text-white mb-1">Send a message</h2>
              <p className="text-sm text-white/90 mb-4">
                Use the form below and we will reply by email.
              </p>
              <ContactForm />
            </div>

            <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-xl p-6 md:p-8 shadow-lg shadow-black/10">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-green-300 hover:text-white hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
