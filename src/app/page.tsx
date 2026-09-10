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

interface Booking {
  id: string
  slot_id: string
  status: string
  live_slots: Slot
}

export default function HostDashboard() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [userBookings, setUserBookings] = useState<Booking[]>([])
  const [user, setUser] = useState<any>(null)
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    initDashboard()
  }, [])

  const initDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    fetchSlots()
    fetchUserBookings(user.id)
  }

  const fetchSlots = async () => {
    const { data } = await supabase
      .from('live_slots')
      .select('*')
      .eq('status', 'open')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (data) setSlots(data)
  }

  const fetchUserBookings = async (userId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select('id, slot_id, status, live_slots(*)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')

    if (data) setUserBookings(data as unknown as Booking[])
  }

  const handleBookSlot = async (slotId: string) => {
    if (!user) return
    setLoadingSlotId(slotId)
    setMessage(null)

    // Call atomic SQL RPC function to prevent race conditions
    const { data, error } = await supabase.rpc('book_slot', {
      target_slot_id: slotId,
      target_user_id: user.id,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (data && !data.success) {
      setMessage({ type: 'error', text: data.message })
    } else {
      setMessage({ type: 'success', text: 'Slot booked successfully!' })
      fetchSlots()
      fetchUserBookings(user.id)
    }

    setLoadingSlotId(null)
  }

  const isAlreadyBooked = (slotId: string) => {
    return userBookings.some((b) => b.slot_id === slotId)
  }

  return (
    <main className="min-h-screen bg-rimbun-bg p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-rimbun-teal">Rimbun Live</h1>
            <p className="text-xs text-gray-500">Host Booking Portal</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Global Feedback Message */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium ${
              message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* My Bookings Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-3">Your Booked Sessions</h2>
          {userBookings.length === 0 ? (
            <p className="text-xs text-gray-400">You have no upcoming booked slots.</p>
          ) : (
            <div className="space-y-2">
              {userBookings.map((b) => (
                <div key={b.id} className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-rimbun-teal">{b.live_slots?.date}</p>
                    <p className="text-xs text-gray-600">
                      {b.live_slots?.start_time} - {b.live_slots?.end_time}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold bg-rimbun-teal text-white px-2 py-0.5 rounded-full">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Slots Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-3">Available Slots</h2>
          {slots.length === 0 ? (
            <p className="text-xs text-gray-400">No available slots open for booking at this time.</p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const booked = isAlreadyBooked(slot.id)
                return (
                  <div key={slot.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{slot.date}</p>
                      <p className="text-xs text-gray-500">
                        {slot.start_time} - {slot.end_time}
                      </p>
                      <span className="text-[10px] text-gray-400">Capacity: {slot.capacity}</span>
                    </div>

                    <button
                      onClick={() => handleBookSlot(slot.id)}
                      disabled={booked || loadingSlotId === slot.id}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                        booked
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-rimbun-teal text-white hover:opacity-90'
                      }`}
                    >
                      {loadingSlotId === slot.id ? 'Booking...' : booked ? 'Booked' : 'Book Slot'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}