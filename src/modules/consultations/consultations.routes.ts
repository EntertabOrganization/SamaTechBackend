import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as controller from "./consultations.controller";

const router = Router();

/**
 * @openapi
 * /consultations:
 *   post:
 *     tags: [Consultations]
 *     summary: Book a consultation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, date, time]
 *             properties:
 *               name: { type: string }
 *               company: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               service: { type: string }
 *               notes: { type: string }
 *               date: { type: string, format: date }
 *               time: { type: string }
 *     responses:
 *       201:
 *         description: Consultation booked
 *       400:
 *         description: Missing required fields or invalid date
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", controller.createConsultation);

/**
 * @openapi
 * /consultations/booked:
 *   get:
 *     tags: [Consultations]
 *     summary: List time slots already booked on a given date (public)
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Array of booked time strings
 *       400:
 *         description: Missing or invalid date
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/booked", controller.getBookedTimes);

/**
 * @openapi
 * /consultations:
 *   get:
 *     tags: [Consultations]
 *     summary: List consultation bookings
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
 *         schema: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED] }
 *     responses:
 *       200:
 *         description: Paginated list of consultations
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
router.get("/", authMiddleware, controller.listConsultations);

/**
 * @openapi
 * /consultations/{id}:
 *   get:
 *     tags: [Consultations]
 *     summary: Get a consultation by id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Consultation found
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Consultation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", authMiddleware, controller.getConsultation);

/**
 * @openapi
 * /consultations/{id}:
 *   patch:
 *     tags: [Consultations]
 *     summary: Update a consultation's status
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
 *               status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED] }
 *     responses:
 *       200:
 *         description: Consultation updated
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
 *         description: Consultation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id", authMiddleware, controller.updateConsultation);

/**
 * @openapi
 * /consultations/{id}:
 *   delete:
 *     tags: [Consultations]
 *     summary: Delete a consultation
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Consultation deleted
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Consultation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/:id", authMiddleware, controller.deleteConsultation);

export default router;
