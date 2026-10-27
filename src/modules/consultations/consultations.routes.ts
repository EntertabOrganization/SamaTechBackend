import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { publicFormRateLimit } from "../../middleware/rateLimit.middleware";
import { requireRole } from "../../middleware/role.middleware";
import * as controller from "./consultations.controller";

const router = Router();
const staff = [authMiddleware, requireRole("BOOKING")];

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
 *             required: [name, email, date, time]
 *             properties:
 *               name: { type: string, maxLength: 200 }
 *               company: { type: string, maxLength: 200 }
 *               email: { type: string, format: email }
 *               phone: { type: string, maxLength: 50 }
 *               service: { type: string, maxLength: 200 }
 *               notes: { type: string, maxLength: 5000 }
 *               date: { type: string, format: date, example: "2026-11-01" }
 *               time:
 *                 type: string
 *                 example: "10:00"
 *                 description: One of the day's slots from GET /availability, in CONSULTATION_TIME_ZONE (default Asia/Riyadh)
 *     responses:
 *       201:
 *         description: Consultation booked
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Slot not offered, already passed, or already booked
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         description: Too many submissions from this client
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", publicFormRateLimit, controller.createConsultation);

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
 *       403:
 *         description: Needs the ADMIN or BOOKING role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", ...staff, controller.listConsultations);

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
 *       403:
 *         description: Needs the ADMIN or BOOKING role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Consultation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", ...staff, controller.getConsultation);

/**
 * @openapi
 * /consultations/{id}:
 *   patch:
 *     tags: [Consultations]
 *     summary: Edit a consultation
 *     description: Updates only the fields sent. A new date or time must not clash with another pending or confirmed booking.
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
 *               name: { type: string, maxLength: 200 }
 *               company: { type: string, maxLength: 200 }
 *               email: { type: string, format: email }
 *               phone: { type: string, maxLength: 50 }
 *               service: { type: string, maxLength: 200 }
 *               notes: { type: string, maxLength: 5000 }
 *               date: { type: string, format: date, example: "2026-11-01" }
 *               time: { type: string, example: "10:00" }
 *               meetLink: { type: string, format: uri }
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
 *       403:
 *         description: Needs the ADMIN or BOOKING role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Consultation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id", ...staff, controller.updateConsultation);

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
 *       403:
 *         description: Needs the ADMIN or BOOKING role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Consultation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/:id", ...staff, controller.deleteConsultation);

export default router;
