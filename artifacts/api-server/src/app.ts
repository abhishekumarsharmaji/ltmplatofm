import express, { type Express } from "express";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import seoRouter from "./routes/seo";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// No CORS middleware on purpose: every browser client is served from the same origin through the
// shared path-based proxy, so no third-party origin is ever granted access to the API or lesson videos.
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
// Public pages are rendered here for crawlers; nginx sends private SPA routes directly to Vite.
app.use("/", seoRouter);

export default app;
