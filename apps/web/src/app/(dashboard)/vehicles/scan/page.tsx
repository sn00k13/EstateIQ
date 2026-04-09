'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RotateCcw, Car, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/fetchJson'
import SubscriptionGate from '@/components/SubscriptionGate'
import MobileMenuButton from '@/components/layout/MobileMenuButton'
import logo from '@/components/images/logo.webp'

type Outcome = 'GRANTED' | 'WARNING' | 'BLOCKED'

interface VehicleScanResult {
  outcome: Outcome
  vehicle: { plateNumber: string; make: string | null; model: string | null; color: string | null }
  resident: { name: string; unit: string }
  estate: string
  debt: { amount: number; formatted: string; invoices: number }
  message: string
}

interface ResidentScanResult {
  outcome: Outcome
  resident: { name: string; unit: string; role: string }
  estate: string
  debt: { amount: number; formatted: string; invoices: number }
  message: string
}

const OUTCOME_CONFIG: Record<Outcome, { bg: string; icon: typeof CheckCircle2; title: string }> = {
  GRANTED: { bg: 'bg-green-600', icon: CheckCircle2, title: 'Access granted' },
  WARNING: { bg: 'bg-amber-500', icon: AlertTriangle, title: 'Access — debt warning' },
  BLOCKED: { bg: 'bg-red-600', icon: XCircle, title: 'Access restricted' },
}

type ScanMode = 'vehicle' | 'resident'

