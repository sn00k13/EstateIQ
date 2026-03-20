import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@estateiq/database'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  // If already onboarded, send to dashboard
  const resident = await prisma.resident.findUnique({
    where: { userId: session.user.id },
  })
  if (resident) redirect('/dashboard')

  return <OnboardingWizard userName={session.user.name ?? ''} />
}