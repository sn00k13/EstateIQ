'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users, Home, ShieldCheck, Megaphone,
  CreditCard, Wrench, BarChart2, Car,
  ArrowRight, CheckCircle2,
} from 'lucide-react'
import logo from '@/components/images/logo.webp'

const QUOTES = [
  { text: 'Alone we can do so little; together we can do so much.', author: 'Helen Keller' },
  { text: 'We must learn to live together as brothers or perish together as fools.', author: 'Martin Luther King Jr.' },
  { text: 'Coming together is a beginning; keeping together is progress; working together is success.', author: 'Henry Ford' },
  { text: 'A sense of belonging is a human need, just like the need for food and shelter.', author: 'Brené Brown' },
  { text: 'The greatness of a community is most accurately measured by the compassionate actions of its members.', author: 'Coretta Scott King' },
  { text: 'We cannot live only for ourselves. A thousand fibers connect us with our fellow men.', author: 'Herman Melville' },
  { text: 'Unity is strength. When there is teamwork and collaboration, wonderful things can be achieved.', author: 'Mattie Stepanek' },
  { text: 'Where we love is home—home that our feet may leave, but not our hearts.', author: 'Oliver Wendell Holmes Sr.' },
  { text: 'No one can live happily who has regard only for themselves.', author: 'Seneca' },
  { text: 'One of the marvelous things about community is that it enables us to welcome and help people in a way we couldn\'t as individuals.', author: 'Jean Vanier' },
  { text: 'The strength of the team is each individual member. The strength of each member is the team.', author: 'Phil Jackson' },
  { text: 'A community is the mental and spiritual condition of knowing that the place is shared.', author: 'Wendell Berry' },
  { text: 'If you want to go fast, go alone. If you want to go far, go together.', author: 'African proverb' },
  { text: 'It takes a village to raise a child.', author: 'African proverb' },
  { text: 'The only way to have a friend is to be one.', author: 'Ralph Waldo Emerson' },
  { text: 'There is no power for change greater than a community discovering what it cares about.', author: 'Margaret J. Wheatley' },
  { text: 'Service to others is the rent you pay for your room here on earth.', author: 'Muhammad Ali' },
  { text: 'We rise by lifting others.', author: 'Robert Ingersoll' },
  { text: 'Do your little bit of good where you are; it\'s those little bits of good put together that overwhelm the world.', author: 'Desmond Tutu' },
  { text: 'The best way to find yourself is to lose yourself in the service of others.', author: 'Mahatma Gandhi' },
  { text: 'Individual commitment to a group effort—that is what makes a team work.', author: 'Vince Lombardi' },
  { text: 'A house is not a home unless it contains food and fire for the mind as well as the body.', author: 'Benjamin Franklin' },
  { text: 'We need each other, and the sooner we learn that, the better for us all.', author: 'Erik Erikson' },
  { text: 'Community cannot for long feed on itself; it can only flourish where hearts are engaged in a common purpose.', author: 'Grace Lee Boggs' },
  { text: 'Good neighbors make for good neighborhoods.', author: 'Proverb' },
  { text: 'The purpose of human life is to serve, and to show compassion and the will to help others.', author: 'Albert Schweitzer' },
  { text: 'We make a living by what we get, but we make a life by what we give.', author: 'Winston Churchill' },
  { text: 'Home is the nicest word there is.', author: 'Laura Ingalls Wilder' },
  { text: 'There is nothing better than the encouragement of a good friend.', author: 'Katharine Butler Hathaway' },
  { text: 'What we have done for ourselves alone dies with us; what we have done for others remains and is immortal.', author: 'Albert Pine' },
  { text: 'A good community is one in which the elderly plant trees under whose shade they will never sit.', author: 'Greek proverb' },
]

interface Estate {
  id:      string
  name:    string
  slug:    string
  address: string | null
  plan:    string
  _count:  { residents: number; units: number }
}

interface Props { estate: Estate }

