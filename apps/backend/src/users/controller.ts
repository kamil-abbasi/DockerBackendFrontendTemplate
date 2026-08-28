import { Get, Route, Request, Response } from "tsoa";
import type { Request as ExpressRequest } from "express";

import { Controller } from "@/common/controller";
import type { UserDto } from "./dtos";
import { User } from "./model";
import { HttpStatus, type ApiResponse } from "@/api/types";

@Route("users")
export class UsersController extends Controller {
  @Response(`${HttpStatus.NOT_FOUND}`, "profile not found")
  @Get("profile")
  public async getProfile(
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<UserDto>> {
    const user = await User.findById(req.user.id);

    if (!user) {
      return this.sendNotFound("profile not found");
    }

    return this.sendSuccess(User.toDto(user));
  }
}
