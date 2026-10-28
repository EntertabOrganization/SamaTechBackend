import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/role.middleware";
import * as controller from "./users.controller";

const router = Router();
router.use(authMiddleware, requireAdmin);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [User]
 *     summary: Create a new dashboard user
 *     description: Grants another person login access to the dashboard with one role — ADMIN (everything), MESSAGES (contact messages) or BOOKING (consultations and availability). Admins only.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *               name: { type: string }
 *               role: { type: string, enum: [ADMIN, MESSAGES, BOOKING] }
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
 *       403:
 *         description: Not an admin
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

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [User]
 *     summary: Edit a dashboard user
 *     description: Updates only the fields sent. Leave password out (or empty) to keep it. Admins can't remove their own admin role, and at least one admin always remains.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *               name: { type: string }
 *               role: { type: string, enum: [ADMIN, MESSAGES, BOOKING] }
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid fields, or the change would leave no admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not an admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: A user with this email already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id", controller.updateUser);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [User]
 *     summary: Delete a dashboard user
 *     description: Admins can't delete their own account or the last admin.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Own account or last admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not an admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/:id", controller.deleteUser);

export default router;
