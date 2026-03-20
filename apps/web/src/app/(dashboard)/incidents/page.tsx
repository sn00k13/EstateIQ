import Topbar from '@/components/layout/Topbar'
import IncidentsClient from './IncidentsClient'

export default function IncidentsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Security Incidents" />
      <IncidentsClient />
    </div>
  )
}