export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  order: number;
  boardId: string;
  columnId: string;
  assigneeId: string | null;
  createdAt: string;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  column?: { id: string; name: string };
  board?: { id: string; name: string };
};

export type Column = {
  id: string;
  name: string;
  order: number;
  boardId: string;
  tasks: Task[];
};

export type BoardSummary = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  _count: { tasks: number; columns: number };
};

export type Board = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  columns: Column[];
};

export const priorityLabel: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};
