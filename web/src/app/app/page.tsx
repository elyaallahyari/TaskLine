'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { BoardSummary, Task } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const boards = useQuery({
    queryKey: ['boards'],
    queryFn: () => api<BoardSummary[]>('/boards'),
    enabled: Boolean(user)
  })
  const tasks = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api<Task[]>('/tasks'),
    enabled: Boolean(user)
  })

  const createBoard = useMutation({
    mutationFn: () =>
      api('/boards', {
        method: 'POST',
        body: JSON.stringify({ name, description })
      }),
    onSuccess: () => {
      setOpen(false)
      setName('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    }
  })

  const upcoming = (tasks.data ?? [])
    .filter((task) => task.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 6)

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good to see you</p>
          <h1 className="text-2xl font-semibold tracking-tight">{user?.name}</h1>
        </div>
        <Button onClick={() => setOpen(true)}>New board</Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Boards</CardDescription>
            <CardTitle className="text-3xl">{boards.data?.length ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open tasks</CardDescription>
            <CardTitle className="text-3xl">{tasks.data?.length ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>With dates</CardDescription>
            <CardTitle className="text-3xl">
              {tasks.data?.filter((task) => task.dueDate || task.startDate).length ?? '—'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Boards</h2>
            <Link href="/app/boards" className="text-sm text-primary">
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(boards.data ?? []).slice(0, 4).map((board) => (
              <Link key={board.id} href={`/app/boards/${board.id}`}>
                <Card className="h-full transition-colors hover:border-primary/30">
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>{board.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {board._count.tasks} tasks · {board._count.columns} lists
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Coming up</h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {upcoming.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">Nothing dated yet.</p>
              ) : (
                upcoming.map((task) => (
                  <div key={task.id} className="px-5 py-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.board?.name} · {format(new Date(task.dueDate!), 'MMM d')}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New board</DialogTitle>
            <DialogDescription>
              Lists for To do, In progress, and Done are added for you.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              createBoard.mutate()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="board-name">Name</Label>
              <Input
                id="board-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="board-desc">Description</Label>
              <Textarea
                id="board-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!name || createBoard.isPending}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
