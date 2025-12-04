import { Router } from 'express';
import {
  getSmtpAccounts,
  createSmtpAccount,
  updateSmtpAccount,
  deleteSmtpAccount,
  testSmtpAccount,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  sendBulkEmails,
  getEmailLogs,
} from '../controllers/emailSenderController';

const router = Router();

// SMTP Account routes
router.get('/smtp-accounts', getSmtpAccounts);
router.post('/smtp-accounts', createSmtpAccount);
router.put('/smtp-accounts/:id', updateSmtpAccount);
router.delete('/smtp-accounts/:id', deleteSmtpAccount);
router.post('/smtp-accounts/:id/test', testSmtpAccount);

// Email Template routes
router.get('/templates', getEmailTemplates);
router.post('/templates', createEmailTemplate);
router.put('/templates/:id', updateEmailTemplate);
router.delete('/templates/:id', deleteEmailTemplate);

// Email sending
router.post('/send', sendBulkEmails);

// Email logs
router.get('/logs', getEmailLogs);

export default router;

