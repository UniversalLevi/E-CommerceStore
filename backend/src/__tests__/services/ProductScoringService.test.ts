import { ProductScoringService, UserPreferences } from '../../services/ProductScoringService';
import { IProduct } from '../../models/Product';
import { INiche } from '../../models/Niche';
import mongoose from 'mongoose';

describe('ProductScoringService', () => {
  const mockNiche: INiche = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Kitchen Gadgets',
    slug: 'kitchen-gadgets',
    synonyms: ['kitchen', 'cooking', 'gadgets'],
    active: true,
    featured: false,
    showOnHomePage: true,
    order: 1,
    priority: 1,
    isDefault: false,
    deleted: false,
    defaultSortMode: 'newest',
    activeProductCount: 10,
    totalProductCount: 10,
  } as INiche;

  const mockUserPref: UserPreferences = {
    nicheId: mockNiche._id as mongoose.Types.ObjectId,
    goal: 'dropship',
  };

  describe('scoreProduct', () => {
    it('should return a score between 0 and 100', () => {
      const product: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Product',
        description: 'A great product for beginners',
        price: 1000,
        niche: mockNiche._id,
        images: ['image1.jpg', 'image2.jpg'],
        active: true,
        analytics: {
          views: 50,
          imports: 10,
          conversions: 2,
        },
      } as IProduct;

      const result = ProductScoringService.scoreProduct(product, mockUserPref, mockNiche);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should give high score for exact niche match', () => {
      const product: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Kitchen Product',
        description: 'Perfect kitchen gadget',
        price: 1500,
        niche: mockNiche._id,
        images: ['image1.jpg', 'image2.jpg'],
        active: true,
        costPrice: 750,
        tags: ['kitchen', 'cooking'],
        analytics: {
          views: 100,
          imports: 20,
          conversions: 5,
        },
      } as IProduct;

      const result = ProductScoringService.scoreProduct(product, mockUserPref, mockNiche);

      expect(result.score).toBeGreaterThan(70); // High score for good match
      expect(result.breakdown.nicheRelevance).toBe(1.0); // Exact match
    });

    it('should normalize profit margin to 0-1 range', () => {
      const product: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Product',
        description: 'Test description',
        price: 1000,
        costPrice: 500, // 50% margin
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
      } as IProduct;

      const result = ProductScoringService.scoreProduct(product, mockUserPref, mockNiche);

      expect(result.breakdown.profitMargin).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.profitMargin).toBeLessThanOrEqual(1);
      expect(result.breakdown.profitMargin).toBeCloseTo(0.5, 1);
    });

    it('should use estimated margin when costPrice is missing', () => {
      const product: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Product',
        description: 'Test description',
        price: 1000,
        // costPrice missing
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
      } as IProduct;

      const result = ProductScoringService.scoreProduct(product, mockUserPref, mockNiche);

      // Should use 45% estimated margin
      expect(result.breakdown.profitMargin).toBeCloseTo(0.45, 1);
    });

    it('should apply penalty for missing images', () => {
      const productWithImages: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Product With Images',
        description: 'Has images',
        price: 1000,
        niche: mockNiche._id,
        images: ['image1.jpg', 'image2.jpg'],
        active: true,
      } as IProduct;

      const productWithoutImages = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Product Without Images',
        description: 'No images',
        price: 1000,
        niche: mockNiche._id,
        images: [],
        active: true,
      } as unknown as IProduct;

      const resultWith = ProductScoringService.scoreProduct(productWithImages, mockUserPref, mockNiche);
      const resultWithout = ProductScoringService.scoreProduct(productWithoutImages, mockUserPref, mockNiche);

      expect(resultWith.score).toBeGreaterThan(resultWithout.score);
    });

    it('should apply penalty for very short description', () => {
      const productShortDesc: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Product',
        description: 'Short', // Less than 10 chars
        price: 1000,
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
      } as IProduct;

      const productLongDesc: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Product',
        description: 'This is a much longer description that provides more details about the product',
        price: 1000,
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
      } as IProduct;

      const resultShort = ProductScoringService.scoreProduct(productShortDesc, mockUserPref, mockNiche);
      const resultLong = ProductScoringService.scoreProduct(productLongDesc, mockUserPref, mockNiche);

      expect(resultLong.score).toBeGreaterThan(resultShort.score);
    });

    it('should reduce beginner score for very low-priced products', () => {
      const lowPriceProduct: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Cheap Product',
        description: 'Very cheap product',
        price: 50, // Below ₹99 threshold
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
      } as IProduct;

      const normalPriceProduct: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Normal Product',
        description: 'Normal priced product',
        price: 500, // Within beginner range
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
      } as IProduct;

      const resultLow = ProductScoringService.scoreProduct(lowPriceProduct, mockUserPref, mockNiche);
      const resultNormal = ProductScoringService.scoreProduct(normalPriceProduct, mockUserPref, mockNiche);

      expect(resultNormal.breakdown.beginnerFriendliness).toBeGreaterThan(
        resultLow.breakdown.beginnerFriendliness
      );
    });

    it('should calculate popularity from analytics', () => {
      const popularProduct: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Popular Product',
        description: 'Very popular',
        price: 1000,
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
        analytics: {
          views: 1000,
          imports: 100,
          conversions: 20,
        },
      } as IProduct;

      const unpopularProduct: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Unpopular Product',
        description: 'Not popular',
        price: 1000,
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
        analytics: {
          views: 0,
          imports: 0,
          conversions: 0,
        },
      } as IProduct;

      const resultPopular = ProductScoringService.scoreProduct(popularProduct, mockUserPref, mockNiche);
      const resultUnpopular = ProductScoringService.scoreProduct(unpopularProduct, mockUserPref, mockNiche);

      expect(resultPopular.breakdown.popularity).toBeGreaterThan(resultUnpopular.breakdown.popularity);
    });

    it('should return low niche relevance for non-matching niche', () => {
      const differentNicheId = new mongoose.Types.ObjectId();
      const product: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Different Niche Product',
        description: 'From different niche',
        price: 1000,
        niche: differentNicheId,
        images: ['image1.jpg'],
        active: true,
      } as IProduct;

      const result = ProductScoringService.scoreProduct(product, mockUserPref, mockNiche);

      expect(result.breakdown.nicheRelevance).toBeLessThan(0.2); // Low relevance
    });

    it('should increase confidence with more data', () => {
      const productWithData: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Product With Data',
        description: 'Has all data',
        price: 1000,
        costPrice: 500,
        niche: mockNiche._id,
        images: ['image1.jpg', 'image2.jpg'],
        tags: ['tag1', 'tag2'],
        supplierLink: 'https://supplier.com',
        analytics: {
          views: 100,
          imports: 20,
        },
        active: true,
      } as IProduct;

      const productWithoutData: IProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Product Without Data',
        description: 'Missing data',
        price: 1000,
        niche: mockNiche._id,
        images: ['image1.jpg'],
        active: true,
      } as IProduct;

      const resultWith = ProductScoringService.scoreProduct(productWithData, mockUserPref, mockNiche);
      const resultWithout = ProductScoringService.scoreProduct(productWithoutData, mockUserPref, mockNiche);

      expect(resultWith.confidence).toBeGreaterThan(resultWithout.confidence);
    });
  });
});

