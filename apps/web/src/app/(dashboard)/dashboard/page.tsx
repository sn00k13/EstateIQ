import Topbar from '@/components/layout/Topbar'
import DashboardClient from './DashboardClient'

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />
      <DashboardClient />
    </div>
  )
}