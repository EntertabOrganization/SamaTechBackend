import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec, swaggerUiOptions, swaggerUiCdnHost } from "./swagger/swagger";
import { errorHandler } from "./middleware/errorHandler";
import prisma from "./lib/prisma";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import contactRoutes from "./modules/contact/contact.routes";
import consultationRoutes from "./modules/consultations/consultations.routes";
import availabilityRoutes from "./modules/availability/availability.routes";

const app = express();

// Behind a hosting proxy (Vercel, a load balancer), use the first
// X-Forwarded-For hop as the client IP so per-visitor rate limits work.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", swaggerUiCdnHost],
        "img-src": ["'self'", "data:", swaggerUiCdnHost],
      },
    },
  })
);
// Allow any origin. Note: with credentials: true, the CORS spec forbids a
// literal Access-Control-Allow-Origin: "*" on credentialed requests — browsers
// reject it outright. `origin: true` has the `cors` package reflect back
// whatever Origin the request sent instead, which satisfies "allow any
// origin" while staying valid for cookie-based auth.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/availability", availabilityRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Reports whether DATABASE_URL works, with the Prisma error kind (never the URL),
// so a deployment's database problems can be told apart without its logs.
app.get("/health/db", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const users = await prisma.user.count();
    res.status(200).json({ database: "ok", users });
  } catch (err: any) {
    res.status(503).json({
      database: "error",
      kind: err?.constructor?.name,
      code: err?.errorCode ?? err?.code,
      databaseUrlSet: Boolean(process.env.DATABASE_URL),
      databaseUrlQuoted: /^["']/.test(process.env.DATABASE_URL ?? ""),
    });
  }
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "SAMATECHS Backend API",
    docs: "/api-docs",
    health: "/health",
  });
});

// 404 handler
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler (must be last)
app.use(errorHandler);

export default app;
