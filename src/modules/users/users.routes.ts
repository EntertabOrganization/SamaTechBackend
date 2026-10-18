import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as controller from "./users.controller";

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [User]
 *     summary: Create a new dashboard user
 *     description: Grants another user login access to the dashboard. Requires an existing authenticated user.
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
 *         description: User created
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
 *         description: A user with this email already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", controller.createUser);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [User]
 *     summary: List dashboard users
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
 *         description: List of users
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", controller.listUsers);

export default router;
