import Topbar from '@/components/layout/Topbar'
import VisitorsClient from './VisitorsClient'

export default function VisitorsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Visitors & Gate" />
      <VisitorsClient />
    </div>
  )
}