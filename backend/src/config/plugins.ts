/**
 * Canonical list of all platform plugins. Used by seed script and by getStorePlugins to ensure all plugins exist in DB.
 */
export const PLUGIN_DEFINITIONS = [
  { slug: 'discount-coupons', name: 'Discount Coupon Codes', description: 'Create and manage discount coupon codes for your store customers.', category: 'marketing', icon: 'Ticket', isActive: true },
  { slug: 'gift-cards', name: 'Gift Cards', description: 'Offer gift cards that customers can purchase and redeem in your store.', category: 'marketing', icon: 'Gift', isActive: true },
  { slug: 'free-gifts', name: 'Free Gift on Order Value', description: 'Offer free products when customers reach a minimum order value.', category: 'conversion', icon: 'Package', isActive: true },
  { slug: 'social-sharing', name: 'Share to Socials', description: 'Let customers share products to WhatsApp, Facebook, Twitter and more.', category: 'social', icon: 'Share2', isActive: true },
  { slug: 'social-links', name: 'Social Links', description: 'Display your social media profiles in your store header and footer.', category: 'social', icon: 'Link', isActive: true },
  { slug: 'announcement-bar', name: 'Announcement Bar', description: 'Show a scrolling bar at the top of your store with offers, discounts, or info.', category: 'marketing', icon: 'Megaphone', isActive: true },
  { slug: 'product-bundles', name: 'Product Bundles', description: 'Create product bundles and frequently-bought-together suggestions.', category: 'products', icon: 'Layers', isActive: true },
  { slug: 'email-popup', name: 'Email Collection Popup', description: 'Collect emails with customizable popups and optionally offer discount codes.', category: 'conversion', icon: 'Mail', isActive: true },
  { slug: 'countdown-timer', name: 'Countdown Timer', description: 'Add countdown timers to products to create urgency for limited-time offers.', category: 'conversion', icon: 'Timer', isActive: true },
  { slug: 'partial-cod', name: 'Partial Cash on Delivery', description: 'Allow customers to pay a portion online and the rest on delivery.', category: 'payments', icon: 'Wallet', isActive: true },
  { slug: 'product-filters', name: 'Product Filtering and Search', description: 'Improve product discovery with filters by tag, variant, and price range.', category: 'products', icon: 'Filter', isActive: true },
  { slug: 'product-reviews', name: 'Product Reviews & Social Proof', description: 'Collect and display product reviews; show verified purchase badges.', category: 'conversion', icon: 'Star', isActive: true },
  { slug: 'upsell-conversion', name: 'Upsell & Conversion Boost', description: 'Frequently bought together, product recommendations, and bundle discounts.', category: 'conversion', icon: 'TrendingUp', isActive: true },
  { slug: 'ai-chatbot', name: 'AI Customer Chatbot', description: 'Automated AI chatbot that answers customer questions about products and store policy.', category: 'conversion', icon: 'MessageCircle', isActive: true },
  { slug: 'page-builder', name: 'Custom Pages', description: 'Create custom pages like About, FAQ, or Landing with your own content.', category: 'conversion', icon: 'FileText', isActive: true },
];
