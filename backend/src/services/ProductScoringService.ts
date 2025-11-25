import { IProduct } from '../models/Product';
import { INiche } from '../models/Niche';
import mongoose from 'mongoose';

export interface UserPreferences {
  nicheId?: mongoose.Types.ObjectId;
  goal?: 'dropship' | 'brand' | 'start_small';
}

export interface ScoringResult {
  score: number; // 0-100
  confidence: number; // 0-1
  breakdown: {
    nicheRelevance: number;
    beginnerFriendliness: number;
    profitMargin: number;
    quality: number;
    popularity: number;
  };
}

/**
 * Product Scoring Service
 * Implements weighted scoring algorithm for product recommendations
 */
export class ProductScoringService {
  // Weight configuration
  private static readonly WEIGHTS = {
    NICHE_RELEVANCE: 0.40,
    BEGINNER_FRIENDLINESS: 0.20,
    PROFIT_MARGIN: 0.15,
    QUALITY: 0.15,
    POPULARITY: 0.10,
  };

  // Beginner-friendly price range (INR)
  private static readonly BEGINNER_PRICE_MIN = 10;
  private static readonly BEGINNER_PRICE_MAX = 3000;
  private static readonly LOW_PRICE_THRESHOLD = 99; // Products below this get reduced score

  /**
   * Score a product based on user preferences
   */
  static scoreProduct(
    product: IProduct,
    userPref: UserPreferences,
    niche?: INiche | null
  ): ScoringResult {
    let score = 0;
    const breakdown = {
      nicheRelevance: 0,
      beginnerFriendliness: 0,
      profitMargin: 0,
      quality: 0,
      popularity: 0,
    };

    // 1. Niche Relevance (40%)
    breakdown.nicheRelevance = this.calculateNicheRelevance(product, userPref, niche);
    score += breakdown.nicheRelevance * this.WEIGHTS.NICHE_RELEVANCE;

    // 2. Beginner-Friendliness (20%)
    breakdown.beginnerFriendliness = this.calculateBeginnerFriendliness(product);
    score += breakdown.beginnerFriendliness * this.WEIGHTS.BEGINNER_FRIENDLINESS;

    // 3. Profit Margin (15%)
    breakdown.profitMargin = this.calculateProfitMargin(product);
    score += breakdown.profitMargin * this.WEIGHTS.PROFIT_MARGIN;

    // 4. Quality Score (15%)
    breakdown.quality = this.calculateQuality(product);
    score += breakdown.quality * this.WEIGHTS.QUALITY;

    // 5. Popularity (10%)
    breakdown.popularity = this.calculatePopularity(product);
    score += breakdown.popularity * this.WEIGHTS.POPULARITY;

    // Apply penalties for missing critical data
    if (!product.images || product.images.length === 0) {
      score -= 15;
    }
    if (!product.description || product.description.length < 10) {
      score -= 10;
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Calculate confidence (based on data completeness)
    const confidence = this.calculateConfidence(product, breakdown);

    return {
      score: Math.round(score),
      confidence,
      breakdown,
    };
  }

  /**
   * Calculate niche relevance score (0-1)
   */
  private static calculateNicheRelevance(
    product: IProduct,
    userPref: UserPreferences,
    niche?: INiche | null
  ): number {
    if (!userPref.nicheId || !product.niche) {
      return 0.1; // Default low score if no niche preference
    }

    // Exact match
    if (product.niche.toString() === userPref.nicheId.toString()) {
      return 1.0;
    }

    // Check if niches are related (same category or tags)
    if (niche && product.tags && niche.synonyms) {
      const productTags = product.tags.map((t) => t.toLowerCase());
      const nicheSynonyms = niche.synonyms.map((s) => s.toLowerCase());
      const hasOverlap = productTags.some((tag) =>
        nicheSynonyms.some((syn) => syn.includes(tag) || tag.includes(syn))
      );
      if (hasOverlap) {
        return 0.6;
      }
    }

    // No match
    return 0.1;
  }

  /**
   * Calculate beginner-friendliness score (0-1)
   */
  private static calculateBeginnerFriendliness(product: IProduct): number {
    let score = 0;

    // Price range check
    if (product.price >= this.BEGINNER_PRICE_MIN && product.price <= this.BEGINNER_PRICE_MAX) {
      score += 0.6;
    } else if (product.price < this.BEGINNER_PRICE_MIN) {
      score += 0.2; // Too cheap might indicate low quality
    } else {
      score += 0.3; // Above range, less beginner-friendly
    }

    // Very low price penalty
    if (product.price < this.LOW_PRICE_THRESHOLD) {
      score *= 0.7; // Reduce score for very low-priced products
    }

    // Title complexity (shorter = simpler)
    if (product.title && product.title.length < 60) {
      score += 0.2;
    }

    // Image count (at least 1 required, more is better)
    if (product.images && product.images.length >= 1) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate profit margin score (0-1)
   */
  private static calculateProfitMargin(product: IProduct): number {
    if (!product.price || product.price <= 0) {
      return 0;
    }

    let margin: number;

    if (product.costPrice && product.costPrice > 0) {
      // Actual margin calculation
      margin = (product.price - product.costPrice) / product.price;
    } else {
      // Fallback: assume 45% margin (costPrice = price * 0.55)
      margin = 0.45;
    }

    // Normalize to 0-1 range
    margin = Math.max(0, Math.min(1, margin));

    // Higher margin = better score
    return margin;
  }

  /**
   * Calculate quality score (0-1)
   */
  private static calculateQuality(product: IProduct): number {
    let score = 0;

    // Description length (longer = better, but not too long)
    if (product.description) {
      const descLength = product.description.length;
      if (descLength >= 200 && descLength <= 1000) {
        score += 0.5; // Optimal length
      } else if (descLength >= 100) {
        score += 0.3; // Good length
      } else if (descLength >= 50) {
        score += 0.1; // Minimum acceptable
      }
    }

    // Image count (more images = better quality)
    if (product.images && product.images.length >= 2) {
      score += 0.5;
    } else if (product.images && product.images.length === 1) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate popularity score (0-1)
   */
  private static calculatePopularity(product: IProduct): number {
    const analytics = product.analytics || {};
    const views = analytics.views || 0;
    const imports = analytics.imports || 0;

    // Normalize views (assume max 1000 views = 1.0)
    const normalizedViews = Math.min(1, views / 1000);

    // Normalize imports (assume max 100 imports = 1.0)
    const normalizedImports = Math.min(1, imports / 100);

    // Combine with 60% weight on imports (more important) and 40% on views
    return normalizedImports * 0.6 + normalizedViews * 0.4;
  }

  /**
   * Calculate confidence score (0-1) based on data completeness
   */
  private static calculateConfidence(
    product: IProduct,
    breakdown: ScoringResult['breakdown']
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if we have costPrice
    if (product.costPrice && product.costPrice > 0) {
      confidence += 0.2;
    }

    // Increase confidence if we have analytics data
    if (product.analytics && (product.analytics.views || product.analytics.imports)) {
      confidence += 0.15;
    }

    // Increase confidence if we have tags
    if (product.tags && product.tags.length > 0) {
      confidence += 0.1;
    }

    // Increase confidence if we have supplier link
    if (product.supplierLink) {
      confidence += 0.05;
    }

    return Math.min(1, confidence);
  }
}

