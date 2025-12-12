/**
 * Niche-specific theme configurations
 * Each niche has customized colors, typography, imagery, and content
 */

export interface NicheThemeConfig {
  id: string;
  name: string;
  slug: string;
  colors: {
    primary: string;        // Main accent color
    secondary: string;      // Secondary accent
    background: string;     // Main background
    backgroundAlt: string;  // Secondary background
    text: string;           // Main text color
    textMuted: string;      // Muted/secondary text
    buttonText: string;     // Button text color
    success: string;        // Success/sale color
    gradient?: string;      // Optional gradient
  };
  typography: {
    headingFont: string;    // Shopify font format
    bodyFont: string;
    headingWeight: string;
    bodyWeight: string;
  };
  hero: {
    heading: string;
    subheading: string;
    buttonText: string;
    secondaryButtonText?: string;
    overlayOpacity: number;
    textAlignment: 'left' | 'center' | 'right';
  };
  sections: {
    featuredProducts: {
      heading: string;
      subheading: string;
    };
    collections: {
      heading: string;
      subheading: string;
    };
    testimonials: {
      heading: string;
      subheading: string;
    };
    newsletter: {
      heading: string;
      subheading: string;
      buttonText: string;
    };
    features: {
      heading: string;
      items: Array<{
        icon: string;
        title: string;
        description: string;
      }>;
    };
    about: {
      heading: string;
      content: string;
    };
  };
  images: {
    hero: string;           // Unsplash URL
    about: string;
    placeholders: string[]; // Product placeholder images
  };
  additionalCSS: string;    // Custom CSS for animations/effects
  seo: {
    title: string;
    description: string;
  };
}

