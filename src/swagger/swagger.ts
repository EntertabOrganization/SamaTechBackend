import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Aramway Admin Backend API",
      version: "1.0.0",
      description:
        "Admin backend API for the Aramway business-consultancy marketing site. " +
        "Handles newsletter subscribers, blog/news content, career applications, " +
        "contact-us messages, and consultation bookings.",
    },
    servers: [
      {
        url: "/api",
        description: "API base path",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  },
  // glob (used internally by swagger-jsdoc) only matches forward-slash
  // patterns, but path.join produces backslashes on Windows — normalize.
  apis: [
    path.join(__dirname, "../modules/**/*.routes.ts").split(path.sep).join("/"),
    path.join(__dirname, "../modules/**/*.routes.js").split(path.sep).join("/"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

// swagger-ui-express normally serves its CSS/JS/favicon assets as local
// static files (via express.static over node_modules/swagger-ui-dist). That
// doesn't reliably work on Vercel's serverless functions — the assets either
// aren't included in the function's bundle or fail to read from the ephemeral
// filesystem, so the docs page loads but its icons/css/bundle silently come
// back as the wrong (tiny, ~3KB) fallback response. Pointing them at the
// jsdelivr CDN (pinned to the exact swagger-ui-dist version this app
// bundles) sidesteps local static file serving entirely.
const SWAGGER_UI_VERSION: string = require("swagger-ui-dist/package.json").version;
const SWAGGER_UI_CDN = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

export const swaggerUiOptions = {
  customCssUrl: `${SWAGGER_UI_CDN}/swagger-ui.css`,
  customJs: [`${SWAGGER_UI_CDN}/swagger-ui-bundle.js`, `${SWAGGER_UI_CDN}/swagger-ui-standalone-preset.js`],
  customfavIcon: `${SWAGGER_UI_CDN}/favicon-32x32.png`,
};

export const swaggerUiCdnHost = "https://cdn.jsdelivr.net";
