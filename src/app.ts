import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec, swaggerUiOptions, swaggerUiCdnHost } from "./swagger/swagger";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import adminRoutes from "./modules/admins/admins.routes";
import subscriberRoutes from "./modules/subscribers/subscribers.routes";
import blogCategoryRoutes from "./modules/blog-categories/blog-categories.routes";
import blogRoutes from "./modules/blogs/blogs.routes";
import careerRoutes from "./modules/careers/careers.routes";
import contactRoutes from "./modules/contact/contact.routes";
import consultationRoutes from "./modules/consultations/consultations.routes";
import availabilityRoutes from "./modules/availability/availability.routes";

const app = express();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/blog-categories", blogCategoryRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/availability", availabilityRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "Aramway Admin Backend API",
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
