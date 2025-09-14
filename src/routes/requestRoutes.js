import express from 'express';
import { approveSyncRequest, getSyncRequests } from '../controllers/requestController.js';
import { apiKeyAuth, generalAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route POST /api/requests/requestAction
 * @desc Approve or reject a sync request
 * @access Private
 */
router.post('/requestAction', apiKeyAuth, approveSyncRequest);

/**
 * @route GET /api/requests/getSyncRequests
 * @desc Get all sync requests with optional filtering
 * @access Private
 */
router.get('/getSyncRequests', apiKeyAuth, getSyncRequests);

export default router;
