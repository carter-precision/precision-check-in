import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  closeCheckInAction,
  getActiveDashboardCheckInsAction,
} from '@/app/actions/check-ins'
import { createClient } from '@/lib/supabase/client'

import type { CheckIn, CheckInQueue, DashboardConnectionStatus } from './types'

const RECENTLY_CLOSED_MS = 30 * 60 * 1000
const DASHBOARD_SYNC_INTERVAL_MS = 10_000

type DashboardQueues = {
  appointments: CheckInQueue
  walkIns: CheckInQueue
}

export function useDashboardCheckIns({
  location,
  locationId,
  initialCheckIns,
  now,
}: {
  location: string
  locationId: string
  initialCheckIns: CheckIn[]
  now: Date | null
}) {
  const [checkIns, setCheckIns] = useState(initialCheckIns)
  const [isRealtimeHealthy, setIsRealtimeHealthy] = useState(false)
  const [isPollingHealthy, setIsPollingHealthy] = useState(true)
  const checkInsRevisionRef = useRef(0)

  useEffect(() => {
    const supabase = createClient()
    let isActive = true
    let isSyncInFlight = false

    async function syncCheckIns() {
      if (isSyncInFlight) return

      isSyncInFlight = true
      const revisionAtStart = checkInsRevisionRef.current

      try {
        const activeCheckIns = await getActiveDashboardCheckInsAction(location)

        if (!isActive) return

        // A Realtime event or optimistic update that happened during this request
        // is newer than the response. Keep it and reconcile on the next pass.
        if (checkInsRevisionRef.current === revisionAtStart) {
          setCheckIns(activeCheckIns)
        }

        setIsPollingHealthy(true)
      } catch (error) {
        if (!isActive) return

        console.error('Dashboard check-in sync failed:', error)
        setIsPollingHealthy(false)
      } finally {
        isSyncInFlight = false
      }
    }

    function handleConnectionProblem() {
      if (!isActive) return

      setIsRealtimeHealthy(false)
      void syncCheckIns()
    }

    supabase.realtime.onHeartbeat((status) => {
      if (status === 'error' || status === 'timeout') {
        handleConnectionProblem()
      }

      if (status === 'disconnected') {
        handleConnectionProblem()
        supabase.realtime.connect()
      }
    })

    const channel = supabase
      .channel(`check-ins-${location}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins',
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          checkInsRevisionRef.current += 1
          setCheckIns((current) => {
            if (payload.eventType === 'INSERT') {
              return addCheckIn(current, payload.new as CheckIn)
            }

            if (payload.eventType === 'UPDATE') {
              return updateCheckIn(current, payload.new as CheckIn)
            }

            return current
          })
        },
      )
      .subscribe((status, error) => {
        if (!isActive) return

        if (status === 'SUBSCRIBED') {
          setIsRealtimeHealthy(true)
          void syncCheckIns()
          return
        }

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          if (error) {
            console.error(`Dashboard Realtime ${status}:`, error)
          }

          handleConnectionProblem()
        }
      })

    const syncInterval = window.setInterval(
      syncCheckIns,
      DASHBOARD_SYNC_INTERVAL_MS,
    )

    function handleOnline() {
      void syncCheckIns()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void syncCheckIns()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isActive = false
      window.clearInterval(syncInterval)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void supabase.removeChannel(channel)
    }
  }, [location, locationId])

  const visibleCheckIns = useMemo(
    () => checkIns.filter((checkIn) => isVisibleCheckIn(checkIn, now)),
    [checkIns, now],
  )

  const queues = useMemo(
    () => groupCheckIns(visibleCheckIns),
    [visibleCheckIns],
  )
  const waitingCount =
    queues.appointments.waiting.length + queues.walkIns.waiting.length
  const connectionStatus: DashboardConnectionStatus =
    isRealtimeHealthy && isPollingHealthy
      ? 'live'
      : isRealtimeHealthy || isPollingHealthy
        ? 'backup'
        : 'offline'

  const closeCheckIn = useCallback(
    async (id: string) => {
      const previous = checkIns.find((checkIn) => checkIn.id === id)
      const closedAt = new Date().toISOString()

      checkInsRevisionRef.current += 1
      setCheckIns((current) =>
        current.map((checkIn) =>
          checkIn.id === id
            ? { ...checkIn, status: 'closed', closed_at: closedAt }
            : checkIn,
        ),
      )

      try {
        await closeCheckInAction(id, location)
      } catch (error) {
        console.error('Failed to close check-in:', error)

        if (previous) {
          checkInsRevisionRef.current += 1
          setCheckIns((current) =>
            current.map((checkIn) => (checkIn.id === id ? previous : checkIn)),
          )
        }

        alert('Could not acknowledge check-in. Please try again.')
      }
    },
    [checkIns, location],
  )

  return {
    queues,
    waitingCount,
    connectionStatus,
    closeCheckIn,
  }
}

function addCheckIn(current: CheckIn[], newCheckIn: CheckIn) {
  if (newCheckIn.status !== 'waiting') return current
  if (current.some((checkIn) => checkIn.id === newCheckIn.id)) return current

  return sortByCreatedAt([...current, newCheckIn])
}

function updateCheckIn(current: CheckIn[], updatedCheckIn: CheckIn) {
  if (updatedCheckIn.status === 'closed' && !updatedCheckIn.closed_at)
    return current

  const exists = current.some((checkIn) => checkIn.id === updatedCheckIn.id)

  if (!exists && updatedCheckIn.status !== 'waiting') return current
  if (!exists) return sortByCreatedAt([...current, updatedCheckIn])

  return current.map((checkIn) =>
    checkIn.id === updatedCheckIn.id ? updatedCheckIn : checkIn,
  )
}

function sortByCreatedAt(checkIns: CheckIn[]) {
  return checkIns.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

function isVisibleCheckIn(checkIn: CheckIn, now: Date | null) {
  if (checkIn.status !== 'closed') return true
  if (!checkIn.closed_at) return false
  if (!now) return true

  return (
    now.getTime() - new Date(checkIn.closed_at).getTime() < RECENTLY_CLOSED_MS
  )
}

function belongsInAppointmentsQueue(visitType: string) {
  return visitType === 'appointment' || visitType === 'vehicle_pickup'
}

function groupCheckIns(checkIns: CheckIn[]): DashboardQueues {
  const queues: DashboardQueues = {
    appointments: { waiting: [], recent: [] },
    walkIns: { waiting: [], recent: [] },
  }

  for (const checkIn of checkIns) {
    const queue = belongsInAppointmentsQueue(checkIn.visit_type)
      ? queues.appointments
      : checkIn.visit_type === 'walk_in'
        ? queues.walkIns
        : null

    if (!queue) continue

    if (checkIn.status === 'waiting') queue.waiting.push(checkIn)
    if (checkIn.status === 'closed') queue.recent.push(checkIn)
  }

  return queues
}
