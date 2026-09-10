'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  status: string
}

export default function AdminDashboard() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from('live_slots')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!error && data) setSlots(data)
  }

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('live_slots').insert([
      {
        date,
        start_time: startTime,
        end_time: endTime,
        capacity,
        created_by: user.id,
        status: 'open',
      },
    ])

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Slot created successfully!')
      setDate('')
      setStartTime('')
      setEndTime('')
      setCapacity(1)
      fetchSlots()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-rimbun-bg p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-rimbun-teal">Admin Dashboard</h1>
            <p className="text-xs text-gray-500">Manage Rimbun Live Streaming Slots</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs font-medium text-rimbun-teal hover:underline cursor-pointer"
          >
            Go to Main App →
          </button>
        </div>

        {/* Create Slot Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Slot</h2>

          {message && (
            <div className={`text-xs p-3 rounded-lg mb-4 ${message.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleCreateSlot} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-rimbun-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-rimbun-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-rimbun-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-rimbun-teal"
              />
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rimbun-teal text-white font-medium rounded-lg text-sm hover:opacity-90 transition cursor-pointer"
              >
                {loading ? 'Creating...' : '+ Create Live Slot'}
              </button>
            </div>
          </form>
        </div>

        {/* Slot List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Existing Slots</h2>
          {slots.length === 0 ? (
            <p className="text-xs text-gray-400">No slots created yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {slots.map((slot) => (
                <div key={slot.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{slot.date}</span>
                    <span className="text-xs text-gray-500 ml-3">{slot.start_time} - {slot.end_time}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      Capacity: {slot.capacity}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      slot.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}