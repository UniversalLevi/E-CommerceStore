import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  verifyWebhook,
  handleWebhook,
} from '../controllers/whatsappWebhookController';
import {
  listDrafts,
  getDraft,
  updateDraft,
  approveDraft,
  deleteDraft,
  getDraftStats,
  bulkApproveDrafts,
} from '../controllers/whatsappDraftController';

const router = Router();

// ======================
// Public Webhook Routes (no auth - called by Meta)
// ======================

// GET - Webhook verification (Meta sends challenge)
router.get('/webhook', verifyWebhook);

// POST - Incoming messages from WhatsApp
router.post('/webhook', handleWebhook);

// ======================
// Admin Routes (require authentication)
// ======================

// Stats endpoint (before :id to avoid conflict)
router.get('/drafts/stats', authenticateToken, requireAdmin, getDraftStats);

// Bulk approve
router.post('/drafts/bulk-approve', authenticateToken, requireAdmin, bulkApproveDrafts);

// List all drafts
router.get('/drafts', authenticateToken, requireAdmin, listDrafts);

// Get single draft
router.get('/drafts/:id', authenticateToken, requireAdmin, getDraft);

// Update draft
router.put('/drafts/:id', authenticateToken, requireAdmin, updateDraft);

// Approve draft (create Product)
router.post('/drafts/:id/approve', authenticateToken, requireAdmin, approveDraft);

// Delete/reject draft
router.delete('/drafts/:id', authenticateToken, requireAdmin, deleteDraft);

export default router;

