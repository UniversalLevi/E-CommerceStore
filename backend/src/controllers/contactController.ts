import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Contact } from '../models/Contact';
import { User } from '../models/User';

export const submitContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      throw createError('All fields are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError('Invalid email format', 400);
    }

    // Try to find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('_id').lean();
    const userId = user?._id;

    // Save contact submission to database
    const contact = await Contact.create({
      name,
      email: email.toLowerCase(),
      subject,
      message,
      status: 'pending',
      userId: userId || undefined,
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    // Log the contact submission
    logger.info('Contact form submission', {
      contactId: contact._id,
      name,
      email,
      subject,
      message: message.substring(0, 100), // Log first 100 chars
    });

    // Send email notification (optional - keep existing functionality)
    try {
      const { sendContactFormEmail } = await import('../utils/email');
      await sendContactFormEmail(name, email, subject, message);
    } catch (emailError) {
      // Don't fail if email fails
      logger.error('Failed to send contact email notification', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
    });
  } catch (error) {
    next(error);
  }
};

