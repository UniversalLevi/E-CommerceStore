import { Product } from '../models/Product';
import { StoreProduct } from '../models/StoreProduct';
import { Store } from '../models/Store';
import { createError } from '../middleware/errorHandler';

export interface ImportOptions {
  basePrice?: number; // Override base price (in paise)
  status?: 'draft' | 'active';
  variantDimension?: string;
  variants?: Array<{
    name: string;
    price?: number;
    inventory?: number | null;
  }>;
}

export class ProductImportService {
  /**
   * Validate if a product can be imported to a store
   */
  static async validateImport(
    catalogProductId: string,
    storeId: string
  ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
    const warnings: string[] = [];

    // Check if catalog product exists
    const catalogProduct = await Product.findById(catalogProductId);
    if (!catalogProduct) {
      return { valid: false, error: 'Catalog product not found' };
    }

    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return { valid: false, error: 'Store not found' };
    }

    // Check product limit (50 per store)
    const maxProducts = parseInt(process.env.MAX_PRODUCTS_PER_STORE || '50', 10);
    const productCount = await StoreProduct.countDocuments({ storeId });
    if (productCount >= maxProducts) {
      return {
        valid: false,
        error: `Product limit reached (${maxProducts} products per store)`,
      };
    }

    // Check for duplicate import (by title or importedFrom)
    const existingByTitle = await StoreProduct.findOne({
      storeId,
      title: catalogProduct.title,
    });

    if (existingByTitle) {
      warnings.push('A product with the same title already exists in your store');
    }

    const existingByImport = await StoreProduct.findOne({
      storeId,
      importedFrom: catalogProductId,
    });

    if (existingByImport) {
      return {
        valid: false,
        error: 'This product has already been imported to your store',
      };
    }

    // Check image count
    if (catalogProduct.images.length > 5) {
      warnings.push(
        `Product has ${catalogProduct.images.length} images, only the first 5 will be imported`
      );
    }

    return { valid: true, warnings };
  }

  /**
   * Map catalog product fields to store product format
   */
  static mapProductFields(
    catalogProduct: any,
    storeId: string,
    options: ImportOptions = {}
  ): Partial<any> {
    // Convert price from rupees to paise (catalog uses rupees, store uses paise)
    // Catalog price is final price (basePrice + profit + shippingPrice)
    const catalogPriceInPaise = Math.round(catalogProduct.price * 100);
    const basePrice = options.basePrice ?? catalogPriceInPaise;

    // Take first 5 images
    const images = catalogProduct.images.slice(0, 5);

    // Build metadata
    const metadata: any = {};
    if (catalogProduct.niche) {
      metadata.nicheId = catalogProduct.niche;
    }
    if (catalogProduct.tags && catalogProduct.tags.length > 0) {
      metadata.tags = catalogProduct.tags;
    }
    if (catalogProduct.supplierLink) {
      metadata.supplierLink = catalogProduct.supplierLink;
    }

    return {
      storeId,
      title: catalogProduct.title,
      description: catalogProduct.description || undefined,
      basePrice,
      status: options.status || 'draft',
      images,
      variantDimension: options.variantDimension,
      variants: options.variants || [],
      inventoryTracking: false, // Default to false
      importedFrom: catalogProduct._id,
      importedAt: new Date(),
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  }

  /**
   * Import a product from catalog to store
   */
  static async importProductToStore(
    catalogProductId: string,
    storeId: string,
    options: ImportOptions = {}
  ): Promise<any> {
    // Validate import
    const validation = await this.validateImport(catalogProductId, storeId);
    if (!validation.valid) {
      throw createError(validation.error || 'Import validation failed', 400);
    }

    // Fetch catalog product with populated niche
    const catalogProduct = await Product.findById(catalogProductId).populate('niche', 'name slug');
    if (!catalogProduct) {
      throw createError('Catalog product not found', 404);
    }

    // Map fields
    const storeProductData = this.mapProductFields(catalogProduct, storeId, options);

    // Create store product
    const storeProduct = new StoreProduct(storeProductData);
    await storeProduct.save();

    // Update catalog product analytics
    if (catalogProduct.analytics) {
      catalogProduct.analytics.imports = (catalogProduct.analytics.imports || 0) + 1;
      await catalogProduct.save();
    } else {
      catalogProduct.analytics = { imports: 1 };
      await catalogProduct.save();
    }

    return storeProduct;
  }

  /**
   * Check if a product is already imported
   */
  static async isProductImported(
    catalogProductId: string,
    storeId: string
  ): Promise<boolean> {
    const existing = await StoreProduct.findOne({
      storeId,
      importedFrom: catalogProductId,
    });
    return !!existing;
  }
}
