export type PricingFeature = { label: string; included: boolean }

export type PricingPlan = {
  id: string
  name: string
  price: number | null
  priceLabel: string
  priceSub: string
  description: string
  featured: boolean
  cta: string
  features: PricingFeature[]
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: null,
    priceLabel: 'Free',
    priceSub: 'forever',
    description: 'Perfect for small estates getting started',
    featured: false,
    cta: 'Get started free',
    features: [
      { label: 'Up to 20 residents', included: true },
      { label: 'Up to 10 units', included: true },
      { label: 'Announcements', included: true },
      { label: 'Visitor management', included: true },
      { label: 'Maintenance requests', included: true },
      { label: 'Incident reporting', included: true },
      { label: 'Levies & payments', included: false },
      { label: 'Polls & voting', included: false },
      { label: 'Vehicle QR system', included: false },
      { label: 'Facility booking', included: false },
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 150000,
    priceLabel: '₦150,000',
    priceSub: '/ year',
    description: 'Full platform for growing estates',
    featured: true,
    cta: 'Get started',
    features: [
      { label: 'Unlimited residents', included: true },
      { label: 'Unlimited units', included: true },
      { label: 'All Starter features', included: true },
      { label: 'Levies & payments', included: true },
      { label: 'Polls & voting', included: true },
      { label: 'Vehicle QR system', included: true },
      { label: 'Facility booking', included: true },
      { label: 'Priority support', included: true },
      { label: 'Subscription dashboard', included: true },
    ],
  },
  {
    id: 'CUSTOM',
    name: 'Custom',
    price: null,
    priceLabel: 'Talk to us',
    priceSub: '',
    description: 'For large estates and property managers',
    featured: false,
    cta: 'Contact sales',
    features: [
      { label: 'Everything in Professional', included: true },
      { label: 'Surveillance Cameras with live feed', included: true },
      { label: 'Facial Recognition Systems', included: true },
      { label: 'AI Integration', included: true },
      { label: 'Multiple estates', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'Dedicated account manager', included: true },
      { label: 'SLA guarantee', included: true },
      { label: 'White-label option', included: true },
      { label: 'Custom contract terms', included: true },
      { label: 'On-site onboarding', included: true },
    ],
  },
]
