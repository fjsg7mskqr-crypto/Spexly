'use client'

import { useEffect, useRef } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { subscribeToTable, subscribeToRow, DatabaseEvent } from '@/lib/supabase/realtime-helpers'

/**
 * Hook to subscribe to table changes
 * @param table Table name to subscribe to
 * @param event Event type to listen for
 * @param callback Function to call when a change occurs
 * @param enabled Whether the subscription is enabled (default: true)
 */
export function useTableSubscription<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  event: DatabaseEvent,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    channelRef.current = subscribeToTable(table, event, callback)

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [table, event, enabled, callback])
}

/**
 * Hook to subscribe to row changes
 * @param table Table name
 * @param filter Filter string (e.g., 'id=eq.123')
 * @param event Event type to listen for
 * @param callback Function to call when a change occurs
 * @param enabled Whether the subscription is enabled (default: true)
 */
export function useRowSubscription<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  filter: string,
  event: DatabaseEvent,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || !filter) return

    channelRef.current = subscribeToRow(table, filter, event, callback)

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [table, filter, event, enabled, callback])
}
