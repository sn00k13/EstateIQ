'use client'
import { useEffect, useState } from 'react'
import { Plus, BarChart2, Trash2, Clock, CheckCircle2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import CreatePollModal from './CreatePollModal'
import { useResident } from '@/context/ResidentContext'

interface Poll {
  id: string
  question: string
  options: string[]
  endsAt: string
  isAnonymous: boolean
  isExpired: boolean
  hasVoted: boolean
  myVote: number | null
  voteCounts: number[]
  totalVotes: number
  createdAt: string
}

export default function PollsClient() {
  const { isAdmin }                       = useResident()
  const [polls, setPolls]                 = useState<Poll[]>([])
  const [loading, setLoading]             = useState(true)
  const [showCreate, setShowCreate]       = useState(false)
  const [voting, setVoting]               = useState<string | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [filter, setFilter]               = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ALL')

  async function load() {
    setLoading(true)
    const { data } = await fetchJson<Poll[]>('/api/polls')
    setPolls(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleVote(pollId: string, optionIndex: number) {
    setVoting(pollId)
    const { error } = await fetchJson(`/api/polls/${pollId}/vote`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ optionIndex: Number(optionIndex) }),
    })
    setVoting(null)
    if (error) { alert(error); return }
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this poll and all its votes?')) return
    setDeleting(id)
    await fetchJson(`/api/polls/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const filtered =
    filter === 'ACTIVE' ? polls.filter(p => !p.isExpired) :
    filter === 'ENDED'  ? polls.filter(p =>  p.isExpired) :
    polls

  const activePollCount = polls.filter(p => !p.isExpired).length

  function timeRemaining(endsAt: string) {
    const ms    = new Date(endsAt).getTime() - Date.now()
    if (ms <= 0) return 'Ended'
    const days  = Math.floor(ms / 86400000)
    const hours = Math.floor((ms % 86400000) / 3600000)
    if (days  > 0) return `${days}d ${hours}h remaining`
    const mins = Math.floor((ms % 3600000) / 60000)
    if (hours > 0) return `${hours}h ${mins}m remaining`
    return `${mins}m remaining`
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'ENDED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                filter === f
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {f === 'ALL'    ? `All (${polls.length})` :
               f === 'ACTIVE' ? `Active (${activePollCount})` :
               `Ended (${polls.length - activePollCount})`}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={15} /> Create poll
          </button>
        )}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-16 text-center">
          <BarChart2 size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No polls found</p>
          <p className="text-gray-400 text-xs mt-1">
            {filter !== 'ALL'
              ? `No ${filter.toLowerCase()} polls.`
              : isAdmin
              ? 'Create a poll to collect votes from residents.'
              : 'No polls have been created by your estate admin yet.'
            }
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 animate-pulse h-40" />
          ))}
        </div>
      )}

      {/* Poll cards */}
      {!loading && (
        <div className="space-y-4">
          {filtered.map(poll => {
            const isVoting  = voting === poll.id
            const maxVotes  = Math.max(...poll.voteCounts, 1)
            const canVote   = !poll.isExpired && !poll.hasVoted

            return (
              <div
                key={poll.id}
                className={cn(
                  'bg-white border rounded-xl overflow-hidden transition-colors',
                  poll.isExpired ? 'border-gray-100 opacity-80' : 'border-gray-200'
                )}
              >
                <div className={cn('h-1', poll.isExpired ? 'bg-gray-200' : 'bg-brand-500')} />

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                        {poll.question}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          poll.isExpired ? 'text-gray-400' : 'text-brand-600'
                        )}>
                          {poll.isExpired
                            ? <><Lock size={11} /> Ended</>
                            : <><Clock size={11} /> {timeRemaining(poll.endsAt)}</>
                          }
                        </span>
                        <span className="text-xs text-gray-400">
                          {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
                        </span>
                        {poll.isAnonymous && (
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            Anonymous
                          </span>
                        )}
                        {poll.hasVoted && !poll.isExpired && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 size={11} /> Voted
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(poll.id)}
                        disabled={deleting === poll.id}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {poll.options.map((option, i) => {
                      const count      = poll.voteCounts[i]
                      const percent    = poll.totalVotes > 0
                        ? Math.round((count / poll.totalVotes) * 100) : 0
                      const isMyVote   = poll.myVote === i
                      const isLeading  = count === maxVotes && count > 0
                      const showResults = poll.hasVoted || poll.isExpired

                      return (
                        <button
                          key={i}
                          onClick={() => canVote && !isVoting && handleVote(poll.id, i)}
                          disabled={!canVote || isVoting}
                          className={cn(
                            'w-full text-left rounded-lg border transition-all overflow-hidden',
                            canVote && !isVoting
                              ? 'hover:border-blue-400 hover:bg-brand-50 cursor-pointer'
                              : 'cursor-default',
                            isMyVote
                              ? 'border-blue-400 bg-brand-50'
                              : 'border-gray-100 bg-white',
                          )}
                        >
                          <div className="relative px-3 py-2.5">
                            {showResults && (
                              <div
                                className={cn(
                                  'absolute inset-0 rounded-lg transition-all duration-500',
                                  isMyVote ? 'bg-blue-100' : isLeading ? 'bg-gray-100' : 'bg-gray-50'
                                )}
                                style={{ width: `${percent}%` }}
                              />
                            )}
                            <div className="relative flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {isMyVote && (
                                  <CheckCircle2 size={13} className="text-brand-600 shrink-0" />
                                )}
                                <span className={cn(
                                  'text-sm truncate',
                                  isMyVote ? 'font-medium text-brand-700' : 'text-gray-700'
                                )}>
                                  {option}
                                </span>
                              </div>
                              {showResults && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-gray-400">{count}</span>
                                  <span className={cn(
                                    'text-xs font-semibold w-9 text-right',
                                    isLeading ? 'text-gray-700' : 'text-gray-400'
                                  )}>
                                    {percent}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {canVote && (
                    <p className="text-xs text-gray-400 text-center">
                      {isVoting ? 'Casting vote...' : 'Click an option to vote'}
                    </p>
                  )}

                  <p className="text-xs text-gray-300">
                    {poll.isExpired ? 'Ended' : 'Ends'}: {new Date(poll.endsAt).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && isAdmin && (
        <CreatePollModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); load() }}
        />
      )}
    </div>
  )
}