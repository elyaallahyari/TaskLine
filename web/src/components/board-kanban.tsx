"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Board, Column, Priority, Task } from "@/lib/types";
import { priorityLabel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TaskDialog } from "@/components/task-dialog";
import { cn } from "@/lib/utils";

const priorityVariant: Record<Priority, "low" | "medium" | "high" | "urgent"> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

function TaskCard({
  task,
  onOpen,
}: {
  task: Task;
  onOpen?: (task: Task) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(task)}
      className="w-full rounded-lg border border-border bg-background p-3 text-left shadow-sm hover:border-primary/30"
    >
      <p className="text-sm font-medium leading-5">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={priorityVariant[task.priority]}>
          {priorityLabel[task.priority]}
        </Badge>
        {task.dueDate ? (
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function SortableTask({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: "task", task } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onOpen={onOpen} />
    </div>
  );
}

function SortableColumn({
  column,
  onAddTask,
  onOpenTask,
  onRename,
  onDelete,
}: {
  column: Column;
  onAddTask: (columnId: string) => void;
  onOpenTask: (task: Task) => void;
  onRename: (column: Column) => void;
  onDelete: (column: Column) => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });
  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop-${column.id}`,
    data: { type: "column-drop", columnId: column.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/50"
    >
      <div className="flex items-center gap-2 px-3 py-2.5" {...attributes} {...listeners}>
        <h3 className="flex-1 text-sm font-medium">{column.name}</h3>
        <span className="text-xs text-muted-foreground">{column.tasks.length}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onRename(column)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(column)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div ref={setDropRef} className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <SortableTask key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>
        <Button
          variant="ghost"
          className="justify-start text-muted-foreground"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="size-4" />
          Add task
        </Button>
      </div>
    </div>
  );
}

export function BoardKanban({ board }: { board: Board }) {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState(board.columns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; columnId?: string; task?: Task | null }>({
    open: false,
  });
  const [newColumn, setNewColumn] = useState("");

  useEffect(() => {
    setColumns(board.columns);
  }, [board.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);

  const persistBoard = (next: Column[]) => {
    queryClient.setQueryData(["board", board.id], { ...board, columns: next });
  };

  const moveMutation = useMutation({
    mutationFn: (payload: { taskId: string; columnId: string; orderedTaskIds: string[] }) =>
      api(`/tasks/${payload.taskId}/move`, {
        method: "PATCH",
        body: JSON.stringify({
          columnId: payload.columnId,
          orderedTaskIds: payload.orderedTaskIds,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", board.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const addColumn = useMutation({
    mutationFn: () =>
      api(`/boards/${board.id}/columns`, {
        method: "POST",
        body: JSON.stringify({ name: newColumn }),
      }),
    onSuccess: () => {
      setNewColumn("");
      queryClient.invalidateQueries({ queryKey: ["board", board.id] });
    },
  });

  const renameColumn = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api(`/columns/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", board.id] }),
  });

  const deleteColumn = useMutation({
    mutationFn: (id: string) => api(`/columns/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", board.id] }),
  });

  function findColumn(id: string) {
    return columns.find(
      (column) => column.id === id || column.tasks.some((task) => task.id === id),
    );
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "task") {
      setActiveTask(event.active.data.current.task as Task);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== "task") return;

    const activeColumn = findColumn(String(active.id));
    const overId = String(over.id).replace(/^drop-/, "");
    const overColumn = findColumn(overId);
    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    setColumns((prev) => {
      const from = prev.find((column) => column.id === activeColumn.id);
      const to = prev.find((column) => column.id === overColumn.id);
      if (!from || !to) return prev;
      const task = from.tasks.find((item) => item.id === active.id);
      if (!task) return prev;
      const overIndex = to.tasks.findIndex((item) => item.id === overId);
      const insertAt = overIndex === -1 ? to.tasks.length : overIndex;
      return prev.map((column) => {
        if (column.id === from.id) {
          return { ...column, tasks: column.tasks.filter((item) => item.id !== task.id) };
        }
        if (column.id === to.id) {
          const next = [...column.tasks];
          next.splice(insertAt, 0, { ...task, columnId: to.id });
          return { ...column, tasks: next };
        }
        return column;
      });
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) {
      setColumns(board.columns);
      return;
    }

    if (active.data.current?.type === "column") {
      const oldIndex = columnIds.indexOf(String(active.id));
      const newIndex = columnIds.indexOf(String(over.id).replace(/^drop-/, ""));
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const nextIds = arrayMove(columnIds, oldIndex, newIndex);
      const next = arrayMove(columns, oldIndex, newIndex);
      setColumns(next);
      persistBoard(next);
      api(`/boards/${board.id}/columns/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ columnIds: nextIds }),
      }).then(() => queryClient.invalidateQueries({ queryKey: ["board", board.id] }));
      return;
    }

    const column = findColumn(String(active.id));
    if (!column) return;
    const overId = String(over.id).replace(/^drop-/, "");
    const overColumn = findColumn(overId) ?? column;
    let next = columns;
    if (column.id === overColumn.id) {
      const oldIndex = column.tasks.findIndex((task) => task.id === active.id);
      const newIndex = column.tasks.findIndex((task) => task.id === overId);
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        next = columns.map((item) =>
          item.id === column.id
            ? { ...item, tasks: arrayMove(item.tasks, oldIndex, newIndex) }
            : item,
        );
        setColumns(next);
      }
    }
    persistBoard(next);
    const target = next.find((item) => item.tasks.some((task) => task.id === active.id));
    if (!target) return;
    moveMutation.mutate({
      taskId: String(active.id),
      columnId: target.id,
      orderedTaskIds: target.tasks.map((task) => task.id),
    });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex h-full gap-3 overflow-x-auto pb-4">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <SortableColumn
                key={column.id}
                column={column}
                onAddTask={(columnId) => setDialog({ open: true, columnId })}
                onOpenTask={(task) =>
                  setDialog({ open: true, columnId: task.columnId, task })
                }
                onRename={(item) => {
                  const name = window.prompt("Column name", item.name);
                  if (name) renameColumn.mutate({ id: item.id, name });
                }}
                onDelete={(item) => {
                  if (window.confirm(`Delete “${item.name}” and its tasks?`)) {
                    deleteColumn.mutate(item.id);
                  }
                }}
              />
            ))}
          </SortableContext>
          <form
            className="flex h-fit w-72 shrink-0 gap-2 rounded-xl border border-dashed border-border bg-background p-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (newColumn.trim()) addColumn.mutate();
            }}
          >
            <Input
              placeholder="New list"
              value={newColumn}
              onChange={(e) => setNewColumn(e.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={!newColumn.trim()}>
              Add
            </Button>
          </form>
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
      <TaskDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        boardId={board.id}
        columnId={dialog.columnId}
        task={dialog.task}
      />
    </>
  );
}
