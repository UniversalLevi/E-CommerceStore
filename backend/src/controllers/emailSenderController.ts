import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SmtpAccount } from '../models/SmtpAccount';
import { EmailTemplate } from '../models/EmailTemplate';
import { EmailLog } from '../models/EmailLog';
import { Customer } from '../models/Customer';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import nodemailer from 'nodemailer';

// Create transporter from SMTP account
function createTransporter(account: any) {
  const config: any = {
    host: account.smtpServer,
    port: account.smtpPort,
    secure: !account.useTls && account.smtpPort === 465, // SSL for port 465
    auth: {
      user: account.email,
      pass: account.password,
    },
  };

  if (account.useTls && account.smtpPort !== 465) {
    config.requireTLS = true;
  }

  return nodemailer.createTransport(config);
}

// SMTP Account Management
export const getSmtpAccounts = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const accounts = await SmtpAccount.find({ createdBy: req.user!._id })
      .select('-password')
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: accounts,
    });
  }
);

export const createSmtpAccount = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { name, smtpServer, smtpPort, useTls, email, password, isDefault } = req.body;

    if (!name || !smtpServer || !smtpPort || !email || !password) {
      throw createError('Missing required fields', 400);
    }

    const account = await SmtpAccount.create({
      name,
      smtpServer,
      smtpPort: parseInt(smtpPort, 10),
      useTls: useTls !== false,
      email,
      password,
      isDefault: isDefault === true,
      createdBy: req.user!._id,
    });

    const accountObj = account.toObject();
    delete (accountObj as any).password;

    res.status(201).json({
      success: true,
      data: accountObj,
    });
  }
);

export const updateSmtpAccount = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { name, smtpServer, smtpPort, useTls, email, password, isDefault, active } = req.body;

    const account = await SmtpAccount.findOne({
      _id: id,
      createdBy: req.user!._id,
    });

    if (!account) {
      throw createError('SMTP account not found', 404);
    }

    if (name) account.name = name;
    if (smtpServer) account.smtpServer = smtpServer;
    if (smtpPort) account.smtpPort = parseInt(smtpPort, 10);
    if (useTls !== undefined) account.useTls = useTls;
    if (email) account.email = email;
    if (password) account.password = password;
    if (isDefault !== undefined) account.isDefault = isDefault;
    if (active !== undefined) account.active = active;

    await account.save();

    const accountObj = account.toObject();
    delete (accountObj as any).password;

    res.json({
      success: true,
      data: accountObj,
    });
  }
);

export const deleteSmtpAccount = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const account = await SmtpAccount.findOneAndDelete({
      _id: id,
      createdBy: req.user!._id,
    });

    if (!account) {
      throw createError('SMTP account not found', 404);
    }

    res.json({
      success: true,
      message: 'SMTP account deleted successfully',
    });
  }
);

export const testSmtpAccount = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const account = await SmtpAccount.findOne({
      _id: id,
      createdBy: req.user!._id,
    });

    if (!account) {
      throw createError('SMTP account not found', 404);
    }

    try {
      const transporter = createTransporter(account);
      await transporter.verify();

      res.json({
        success: true,
        message: 'SMTP account connection successful',
      });
    } catch (error: any) {
      throw createError(`SMTP connection failed: ${error.message}`, 400);
    }
  }
);

// Email Template Management
export const getEmailTemplates = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const templates = await EmailTemplate.find({ createdBy: req.user!._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: templates,
    });
  }
);

export const createEmailTemplate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { name, subject, htmlContent, plainTextContent, isDefault } = req.body;

    if (!name || !subject || !htmlContent) {
      throw createError('Missing required fields: name, subject, htmlContent', 400);
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      htmlContent,
      plainTextContent,
      isDefault: isDefault === true,
      createdBy: req.user!._id,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  }
);

export const updateEmailTemplate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { name, subject, htmlContent, plainTextContent, isDefault } = req.body;

    const template = await EmailTemplate.findOne({
      _id: id,
      createdBy: req.user!._id,
    });

    if (!template) {
      throw createError('Email template not found', 404);
    }

    if (name) template.name = name;
    if (subject) template.subject = subject;
    if (htmlContent) template.htmlContent = htmlContent;
    if (plainTextContent !== undefined) template.plainTextContent = plainTextContent;
    if (isDefault !== undefined) template.isDefault = isDefault;

    await template.save();

    res.json({
      success: true,
      data: template,
    });
  }
);

export const deleteEmailTemplate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const template = await EmailTemplate.findOneAndDelete({
      _id: id,
      createdBy: req.user!._id,
    });

    if (!template) {
      throw createError('Email template not found', 404);
    }

    res.json({
      success: true,
      message: 'Email template deleted successfully',
    });
  }
);

