import Topbar from '@/components/layout/Topbar'
import FacilitiesClient from './FacilitiesClient'

export default function FacilitiesPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Facilities" />
      <FacilitiesClient />
    </div>
  )
}