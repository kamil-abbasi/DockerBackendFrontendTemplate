import type { Request as ExpressRequest } from "express";
import {
  Body,
  Delete,
  Get,
  Middlewares,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
} from "tsoa";

import { HttpStatus, type ApiResponse } from "@/api";
import { Controller } from "@/common/controller";
import { validate } from "@/common/middleware";
import type { TaskStatus } from "@/common/db/schemas";
import type {
  CreateTaskDto,
  TaskDeletedDto,
  TaskDto,
  TaskListDto,
  UpdateTaskDto,
} from "./dtos";
import { Task, type UpdateTaskProps } from "./model";
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskParamsSchema,
  updateTaskSchema,
} from "./schemas";

/**
 * Every route here is authenticated by the root security scheme in tsoa.json
 * and scoped to `req.user.id`, so a task is only ever visible to its owner.
 */
@Route("tasks")
export class TasksController extends Controller {
  @Middlewares(validate({ query: listTasksQuerySchema }))
  @Get()
  public async list(
    @Request() req: ExpressRequest,
    @Query() status?: TaskStatus,
    @Query() limit?: number,
    @Query() offset?: number,
  ): Promise<ApiResponse<TaskListDto>> {
    // the query schema defaults both, so the middleware has already filled them
    const resolvedLimit = limit ?? 20;
    const resolvedOffset = offset ?? 0;

    const tasks = await Task.findMany({
      userId: req.user.id,
      status,
      limit: resolvedLimit,
      offset: resolvedOffset,
    });

    return this.sendSuccess({
      items: tasks.map(Task.toDto),
      limit: resolvedLimit,
      offset: resolvedOffset,
    });
  }

  @Response(`${HttpStatus.NOT_FOUND}`, "task not found")
  @Middlewares(validate({ params: taskParamsSchema }))
  @Get("{id}")
  public async getById(
    @Request() req: ExpressRequest,
    @Path() id: string,
  ): Promise<ApiResponse<TaskDto>> {
    const task = await Task.findById(id, req.user.id);

    if (!task) {
      return this.sendNotFound("task not found");
    }

    return this.sendSuccess(Task.toDto(task));
  }

  @Middlewares(validate({ body: createTaskSchema }))
  @Post()
  public async create(
    @Request() req: ExpressRequest,
    @Body() body: CreateTaskDto,
  ): Promise<ApiResponse<TaskDto>> {
    const task = Task.create({
      userId: req.user.id,
      title: body.title,
      description: body.description,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });

    await task.save();

    return this.sendSuccess(Task.toDto(task), HttpStatus.CREATED);
  }

  @Response(`${HttpStatus.NOT_FOUND}`, "task not found")
  @Middlewares(
    validate({ params: taskParamsSchema, body: updateTaskSchema }),
  )
  @Patch("{id}")
  public async update(
    @Request() req: ExpressRequest,
    @Path() id: string,
    @Body() body: UpdateTaskDto,
  ): Promise<ApiResponse<TaskDto>> {
    const task = await Task.findById(id, req.user.id);

    if (!task) {
      return this.sendNotFound("task not found");
    }

    task.update(toUpdateProps(body));
    await task.save();

    return this.sendSuccess(Task.toDto(task));
  }

  @Response(`${HttpStatus.NOT_FOUND}`, "task not found")
  @Middlewares(validate({ params: taskParamsSchema }))
  @Delete("{id}")
  public async remove(
    @Request() req: ExpressRequest,
    @Path() id: string,
  ): Promise<ApiResponse<TaskDeletedDto>> {
    const deleted = await Task.deleteById(id, req.user.id);

    if (!deleted) {
      return this.sendNotFound("task not found");
    }

    return this.sendSuccess({ id, deletedAt: new Date().toISOString() });
  }
}

/**
 * Copies only the keys the client actually sent, so an absent field is left
 * alone rather than overwritten with `undefined`, and turns the ISO `dueDate`
 * string into the `Date` the model stores.
 */
function toUpdateProps(body: UpdateTaskDto): UpdateTaskProps {
  const props: UpdateTaskProps = {};

  if (body.title !== undefined) {
    props.title = body.title;
  }

  if (body.status !== undefined) {
    props.status = body.status;
  }

  if (body.description !== undefined) {
    props.description = body.description;
  }

  if (body.dueDate !== undefined) {
    props.dueDate = new Date(body.dueDate);
  }

  return props;
}