// Email Sending
export const sendBulkEmails = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { recipients, subject, htmlContent, plainTextContent, smtpAccountId, templateId } =
      req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw createError('Recipients list is required and must not be empty', 400);
    }

    if (!subject && !templateId) {
      throw createError('Subject or template ID is required', 400);
    }

    // Get SMTP account
    let account;
    if (smtpAccountId) {
      account = await SmtpAccount.findOne({
        _id: smtpAccountId,
        createdBy: req.user!._id,
        active: true,
      });
    } else {
      account = await SmtpAccount.findOne({
        createdBy: req.user!._id,
        isDefault: true,
        active: true,
      });
    }

    if (!account) {
      throw createError('No active SMTP account found', 404);
    }

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await EmailTemplate.findOne({
        _id: templateId,
        createdBy: req.user!._id,
      });
    } else {
      template = await EmailTemplate.findOne({
        createdBy: req.user!._id,
        isDefault: true,
      });
    }

    const finalSubject = subject || template?.subject || 'No Subject';
    const finalHtmlContent = htmlContent || template?.htmlContent || '';
    const finalPlainTextContent = plainTextContent || template?.plainTextContent || '';

    if (!finalHtmlContent) {
      throw createError('HTML content is required', 400);
    }

    // Create transporter
    const transporter = createTransporter(account);

    // Send emails
    const results = {
      sent: 0,
      failed: 0,
      total: recipients.length,
      errors: [] as Array<{ email: string; error: string }>,
    };

    for (const recipient of recipients) {
      const email = recipient.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        results.failed++;
        results.errors.push({ email, error: 'Invalid email address' });
        continue;
      }

      try {
        const mailOptions = {
          from: `"${account.name}" <${account.email}>`,
          to: email,
          subject: finalSubject,
          html: finalHtmlContent,
          text: finalPlainTextContent || finalHtmlContent.replace(/<[^>]*>/g, ''),
        };

        await transporter.sendMail(mailOptions);

        // Log success
        await EmailLog.create({
          recipient: email,
          subject: finalSubject,
          smtpAccountId: account._id,
          templateId: template?._id,
          status: 'sent',
          sentAt: new Date(),
          sentBy: req.user!._id,
        });

        results.sent++;
      } catch (error: any) {
        // Log failure
        await EmailLog.create({
          recipient: email,
          subject: finalSubject,
          smtpAccountId: account._id,
          templateId: template?._id,
          status: 'failed',
          errorMessage: error.message,
          sentBy: req.user!._id,
        });

        results.failed++;
        results.errors.push({ email, error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
    });
  }
);

// Email Logs
export const getEmailLogs = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { page = 1, limit = 50, status, recipient } = req.query;

    const filter: any = { sentBy: req.user!._id };
    if (status) filter.status = status;
    if (recipient) filter.recipient = { $regex: recipient, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .populate('smtpAccountId', 'name email')
        .populate('templateId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      EmailLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }
);

// Send emails to customers
export const sendEmailsToCustomers = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { storeIds, subject, htmlContent, plainTextContent, smtpAccountId, templateId, acceptsMarketingOnly } =
      req.body;

    if (!subject && !templateId) {
      throw createError('Subject or template ID is required', 400);
    }

    // Build customer query
    const customerQuery: any = {};
    
    if (req.user!.role === 'admin') {
      // Admin can send to all customers or filter by stores
      if (storeIds && Array.isArray(storeIds) && storeIds.length > 0) {
        customerQuery.storeConnectionId = { $in: storeIds };
      }
    } else {
      // Regular users can only send to their own customers
      customerQuery.owner = req.user!._id;
      if (storeIds && Array.isArray(storeIds) && storeIds.length > 0) {
        customerQuery.storeConnectionId = { $in: storeIds };
      }
    }

    // Filter by acceptsMarketing if requested
    if (acceptsMarketingOnly === true) {
      customerQuery.acceptsMarketing = true;
    }

    // Only get customers with email addresses
    customerQuery.email = { $exists: true, $nin: [null, ''] };

    // Get SMTP account
    let account;
    if (smtpAccountId) {
      account = await SmtpAccount.findOne({
        _id: smtpAccountId,
        createdBy: req.user!._id,
        active: true,
      });
    } else {
      account = await SmtpAccount.findOne({
        createdBy: req.user!._id,
        isDefault: true,
        active: true,
      });
    }

    if (!account) {
      throw createError('No active SMTP account found', 404);
    }

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await EmailTemplate.findOne({
        _id: templateId,
        createdBy: req.user!._id,
      });
    } else {
      template = await EmailTemplate.findOne({
        createdBy: req.user!._id,
        isDefault: true,
      });
    }

    const finalSubject = subject || template?.subject || 'No Subject';
    const finalHtmlContent = htmlContent || template?.htmlContent || '';
    const finalPlainTextContent = plainTextContent || template?.plainTextContent || '';

    if (!finalHtmlContent) {
      throw createError('HTML content is required', 400);
    }

    // Get all customers matching the query
    const customers = await Customer.find(customerQuery).select('email').lean();

    if (customers.length === 0) {
      throw createError('No customers found matching the criteria', 404);
    }

    // Extract unique email addresses
    const recipients = [...new Set(customers.map((c) => c.email).filter(Boolean))];

    // Create transporter
    const transporter = createTransporter(account);

    // Send emails
    const results = {
      sent: 0,
      failed: 0,
      total: recipients.length,
      errors: [] as Array<{ email: string; error: string }>,
    };

    for (const email of recipients) {
      if (!email || !email.includes('@')) {
        results.failed++;
        results.errors.push({ email: email || 'unknown', error: 'Invalid email address' });
        continue;
      }

      try {
        const mailOptions = {
          from: `"${account.name}" <${account.email}>`,
          to: email,
          subject: finalSubject,
          html: finalHtmlContent,
          text: finalPlainTextContent || finalHtmlContent.replace(/<[^>]*>/g, ''),
        };

        await transporter.sendMail(mailOptions);

        // Log success
        await EmailLog.create({
          recipient: email,
          subject: finalSubject,
          smtpAccountId: account._id,
          templateId: template?._id,
          status: 'sent',
          sentAt: new Date(),
          sentBy: req.user!._id,
        });

        results.sent++;
      } catch (error: any) {
        // Log failure
        await EmailLog.create({
          recipient: email,
          subject: finalSubject,
          smtpAccountId: account._id,
          templateId: template?._id,
          status: 'failed',
          errorMessage: error.message,
          sentBy: req.user!._id,
        });

        results.failed++;
        results.errors.push({ email, error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
    });
  }
);

