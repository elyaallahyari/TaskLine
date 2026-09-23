'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { BoardKanban } from '@/components/board-kanban'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Board } from '@/lib/types'

export default function BoardPage() {
  const { user } = useAuth()
  const params = useParams<{ id: string }>()
  const board = useQuery({
    queryKey: ['board', params.id],
    queryFn: () => api<Board>(`/boards/${params.id}`),
    enabled: Boolean(user && params.id)
  })

  if (board.isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading board…</p>
  }
  if (!board.data) {
    return <p className="p-8 text-sm text-muted-foreground">Board not found.</p>
  }

  return (
    <div className="flex h-screen flex-col px-6 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">{board.data.name}</h1>
        <p className="text-sm text-muted-foreground">
          {board.data.description || 'Drag cards between lists.'}
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <BoardKanban board={board.data} />
      </div>
    </div>
  )
}
