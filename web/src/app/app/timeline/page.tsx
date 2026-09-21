'use client'

import { useQuery } from '@tanstack/react-query'
import { TimelineView } from '@/components/timeline-view'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Task } from '@/lib/types'

export default function TimelinePage() {
  const { user } = useAuth()
  const tasks = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api<Task[]>('/tasks'),
    enabled: Boolean(user)
  })

  return (
    <div className="flex h-screen flex-col px-8 py-8">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Timeline</h1>
        <p className="text-sm text-muted-foreground">Tasks with dates, laid out left to right.</p>
      </div>
      <TimelineView tasks={tasks.data ?? []} />
    </div>
  )
}
