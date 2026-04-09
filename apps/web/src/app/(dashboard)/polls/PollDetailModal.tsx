'use client'

import { X, BarChart2, Trash2, Clock, CheckCircle2, Lock, Calendar, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import PollVoteOptions from './PollVoteOptions'
import type { Poll } from './pollTypes'

interface Props {
  poll: Poll
  timeRemaining: (endsAt: string) => string
  /** Poll id currently submitting a vote, or null */
  votingPollId: string | null
  /** Poll id currently being deleted, or null */
  deletingPollId: string | null
  isAdmin: boolean
  onClose: () => void
  onVote: (pollId: string, optionIndex: number) => void
  onDelete: (id: string) => void
}

export default function PollDetailModal({
  poll,
  timeRemaining,
  votingPollId,
  deletingPollId,
  isAdmin,
  onClose,
  onVote,
  onDelete,
}: Props) {
  const isVoting = votingPollId === poll.id
  const canVote  = !poll.isExpired && !poll.hasVoted

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="poll-detail-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className={cn('h-1', poll.isExpired ? 'bg-gray-200' : 'bg-brand-500')} />

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart2 size={16} className="text-brand-600 shrink-0" />
            <h2 id="poll-detail-title" className="font-semibold text-gray-900 truncate">
              Poll details
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onDelete(poll.id)}
                disabled={deletingPollId === poll.id}
                className="p-2 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                aria-label="Delete poll"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100 text-gray-400"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-base font-semibold text-gray-900 leading-snug">
              {poll.question}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
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
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                  Anonymous voting
                </span>
              )}
              {poll.hasVoted && !poll.isExpired && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 size={11} /> You voted
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
            <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-600">Closes</p>
                <p className="text-gray-700">
                  {new Date(poll.endsAt).toLocaleDateString('en-NG', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-600">Created</p>
                <p className="text-gray-700">
                  {new Date(poll.createdAt).toLocaleDateString('en-NG', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Options</p>
            <PollVoteOptions
              poll={poll}
              isVoting={isVoting}
              canVote={canVote}
              onVote={onVote}
            />
          </div>

          {canVote && (
            <p className="text-xs text-gray-400 text-center">
              {isVoting ? 'Casting vote…' : 'Click an option to vote'}
            </p>
          )}

          {isAdmin && poll.voters && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <Users size={14} className="text-gray-500 shrink-0" />
                <p className="text-xs font-medium text-gray-700">Who voted</p>
              </div>
              {poll.voters.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">No votes yet.</p>
              ) : (
                <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {poll.voters.map(v => (
                    <li key={v.residentId} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                      <span className="text-gray-900 font-medium">
                        {v.firstName} {v.lastName}
                        {v.unit && (
                          <span className="font-normal text-gray-500">
                            {' · '}
                            Unit {v.unit.number}
                            {v.unit.block ? ` · Street ${v.unit.block}` : ''}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500 sm:text-right shrink-0">
                        {v.optionLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
