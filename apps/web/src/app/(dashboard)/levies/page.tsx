import Topbar from '@/components/layout/Topbar'
import LeviesClient from './LeviesClient'

export default function LeviesPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Levies & Dues" />
      <LeviesClient />
    </div>
  )
}