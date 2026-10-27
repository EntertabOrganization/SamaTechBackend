import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import * as controller from "./availability.controller";

const router = Router();
const staff = [authMiddleware, requireRole("BOOKING")];

/**
 * @openapi
 * /availability:
 *   get:
 *     tags: [Availability]
 *     summary: Get the user's recurring weekly consultation availability (public)
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
 *     summary: Replace the user's recurring weekly consultation availability
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
 *       403:
 *         description: Needs the ADMIN or BOOKING role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put("/", ...staff, controller.updateWeeklyAvailability);

/**
 * @openapi
 * /availability:
 *   delete:
 *     tags: [Availability]
 *     summary: Clear the weekly availability (no day is bookable afterwards)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The 7 days, all with empty timeSlots
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Needs the ADMIN or BOOKING role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/", ...staff, controller.clearWeeklyAvailability);

export default router;
