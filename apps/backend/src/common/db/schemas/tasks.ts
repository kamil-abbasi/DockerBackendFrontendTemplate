import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * Single source of truth for the status column. `tasks/schemas.ts` builds its
 * zod enum from this tuple, so the two cannot drift.
 */
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const taskStatusEnum = pgEnum("task_status", TASK_STATUSES);

export type DbTask = typeof tasksTable.$inferSelect;

export const tasksTable = pgTable("tasks", {
  id: uuid().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: taskStatusEnum().notNull().default("todo"),
  dueDate: timestamp(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp(),
});
