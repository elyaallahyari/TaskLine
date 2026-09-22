'use client'

import { addDays, differenceInCalendarDays, format, max, min, startOfDay } from 'date-fns'
import { useMemo } from 'react'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'

const DAY_WIDTH = 36

function rangeFor(task: Task, fallback: Date) {
  const start = task.startDate
    ? new Date(task.startDate)
    : task.dueDate
      ? new Date(task.dueDate)
      : fallback

  const end = task.dueDate ? new Date(task.dueDate) : addDays(start, 1)

  return {
    start: startOfDay(start),
    end: startOfDay(end)
  }
}

export function TimelineView({ tasks }: { tasks: Task[] }) {
  const { start, days, rows } = useMemo(() => {
    const dated = tasks.filter((task) => task.startDate || task.dueDate)
    const today = startOfDay(new Date())

    if (dated.length === 0) {
      return {
        start: addDays(today, -3),
        days: Array.from({ length: 21 }, (_, i) => addDays(today, i - 3)),
        rows: [] as Task[]
      }
    }

    const starts = dated.map((task) => rangeFor(task, today).start)
    const ends = dated.map((task) => rangeFor(task, today).end)

    const minDate = addDays(min(starts), -2)
    const maxDate = addDays(max(ends), 4)

    const length = Math.max(14, differenceInCalendarDays(maxDate, minDate) + 1)

    return {
      start: minDate,
      days: Array.from({ length }, (_, i) => addDays(minDate, i)),
      rows: [...dated].sort(
        (a, b) => rangeFor(a, today).start.getTime() - rangeFor(b, today).start.getTime()
      )
    }
  }, [tasks])

  const today = startOfDay(new Date())
  const todayOffset = differenceInCalendarDays(today, start)

  const todayIsVisible = todayOffset >= 0 && todayOffset < days.length

  const todayLineLeft = todayOffset * DAY_WIDTH + DAY_WIDTH / 2

  return (
    <div className="overflow-auto rounded-xl border border-border bg-background">
      <div className="min-w-max">
        <div className="sticky top-0 z-10 flex border-b border-border bg-background">
          <div className="sticky left-0 z-30 w-56 shrink-0 border-r border-border bg-background px-3 py-3 text-xs font-medium text-muted-foreground">
            Task
          </div>

          <div className="relative flex" style={{ width: days.length * DAY_WIDTH }}>
            {days.map((day) => {
              const isToday = differenceInCalendarDays(day, today) === 0

              const isPast = day < today

              const isWeekend = day.getDay() === 0 || day.getDay() === 6

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'w-9 shrink-0 border-r border-border/70 py-2 text-center text-[10px] transition-colors',

                    isPast && 'bg-muted/35 text-muted-foreground',

                    isToday && 'bg-primary/6 text-foreground',

                    !isPast && !isToday && !isWeekend && 'bg-background text-muted-foreground',

                    isWeekend && !isToday && 'bg-muted/50 text-muted-foreground'
                  )}
                >
                  <div>{format(day, 'EEEEE')}</div>

                  <div className={cn('font-medium', isToday && 'text-primary')}>
                    {format(day, 'd')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">
            Add start or due dates to tasks to see them here.
          </p>
        ) : (
          <div className="relative">
            {rows.map((task) => {
              const span = rangeFor(task, today)

              const offset = differenceInCalendarDays(span.start, start)

              const length = Math.max(1, differenceInCalendarDays(span.end, span.start) + 1)

              return (
                <div key={task.id} className="flex border-b border-border last:border-b-0">
                  <div className="sticky left-0 z-20 flex w-56 shrink-0 items-center truncate border-r border-border bg-background px-3 py-3 text-sm">
                    {task.title}
                  </div>

                  <div
                    className="relative h-12"
                    style={{
                      width: days.length * DAY_WIDTH
                    }}
                  >
                    <div className="absolute inset-0 flex">
                      {days.map((day) => {
                        const isToday = differenceInCalendarDays(day, today) === 0

                        const isPast = day < today

                        const isWeekend = day.getDay() === 0 || day.getDay() === 6

                        return (
                          <div
                            key={day.toISOString()}
                            className={cn(
                              'h-full w-9 shrink-0 border-r border-border/50',

                              isPast && 'bg-muted/25',

                              isToday && 'bg-primary/4',

                              isWeekend && !isToday && 'bg-muted/30'
                            )}
                          />
                        )
                      })}
                    </div>

                    <div
                      className="absolute top-3 h-6 rounded-full bg-primary/85 px-2 text-[11px] leading-6 text-primary-foreground shadow-sm"
                      style={{
                        left: offset * DAY_WIDTH + 4,
                        width: length * DAY_WIDTH - 8
                      }}
                      title={`${task.title} · ${format(
                        span.start,
                        'MMM d'
                      )} – ${format(span.end, 'MMM d')}`}
                    >
                      <span className="block truncate">{task.title}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {todayIsVisible && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-primary/25"
                style={{
                  left: `calc(224px + ${todayLineLeft}px)`
                }}
              >
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/50" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
