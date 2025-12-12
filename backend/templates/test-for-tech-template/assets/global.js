// Global JavaScript for Dawn-based Theme

document.addEventListener('DOMContentLoaded', function() {
  // Product form variant handling
  initProductForms();
  
  // Product thumbnails
  initProductThumbnails();
});

function initProductForms() {
  const productForms = document.querySelectorAll('.main-product__form');
  
  productForms.forEach(form => {
    const selects = form.querySelectorAll('.main-product__option-select');
    const hiddenInput = form.querySelector('input[name="id"]');
    
    if (!selects.length || !hiddenInput) return;
    
    selects.forEach(select => {
      select.addEventListener('change', () => {
        // This is a simplified variant handling
        // In production, you would match selected options to variants
        console.log('Variant selection changed');
      });
    });
  });
}

function initProductThumbnails() {
  const thumbnailButtons = document.querySelectorAll('.main-product__thumbnail');
  const featuredImageContainer = document.querySelector('.main-product__featured-image');
  
  if (!thumbnailButtons.length || !featuredImageContainer) return;
  
  thumbnailButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all thumbnails
      thumbnailButtons.forEach(btn => btn.classList.remove('main-product__thumbnail--active'));
      
      // Add active class to clicked thumbnail
      button.classList.add('main-product__thumbnail--active');
      
      // Update featured image
      const thumbnailImg = button.querySelector('img');
      if (thumbnailImg) {
        const featuredImg = featuredImageContainer.querySelector('img');
        if (featuredImg) {
          // Get larger version of the thumbnail image
          const newSrc = thumbnailImg.src.replace(/width=\d+/, 'width=1200');
          featuredImg.src = newSrc;
        }
      }
    });
  });
}

// Cart functionality would go here in a full implementation
// This is a placeholder for cart drawer, add to cart AJAX, etc.

