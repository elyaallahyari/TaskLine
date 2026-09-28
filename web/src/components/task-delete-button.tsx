'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

export type OnTaskDeleted = (deletedId: string) => void

interface TaskDeleteButtonProps {
  taskId: string
  taskTitle?: string
  onDeleted?: OnTaskDeleted
  onError?: (message: string) => void
  className?: string
}

export function TaskDeleteButton({
  taskId,
  taskTitle = 'this task',
  onDeleted,
  onError,
  className = ''
}: TaskDeleteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openConfirm(e: React.MouseEvent | React.PointerEvent) {
    e.stopPropagation()
    setError(null)
    setConfirmOpen(true)
  }

  async function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await api<{ ok: true }>(`/tasks/${encodeURIComponent(taskId)}`, {
        method: 'DELETE'
      })
      setConfirmOpen(false)
      onDeleted?.(taskId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task'
      setError(message)
      onError?.(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Delete ${taskTitle}`}
        title="Delete task"
        disabled={pending}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={openConfirm}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 ${className}`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>

      {confirmOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-task-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            if (!pending) setConfirmOpen(false)
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-background p-5 shadow-xl"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-task-title" className="text-base font-semibold">
              Delete task?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              &ldquo;{taskTitle}&rdquo; will be permanently deleted. This action cannot be undone.
            </p>
            {error && (
              <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmOpen(false)
                }}
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground disabled:opacity-50"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
