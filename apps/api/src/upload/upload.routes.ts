import { Router } from 'express';
import { uploadImage } from './upload.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// POST /api/upload
// Security Chain:
// 1. requireAuth: Ensures user is logged in (valid JWT)
// 2. requireRole('ADMIN'): Ensures only Admins can upload
// 3. uploadMiddleware.single('file'): Processes the file (limit 5MB, image only)
/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload an image file (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  uploadMiddleware.single('file'),
  uploadImage
);

export default router;