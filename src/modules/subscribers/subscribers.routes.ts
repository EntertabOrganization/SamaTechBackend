import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as controller from "./subscribers.controller";

const router = Router();

/**
 * @openapi
 * /subscribers:
 *   post:
 *     tags: [Subscribers]
 *     summary: Subscribe to the newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Subscribed successfully
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Email already subscribed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", controller.createSubscriber);

/**
 * @openapi
 * /subscribers:
 *   get:
 *     tags: [Subscribers]
 *     summary: List subscribers
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, UNSUBSCRIBED] }
 *     responses:
 *       200:
 *         description: Paginated list of subscribers
 *       400:
 *         description: Invalid status filter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", authMiddleware, controller.listSubscribers);

/**
 * @openapi
 * /subscribers/{id}:
 *   get:
 *     tags: [Subscribers]
 *     summary: Get a subscriber by id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscriber found
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Subscriber not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", authMiddleware, controller.getSubscriber);

/**
 * @openapi
 * /subscribers/{id}:
 *   patch:
 *     tags: [Subscribers]
 *     summary: Update a subscriber
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
 *               name: { type: string }
 *               status: { type: string, enum: [ACTIVE, UNSUBSCRIBED] }
 *     responses:
 *       200:
 *         description: Subscriber updated
 *       400:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Subscriber not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id", authMiddleware, controller.updateSubscriber);

/**
 * @openapi
 * /subscribers/{id}:
 *   delete:
 *     tags: [Subscribers]
 *     summary: Delete a subscriber
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscriber deleted
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Subscriber not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/:id", authMiddleware, controller.deleteSubscriber);

export default router;
