import z from "zod";

import { TASK_STATUSES } from "@/common/db/schemas";

/** Field rules for the task domain, aligned with `common/db/schemas/tasks.ts`. */

export const taskIdSchema = z.uuid();

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "title is required")
  .max(255);

export const taskDescriptionSchema = z.string().trim().max(10_000);

export const taskStatusSchema = z.enum(TASK_STATUSES);

/** ISO-8601 string on the wire; the model turns it into a `Date`. */
export const taskDueDateSchema = z.iso.datetime();

export const taskParamsSchema = z.strictObject({
  id: taskIdSchema,
});

export const listTasksQuerySchema = z.strictObject({
  status: taskStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createTaskSchema = z.strictObject({
  title: taskTitleSchema,
  description: taskDescriptionSchema.optional(),
  status: taskStatusSchema.optional(),
  dueDate: taskDueDateSchema.optional(),
});

export const updateTaskSchema = z
  .strictObject({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.optional(),
    status: taskStatusSchema.optional(),
    dueDate: taskDueDateSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    error: "at least one field must be provided",
  });