const FEATURES = [
  { icon: Megaphone,  label: 'Announcements',    desc: 'Stay informed with estate notices'     },
  { icon: CreditCard, label: 'Dues & levies',     desc: 'Pay and track estate contributions'    },
  { icon: ShieldCheck,label: 'Visitor access',    desc: 'Register and manage your visitors'     },
  { icon: Wrench,     label: 'Maintenance',       desc: 'Submit and track repair requests'      },
  { icon: Car,        label: 'Vehicle access',    desc: 'QR sticker gate management'            },
  { icon: BarChart2,  label: 'Community polls',   desc: 'Vote on estate decisions'              },
]

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

export default function EstateLandingClient({ estate }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [quote, setQuote] = useState<typeof QUOTES[0] | null>(null)

  useEffect(() => {
    setQuote(getRandomQuote())
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white border-b border-gray-100 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src={logo}
              alt="Kynjo.Homes"
              height={32}
              width={110}
              className="h-8 w-auto object-contain rounded"
            />
          </Link>

          <Link
            href={`/sign-in`}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
              scrolled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
            }`}
          >
            Sign in <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(https://res.cloudinary.com/dihidzrkb/image/upload/v1774259432/julzyg2kimyqxmwqyyyw.jpg)' }}
        />
        <div className="absolute inset-0 bg-green-900/50" />

        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon
                  points="30,2 58,17 58,47 30,62 2,47 2,17"
                  fill="none" stroke="#fff" strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex)" />
          </svg>
        </div>

        {/* Dark overlay at bottom for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-green-900/30" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">

          {/* Estate badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm px-4 py-2 rounded mb-8 border border-white/20">
            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            Managed by Kynjo.Homes
          </div>

          {/* Estate name */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-4 tracking-tight">
            {estate.name}
          </h1>

          {/* Address */}
          {estate.address && (
            <p className="text-green-100 text-lg mb-8">
              {estate.address}
            </p>
          )}

          {/* Random quote */}
          <div className="min-h-[4.5rem] flex flex-col items-center justify-center mb-10">
            {quote && (
              <blockquote className="text-green-100 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto text-center">
                <p className="italic">"{quote.text}"</p>
                <cite className="mt-2 block text-green-200/90 text-base not-italic">— {quote.author}</cite>
              </blockquote>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/sign-in"
              className="flex items-center gap-2 bg-white text-green-700 px-6 py-3 rounded text-sm font-semibold hover:bg-green-50 transition-colors"
            >
              Sign in to your account <ArrowRight size={15} />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-6 py-3 rounded text-sm font-semibold hover:bg-white/25 transition-colors border border-white/20"
            >
              Learn more
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/60">
          <div className="w-0.5 h-8 bg-white/30 rounded-full animate-pulse" />
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything your estate needs
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              {estate.name} uses Kynjo.Homes to manage every aspect of community living in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-white rounded p-6 border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all group"
              >
                <div className="w-11 h-11 bg-green-50 rounded flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                  <Icon size={20} className="text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              How it works for residents
            </h2>
            <p className="text-gray-500">
              Getting started with {estate.name} on Kynjo.Homes takes less than 2 minutes.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Receive your invitation',
                desc:  'Your estate admin sends you an invite link to your email address.',
              },
              {
                step: '02',
                title: 'Set up your account',
                desc:  'Click the link, choose a password, and your account is activated instantly.',
              },
              {
                step: '03',
                title: 'Sign in and get started',
                desc:  'Access announcements, pay levies, register visitors, and more — all from one place.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────── */}
      <section className="py-20 px-6 bg-green-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-green-100 mb-8">
            Sign in to your {estate.name} account and stay connected with your community.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 bg-white text-green-700 px-8 py-3.5 rounded text-sm font-semibold hover:bg-green-50 transition-colors"
          >
            Sign in to {estate.name} <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="py-8 px-6 bg-gray-900">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={logo}
              alt="Kynjo.Homes"
              height={28}
              width={96}
              className="h-7 w-auto object-contain rounded"
            />
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/terms"   className="text-gray-400 text-xs hover:text-gray-200 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-gray-400 text-xs hover:text-gray-200 transition-colors">Privacy</Link>
          </div>

          <p className="text-gray-500 text-xs">
            {estate.name} · Powered by Kynjo.Homes
          </p>
        </div>
      </footer>

    </div>
  )
}