"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarMonth } from "@/components/calendar-month";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Task } from "@/lib/types";

export default function CalendarPage() {
  const { user } = useAuth();
  const tasks = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api<Task[]>("/tasks"),
    enabled: Boolean(user),
  });

  return (
    <div className="flex h-screen flex-col px-8 py-8">
      <CalendarMonth tasks={tasks.data ?? []} />
    </div>
  );
}
