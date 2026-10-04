import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as controller from "./availability.controller";

const router = Router();

/**
 * @openapi
 * /availability:
 *   get:
 *     tags: [Availability]
 *     summary: Get the admin's recurring weekly consultation availability (public)
 *     responses:
 *       200:
 *         description: Always exactly 7 entries, one per day of week (0=Sunday..6=Saturday)
 */
router.get("/", controller.getWeeklyAvailability);

/**
 * @openapi
 * /availability:
 *   put:
 *     tags: [Availability]
 *     summary: Replace the admin's recurring weekly consultation availability
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [days]
 *             properties:
 *               days:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek: { type: integer, minimum: 0, maximum: 6 }
 *                     timeSlots: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Updated weekly availability
 *       400:
 *         description: Invalid payload
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put("/", authMiddleware, controller.updateWeeklyAvailability);

export default router;
