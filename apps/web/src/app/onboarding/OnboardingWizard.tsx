'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, User, Home, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import { openPaystackInlinePopup } from '@/lib/paystackInline'
import {
  sanitizeNigeriaPhoneInput,
  isValidNigeriaMobileLocal,
  NIGERIA_PHONE_HINT,
} from '@/lib/nigeriaPhone'

const STEPS = [
  { id: 1, label: 'Your estate',      icon: Building2 },
  { id: 2, label: 'Your profile',     icon: User },
  { id: 3, label: 'Unit (optional)', icon: Home },
]

function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName:  parts.slice(1).join(' '),
  }
}

interface Props {
  userName?: string
}

export default function OnboardingWizard({ userName = '' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'STARTER'
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const { firstName: initialFirst, lastName: initialLast } = splitDisplayName(userName)

  const [form, setForm] = useState({
    estateName: '', slug: '', address: '',
    firstName: initialFirst,
    lastName:  initialLast,
    phone: '',
    unitNumber: '', unitBlock: '',
  })

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  function setPhone(e: React.ChangeEvent<HTMLInputElement>) {
    const phone = sanitizeNigeriaPhoneInput(e.target.value)
    setForm(p => ({ ...p, phone }))
  }

  // Auto-generate slug from estate name
  function handleEstateName(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setForm(p => ({ ...p, estateName: name, slug }))
    if (slug) checkSlug(slug)
  }

  async function checkSlug(slug: string) {
    setSlugStatus('checking')
    const res = await fetch(`/api/onboarding/check-slug?slug=${slug}`)
    const { available } = await res.json()
    setSlugStatus(available ? 'available' : 'taken')
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (form.phone && !isValidNigeriaMobileLocal(form.phone)) {
      setError('Enter a valid 11-digit Nigerian mobile number (e.g. 08012345678), or leave phone blank.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...form, plan}),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    if (plan === 'PROFESSIONAL') {
      const payKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      if (!payKey) {
        setError('Payment could not start (configuration). You can complete payment from the dashboard.')
        setLoading(false)
        router.push('/subscribe')
        return
      }

      const { data, error: initError } = await fetchJson<{
        url: string
        accessCode?: string
        customerEmail?: string
        amountKobo?: number
      }>('/api/subscription/initialize', { method: 'POST' })

      if (initError || !data) {
        setError(initError ?? 'Could not start payment. Try again from Billing.')
        setLoading(false)
        router.push('/subscribe')
        return
      }

      if (!data.accessCode && data.url) {
        setLoading(false)
        window.location.href = data.url
        return
      }

      if (!data.accessCode) {
        setError('Could not start payment. Try again from Billing.')
        setLoading(false)
        router.push('/subscribe')
        return
      }

      setLoading(false)

      const payEmail = data.customerEmail?.trim()
      const payAmount = data.amountKobo
      if (!payEmail || !payAmount) {
        if (data.url) window.location.href = data.url
        else {
          setError('Could not start payment. Try again from Billing.')
          router.push('/subscribe')
        }
        return
      }

      try {
        await openPaystackInlinePopup({
          accessCode: data.accessCode,
          publicKey:  payKey,
          email:      payEmail,
          amountKobo: payAmount,
          onSuccess:  () => router.push('/subscribe/success'),
          onClose:    () => router.push('/subscribe'),
        })
      } catch (e) {
        if (data.url) {
          window.location.href = data.url
          return
        }
        setError(e instanceof Error ? e.message : 'Payment window failed to open.')
        router.push('/subscribe')
      }
    } else {
      setLoading(false)
      router.push(`/${form.slug}`)
    }
  }

  function canProceed() {
    if (step === 1) return form.estateName && form.slug && slugStatus === 'available'
    if (step === 2) {
      if (!form.firstName.trim() || !form.lastName.trim()) return false
      if (form.phone && !isValidNigeriaMobileLocal(form.phone)) return false
      return true
    }
    if (step === 3) return true
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
            <Building2 size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Set up Kynjo.Homes</h1>
          <p className="text-gray-500 text-sm mt-1">Takes less than 2 minutes</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map(({ id, label, icon: Icon }, i) => (
            <div key={id} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                step === id
                  ? 'bg-brand-600 text-white'
                  : step > id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              )}>
                {step > id
                  ? <CheckCircle2 size={13} />
                  : <Icon size={13} />
                }
                <span>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'w-6 h-px',
                  step > id ? 'bg-green-300' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-5">
              {error}
            </div>
          )}

          {/* Step 1 — Estate details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Tell us about your estate</h2>
                <p className="text-sm text-gray-500">This is how your estate will appear on the platform.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estate name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={form.estateName} onChange={handleEstateName}
                  placeholder="e.g. Green Park Estate"
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estate URL <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border border-gray-200 rounded overflow-hidden focus-within:ring-2 focus-within:ring-green-600">
                  <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm text-gray-400 shrink-0">
                    kynjo.homes/
                  </span>
                  <input
                    type="text" value={form.slug}
                    onChange={e => { setForm(p => ({ ...p, slug: e.target.value })); checkSlug(e.target.value) }}
                    placeholder="green-park-estate"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                  <div className="px-3 text-sm">
                    {slugStatus === 'checking'  && <Loader2 size={14} className="animate-spin text-gray-400" />}
                    {slugStatus === 'available' && <span className="text-green-600 text-xs font-medium">Available ✓</span>}
                    {slugStatus === 'taken'     && <span className="text-red-500 text-xs font-medium">Taken ✗</span>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text" value={form.address} onChange={set('address')}
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Admin profile */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Your profile</h2>
                <p className="text-sm text-gray-500">You will be set as the estate administrator.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" value={form.firstName} onChange={set('firstName')}
                    placeholder="e.g. Adeola"
                    autoComplete="given-name"
                    className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" value={form.lastName} onChange={set('lastName')}
                    placeholder="e.g. Oke"
                    autoComplete="family-name"
                    className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={14}
                  value={form.phone}
                  onChange={setPhone}
                  placeholder="08012345678"
                  aria-invalid={form.phone.length > 0 && !isValidNigeriaMobileLocal(form.phone)}
                  className={cn(
                    'w-full border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600',
                    form.phone.length > 0 && !isValidNigeriaMobileLocal(form.phone)
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-gray-200'
                  )}
                />
                <p className="text-xs text-gray-500 mt-1.5">{NIGERIA_PHONE_HINT}</p>
                {form.phone.length > 0 && !isValidNigeriaMobileLocal(form.phone) && (
                  <p className="text-xs text-red-600 mt-1">
                    Use 11 digits starting with 0 (e.g. 08012345678).
                  </p>
                )}
              </div>

              <div className="bg-brand-50 rounded p-3 text-xs text-brand-700">
                You can invite other admins and residents after setup from the Residents section.
              </div>
            </div>
          )}

          {/* Step 3 — First unit */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">First unit (optional)</h2>
                <p className="text-sm text-gray-500">
                  A unit is a house, flat, or plot. Skip this if you are not assigning one yet, or add more from the dashboard later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text" value={form.unitBlock} onChange={set('unitBlock')}
                    placeholder="e.g. Oak Avenue"
                    className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text" value={form.unitNumber} onChange={set('unitNumber')}
                    placeholder="e.g. House 3"
                    className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3 text-xs text-gray-500">
                If you add a unit here, it will be assigned to you as the admin. Otherwise, add units from the dashboard when you are ready.
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(p => p - 1)}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-0 transition-colors"
            >
              <ChevronLeft size={15} /> Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(p => p + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 bg-brand-600 text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Setting up...</>
                ) : (
                  <><CheckCircle2 size={15} /> Launch estate</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          You can change all of this later from your estate settings.
        </p>
      </div>
    </div>
  )
}