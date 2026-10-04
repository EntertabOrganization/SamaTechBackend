import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";
import * as controller from "./careers.controller";

const router = Router();

const uploadFields = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "coverLetter", maxCount: 1 },
]);

/**
 * @openapi
 * /careers:
 *   post:
 *     tags: [Careers]
 *     summary: Submit a career application
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, address, city, country, expectedSalary, position, startDate, resume, coverLetter]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               country: { type: string }
 *               expectedSalary: { type: string }
 *               position: { type: string }
 *               startDate: { type: string, format: date }
 *               resume: { type: string, format: binary }
 *               coverLetter: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Application submitted
 *       400:
 *         description: Missing required fields or files
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", uploadFields, controller.createCareerApplication);

/**
 * @openapi
 * /careers:
 *   get:
 *     tags: [Careers]
 *     summary: List career applications
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
 *         schema: { type: string, enum: [PENDING, REVIEWED, REJECTED, HIRED] }
 *     responses:
 *       200:
 *         description: Paginated list of applications
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
router.get("/", authMiddleware, controller.listCareerApplications);

/**
 * @openapi
 * /careers/{id}:
 *   get:
 *     tags: [Careers]
 *     summary: Get a career application by id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Application found
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", authMiddleware, controller.getCareerApplication);

/**
 * @openapi
 * /careers/{id}:
 *   patch:
 *     tags: [Careers]
 *     summary: Update a career application's status
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
 *               status: { type: string, enum: [PENDING, REVIEWED, REJECTED, HIRED] }
 *     responses:
 *       200:
 *         description: Application updated
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
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id", authMiddleware, controller.updateCareerApplication);

/**
 * @openapi
 * /careers/{id}:
 *   delete:
 *     tags: [Careers]
 *     summary: Delete a career application
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Application deleted
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/:id", authMiddleware, controller.deleteCareerApplication);

export default router;