export const nicheThemes: Record<string, NicheThemeConfig> = {
  // ============================================
  // 1. AUTOMOTIVE ACCESSORIES
  // ============================================
  'automotive-accessories': {
    id: 'automotive-accessories',
    name: 'Automotive Accessories',
    slug: 'automotive-accessories',
    colors: {
      primary: '#E53935',        // Bold red
      secondary: '#212121',      // Dark charcoal
      background: '#FAFAFA',     // Light gray
      backgroundAlt: '#F5F5F5',  // Slightly darker
      text: '#1A1A1A',
      textMuted: '#666666',
      buttonText: '#FFFFFF',
      success: '#43A047',
      gradient: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
    },
    typography: {
      headingFont: 'oswald_n6',
      bodyFont: 'roboto_n4',
      headingWeight: '600',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Upgrade Your Ride',
      subheading: 'Premium automotive accessories to enhance your driving experience',
      buttonText: 'Shop Now',
      secondaryButtonText: 'View Collections',
      overlayOpacity: 40,
      textAlignment: 'left',
    },
    sections: {
      featuredProducts: {
        heading: 'Top Gear',
        subheading: 'Best-selling automotive accessories',
      },
      collections: {
        heading: 'Shop by Category',
        subheading: 'Find the perfect upgrade for your vehicle',
      },
      testimonials: {
        heading: 'What Drivers Say',
        subheading: 'Real reviews from car enthusiasts',
      },
      newsletter: {
        heading: 'Join the Garage',
        subheading: 'Get exclusive deals and new product alerts',
        buttonText: 'Subscribe',
      },
      features: {
        heading: 'Why Choose Us',
        items: [
          { icon: 'truck', title: 'Fast Shipping', description: 'Express delivery available' },
          { icon: 'shield', title: 'Quality Guaranteed', description: 'Premium materials only' },
          { icon: 'refresh', title: 'Easy Returns', description: '30-day hassle-free returns' },
          { icon: 'headphones', title: '24/7 Support', description: 'Expert assistance anytime' },
        ],
      },
      about: {
        heading: 'About Our Store',
        content: 'We are passionate car enthusiasts dedicated to bringing you the finest automotive accessories.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80',
      ],
    },
    additionalCSS: `
      .hero-banner { position: relative; }
      .hero-banner::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 100px;
        background: linear-gradient(to top, rgb(var(--color-base-background-1)), transparent);
        z-index: 2;
      }
      .product-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
      .product-card:hover { transform: translateY(-8px); box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
      .button { border-radius: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.15em; }
    `,
    seo: {
      title: 'Premium Automotive Accessories | Upgrade Your Ride',
      description: 'Shop the best automotive accessories. Quality car parts, interior upgrades, and exterior accessories for every vehicle.',
    },
  },

  // ============================================
  // 2. HOME DECOR & LIGHTING
  // ============================================
  'home-decor-lighting': {
    id: 'home-decor-lighting',
    name: 'Home Decor & Lighting',
    slug: 'home-decor-lighting',
    colors: {
      primary: '#D4A574',        // Warm gold
      secondary: '#8B7355',      // Earthy brown
      background: '#FFFBF7',     // Warm white
      backgroundAlt: '#F5EDE4',  // Cream
      text: '#2C2416',
      textMuted: '#6B5D4D',
      buttonText: '#FFFFFF',
      success: '#6B8E23',
      gradient: 'linear-gradient(135deg, #D4A574 0%, #C49A6C 100%)',
    },
    typography: {
      headingFont: 'playfair_display_n4',
      bodyFont: 'lato_n4',
      headingWeight: '400',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Illuminate Your Space',
      subheading: 'Curated home decor and lighting to transform your living spaces',
      buttonText: 'Explore Collection',
      overlayOpacity: 25,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Trending Pieces',
        subheading: 'Handpicked decor for modern homes',
      },
      collections: {
        heading: 'Browse Collections',
        subheading: 'Find your perfect aesthetic',
      },
      testimonials: {
        heading: 'Happy Homes',
        subheading: 'Stories from our satisfied customers',
      },
      newsletter: {
        heading: 'Design Inspiration',
        subheading: 'Subscribe for styling tips and exclusive offers',
        buttonText: 'Get Inspired',
      },
      features: {
        heading: 'The Experience',
        items: [
          { icon: 'star', title: 'Curated Selection', description: 'Hand-picked by designers' },
          { icon: 'package', title: 'Careful Packaging', description: 'Safely delivered to your door' },
          { icon: 'refresh', title: 'Easy Returns', description: '30-day satisfaction guarantee' },
          { icon: 'heart', title: 'Design Support', description: 'Free styling advice' },
        ],
      },
      about: {
        heading: 'Our Story',
        content: 'We believe every home deserves beautiful lighting and decor that reflects your unique style.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80',
      ],
    },
    additionalCSS: `
      .section-header__title { font-style: italic; }
      .product-card { transition: all 0.4s ease; }
      .product-card:hover { transform: scale(1.02); }
      .product-card__image-wrapper { border-radius: 8px; overflow: hidden; }
      .button { border-radius: 30px; padding: 1.2rem 3rem; }
      .hero-banner__heading { font-style: italic; }
    `,
    seo: {
      title: 'Home Decor & Lighting | Beautiful Living Spaces',
      description: 'Discover curated home decor and lighting solutions. Transform your space with our elegant collection.',
    },
  },

  // ============================================
  // 3. FASHION ACCESSORIES STORAGE
  // ============================================
  'fashion-accessories-storage': {
    id: 'fashion-accessories-storage',
    name: 'Fashion Accessories Storage',
    slug: 'fashion-accessories-storage',
    colors: {
      primary: '#E91E63',        // Pink
      secondary: '#9C27B0',      // Purple
      background: '#FFFFFF',
      backgroundAlt: '#FCE4EC',  // Light pink
      text: '#1A1A1A',
      textMuted: '#757575',
      buttonText: '#FFFFFF',
      success: '#4CAF50',
      gradient: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
    },
    typography: {
      headingFont: 'poppins_n6',
      bodyFont: 'poppins_n4',
      headingWeight: '600',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Organize in Style',
      subheading: 'Chic storage solutions for your precious accessories',
      buttonText: 'Shop Storage',
      overlayOpacity: 30,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Best Sellers',
        subheading: 'Most loved storage solutions',
      },
      collections: {
        heading: 'Storage Solutions',
        subheading: 'Organize everything beautifully',
      },
      testimonials: {
        heading: 'Customer Love',
        subheading: 'See why customers adore our products',
      },
      newsletter: {
        heading: 'Style Updates',
        subheading: 'Be the first to know about new arrivals',
        buttonText: 'Join Now',
      },
      features: {
        heading: 'Why Shop With Us',
        items: [
          { icon: 'sparkles', title: 'Stylish Designs', description: 'Fashion-forward organizers' },
          { icon: 'shield', title: 'Premium Quality', description: 'Built to last beautifully' },
          { icon: 'truck', title: 'Free Shipping', description: 'On orders over ₹999' },
          { icon: 'gift', title: 'Gift Ready', description: 'Beautiful packaging included' },
        ],
      },
      about: {
        heading: 'About Us',
        content: 'We create beautiful storage solutions that help you organize your accessories while adding elegance to your space.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      ],
    },
    additionalCSS: `
      .button { border-radius: 25px; background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); }
      .button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(233,30,99,0.3); }
      .product-card { border-radius: 16px; overflow: hidden; }
      .product-card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
      .section-header__title { background: linear-gradient(135deg, #E91E63, #9C27B0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    `,
    seo: {
      title: 'Fashion Accessories Storage | Organize in Style',
      description: 'Shop stylish storage solutions for jewelry, accessories, and more. Beautiful organizers that complement your decor.',
    },
  },

  // ============================================
  // 4. JEWELLERY
  // ============================================
  'jewellery': {
    id: 'jewellery',
    name: 'Jewellery',
    slug: 'jewellery',
    colors: {
      primary: '#B8860B',        // Dark gold
      secondary: '#1A1A1A',      // Black
      background: '#FFFFFF',
      backgroundAlt: '#FAF7F0',  // Cream
      text: '#1A1A1A',
      textMuted: '#666666',
      buttonText: '#FFFFFF',
      success: '#2E7D32',
      gradient: 'linear-gradient(135deg, #B8860B 0%, #8B6914 100%)',
    },
    typography: {
      headingFont: 'cormorant_garamond_n4',
      bodyFont: 'montserrat_n4',
      headingWeight: '400',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Timeless Elegance',
      subheading: 'Exquisite jewellery crafted for moments that matter',
      buttonText: 'Discover Collection',
      overlayOpacity: 35,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Signature Pieces',
        subheading: 'Our most coveted designs',
      },
      collections: {
        heading: 'Collections',
        subheading: 'Find your perfect piece',
      },
      testimonials: {
        heading: 'Cherished Moments',
        subheading: 'Stories from our valued customers',
      },
      newsletter: {
        heading: 'Join Our Circle',
        subheading: 'Exclusive previews and member-only offers',
        buttonText: 'Subscribe',
      },
      features: {
        heading: 'The Promise',
        items: [
          { icon: 'gem', title: 'Authentic Materials', description: 'Certified genuine stones' },
          { icon: 'shield', title: 'Lifetime Warranty', description: 'Quality guaranteed forever' },
          { icon: 'gift', title: 'Luxury Packaging', description: 'Gift-ready presentation' },
          { icon: 'certificate', title: 'Certified Quality', description: 'Hallmarked pieces' },
        ],
      },
      about: {
        heading: 'Our Heritage',
        content: 'For generations, we have crafted jewellery that celebrates life\'s precious moments.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
      ],
    },
    additionalCSS: `
      body { background: linear-gradient(180deg, #FFFFFF 0%, #FAF7F0 100%); }
      .hero-banner__heading { font-size: clamp(2.5rem, 6vw, 5rem); letter-spacing: 0.1em; }
      .button { border-radius: 0; border: 2px solid currentColor; background: transparent; color: rgb(var(--color-base-accent-1)); }
      .button:hover { background: rgb(var(--color-base-accent-1)); color: #fff; }
      .product-card { text-align: center; }
      .product-card__image-wrapper { background: linear-gradient(135deg, #FAF7F0, #FFFFFF); }
      .section-header__title { letter-spacing: 0.15em; text-transform: uppercase; font-size: 1rem; }
    `,
    seo: {
      title: 'Exquisite Jewellery | Timeless Elegance',
      description: 'Discover our curated collection of fine jewellery. Handcrafted pieces for every occasion.',
    },
  },

  // ============================================
  // 5. HOME DECOR & GIFTING
  // ============================================
  'home-decor-gifting': {
    id: 'home-decor-gifting',
    name: 'Home Decor & Gifting',
    slug: 'home-decor-gifting',
    colors: {
      primary: '#7C3AED',        // Purple
      secondary: '#EC4899',      // Pink
      background: '#FFFFFF',
      backgroundAlt: '#F5F3FF',  // Light purple
      text: '#1F2937',
      textMuted: '#6B7280',
      buttonText: '#FFFFFF',
      success: '#10B981',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    },
    typography: {
      headingFont: 'quicksand_n6',
      bodyFont: 'nunito_n4',
      headingWeight: '600',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Give the Gift of Beauty',
      subheading: 'Thoughtful decor pieces that make perfect gifts',
      buttonText: 'Shop Gifts',
      secondaryButtonText: 'Gift Guide',
      overlayOpacity: 30,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Gift Ideas',
        subheading: 'Perfect presents for every occasion',
      },
      collections: {
        heading: 'Shop by Occasion',
        subheading: 'Find the perfect gift',
      },
      testimonials: {
        heading: 'Gifting Joy',
        subheading: 'See how we\'ve helped spread happiness',
      },
      newsletter: {
        heading: 'Gift Inspiration',
        subheading: 'Get gifting ideas and exclusive discounts',
        buttonText: 'Sign Up',
      },
      features: {
        heading: 'Gifting Made Easy',
        items: [
          { icon: 'gift', title: 'Gift Wrapping', description: 'Beautiful presentation included' },
          { icon: 'card', title: 'Personal Message', description: 'Add a heartfelt note' },
          { icon: 'truck', title: 'Direct Delivery', description: 'Ship straight to recipient' },
          { icon: 'refresh', title: 'Easy Exchanges', description: '30-day exchange policy' },
        ],
      },
      about: {
        heading: 'About Us',
        content: 'We curate beautiful home decor pieces that make meaningful gifts for your loved ones.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80',
      ],
    },
    additionalCSS: `
      .button { border-radius: 12px; background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); }
      .product-card { border-radius: 20px; overflow: hidden; transition: all 0.3s ease; }
      .product-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 25px 50px rgba(124,58,237,0.15); }
      .section-header { position: relative; }
      .section-header::after { content: '🎁'; font-size: 2rem; position: absolute; top: -1rem; right: calc(50% - 3rem); }
    `,
    seo: {
      title: 'Home Decor & Gifting | Thoughtful Gifts',
      description: 'Shop beautiful home decor pieces perfect for gifting. Unique items for every occasion.',
    },
  },

  // ============================================
  // 6. HOME & LIVING
  // ============================================
  'home-living': {
    id: 'home-living',
    name: 'Home & Living',
    slug: 'home-living',
    colors: {
      primary: '#059669',        // Emerald
      secondary: '#0D9488',      // Teal
      background: '#FFFFFF',
      backgroundAlt: '#ECFDF5',  // Light green
      text: '#1F2937',
      textMuted: '#6B7280',
      buttonText: '#FFFFFF',
      success: '#10B981',
      gradient: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
    },
    typography: {
      headingFont: 'dm_sans_n5',
      bodyFont: 'dm_sans_n4',
      headingWeight: '500',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Make House a Home',
      subheading: 'Essential products for comfortable living',
      buttonText: 'Shop Essentials',
      overlayOpacity: 35,
      textAlignment: 'left',
    },
    sections: {
      featuredProducts: {
        heading: 'Home Essentials',
        subheading: 'Must-haves for every room',
      },
      collections: {
        heading: 'Shop by Room',
        subheading: 'Everything you need, organized',
      },
      testimonials: {
        heading: 'Happy Homes',
        subheading: 'What our customers say',
      },
      newsletter: {
        heading: 'Home Tips & Deals',
        subheading: 'Subscribe for home improvement ideas',
        buttonText: 'Subscribe',
      },
      features: {
        heading: 'Why Shop Here',
        items: [
          { icon: 'home', title: 'Home Experts', description: 'Curated by design experts' },
          { icon: 'truck', title: 'Free Delivery', description: 'On orders above ₹499' },
          { icon: 'shield', title: 'Quality Promise', description: 'Durable, long-lasting items' },
          { icon: 'refresh', title: '30-Day Returns', description: 'Hassle-free return policy' },
        ],
      },
      about: {
        heading: 'Our Mission',
        content: 'We help you create comfortable, functional, and beautiful living spaces with quality home essentials.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80',
      ],
    },
    additionalCSS: `
      .button { border-radius: 8px; }
      .product-card { border-radius: 12px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.3s ease; }
      .product-card:hover { box-shadow: 0 10px 40px rgba(5,150,105,0.15); transform: translateY(-5px); }
      .section-header__title { color: rgb(var(--color-base-accent-1)); }
    `,
    seo: {
      title: 'Home & Living Essentials | Comfortable Living',
      description: 'Shop home and living essentials. Quality products for every room in your home.',
    },
  },

  // ============================================
  // 7. TOOLS & HOME IMPROVEMENT
  // ============================================
  'tools-home-improvement': {
    id: 'tools-home-improvement',
    name: 'Tools & Home Improvement',
    slug: 'tools-home-improvement',
    colors: {
      primary: '#F59E0B',        // Amber/Orange
      secondary: '#1F2937',      // Dark gray
      background: '#FFFFFF',
      backgroundAlt: '#FEF3C7',  // Light amber
      text: '#1F2937',
      textMuted: '#6B7280',
      buttonText: '#000000',
      success: '#10B981',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    },
    typography: {
      headingFont: 'bebas_neue_n4',
      bodyFont: 'open_sans_n4',
      headingWeight: '400',
      bodyWeight: '400',
    },
    hero: {
      heading: 'BUILD IT BETTER',
      subheading: 'Professional-grade tools for every project',
      buttonText: 'Shop Tools',
      overlayOpacity: 45,
      textAlignment: 'left',
    },
    sections: {
      featuredProducts: {
        heading: 'TOP TOOLS',
        subheading: 'Best sellers trusted by professionals',
      },
      collections: {
        heading: 'SHOP BY PROJECT',
        subheading: 'Find the right tools for your job',
      },
      testimonials: {
        heading: 'BUILDER REVIEWS',
        subheading: 'What DIYers and pros say',
      },
      newsletter: {
        heading: 'PRO TIPS',
        subheading: 'Get DIY guides and exclusive deals',
        buttonText: 'Join Free',
      },
      features: {
        heading: 'THE PRO ADVANTAGE',
        items: [
          { icon: 'tools', title: 'Pro Quality', description: 'Industrial-grade tools' },
          { icon: 'shield', title: 'Warranty', description: 'Extended protection plans' },
          { icon: 'truck', title: 'Fast Shipping', description: 'Get tools when you need them' },
          { icon: 'support', title: 'Expert Support', description: 'Technical help available' },
        ],
      },
      about: {
        heading: 'ABOUT US',
        content: 'We supply professional-grade tools to DIY enthusiasts and contractors who demand quality.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&q=80',
        'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80',
      ],
    },
    additionalCSS: `
      .hero-banner__heading { font-size: clamp(3rem, 8vw, 7rem); letter-spacing: 0.05em; }
      .section-header__title { letter-spacing: 0.1em; }
      .button { border-radius: 0; font-weight: 700; text-transform: uppercase; }
      .product-card { border: 2px solid transparent; transition: all 0.2s ease; }
      .product-card:hover { border-color: rgb(var(--color-base-accent-1)); }
      .product-card__badge--sale { background: #F59E0B; color: #000; }
    `,
    seo: {
      title: 'Tools & Home Improvement | Professional Quality',
      description: 'Shop professional-grade tools and home improvement supplies. Quality tools for every project.',
    },
  },

  // ============================================
  // 8. KITCHEN APPLIANCES
  // ============================================
  'kitchen-appliances': {
    id: 'kitchen-appliances',
    name: 'Kitchen Appliances',
    slug: 'kitchen-appliances',
    colors: {
      primary: '#DC2626',        // Red
      secondary: '#1F2937',      // Dark gray
      background: '#FFFFFF',
      backgroundAlt: '#FEF2F2',  // Light red
      text: '#1F2937',
      textMuted: '#6B7280',
      buttonText: '#FFFFFF',
      success: '#16A34A',
      gradient: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    },
    typography: {
      headingFont: 'source_sans_pro_n6',
      bodyFont: 'source_sans_pro_n4',
      headingWeight: '600',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Cook Like a Pro',
      subheading: 'Premium kitchen appliances for the modern chef',
      buttonText: 'Shop Appliances',
      overlayOpacity: 40,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Chef\'s Picks',
        subheading: 'Our most popular kitchen essentials',
      },
      collections: {
        heading: 'Kitchen Categories',
        subheading: 'Find the perfect appliance',
      },
      testimonials: {
        heading: 'Kitchen Stories',
        subheading: 'Reviews from home chefs',
      },
      newsletter: {
        heading: 'Recipe & Deals',
        subheading: 'Get recipes and exclusive offers',
        buttonText: 'Subscribe',
      },
      features: {
        heading: 'Why Choose Us',
        items: [
          { icon: 'star', title: 'Top Brands', description: 'Trusted appliance brands' },
          { icon: 'shield', title: 'Warranty', description: '1-year manufacturer warranty' },
          { icon: 'truck', title: 'Safe Delivery', description: 'Careful handling guaranteed' },
          { icon: 'support', title: 'Installation Help', description: 'Setup assistance available' },
        ],
      },
      about: {
        heading: 'About Our Store',
        content: 'We bring you the best kitchen appliances to make cooking easier and more enjoyable.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80',
        'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80',
      ],
    },
    additionalCSS: `
      .button { border-radius: 8px; }
      .product-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s ease; }
      .product-card:hover { box-shadow: 0 15px 40px rgba(220,38,38,0.15); transform: translateY(-8px); }
      .product-card__badge--sale { background: #DC2626; }
    `,
    seo: {
      title: 'Kitchen Appliances | Cook Like a Pro',
      description: 'Shop premium kitchen appliances. Top brands, great prices, and fast delivery.',
    },
  },

  // ============================================
  // 9. HEALTH & PERSONAL CARE
  // ============================================
  'health-personal-care': {
    id: 'health-personal-care',
    name: 'Health & Personal Care',
    slug: 'health-personal-care',
    colors: {
      primary: '#14B8A6',        // Teal
      secondary: '#6366F1',      // Indigo
      background: '#FFFFFF',
      backgroundAlt: '#F0FDFA',  // Light teal
      text: '#1F2937',
      textMuted: '#6B7280',
      buttonText: '#FFFFFF',
      success: '#22C55E',
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)',
    },
    typography: {
      headingFont: 'inter_n6',
      bodyFont: 'inter_n4',
      headingWeight: '600',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Feel Your Best',
      subheading: 'Premium health and personal care essentials',
      buttonText: 'Shop Wellness',
      overlayOpacity: 30,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Wellness Essentials',
        subheading: 'Products for your daily routine',
      },
      collections: {
        heading: 'Shop Categories',
        subheading: 'Find what you need',
      },
      testimonials: {
        heading: 'Customer Stories',
        subheading: 'Real results from real people',
      },
      newsletter: {
        heading: 'Wellness Tips',
        subheading: 'Health advice and exclusive offers',
        buttonText: 'Join Free',
      },
      features: {
        heading: 'Our Promise',
        items: [
          { icon: 'check', title: 'Quality Assured', description: 'Safe, tested products' },
          { icon: 'leaf', title: 'Natural Options', description: 'Clean ingredients' },
          { icon: 'truck', title: 'Discreet Shipping', description: 'Privacy guaranteed' },
          { icon: 'refresh', title: 'Satisfaction', description: '30-day guarantee' },
        ],
      },
      about: {
        heading: 'Our Mission',
        content: 'We help you take care of yourself with quality health and personal care products.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80',
      ],
    },
    additionalCSS: `
      .button { border-radius: 50px; padding: 1rem 2.5rem; }
      .product-card { border-radius: 16px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: all 0.3s ease; }
      .product-card:hover { box-shadow: 0 20px 40px rgba(20,184,166,0.15); transform: translateY(-6px); }
      .section-header__title { color: rgb(var(--color-base-accent-1)); }
    `,
    seo: {
      title: 'Health & Personal Care | Feel Your Best',
      description: 'Shop health and personal care essentials. Quality products for your wellness routine.',
    },
  },

  // ============================================
  // 10. HOME & CLEANING ESSENTIALS
  // ============================================
  'home-cleaning-essentials': {
    id: 'home-cleaning-essentials',
    name: 'Home & Cleaning Essentials',
    slug: 'home-cleaning-essentials',
    colors: {
      primary: '#3B82F6',        // Blue
      secondary: '#06B6D4',      // Cyan
      background: '#FFFFFF',
      backgroundAlt: '#EFF6FF',  // Light blue
      text: '#1E3A5F',
      textMuted: '#64748B',
      buttonText: '#FFFFFF',
      success: '#22C55E',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
    },
    typography: {
      headingFont: 'work_sans_n6',
      bodyFont: 'work_sans_n4',
      headingWeight: '600',
      bodyWeight: '400',
    },
    hero: {
      heading: 'A Cleaner Home',
      subheading: 'Everything you need for a spotless living space',
      buttonText: 'Shop Cleaning',
      overlayOpacity: 35,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Cleaning Must-Haves',
        subheading: 'Top-rated cleaning essentials',
      },
      collections: {
        heading: 'Shop by Need',
        subheading: 'Find the right solution',
      },
      testimonials: {
        heading: 'Clean Reviews',
        subheading: 'What customers say',
      },
      newsletter: {
        heading: 'Cleaning Tips',
        subheading: 'Get hacks and exclusive deals',
        buttonText: 'Subscribe',
      },
      features: {
        heading: 'Why Us',
        items: [
          { icon: 'sparkles', title: 'Effective Products', description: 'Tested and proven' },
          { icon: 'leaf', title: 'Eco Options', description: 'Planet-friendly choices' },
          { icon: 'truck', title: 'Fast Delivery', description: 'Get supplies quickly' },
          { icon: 'percent', title: 'Great Value', description: 'Competitive pricing' },
        ],
      },
      about: {
        heading: 'About Us',
        content: 'We make keeping your home clean easy with quality products at great prices.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80',
        'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80',
      ],
    },
    additionalCSS: `
      .button { border-radius: 8px; }
      .product-card { border-radius: 12px; transition: all 0.3s ease; }
      .product-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(59,130,246,0.15); }
    `,
    seo: {
      title: 'Home & Cleaning Essentials | Spotless Living',
      description: 'Shop cleaning supplies and home essentials. Quality products for a cleaner home.',
    },
  },

  // ============================================
  // 11. ART & STATIONERY
  // ============================================
  'art-stationery': {
    id: 'art-stationery',
    name: 'Art & Stationery',
    slug: 'art-stationery',
    colors: {
      primary: '#8B5CF6',        // Violet
      secondary: '#F472B6',      // Pink
      background: '#FFFFFF',
      backgroundAlt: '#FAF5FF',  // Light purple
      text: '#1F2937',
      textMuted: '#6B7280',
      buttonText: '#FFFFFF',
      success: '#22C55E',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    },
    typography: {
      headingFont: 'caveat_n4',
      bodyFont: 'nunito_sans_n4',
      headingWeight: '400',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Create Something Beautiful',
      subheading: 'Premium art supplies and stationery for creators',
      buttonText: 'Start Creating',
      overlayOpacity: 25,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Artist Favorites',
        subheading: 'Supplies loved by creators',
      },
      collections: {
        heading: 'Browse Supplies',
        subheading: 'Find your creative tools',
      },
      testimonials: {
        heading: 'Creator Stories',
        subheading: 'Reviews from artists',
      },
      newsletter: {
        heading: 'Creative Inspiration',
        subheading: 'Tips, tutorials, and exclusive offers',
        buttonText: 'Get Inspired',
      },
      features: {
        heading: 'For Creators',
        items: [
          { icon: 'palette', title: 'Quality Materials', description: 'Professional-grade supplies' },
          { icon: 'star', title: 'Curated Selection', description: 'Hand-picked products' },
          { icon: 'truck', title: 'Safe Packaging', description: 'Careful handling' },
          { icon: 'heart', title: 'Artist Support', description: 'Expert recommendations' },
        ],
      },
      about: {
        heading: 'Our Passion',
        content: 'We are artists and creators ourselves, dedicated to bringing you the best supplies.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80',
        'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600&q=80',
      ],
    },
    additionalCSS: `
      .hero-banner__heading { font-size: clamp(3rem, 7vw, 6rem); }
      .button { border-radius: 50px; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); }
      .product-card { border-radius: 20px; transition: all 0.4s ease; }
      .product-card:hover { transform: rotate(-1deg) translateY(-10px); box-shadow: 0 20px 40px rgba(139,92,246,0.2); }
      .section-header__title { font-family: var(--font-heading-family); font-size: clamp(2rem, 4vw, 3rem); }
    `,
    seo: {
      title: 'Art & Stationery | Creative Supplies',
      description: 'Shop premium art supplies and stationery. Quality materials for artists and creators.',
    },
  },

  // ============================================
  // 12. GARDENING TOOLS
  // ============================================
  'gardening-tools': {
    id: 'gardening-tools',
    name: 'Home & Cleaning Essentials / Gardening Tools',
    slug: 'gardening-tools',
    colors: {
      primary: '#16A34A',        // Green
      secondary: '#65A30D',      // Lime
      background: '#FFFFFF',
      backgroundAlt: '#F0FDF4',  // Light green
      text: '#1A3620',
      textMuted: '#4B5563',
      buttonText: '#FFFFFF',
      success: '#22C55E',
      gradient: 'linear-gradient(135deg, #16A34A 0%, #65A30D 100%)',
    },
    typography: {
      headingFont: 'merriweather_n7',
      bodyFont: 'open_sans_n4',
      headingWeight: '700',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Grow Your Garden',
      subheading: 'Quality tools for gardeners of all levels',
      buttonText: 'Shop Garden Tools',
      overlayOpacity: 40,
      textAlignment: 'left',
    },
    sections: {
      featuredProducts: {
        heading: 'Garden Essentials',
        subheading: 'Tools every gardener needs',
      },
      collections: {
        heading: 'Shop by Category',
        subheading: 'Find the right tools',
      },
      testimonials: {
        heading: 'Garden Stories',
        subheading: 'From our gardening community',
      },
      newsletter: {
        heading: 'Garden Tips',
        subheading: 'Seasonal advice and exclusive offers',
        buttonText: 'Join Free',
      },
      features: {
        heading: 'Why Garden With Us',
        items: [
          { icon: 'leaf', title: 'Eco-Friendly', description: 'Sustainable options' },
          { icon: 'tools', title: 'Durable Tools', description: 'Built to last seasons' },
          { icon: 'truck', title: 'Free Shipping', description: 'On orders over ₹599' },
          { icon: 'book', title: 'Garden Guides', description: 'Free growing tips' },
        ],
      },
      about: {
        heading: 'Our Story',
        content: 'We are passionate gardeners dedicated to helping you create beautiful outdoor spaces.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
        'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&q=80',
      ],
    },
    additionalCSS: `
      .hero-banner::before { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 150px; background: linear-gradient(to top, rgb(var(--color-base-background-1)), transparent); z-index: 2; }
      .button { border-radius: 8px; }
      .product-card { border-radius: 12px; overflow: hidden; transition: all 0.3s ease; }
      .product-card:hover { transform: translateY(-8px); box-shadow: 0 15px 40px rgba(22,163,74,0.2); }
    `,
    seo: {
      title: 'Gardening Tools | Grow Your Garden',
      description: 'Shop quality gardening tools and supplies. Everything you need for a beautiful garden.',
    },
  },

  // ============================================
  // 13. MOBILE ACCESSORIES
  // ============================================
  'mobile-accessories': {
    id: 'mobile-accessories',
    name: 'Mobile Accessories',
    slug: 'mobile-accessories',
    colors: {
      primary: '#2563EB',        // Blue
      secondary: '#7C3AED',      // Purple
      background: '#FFFFFF',
      backgroundAlt: '#EFF6FF',  // Light blue
      text: '#1E293B',
      textMuted: '#64748B',
      buttonText: '#FFFFFF',
      success: '#22C55E',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
    },
    typography: {
      headingFont: 'inter_n7',
      bodyFont: 'inter_n4',
      headingWeight: '700',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Gear Up Your Device',
      subheading: 'Premium accessories for your smartphone',
      buttonText: 'Shop Now',
      overlayOpacity: 45,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Trending Accessories',
        subheading: 'Most popular mobile gear',
      },
      collections: {
        heading: 'Shop by Type',
        subheading: 'Find what you need',
      },
      testimonials: {
        heading: 'Customer Reviews',
        subheading: 'What users say',
      },
      newsletter: {
        heading: 'Tech Updates',
        subheading: 'New arrivals and exclusive deals',
        buttonText: 'Subscribe',
      },
      features: {
        heading: 'Why Buy From Us',
        items: [
          { icon: 'shield', title: 'Quality Tested', description: 'Certified accessories' },
          { icon: 'device', title: 'Wide Compatibility', description: 'All major brands' },
          { icon: 'truck', title: 'Fast Shipping', description: 'Same-day dispatch' },
          { icon: 'refresh', title: 'Easy Returns', description: '15-day return policy' },
        ],
      },
      about: {
        heading: 'About Us',
        content: 'We offer premium mobile accessories that enhance and protect your devices.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&q=80',
      ],
    },
    additionalCSS: `
      .button { border-radius: 12px; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); }
      .button:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(37,99,235,0.3); }
      .product-card { border-radius: 16px; background: #fff; transition: all 0.3s ease; }
      .product-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 50px rgba(37,99,235,0.15); }
    `,
    seo: {
      title: 'Mobile Accessories | Gear Up Your Device',
      description: 'Shop premium mobile accessories. Cases, chargers, earphones, and more for all devices.',
    },
  },

  // ============================================
  // 14. KITCHEN ESSENTIALS
  // ============================================
  'kitchen-essentials': {
    id: 'kitchen-essentials',
    name: 'Kitchen Essentials',
    slug: 'kitchen-essentials',
    colors: {
      primary: '#EA580C',        // Orange
      secondary: '#DC2626',      // Red
      background: '#FFFFFF',
      backgroundAlt: '#FFF7ED',  // Light orange
      text: '#1C1917',
      textMuted: '#57534E',
      buttonText: '#FFFFFF',
      success: '#16A34A',
      gradient: 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)',
    },
    typography: {
      headingFont: 'josefin_sans_n6',
      bodyFont: 'josefin_sans_n4',
      headingWeight: '600',
      bodyWeight: '400',
    },
    hero: {
      heading: 'Kitchen Made Easy',
      subheading: 'Essential tools for everyday cooking',
      buttonText: 'Shop Essentials',
      overlayOpacity: 35,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'Kitchen Favorites',
        subheading: 'Must-have cooking tools',
      },
      collections: {
        heading: 'Shop Categories',
        subheading: 'Explore our collections',
      },
      testimonials: {
        heading: 'Happy Cooks',
        subheading: 'What our customers say',
      },
      newsletter: {
        heading: 'Kitchen Tips',
        subheading: 'Recipes and exclusive deals',
        buttonText: 'Subscribe',
      },
      features: {
        heading: 'Our Promise',
        items: [
          { icon: 'check', title: 'Food-Safe', description: 'BPA-free materials' },
          { icon: 'star', title: 'Quality Made', description: 'Durable products' },
          { icon: 'truck', title: 'Fast Delivery', description: 'Quick shipping' },
          { icon: 'refresh', title: 'Easy Returns', description: 'Hassle-free policy' },
        ],
      },
      about: {
        heading: 'About Us',
        content: 'We bring you quality kitchen essentials that make cooking a joy.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
        'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&q=80',
      ],
    },
    additionalCSS: `
      .button { border-radius: 50px; }
      .product-card { border-radius: 16px; transition: all 0.3s ease; }
      .product-card:hover { transform: translateY(-6px); box-shadow: 0 15px 40px rgba(234,88,12,0.15); }
      .section-header__title { color: rgb(var(--color-base-accent-1)); }
    `,
    seo: {
      title: 'Kitchen Essentials | Cooking Made Easy',
      description: 'Shop kitchen essentials and cooking tools. Quality products for your kitchen.',
    },
  },

  // ============================================
  // 15. GYM & SUPPLIES
  // ============================================
  'gym-supplies': {
    id: 'gym-supplies',
    name: 'Gym & Supplies',
    slug: 'gym-supplies',
    colors: {
      primary: '#18181B',        // Black
      secondary: '#EF4444',      // Red accent
      background: '#FFFFFF',
      backgroundAlt: '#F4F4F5',  // Light gray
      text: '#18181B',
      textMuted: '#71717A',
      buttonText: '#FFFFFF',
      success: '#22C55E',
      gradient: 'linear-gradient(135deg, #18181B 0%, #3F3F46 100%)',
    },
    typography: {
      headingFont: 'anton_n4',
      bodyFont: 'roboto_n4',
      headingWeight: '400',
      bodyWeight: '400',
    },
    hero: {
      heading: 'TRAIN HARDER',
      subheading: 'Premium gym equipment and fitness gear',
      buttonText: 'SHOP NOW',
      overlayOpacity: 50,
      textAlignment: 'center',
    },
    sections: {
      featuredProducts: {
        heading: 'TOP GEAR',
        subheading: 'Best-selling fitness equipment',
      },
      collections: {
        heading: 'SHOP BY GOAL',
        subheading: 'Find gear for your workout',
      },
      testimonials: {
        heading: 'ATHLETE REVIEWS',
        subheading: 'What our community says',
      },
      newsletter: {
        heading: 'JOIN THE TEAM',
        subheading: 'Workout tips and exclusive deals',
        buttonText: 'SIGN UP',
      },
      features: {
        heading: 'WHY CHOOSE US',
        items: [
          { icon: 'dumbbell', title: 'Pro Quality', description: 'Gym-grade equipment' },
          { icon: 'shield', title: 'Durable', description: 'Built to last' },
          { icon: 'truck', title: 'Fast Shipping', description: 'Get training faster' },
          { icon: 'support', title: 'Expert Help', description: 'Fitness advice available' },
        ],
      },
      about: {
        heading: 'OUR MISSION',
        content: 'We equip athletes and fitness enthusiasts with quality gear to achieve their goals.',
      },
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
      about: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
      placeholders: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
      ],
    },
    additionalCSS: `
      .hero-banner__heading { font-size: clamp(3rem, 10vw, 8rem); letter-spacing: 0.05em; }
      .section-header__title { letter-spacing: 0.1em; }
      .button { border-radius: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; }
      .button:hover { background: #EF4444; }
      .product-card { transition: all 0.2s ease; }
      .product-card:hover { transform: scale(1.03); }
      .product-card__badge--sale { background: #EF4444; }
    `,
    seo: {
      title: 'Gym & Fitness Supplies | Train Harder',
      description: 'Shop premium gym equipment and fitness gear. Quality supplies for serious athletes.',
    },
  },
};

