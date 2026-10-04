import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as controller from "./contact.controller";

const router = Router();

/**
 * @openapi
 * /contact:
 *   post:
 *     tags: [Contact]
 *     summary: Submit a contact-us message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               service: { type: string }
 *               program: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Message submitted
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", controller.createContactMessage);

/**
 * @openapi
 * /contact:
 *   get:
 *     tags: [Contact]
 *     summary: List contact messages
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
 *         schema: { type: string, enum: [NEW, READ, RESPONDED] }
 *     responses:
 *       200:
 *         description: Paginated list of contact messages
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
router.get("/", authMiddleware, controller.listContactMessages);

/**
 * @openapi
 * /contact/{id}:
 *   get:
 *     tags: [Contact]
 *     summary: Get a contact message by id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message found
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", authMiddleware, controller.getContactMessage);

/**
 * @openapi
 * /contact/{id}:
 *   patch:
 *     tags: [Contact]
 *     summary: Update a contact message's status
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
 *               status: { type: string, enum: [NEW, READ, RESPONDED] }
 *     responses:
 *       200:
 *         description: Message updated
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
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id", authMiddleware, controller.updateContactMessage);

/**
 * @openapi
 * /contact/{id}:
 *   delete:
 *     tags: [Contact]
 *     summary: Delete a contact message
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message deleted
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/:id", authMiddleware, controller.deleteContactMessage);

export default router;