export default function GateScanPage() {
  const [mode, setMode] = useState<ScanMode>('vehicle')

  const [vehicleToken, setVehicleToken] = useState('')
  const [vehicleLoading, setVehicleLoading] = useState(false)
  const [vehicleResult, setVehicleResult] = useState<VehicleScanResult | null>(null)
  const [vehicleError, setVehicleError] = useState('')

  const [residentToken, setResidentToken] = useState('')
  const [residentLoading, setResidentLoading] = useState(false)
  const [residentResult, setResidentResult] = useState<ResidentScanResult | null>(null)
  const [residentError, setResidentError] = useState('')

  async function handleVehicleScan(e: React.FormEvent) {
    e.preventDefault()
    if (!vehicleToken.trim()) return
    setVehicleLoading(true)
    setVehicleError('')
    setVehicleResult(null)

    const { data, error } = await fetchJson<VehicleScanResult>(
      `/api/scan/vehicle?token=${encodeURIComponent(vehicleToken.trim())}`
    )

    setVehicleLoading(false)
    if (error) {
      setVehicleError(error)
      return
    }
    setVehicleResult(data)
  }

  async function handleResidentScan(e: React.FormEvent) {
    e.preventDefault()
    if (!residentToken.trim()) return
    setResidentLoading(true)
    setResidentError('')
    setResidentResult(null)

    const { data, error } = await fetchJson<ResidentScanResult>(
      `/api/scan/resident?token=${encodeURIComponent(residentToken.trim())}`
    )

    setResidentLoading(false)
    if (error) {
      setResidentError(error)
      return
    }
    setResidentResult(data)
  }

  function resetVehicle() {
    setVehicleToken('')
    setVehicleResult(null)
    setVehicleError('')
  }

  function resetResident() {
    setResidentToken('')
    setResidentResult(null)
    setResidentError('')
  }

  useEffect(() => {
    if (!vehicleResult) return
    const t = setTimeout(resetVehicle, 10000)
    return () => clearTimeout(t)
  }, [vehicleResult])

  useEffect(() => {
    if (!residentResult) return
    const t = setTimeout(resetResident, 10000)
    return () => clearTimeout(t)
  }, [residentResult])

  return (
    <SubscriptionGate feature="vehicleQR">
      <div className="relative min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
        <div className="absolute top-4 left-4 z-30">
          <MobileMenuButton className="text-white hover:bg-white/10 border border-white/15" />
        </div>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Image
              src={logo}
              alt="Kynjo.Homes"
              height={64}
              width={224}
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-white font-bold text-2xl">Scanner</h1>
          <p className="text-gray-400 text-sm mt-1">Vehicle and resident verification</p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-gray-800/80 rounded-xl border border-gray-700">
          <button
            type="button"
            onClick={() => { setMode('vehicle'); resetResident() }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
              mode === 'vehicle'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Car size={18} />
            Vehicle
          </button>
          <button
            type="button"
            onClick={() => { setMode('resident'); resetVehicle() }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
              mode === 'resident'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <User size={18} />
            Resident
          </button>
        </div>

        {/* Vehicle */}
        {mode === 'vehicle' && (
          <>
            {vehicleResult && (
              <div
                className={cn(
                  'w-full max-w-md rounded-2xl p-6 mb-6 text-white',
                  OUTCOME_CONFIG[vehicleResult.outcome].bg
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const Icon = OUTCOME_CONFIG[vehicleResult.outcome].icon
                    return <Icon size={28} />
                  })()}
                  <h2 className="text-xl font-bold">{OUTCOME_CONFIG[vehicleResult.outcome].title}</h2>
                </div>
                <div className="space-y-1.5 text-sm opacity-90">
                  <p>
                    <span className="opacity-70">Plate:</span>{' '}
                    <span className="font-mono font-bold">{vehicleResult.vehicle.plateNumber}</span>
                  </p>
                  <p>
                    <span className="opacity-70">Vehicle:</span>{' '}
                    {[vehicleResult.vehicle.color, vehicleResult.vehicle.make, vehicleResult.vehicle.model]
                      .filter(Boolean)
                      .join(' ') || 'No details'}
                  </p>
                  <p>
                    <span className="opacity-70">Resident:</span> {vehicleResult.resident.name}
                  </p>
                  <p>
                    <span className="opacity-70">Unit:</span> {vehicleResult.resident.unit}
                  </p>
                  {vehicleResult.debt.amount > 0 && (
                    <p className="mt-3 font-semibold">
                      Outstanding dues: {vehicleResult.debt.formatted}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs opacity-60">Auto-resets in 10s</p>
                  <button
                    type="button"
                    onClick={resetVehicle}
                    className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors"
                  >
                    <RotateCcw size={12} /> Reset now
                  </button>
                </div>
              </div>
            )}

            {!vehicleResult && (
              <form onSubmit={handleVehicleScan} className="w-full max-w-md space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 text-center">
                    Enter or scan vehicle QR token
                  </label>
                  <input
                    type="text"
                    value={vehicleToken}
                    onChange={e => {
                      setVehicleToken(e.target.value)
                      setVehicleError('')
                    }}
                    placeholder="Vehicle QR token"
                    autoFocus
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-4 text-white text-center text-lg font-mono focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                {vehicleError && (
                  <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded text-center">
                    {vehicleError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!vehicleToken.trim() || vehicleLoading}
                  className="w-full bg-green-600 text-white rounded py-4 text-lg font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {vehicleLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Checking...
                    </>
                  ) : (
                    'Verify vehicle'
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Resident */}
        {mode === 'resident' && (
          <>
            {residentResult && (
              <div
                className={cn(
                  'w-full max-w-md rounded-2xl p-6 mb-6 text-white',
                  OUTCOME_CONFIG[residentResult.outcome].bg
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const Icon = OUTCOME_CONFIG[residentResult.outcome].icon
                    return <Icon size={28} />
                  })()}
                  <h2 className="text-xl font-bold">{OUTCOME_CONFIG[residentResult.outcome].title}</h2>
                </div>
                <div className="space-y-1.5 text-sm opacity-90">
                  <p>
                    <span className="opacity-70">Resident:</span>{' '}
                    <span className="font-semibold">{residentResult.resident.name}</span>
                  </p>
                  <p>
                    <span className="opacity-70">Role:</span> {residentResult.resident.role}
                  </p>
                  <p>
                    <span className="opacity-70">Unit:</span> {residentResult.resident.unit}
                  </p>
                  <p className="text-xs opacity-70 mt-2">{residentResult.estate}</p>
                  {residentResult.debt.amount > 0 && (
                    <p className="mt-3 font-semibold">
                      Outstanding dues: {residentResult.debt.formatted}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs opacity-60">Auto-resets in 10s</p>
                  <button
                    type="button"
                    onClick={resetResident}
                    className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors"
                  >
                    <RotateCcw size={12} /> Reset now
                  </button>
                </div>
              </div>
            )}

            {!residentResult && (
              <form onSubmit={handleResidentScan} className="w-full max-w-md space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 text-center">
                    Enter or scan resident ID card QR token
                  </label>
                  <input
                    type="text"
                    value={residentToken}
                    onChange={e => {
                      setResidentToken(e.target.value)
                      setResidentError('')
                    }}
                    placeholder="Resident QR token"
                    autoFocus
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-4 text-white text-center text-lg font-mono focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                {residentError && (
                  <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded text-center">
                    {residentError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!residentToken.trim() || residentLoading}
                  className="w-full bg-green-600 text-white rounded py-4 text-lg font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {residentLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Checking...
                    </>
                  ) : (
                    'Verify resident'
                  )}
                </button>
              </form>
            )}
          </>
        )}

        <p className="text-gray-600 text-xs mt-8">Kynjo.Homes · Gate verification</p>
      </div>
    </SubscriptionGate>
  )
}
