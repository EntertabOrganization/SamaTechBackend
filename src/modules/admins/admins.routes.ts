import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as controller from "./admins.controller";

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /admins:
 *   post:
 *     tags: [Admins]
 *     summary: Create a new dashboard admin user
 *     description: Grants another user login access to the admin dashboard. Requires an existing authenticated admin.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Admin created
 *       400:
 *         description: Missing required fields or password too short
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: An admin with this email already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", controller.createAdmin);

/**
 * @openapi
 * /admins:
 *   get:
 *     tags: [Admins]
 *     summary: List dashboard admin users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of admins
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", controller.listAdmins);

export default router;
