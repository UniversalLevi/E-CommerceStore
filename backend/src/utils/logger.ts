const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'apiKey',
  'apiSecret',
  'auth_token',
  'authorization',
];

export function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(`[INFO] ${msg}`, meta ? sanitize(meta) : '');
  },
  error: (msg: string, meta?: any) => {
    console.error(`[ERROR] ${msg}`, meta ? sanitize(meta) : '');
  },
  warn: (msg: string, meta?: any) => {
    console.warn(`[WARN] ${msg}`, meta ? sanitize(meta) : '');
  },
  debug: (msg: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${msg}`, meta ? sanitize(meta) : '');
    }
  },
};

