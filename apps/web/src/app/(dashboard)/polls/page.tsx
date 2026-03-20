import Topbar from '@/components/layout/Topbar'
import PollsClient from './PollsClient'

export default function PollsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Polls & Voting" />
      <PollsClient />
    </div>
  )
}