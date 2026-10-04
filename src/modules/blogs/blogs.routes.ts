import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as controller from "./blogs.controller";

const router = Router();

/**
 * @openapi
 * /blogs/public:
 *   get:
 *     tags: [Blogs]
 *     summary: List published blogs/news (public, unauthenticated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [BLOG, NEWS] }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of published blogs
 *       400:
 *         description: Invalid filter value
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/public", controller.listPublicBlogs);

/**
 * @openapi
 * /blogs/public/{slug}:
 *   get:
 *     tags: [Blogs]
 *     summary: Get a published blog by slug (public, unauthenticated)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog found
 *       404:
 *         description: Blog not found (or not published)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/public/:slug", controller.getPublicBlogBySlug);

router.use(authMiddleware);

/**
 * @openapi
 * /blogs:
 *   post:
 *     tags: [Blogs]
 *     summary: Create a blog/news post
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug, excerpt, content, type, categoryId]
 *             properties:
 *               title: { type: string }
 *               slug: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               coverImage: { type: string }
 *               type: { type: string, enum: [BLOG, NEWS] }
 *               status: { type: string, enum: [DRAFT, PUBLISHED] }
 *               tags: { type: array, items: { type: string } }
 *               categoryId: { type: string }
 *               authorName: { type: string }
 *               publishedAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Blog created
 *       400:
 *         description: Missing/invalid fields or categoryId not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Slug already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", controller.createBlog);

/**
 * @openapi
 * /blogs:
 *   get:
 *     tags: [Blogs]
 *     summary: List blogs/news
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
 *         name: type
 *         schema: { type: string, enum: [BLOG, NEWS] }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, PUBLISHED] }
 *     responses:
 *       200:
 *         description: Paginated list of blogs
 *       400:
 *         description: Invalid filter value
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", controller.listBlogs);

/**
 * @openapi
 * /blogs/{id}:
 *   get:
 *     tags: [Blogs]
 *     summary: Get a blog by id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog found
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Blog not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", controller.getBlog);

/**
 * @openapi
 * /blogs/{id}:
 *   patch:
 *     tags: [Blogs]
 *     summary: Update a blog
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
 *               title: { type: string }
 *               slug: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               coverImage: { type: string }
 *               type: { type: string, enum: [BLOG, NEWS] }
 *               status: { type: string, enum: [DRAFT, PUBLISHED] }
 *               tags: { type: array, items: { type: string } }
 *               categoryId: { type: string }
 *               authorName: { type: string }
 *               publishedAt: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Blog updated
 *       400:
 *         description: Invalid fields or categoryId not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Blog not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Slug already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id", controller.updateBlog);

/**
 * @openapi
 * /blogs/{id}:
 *   delete:
 *     tags: [Blogs]
 *     summary: Delete a blog
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog deleted
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Blog not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/:id", controller.deleteBlog);

export default router;
