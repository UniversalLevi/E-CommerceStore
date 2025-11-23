import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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

    // Log the contact submission
    logger.info('Contact form submission', {
      name,
      email,
      subject,
      message: message.substring(0, 100), // Log first 100 chars
    });

    // Send email notification
    const { sendContactFormEmail } = await import('../utils/email');
    await sendContactFormEmail(name, email, subject, message);

    res.status(200).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
    });
  } catch (error) {
    next(error);
  }
};

