import rateLimit from "express-rate-limit";

/**
 * Throttles the public form endpoints (contact messages and consultation
 * bookings) against scripted spam. Generous enough that a real visitor
 * retrying after a validation error never hits it.
 */
export const publicFormRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Too many requests — please try again in a few minutes" },
});
