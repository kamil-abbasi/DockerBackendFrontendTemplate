import express, { type Response, type Request } from "express";
import swaggerUi from "swagger-ui-express";

import middleware from "@/common/middleware";
import { env, logger } from "@/singletons";
import { RegisterRoutes } from "@/api/spec/routes";

async function bootstrap() {
  const app = express();

  app.use(express.json());
  app.use(middleware.logger(logger));

  app.get("/healthcheck", (_, res) => {
    res.json({ message: "I'm fine" });
  });

  app.use("/docs", swaggerUi.serve, async (_: Request, res: Response) => {
    return res.send(
      swaggerUi.generateHTML(await import("./api/spec/swagger.json")),
    );
  });

  RegisterRoutes(app);

  app.use(middleware.error(logger));
  app.use(middleware.notFound);

  app.listen(env.PORT, () => {
    logger.info(`Http server is listening on port ${env.PORT}`);
  });
}

await bootstrap();
