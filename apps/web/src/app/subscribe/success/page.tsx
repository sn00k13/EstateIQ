'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default function SubscribeSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => router.push('/dashboard'), 4000)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Activation successful
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Your Professional subscription is active. All features are unlocked for the next 12 months. Taking you to your dashboard...
        </p>
        <div className="mt-6 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-[progress_4s_linear_forwards]" />
        </div>
      </div>
    </div>
  )
}