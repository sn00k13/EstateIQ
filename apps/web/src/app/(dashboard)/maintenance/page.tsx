import Topbar from '@/components/layout/Topbar'
import MaintenanceClient from './MaintenanceClient'

export default function MaintenancePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Maintenance" />
      <MaintenanceClient />
    </div>
  )
}