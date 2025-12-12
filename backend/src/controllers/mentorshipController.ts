import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MentorshipApplication } from '../models/MentorshipApplication';
import { AuditLog } from '../models/AuditLog';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { sendEmail } from '../utils/email';

/**
 * Create a new mentorship application (public endpoint)
 */
export const createMentorshipApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, email, incomeGoal, businessStage, whyMentorship } = req.body;

    // Validation
    if (!name || !name.trim()) {
      throw createError('Name is required', 400);
    }
    if (!phone || !phone.trim()) {
      throw createError('Phone is required', 400);
    }
    if (!email || !email.trim()) {
      throw createError('Email is required', 400);
    }
    if (!whyMentorship || !whyMentorship.trim()) {
      throw createError('Please explain why you want mentorship', 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError('Invalid email format', 400);
    }

    // Create the application
    const application = await MentorshipApplication.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      incomeGoal: incomeGoal?.trim() || undefined,
      businessStage: businessStage?.trim() || undefined,
      whyMentorship: whyMentorship.trim(),
      status: 'pending',
    });

    const applicationId = (application._id as any).toString();

    // Notify all admin users
    try {
      const admins = await User.find({ role: 'admin' }).select('_id').lean();
      const notifications = admins.map((admin) => ({
        userId: admin._id,
        type: 'mentorship_application' as const,
        title: 'New Mentorship Application',
        message: `${name} (${email}) submitted a mentorship application`,
        link: `/admin/mentorship/applications/${applicationId}`,
        metadata: {
          applicationId,
          applicantName: name,
          applicantEmail: email,
        },
        read: false,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      console.error('Failed to create admin notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        _id: applicationId,
        name: application.name,
        email: application.email,
        status: application.status,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get all mentorship applications (admin only)
 */
export const getMentorshipApplications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, limit } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    let applicationsQuery = MentorshipApplication.find(query)
      .sort({ createdAt: -1 });

    if (limit) {
      applicationsQuery = applicationsQuery.limit(parseInt(limit as string, 10));
    }

    const applications = await applicationsQuery.lean();

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get a single mentorship application (admin only)
 */
export const getMentorshipApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const application = await MentorshipApplication.findById(id).lean();

    if (!application) {
      throw createError('Application not found', 404);
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update mentorship application status (admin only)
 */
export const updateMentorshipApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const application = await MentorshipApplication.findById(id);

    if (!application) {
      throw createError('Application not found', 404);
    }

    const updateData: any = {};
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updatedApplication = await MentorshipApplication.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'UPDATE_MENTORSHIP_APPLICATION',
      success: true,
      details: {
        applicationId: id,
        applicantEmail: application.email,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      application: updatedApplication,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Send reply email to mentorship applicant (admin only)
 */
export const sendMentorshipReply = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage || replyMessage.trim().length === 0) {
      throw createError('Reply message is required', 400);
    }

    const application = await MentorshipApplication.findById(id);

    if (!application) {
      throw createError('Application not found', 404);
    }

    const adminUser = req.user as any;
    const adminEmail = adminUser.email;

    if (!adminEmail) {
      throw createError('Admin email not found', 400);
    }

    // Send email to applicant
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mentorship Application Reply</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Mentorship Application Reply</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
          <p>Hello ${application.name},</p>
          <p>Thank you for your interest in our mentorship program. We have reviewed your application and would like to respond:</p>
          <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
            ${replyMessage.replace(/\n/g, '<br>')}
          </div>
          <p>If you have any questions, please feel free to reply to this email.</p>
          <p>Best regards,<br>Mentorship Team</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} EAZY DROPSHIPPING. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const emailSent = await sendEmail({
      to: application.email,
      subject: 'Re: Your Mentorship Application',
      html: emailHtml,
    });

    if (!emailSent) {
      // Return 400 instead of 500 to prevent retries
      throw createError('Failed to send email. Please check email configuration.', 400);
    }

    // Update admin notes with reply information
    const replyNote = `Reply sent on ${new Date().toLocaleString()} by ${adminEmail}:\n${replyMessage}`;
    const existingNotes = application.adminNotes || '';
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n---\n${replyNote}`
      : replyNote;

    await MentorshipApplication.findByIdAndUpdate(
      id,
      { adminNotes: updatedNotes },
      { new: true }
    );

    // Create audit log
    await AuditLog.create({
      userId: adminUser._id,
      action: 'MENTORSHIP_REPLY_SENT',
      success: true,
      details: {
        applicationId: id,
        applicantEmail: application.email,
        adminEmail,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
    });
  } catch (error: any) {
    next(error);
  }
};
