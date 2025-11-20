import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 min default TTL

export const cacheMiddleware = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `${req.originalUrl}`;
    const cached = cache.get(key) as { data: any; timestamp: number; lastUpdatedAt: string } | undefined;
    
    if (cached) {
      // Add cache-busting headers
      res.setHeader('X-Cache-Timestamp', cached.timestamp.toString());
      res.setHeader('X-Cache-Hit', 'true');
      res.setHeader('X-Last-Updated-At', cached.lastUpdatedAt);
      return res.json(cached.data);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      const timestamp = Date.now();
      const cacheData = {
        data,
        timestamp,
        lastUpdatedAt: new Date().toISOString(),
      };
      cache.set(key, cacheData, ttl);
      
      // Add cache-busting headers
      res.setHeader('X-Cache-Timestamp', timestamp.toString());
      res.setHeader('X-Cache-Hit', 'false');
      res.setHeader('X-Last-Updated-At', cacheData.lastUpdatedAt);
      
      return originalJson(data);
    };
    
    next();
  };
};

// Clear cache helper
export const clearNicheCache = () => {
  const keys = cache.keys();
  let cleared = 0;
  keys.forEach((key) => {
    if (typeof key === 'string' && key.startsWith('/api/niches')) {
      cache.del(key);
      cleared++;
    }
  });
  return cleared;
};






