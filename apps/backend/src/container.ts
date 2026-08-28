import { Logger, type ILogger } from "@/common/logger";
import { Database, setupEnv, type Env } from "./common";
import { User } from "./users/model";
import type { Controller as TsoaController } from "tsoa";
import type { IocContainer, ServiceIdentifier } from "@tsoa/runtime";
import { AuthController } from "./auth/controller";
import { TokenService } from "./auth/tokens";
import { UsersController } from "./users/controller";

/**
 * Any tsoa controller class. `never[]` args keep it assignable from
 * controllers with required constructor parameters.
 */
type ControllerClass<T extends TsoaController = TsoaController> = new (
  ...args: never[]
) => T;

/**
 * Composition root. Owns every singleton and hands controllers to tsoa's
 * generated routes through the `IocContainer` interface.
 */
export class Container implements IocContainer {
  public readonly env: Env;
  public readonly logger: ILogger;
  public readonly db: Database;
  public readonly tokens: TokenService;

  private readonly controllers = new Map<ControllerClass, TsoaController>();

  constructor() {
    const env = setupEnv();

    this.env = env;
    this.logger = new Logger({ level: env.LOG_LEVEL });
    this.db = new Database(env.DB_URL);

    this.tokens = new TokenService(env);

    User.setDb(this.db);

    this.register(AuthController, new AuthController(this.tokens));
    this.register(UsersController, new UsersController());
  }

  /**
   * Binds a controller class to its instance. The generic ties both together,
   * so passing an instance of the wrong class is a compile error.
   */
  private register<T extends TsoaController>(
    controller: ControllerClass<T>,
    instance: T,
  ): void {
    this.controllers.set(controller, instance);
  }

  /** Called by the tsoa-generated routes for every request. */
  get<T>(controller: ServiceIdentifier<T>): T {
    const instance = this.controllers.get(controller as ControllerClass);

    if (!instance) {
      throw new Error(
        `Controller "${String((controller as { name?: string }).name ?? controller)}" is not registered in the container`,
      );
    }

    return instance as T;
  }
}
