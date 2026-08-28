import express, { type Response, type Request } from "express";
import swaggerUi from "swagger-ui-express";

import middleware from "@/common/middleware";
import { container } from "@/ioc";
import { RegisterRoutes } from "@/api/spec/routes";

async function bootstrap() {
  const app = express();

  app.use(express.json());
  app.use(middleware.logger(container.logger));

  app.get("/healthcheck", (_, res) => {
    res.json({ message: "I'm fine" });
  });

  app.use("/docs", swaggerUi.serve, async (_: Request, res: Response) => {
    return res.send(
      swaggerUi.generateHTML(await import("./api/spec/swagger.json")),
    );
  });

  RegisterRoutes(app);

  app.use(middleware.error(container.logger));
  app.use(middleware.notFound);

  app.listen(container.env.PORT, () => {
    container.logger.info(
      `Http server is listening on port ${container.env.PORT}`,
    );
  });
}

await bootstrap();
