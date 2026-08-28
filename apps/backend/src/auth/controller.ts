import { HttpStatus, type ApiResponse } from "../api/types";
import { Controller } from "@/common/controller";
import type {
  LoginResponseDto,
  SingupResponseDto,
  SignupDto,
  LoginDto,
} from "./dtos";
import { Body, Middlewares, NoSecurity, Post, Route } from "tsoa";
import { User } from "@/users/model";
import argon2 from "argon2";
import type { TokenService } from "./tokens";
import { validate } from "@/common/middleware";
import { loginSchema, signupSchema } from "./schemas";

@Route("auth")
export class AuthController extends Controller {
  constructor(private readonly tokens: TokenService) {
    super();
  }

  @NoSecurity()
  @Middlewares(validate({ body: signupSchema }))
  @Post("signup")
  async signup(
    @Body() body: SignupDto,
  ): Promise<ApiResponse<SingupResponseDto>> {
    const result = await User.findByUsername(body.username);

    if (result) {
      return this.sendError({
        message: "user with this username already exists",
        httpStatus: HttpStatus.CONFLICT,
      });
    }

    const hashedPassword = await argon2.hash(body.password);

    const user = User.create({
      username: body.username,
      hashedPassword: hashedPassword,
    });

    await user.save();

    return this.sendSuccess(
      {
        createdAt: user.createdAt.toISOString(),
        userId: user.id,
      },
      HttpStatus.CREATED,
    );
  }

  @NoSecurity()
  @Middlewares(validate({ body: loginSchema }))
  @Post("login")
  async login(@Body() body: LoginDto): Promise<ApiResponse<LoginResponseDto>> {
    const user = await User.findByUsername(body.username);

    if (!user) {
      return this.sendError({
        message: "incorrect username or password",
        httpStatus: HttpStatus.CONFLICT,
      });
    }

    const validPassword = await argon2.verify(
      user.hashedPassword,
      body.password,
    );

    if (!validPassword) {
      return this.sendError({
        message: "incorrect username or password",
        httpStatus: HttpStatus.CONFLICT,
      });
    }

    return this.sendSuccess({
      userId: user.id,
      loggedInAt: new Date().toISOString(),
      accessToken: this.tokens.sign({ id: user.id }),
    });
  }
}
