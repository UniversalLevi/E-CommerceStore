/**
 * Minimal Theme - Animations
 * Smooth scroll animations and interactions
 */

(function() {
  'use strict';

  // ============================================
  // Intersection Observer for Fade-in Animations
  // ============================================
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Initialize fade-in animations
  function initFadeAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in-on-scroll');
    fadeElements.forEach((el) => {
      fadeInObserver.observe(el);
    });
  }

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ============================================
  // Image Lazy Loading Enhancement
  // ============================================
  
  function initLazyImages() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      lazyImages.forEach((img) => {
        img.addEventListener('load', () => {
          img.classList.add('is-loaded');
        });
      });
    } else {
      // Fallback for browsers without native lazy loading
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.add('is-loaded');
            imageObserver.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  // ============================================
  // Product Card Hover Effects
  // ============================================
  
  function initProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach((card) => {
      const images = card.querySelectorAll('.product-image');
      
      if (images.length > 1) {
        card.addEventListener('mouseenter', () => {
          images[0].style.opacity = '0';
          images[1].style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', () => {
          images[0].style.opacity = '1';
          images[1].style.opacity = '0';
        });
      }
    });
  }

  // ============================================
  // Header Scroll Effects
  // ============================================
  
  function initHeaderScroll() {
    const header = document.querySelector('.header, header');
    if (!header) return;
    
    let lastScroll = 0;
    const scrollThreshold = 100;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      // Add scrolled class when page is scrolled
      if (currentScroll > scrollThreshold) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      
      // Hide/show header on scroll direction
      if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
      
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ============================================
  // Mobile Menu Toggle
  // ============================================
  
  function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle, [data-menu-toggle]');
    const mobileMenu = document.querySelector('.mobile-menu, [data-mobile-menu]');
    
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('is-open');
        menuToggle.classList.toggle('is-active', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen);
      });
    }
  }

  // ============================================
  // Initialize All Animations
  // ============================================
  
  function init() {
    initFadeAnimations();
    initSmoothScroll();
    initLazyImages();
    initProductCards();
    initHeaderScroll();
    initMobileMenu();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Reinitialize after AJAX navigation (for Shopify themes with AJAX)
  document.addEventListener('shopify:section:load', init);

})();

