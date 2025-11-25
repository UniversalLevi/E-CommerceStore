import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';
import mongoose from 'mongoose';

export interface AuditLogOptions {
  userId: mongoose.Types.ObjectId | string;
  action: string;
  storeId?: mongoose.Types.ObjectId | string;
  success: boolean;
  errorMessage?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: Record<string, any>;
  requestQuery?: Record<string, any>;
  responseData?: Record<string, any>;
}

/**
 * Centralized audit logging utility
 * Ensures all critical actions are logged with full context
 */
export async function logAudit(options: AuditLogOptions): Promise<void> {
  try {
    // Build comprehensive details object
    const fullDetails: Record<string, any> = {
      ...options.details,
      timestamp: new Date().toISOString(),
    };

    // Add request context if available
    if (options.requestBody) {
      // Sanitize sensitive fields from request body
      const sanitizedBody = sanitizeSensitiveData(options.requestBody);
      fullDetails.requestBody = sanitizedBody;
    }

    if (options.requestQuery) {
      fullDetails.requestQuery = options.requestQuery;
    }

    if (options.responseData) {
      // Sanitize sensitive fields from response data
      const sanitizedResponse = sanitizeSensitiveData(options.responseData);
      fullDetails.responseData = sanitizedResponse;
    }

    if (options.userAgent) {
      fullDetails.userAgent = options.userAgent;
    }

    // Create audit log entry
    await AuditLog.create({
      userId: options.userId,
      action: options.action,
      storeId: options.storeId,
      success: options.success,
      errorMessage: options.errorMessage,
      details: fullDetails,
      ipAddress: options.ipAddress,
      timestamp: new Date(),
    });

    console.log(`✅ Audit log created: ${options.action} - ${options.success ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    // Log error but don't fail the request
    console.error('❌ Failed to create audit log:', error);
    // In production, you might want to send this to an error tracking service
  }
}

/**
 * Helper to extract audit context from Express request
 */
export function getAuditContext(req: Request): {
  ipAddress?: string;
  userAgent?: string;
  requestBody?: Record<string, any>;
  requestQuery?: Record<string, any>;
} {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    requestBody: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
    requestQuery: req.query && Object.keys(req.query).length > 0 ? req.query as Record<string, any> : undefined,
  };
}

/**
 * Sanitize sensitive data from objects before logging
 */
function sanitizeSensitiveData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password',
    'accessToken',
    'apiKey',
    'apiSecret',
    'token',
    'secret',
    'authorization',
    'creditCard',
    'cvv',
    'ssn',
    'socialSecurityNumber',
  ];

  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive field name
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      // Sanitize array items if they're objects
      sanitized[key] = sanitized[key].map((item: any) => 
        typeof item === 'object' && item !== null ? sanitizeSensitiveData(item) : item
      );
    }
  }

  return sanitized;
}

/**
 * Convenience function to log audit with request context
 */
export async function logAuditWithRequest(
  req: Request,
  options: Omit<AuditLogOptions, 'ipAddress' | 'userAgent' | 'requestBody' | 'requestQuery'>
): Promise<void> {
  const context = getAuditContext(req);
  
  await logAudit({
    ...options,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestBody: context.requestBody,
    requestQuery: context.requestQuery,
  });
}

