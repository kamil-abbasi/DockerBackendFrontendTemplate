import type z from "zod";

import type { TaskStatus } from "@/common/db/schemas";

import type {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from "./schemas";

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type ListTasksQueryDto = z.infer<typeof listTasksQuerySchema>;

export type TaskDto = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
};

export type TaskListDto = {
  items: TaskDto[];
  limit: number;
  offset: number;
};

export type TaskDeletedDto = {
  id: string;
  deletedAt: string;
};
