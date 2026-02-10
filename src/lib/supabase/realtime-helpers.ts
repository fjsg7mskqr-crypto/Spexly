'use client'

import { createClient } from './client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type DatabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

/**
 * Subscribe to changes on a specific table
 * @param table The table name to subscribe to
 * @param event The type of change to listen for (INSERT, UPDATE, DELETE, or * for all)
 * @param callback Function to call when a change occurs
 * @returns RealtimeChannel that can be used to unsubscribe
 */
export function subscribeToTable<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  event: DatabaseEvent,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      { event, schema: 'public', table },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to changes on a specific row
 * @param table The table name
 * @param filter The column and value to filter by (e.g., 'id=eq.123')
 * @param event The type of change to listen for
 * @param callback Function to call when a change occurs
 * @returns RealtimeChannel that can be used to unsubscribe
 */
export function subscribeToRow<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  filter: string,
  event: DatabaseEvent,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`${table}-row-${filter}`)
    .on(
      'postgres_changes',
      { event, schema: 'public', table, filter },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Create a presence channel for real-time collaboration
 * @param channelName Name of the presence channel
 * @param initialState Initial presence state for this client
 * @returns RealtimeChannel
 */
export function createPresenceChannel(
  channelName: string,
  initialState?: Record<string, unknown>
) {
  const supabase = createClient()

  const channel = supabase.channel(channelName, {
    config: {
      presence: {
        key: crypto.randomUUID(),
      },
    },
  })

  if (initialState) {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(initialState)
      }
    })
  }

  return channel
}
