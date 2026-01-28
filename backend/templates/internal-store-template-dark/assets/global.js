/**
 * Global JavaScript for Shopify Theme
 * Handles scroll animations, cart interactions, and UI enhancements
 */

(function() {
  'use strict';

  // ========================================
  // Scroll Reveal Animation
  // ========================================
  const revealElements = () => {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  };

  // ========================================
  // Smooth Scroll for Anchor Links
  // ========================================
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  };

  // ========================================
  // Header Scroll Effect
  // ========================================
  const initHeaderScroll = () => {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;
    const scrollThreshold = 100;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > scrollThreshold) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }

      // Hide/show on scroll direction
      if (currentScroll > lastScroll && currentScroll > 300) {
        header.classList.add('header--hidden');
      } else {
        header.classList.remove('header--hidden');
      }

      lastScroll = currentScroll;
    }, { passive: true });
  };

  // ========================================
  // Mobile Menu Toggle
  // ========================================
  const initMobileMenu = () => {
    const menuToggle = document.querySelector('.header__menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeBtn = document.querySelector('.mobile-menu__close');
    const overlay = document.querySelector('.mobile-menu__overlay');

    if (!menuToggle || !mobileMenu) return;

    const toggleMenu = (open) => {
      mobileMenu.classList.toggle('mobile-menu--open', open);
      document.body.classList.toggle('overflow-hidden', open);
    };

    menuToggle.addEventListener('click', () => toggleMenu(true));
    closeBtn?.addEventListener('click', () => toggleMenu(false));
    overlay?.addEventListener('click', () => toggleMenu(false));

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('mobile-menu--open')) {
        toggleMenu(false);
      }
    });
  };

  // ========================================
  // Product Image Gallery
  // ========================================
  const initProductGallery = () => {
    const thumbnails = document.querySelectorAll('.product-gallery__thumbnail');
    const mainImage = document.querySelector('.product-gallery__main-image');

    if (!thumbnails.length || !mainImage) return;

    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const newSrc = thumb.dataset.src;
        const newAlt = thumb.dataset.alt || '';

        // Update main image with fade effect
        mainImage.style.opacity = '0';
        setTimeout(() => {
          mainImage.src = newSrc;
          mainImage.alt = newAlt;
          mainImage.style.opacity = '1';
        }, 200);

        // Update active state
        thumbnails.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  };

  // ========================================
  // Quantity Selector
  // ========================================
  const initQuantitySelectors = () => {
    document.querySelectorAll('.quantity-selector').forEach(selector => {
      const minusBtn = selector.querySelector('.quantity-selector__minus');
      const plusBtn = selector.querySelector('.quantity-selector__plus');
      const input = selector.querySelector('.quantity-selector__input');

      if (!input) return;

      const updateQuantity = (delta) => {
        const min = parseInt(input.min) || 1;
        const max = parseInt(input.max) || 999;
        let value = parseInt(input.value) + delta;
        
        value = Math.max(min, Math.min(max, value));
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      minusBtn?.addEventListener('click', () => updateQuantity(-1));
      plusBtn?.addEventListener('click', () => updateQuantity(1));
    });
  };

  // ========================================
  // Add to Cart Animation
  // ========================================
  const initAddToCart = () => {
    document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
      btn.addEventListener('click', async function(e) {
        const form = this.closest('form');
        if (!form) return;

        const originalText = this.innerHTML;
        this.innerHTML = '<span class="loading-spinner"></span>';
        this.disabled = true;

        try {
          const formData = new FormData(form);
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            this.innerHTML = '✓ Added!';
            this.classList.add('button--success');
            
            // Update cart count
            updateCartCount();

            setTimeout(() => {
              this.innerHTML = originalText;
              this.classList.remove('button--success');
              this.disabled = false;
            }, 2000);
          } else {
            throw new Error('Failed to add to cart');
          }
        } catch (error) {
          this.innerHTML = 'Error';
          setTimeout(() => {
            this.innerHTML = originalText;
            this.disabled = false;
          }, 2000);
        }
      });
    });
  };

  // ========================================
  // Update Cart Count
  // ========================================
  const updateCartCount = async () => {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      const countElements = document.querySelectorAll('.cart-count');
      
      countElements.forEach(el => {
        el.textContent = cart.item_count;
        el.classList.toggle('cart-count--hidden', cart.item_count === 0);
      });
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  };

  // ========================================
  // Newsletter Form
  // ========================================
  const initNewsletterForm = () => {
    document.querySelectorAll('.newsletter__form').forEach(form => {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const button = this.querySelector('button[type="submit"]');
        const input = this.querySelector('input[type="email"]');
        const originalText = button.innerHTML;

        button.innerHTML = '<span class="loading-spinner"></span>';
        button.disabled = true;

        // Simulate submission (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 1000));

        button.innerHTML = '✓ Subscribed!';
        input.value = '';

        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 3000);
      });
    });
  };

  // ========================================
  // Lazy Loading Images
  // ========================================
  const initLazyLoad = () => {
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading supported
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
      });
    } else {
      // Fallback for older browsers
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            imageObserver.unobserve(img);
          }
        });
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    }
  };

  // ========================================
  // Announcement Bar Dismiss
  // ========================================
  const initAnnouncementBar = () => {
    const bar = document.querySelector('.announcement-bar');
    const closeBtn = bar?.querySelector('.announcement-bar__close');

    if (!bar || !closeBtn) return;

    closeBtn.addEventListener('click', () => {
      bar.style.height = bar.offsetHeight + 'px';
      requestAnimationFrame(() => {
        bar.style.height = '0';
        bar.style.overflow = 'hidden';
        bar.style.padding = '0';
        bar.style.margin = '0';
      });
      
      // Save preference
      sessionStorage.setItem('announcement-dismissed', 'true');
    });

    // Check if already dismissed
    if (sessionStorage.getItem('announcement-dismissed') === 'true') {
      bar.style.display = 'none';
    }
  };

  // ========================================
  // Accordion
  // ========================================
  const initAccordions = () => {
    document.querySelectorAll('.accordion__trigger').forEach(trigger => {
      trigger.addEventListener('click', function() {
        const item = this.closest('.accordion__item');
        const content = item.querySelector('.accordion__content');
        const isOpen = item.classList.contains('accordion__item--open');

        // Close all other items in same accordion
        const accordion = item.closest('.accordion');
        accordion?.querySelectorAll('.accordion__item--open').forEach(openItem => {
          if (openItem !== item) {
            openItem.classList.remove('accordion__item--open');
            openItem.querySelector('.accordion__content').style.maxHeight = null;
          }
        });

        // Toggle current item
        item.classList.toggle('accordion__item--open', !isOpen);
        content.style.maxHeight = isOpen ? null : content.scrollHeight + 'px';
      });
    });
  };

  // ========================================
  // Tabs
  // ========================================
  const initTabs = () => {
    document.querySelectorAll('.tabs').forEach(tabContainer => {
      const triggers = tabContainer.querySelectorAll('.tabs__trigger');
      const panels = tabContainer.querySelectorAll('.tabs__panel');

      triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
          const targetId = trigger.dataset.target;

          // Update triggers
          triggers.forEach(t => t.classList.remove('tabs__trigger--active'));
          trigger.classList.add('tabs__trigger--active');

          // Update panels
          panels.forEach(panel => {
            panel.classList.toggle('tabs__panel--active', panel.id === targetId);
          });
        });
      });
    });
  };

  // ========================================
  // Back to Top Button
  // ========================================
  const initBackToTop = () => {
    const button = document.querySelector('.back-to-top');
    if (!button) return;

    window.addEventListener('scroll', () => {
      button.classList.toggle('back-to-top--visible', window.pageYOffset > 500);
    }, { passive: true });

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // ========================================
  // Initialize Everything
  // ========================================
  const init = () => {
    revealElements();
    initSmoothScroll();
    initHeaderScroll();
    initMobileMenu();
    initProductGallery();
    initQuantitySelectors();
    initAddToCart();
    initNewsletterForm();
    initLazyLoad();
    initAnnouncementBar();
    initAccordions();
    initTabs();
    initBackToTop();
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also run reveal on dynamic content changes
  document.addEventListener('shopify:section:load', revealElements);

})();
