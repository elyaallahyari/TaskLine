"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarMonth({ tasks }: { tasks: Task[] }) {
  const [month, setMonth] = useState(new Date());
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">
          {format(month, "MMMM yyyy")}
        </h1>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button size="icon" variant="outline" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 overflow-hidden rounded-xl border border-border bg-background">
        {days.map((day) => {
          const items = tasks.filter(
            (task) => task.dueDate && isSameDay(new Date(task.dueDate), day),
          );
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-28 border-b border-r border-border p-2 last:border-r-0",
                !isSameMonth(day, month) && "bg-muted/40 text-muted-foreground",
                isSameDay(day, new Date()) && "bg-primary/5",
              )}
            >
              <div className="mb-1 text-xs font-medium">{format(day, "d")}</div>
              <div className="space-y-1">
                {items.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="truncate rounded-md bg-primary/10 px-1.5 py-1 text-[11px] text-primary"
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {items.length > 3 ? (
                  <p className="text-[11px] text-muted-foreground">
                    +{items.length - 3} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
