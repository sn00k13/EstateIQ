import Link from 'next/link'
import Image from 'next/image'
import logo from '@/components/images/logo.webp'

type MarketingPageShellProps = {
  title: string
  description?: string
  children: React.ReactNode
}

export default function MarketingPageShell({
  title,
  description,
  children,
}: MarketingPageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center mb-10">
          <Image
            src={logo}
            alt="Kynjo.Homes"
            height={64}
            width={224}
            className="h-16 w-auto object-contain"
          />
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description ? (
              <p className="text-gray-500 text-sm mt-1">{description}</p>
            ) : null}
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-4">{children}</div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-green-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
