import Topbar from '@/components/layout/Topbar'
import AnnouncementsClient from './AnnouncementsClient'

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Announcements" />
      <AnnouncementsClient />
    </div>
  )
}