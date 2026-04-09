import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import logo from '@/components/images/logo.png'
import { ProductGuideMarkdown } from '@/components/help/ProductGuideMarkdown'
import { loadProductGuideMarkdown } from '@/lib/loadProductGuide'

export const metadata: Metadata = {
  title: 'Help & product guide — Kynjo.Homes',
  description:
    'Learn how to use Kynjo.Homes as a resident, administrator, or security staff. Step-by-step guides and tips.',
  alternates: { canonical: '/help' },
}

export default async function HelpPage() {
  const markdown = await loadProductGuideMarkdown()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src={logo}
              alt="Kynjo.Homes"
              width={140}
              height={40}
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          <div className="flex items-start gap-3 mb-8 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Help & product guide</h1>
              <p className="text-sm text-gray-500 mt-1">
                For residents, estate admins, and security. No technical background required.
              </p>
            </div>
          </div>

          <ProductGuideMarkdown markdown={markdown} />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="text-green-600 hover:underline">
            Home
          </Link>
          <Link href="/sign-in" className="text-gray-500 hover:text-gray-700 hover:underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="text-gray-500 hover:text-gray-700 hover:underline">
            Get started
          </Link>
          <Link href="/contact" className="text-gray-500 hover:text-gray-700 hover:underline">
            Contact
          </Link>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-700 hover:underline">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  )
}
