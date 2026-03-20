'use client'
import { useEffect, useState } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  name:    string
  purpose: string | null
  onClose: () => void
}

export default function VisitorToast({ name, purpose, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 6000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className={cn(
      'fixed top-5 right-5 z-50 bg-white border border-green-200 shadow-lg rounded-xl p-4 w-80 flex items-start gap-3 transition-all duration-300',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    )}>
      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <ShieldCheck size={18} className="text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Visitor has arrived</p>
        <p className="text-sm text-gray-700 mt-0.5">{name}</p>
        {purpose && <p className="text-xs text-gray-400 mt-0.5">{purpose}</p>}
      </div>
      <button onClick={onClose} className="text-gray-300 hover:text-gray-500 shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}