/**
 * Get niche theme by slug (handles variations)
 */
export function getNicheTheme(nicheNameOrSlug: string): NicheThemeConfig | null {
  // Direct match
  if (nicheThemes[nicheNameOrSlug]) {
    return nicheThemes[nicheNameOrSlug];
  }

  // Convert name to slug and try again
  const slug = nicheNameOrSlug
    .toLowerCase()
    .replace(/[&\/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  if (nicheThemes[slug]) {
    return nicheThemes[slug];
  }

  // Try partial match
  for (const [key, theme] of Object.entries(nicheThemes)) {
    if (
      theme.name.toLowerCase().includes(nicheNameOrSlug.toLowerCase()) ||
      nicheNameOrSlug.toLowerCase().includes(theme.name.toLowerCase())
    ) {
      return theme;
    }
  }

  return null;
}

/**
 * Get all niche themes
 */
export function getAllNicheThemes(): NicheThemeConfig[] {
  return Object.values(nicheThemes);
}

/**
 * Default theme for unknown niches
 */
export const defaultTheme: NicheThemeConfig = {
  id: 'default',
  name: 'Default',
  slug: 'default',
  colors: {
    primary: '#1A1A1A',
    secondary: '#4A90D9',
    background: '#FFFFFF',
    backgroundAlt: '#F5F5F5',
    text: '#1A1A1A',
    textMuted: '#666666',
    buttonText: '#FFFFFF',
    success: '#22C55E',
  },
  typography: {
    headingFont: 'assistant_n6',
    bodyFont: 'assistant_n4',
    headingWeight: '600',
    bodyWeight: '400',
  },
  hero: {
    heading: 'Welcome to Our Store',
    subheading: 'Discover our amazing collection of products',
    buttonText: 'Shop Now',
    overlayOpacity: 30,
    textAlignment: 'center',
  },
  sections: {
    featuredProducts: {
      heading: 'Featured Products',
      subheading: 'Our best sellers',
    },
    collections: {
      heading: 'Shop by Category',
      subheading: 'Browse our collections',
    },
    testimonials: {
      heading: 'Customer Reviews',
      subheading: 'What our customers say',
    },
    newsletter: {
      heading: 'Stay Updated',
      subheading: 'Subscribe for news and offers',
      buttonText: 'Subscribe',
    },
    features: {
      heading: 'Why Choose Us',
      items: [
        { icon: 'truck', title: 'Free Shipping', description: 'On orders over ₹499' },
        { icon: 'shield', title: 'Secure Payment', description: 'Safe transactions' },
        { icon: 'refresh', title: 'Easy Returns', description: '30-day return policy' },
        { icon: 'support', title: '24/7 Support', description: 'Always here to help' },
      ],
    },
    about: {
      heading: 'About Us',
      content: 'We are dedicated to bringing you the best products at great prices.',
    },
  },
  images: {
    hero: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    about: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    placeholders: [],
  },
  additionalCSS: '',
  seo: {
    title: 'Welcome to Our Store',
    description: 'Shop our amazing collection of quality products.',
  },
};

