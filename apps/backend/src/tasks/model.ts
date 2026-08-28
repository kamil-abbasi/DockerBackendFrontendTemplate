import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { schemas, type Database } from "@/common/db";
import type { DbTask, TaskStatus } from "@/common/db/schemas";
import type { TaskDto } from "./dtos";

export type TaskProps = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
};

export type CreateTaskProps = Omit<
  TaskProps,
  "id" | "createdAt" | "updatedAt" | "status"
> & { status?: TaskStatus };

export type UpdateTaskProps = Partial<
  Pick<TaskProps, "title" | "description" | "status" | "dueDate">
>;

export type FindTasksProps = {
  userId: string;
  status?: TaskStatus;
  limit: number;
  offset: number;
};

export class Task {
  private static db: Database;

  public static setDb(db: Database) {
    Task.db = db;
  }

  private props: TaskProps;

  constructor(props: TaskProps) {
    this.props = props;
  }

  get id() {
    return this.props.id;
  }

  get userId() {
    return this.props.userId;
  }

  get title() {
    return this.props.title;
  }

  get description() {
    return this.props.description;
  }

  get status() {
    return this.props.status;
  }

  get dueDate() {
    return this.props.dueDate;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(props: CreateTaskProps): Task {
    return new Task({
      ...props,
      status: props.status ?? "todo",
      id: randomUUID(),
      createdAt: new Date(),
    });
  }

  /** Always scoped to one owner — there is no cross-user listing. */
  static async findMany(props: FindTasksProps): Promise<Task[]> {
    const tasks = await Task.db.client
      .select()
      .from(schemas.tasksTable)
      .where(
        and(
          eq(schemas.tasksTable.userId, props.userId),
          props.status ? eq(schemas.tasksTable.status, props.status) : undefined,
        ),
      )
      .orderBy(desc(schemas.tasksTable.createdAt))
      .limit(props.limit)
      .offset(props.offset);

    return tasks.map(Task.fromDb);
  }

  /**
   * Scoped by owner on purpose: someone else's task reads as missing rather
   * than forbidden, so the endpoint does not leak which ids exist.
   */
  static async findById(id: string, userId: string): Promise<Task | null> {
    const [task] = await Task.db.client
      .select()
      .from(schemas.tasksTable)
      .where(
        and(
          eq(schemas.tasksTable.id, id),
          eq(schemas.tasksTable.userId, userId),
        ),
      );

    return task ? Task.fromDb(task) : null;
  }

  static async deleteById(id: string, userId: string): Promise<boolean> {
    const deleted = await Task.db.client
      .delete(schemas.tasksTable)
      .where(
        and(
          eq(schemas.tasksTable.id, id),
          eq(schemas.tasksTable.userId, userId),
        ),
      )
      .returning({ id: schemas.tasksTable.id });

    return deleted.length > 0;
  }

  static toDto(model: Task): TaskDto {
    return {
      id: model.id,
      userId: model.userId,
      title: model.title,
      description: model.description,
      status: model.status,
      dueDate: model.dueDate?.toISOString(),
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt?.toISOString(),
    };
  }

  static fromDb(row: DbTask): Task {
    return new Task({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description ?? undefined,
      status: row.status,
      dueDate: row.dueDate ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? undefined,
    });
  }

  async save(): Promise<void> {
    await Task.db.client
      .insert(schemas.tasksTable)
      .values(this.props)
      .onConflictDoUpdate({
        target: schemas.tasksTable.id,
        set: {
          title: this.props.title,
          description: this.props.description ?? null,
          status: this.props.status,
          dueDate: this.props.dueDate ?? null,
          updatedAt: this.props.updatedAt,
        },
      });
  }

  update(props: UpdateTaskProps) {
    this.props = { ...this.props, ...props, updatedAt: new Date() };
  }
}
