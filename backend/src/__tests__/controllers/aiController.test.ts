import { Request, Response, NextFunction } from 'express';
import { findWinningProduct, writeProductDescription } from '../../controllers/aiController';
import { AuthRequest } from '../../middleware/auth';
import { Product } from '../../models/Product';
import { User } from '../../models/User';
import { Niche } from '../../models/Niche';
import { ProductScoringService } from '../../services/ProductScoringService';
import { generateProductRationale, generateProductDescription } from '../../services/OpenAIService';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../models/Product');
jest.mock('../../models/User');
jest.mock('../../models/Niche');
jest.mock('../../services/ProductScoringService');
jest.mock('../../services/OpenAIService');

describe('AI Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        role: 'user',
      } as any,
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('findWinningProduct', () => {
    it('should require authentication', async () => {
      mockReq.user = undefined;

      await findWinningProduct(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should require onboarding niche', async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: mockReq.user!._id,
        onboarding: null,
      });

      await findWinningProduct(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('niche'),
        })
      );
    });

    it('should return product recommendation when niche is provided', async () => {
      const nicheId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const mockNiche = {
        _id: nicheId,
        name: 'Test Niche',
        active: true,
        deleted: false,
      };

      const mockProduct = {
        _id: productId,
        title: 'Test Product',
        description: 'Test description',
        price: 1000,
        images: ['image1.jpg'],
        niche: nicheId,
        active: true,
      };

      const mockScoringResult = {
        score: 85,
        confidence: 0.85,
        breakdown: {
          nicheRelevance: 1.0,
          beginnerFriendliness: 0.8,
          profitMargin: 0.5,
          quality: 0.7,
          popularity: 0.6,
        },
      };

      (User.findById as jest.Mock).mockResolvedValue({
        _id: mockReq.user!._id,
        onboarding: {
          nicheId,
          goal: 'dropship',
        },
      });

      (Niche.findById as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockNiche),
        }),
      });

      (Product.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockProduct]),
        }),
      });

      (ProductScoringService.scoreProduct as jest.Mock).mockReturnValue(mockScoringResult);
      (generateProductRationale as jest.Mock).mockResolvedValue([
        'Great niche fit',
        'Beginner-friendly price',
      ]);

      mockReq.body = { mode: 'single' };

      await findWinningProduct(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            productId: productId.toString(),
            score: 85,
            confidence: 0.85,
            rationale: expect.any(Array),
          }),
        })
      );
    });

    it('should handle Zod validation errors', async () => {
      mockReq.body = { mode: 'invalid' }; // Invalid enum value

      await findWinningProduct(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        })
      );
    });
  });

  describe('writeProductDescription', () => {
    it('should require authentication', async () => {
      mockReq.user = undefined;

      await writeProductDescription(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should require productId', async () => {
      mockReq.body = {};

      await writeProductDescription(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        })
      );
    });

    it('should return generated description', async () => {
      const productId = new mongoose.Types.ObjectId();
      const mockProduct = {
        _id: productId,
        title: 'Test Product',
        description: 'Existing description',
        price: 1000,
        images: ['image1.jpg'],
        active: true,
        niche: null,
      };

      const mockDescription = {
        title: 'AI Generated Title',
        shortDescription: 'Short desc',
        longDescription: 'Long desc',
        bullets: ['Benefit 1', 'Benefit 2'],
        seoMeta: {
          title: 'SEO Title',
          description: 'SEO Description',
        },
        fallback: false,
      };

      (Product.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct),
      });

      (generateProductDescription as jest.Mock).mockResolvedValue(mockDescription);

      mockReq.body = {
        productId: productId.toString(),
        tone: 'persuasive',
        length: 'short',
      };

      await writeProductDescription(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockDescription,
        })
      );
    });

    it('should reject inactive products', async () => {
      const productId = new mongoose.Types.ObjectId();
      const mockProduct = {
        _id: productId,
        active: false,
      };

      (Product.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct),
      });

      mockReq.body = {
        productId: productId.toString(),
        tone: 'persuasive',
        length: 'short',
      };

      await writeProductDescription(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('not active'),
        })
      );
    });
  });
});

