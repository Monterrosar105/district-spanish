/* ============================================
   District Spanish - JavaScript
   ============================================ */

// ============================================
// MOBILE MENU TOGGLE
// ============================================

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle menu on hamburger click
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when a nav link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// ============================================
// SMOOTH SCROLLING FOR ANCHOR LINKS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Don't prevent default for empty anchors
        if (href === '#') return;
        
        e.preventDefault();
        
        const target = document.querySelector(href);
        if (target) {
            const offsetTop = target.offsetTop - 70; // Account for sticky navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// FAQ ACCORDION
// ============================================

// Get all FAQ question buttons
const faqButtons = document.querySelectorAll('.faq-question');

faqButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        // Get corresponding answer
        const answer = button.nextElementSibling;
        
        // Close all other FAQs
        faqButtons.forEach((otherButton, otherIndex) => {
            if (otherIndex !== index) {
                otherButton.parentElement.classList.remove('active');
                otherButton.nextElementSibling.classList.remove('active');
            }
        });
        
        // Toggle current FAQ
        button.parentElement.classList.toggle('active');
        answer.classList.toggle('active');
    });
});

// ============================================
// MODAL HANDLING
// ============================================

const formModal = document.getElementById('formModal');
const openFormModal = document.getElementById('openFormModal');
const navOpenFormModal = document.getElementById('navOpenFormModal');
const heroOpenFormModal = document.getElementById('heroOpenFormModal');
const closeFormModal = document.getElementById('closeFormModal');
const modalOverlay = document.getElementById('modalOverlay');

// Open modal function
function openModal() {
  formModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Open modal from Contact Info button
if (openFormModal) {
  openFormModal.addEventListener('click', openModal);
}

// Open modal from Navbar button
if (navOpenFormModal) {
  navOpenFormModal.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });
}

// Open modal from Hero button
if (heroOpenFormModal) {
  heroOpenFormModal.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });
}

// Open form modal from program modal "Book FREE Level Assessment" buttons
document.querySelectorAll('.open-form-modal-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    closeProgramModals();
    openModal();
  });
});

// Close modal
function closeModal() {
  formModal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

if (closeFormModal) {
  closeFormModal.addEventListener('click', closeModal);
}

// Close modal when clicking overlay
if (modalOverlay) {
  modalOverlay.addEventListener('click', closeModal);
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && formModal.classList.contains('active')) {
    closeModal();
  }
});

// ============================================
// CONTACT FORM HANDLING
// ============================================

const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

// Show/hide "Other" field for schedule
const scheduleOtherCheck = document.getElementById('scheduleOtherCheck');
const scheduleOtherInput = document.querySelector('.schedule-other-input');

if (scheduleOtherCheck) {
  scheduleOtherCheck.addEventListener('change', (e) => {
    scheduleOtherInput.style.display = e.target.checked ? 'block' : 'none';
  });
}

// Show/hide "Other" field for referral source
const referralSourceSelect = document.getElementById('referralSource');
const referralOtherInput = document.querySelector('.referral-other-input');

if (referralSourceSelect) {
  referralSourceSelect.addEventListener('change', (e) => {
    referralOtherInput.style.display = e.target.value === 'Other' ? 'block' : 'none';
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous status messages
    formStatus.textContent = '';
    formStatus.className = 'form-status';

    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const level = document.getElementById('level').value;
    const experience = document.getElementById('experience').value.trim();
    const comments = document.getElementById('comments').value.trim();
    const referralSource = document.getElementById('referralSource').value;
    const referralOther = document.getElementById('referralOther').value.trim();

    // Get schedule checkboxes
    const scheduleCheckboxes = document.querySelectorAll('input[name="schedule"]:checked');
    const schedule = Array.from(scheduleCheckboxes).map(cb => cb.value);
    const scheduleOther = document.getElementById('scheduleOther').value.trim();

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !level || !referralSource) {
      showFormStatus('Please fill in all required fields (*)', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFormStatus('Please enter a valid email address', 'error');
      return;
    }

    // Build form data object
    const formData = {
      firstName,
      lastName,
      email,
      phone,
      level,
      experience,
      schedule,
      scheduleOther,
      comments,
      referralSource,
      referralOther
    };

    // Show loading state
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
      // Send POST request to Cloudflare Workers
      const response = await fetch('https://district-spanish-form.robmonterrosa105.workers.dev/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        showFormStatus('✓ Thank you! We received your message and will contact you soon.', 'success');
        contactForm.reset();
        scheduleOtherInput.style.display = 'none';
        referralOtherInput.style.display = 'none';
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;

        // Clear success message and close modal after 3 seconds
        setTimeout(() => {
          formStatus.textContent = '';
          closeModal();
        }, 3000);
      } else {
        // Error response from server
        showFormStatus(result.error || 'An error occurred. Please try again.', 'error');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showFormStatus('Network error. Please check your connection and try again.', 'error');
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
}

/**
 * Display form status message
 */
function showFormStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = `form-status form-status--${type}`;
  formStatus.style.display = 'block';

  // Scroll to message
  formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// SCROLL ANIMATIONS (Fade-in on scroll)
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.program-card, .step-card, .teacher-card, .testimonial-card, .culture-card, .pricing-card').forEach(element => {
    observer.observe(element);
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

const navbar = document.querySelector('.navbar');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add shadow on scroll
    if (scrollTop > 10) {
        navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.08)';
    }
    
    lastScrollTop = scrollTop;
});

// ============================================
// ENHANCED BUTTON HOVER EFFECTS
// ============================================

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// ============================================
// PAGE LOAD ANIMATION
// ============================================

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Set initial opacity
document.body.style.opacity = '0.95';
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '1';
});

// ============================================
// HERO SECTION PARALLAX EFFECT (Optional)
// ============================================

const hero = document.querySelector('.hero');

if (hero) {
    window.addEventListener('scroll', () => {
        const scrollPosition = window.pageYOffset;
        hero.style.backgroundPosition = `0 ${scrollPosition * 0.5}px`;
    });
}

// ============================================
// INACTIVE TAB DETECTION (Optional engagement feature)
// ============================================

let isTabActive = true;

window.addEventListener('focus', () => {
    isTabActive = true;
});

window.addEventListener('blur', () => {
    isTabActive = false;
});

// ============================================
// RESPONSIVE UTILITIES
// ============================================

/**
 * Check if device is in mobile view
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Handle touch events for better mobile UX
 */
document.addEventListener('touchstart', () => {
    // Remove hover states on touch devices
    document.body.classList.add('touch-device');
}, { passive: true });

// ============================================
// CONSOLE MESSAGE (Branding)
// ============================================

console.log('%c🌍 Welcome to District Spanish!', 'font-size: 20px; color: #f69521; font-weight: bold;');
console.log('%cLearn Spanish with confidence from native teachers worldwide.', 'font-size: 14px; color: #1e6294;');
console.log('%cVisit: www.districtspanish.com | Email: team@districtspanish.com', 'font-size: 12px; color: #666;');

// ============================================
// PERFORMANCE MONITORING (Optional)
// ============================================

if (window.performance) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('%cPage loaded in ' + pageLoadTime + 'ms', 'color: #25D366; font-weight: bold;');
    });
}

// ============================================
// EXTERNAL LINK TRACKING
// ============================================

document.querySelectorAll('a[href^="http"], a[href^="https"], a[href^="mailto"], a[href^="https://wa.me"]').forEach(link => {
    // Add target="_blank" for external links
    if (link.hostname !== window.location.hostname && !link.getAttribute('target')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    }
});

// ============================================
// UTILITY: Print page (for potential future use)
// ============================================

/**
 * Print page functionality
 */
window.printPage = function() {
    window.print();
};

// ============================================
// PROGRAM MODALS
// ============================================

const programModalIds = ['privateModal', 'groupModal', 'couplesModal', 'tutoringModal'];

function closeProgramModals() {
  programModalIds.forEach(id => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  });
  document.body.style.overflow = 'auto';
}

// Open modal triggered by data-modal attribute
document.querySelectorAll('[data-modal]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const modalId = trigger.getAttribute('data-modal');
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
});

// Close program modals via their close buttons and overlays
[
  ['closePrivateModal',   'privateModalOverlay'],
  ['closeGroupModal',     'groupModalOverlay'],
  ['closeCouplesModal',   'couplesModalOverlay'],
  ['closeTutoringModal',  'tutoringModalOverlay'],
].forEach(([btnId, overlayId]) => {
  const btn = document.getElementById(btnId);
  const overlay = document.getElementById(overlayId);
  if (btn) btn.addEventListener('click', closeProgramModals);
  if (overlay) overlay.addEventListener('click', closeProgramModals);
});

// Close program modals with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProgramModals();
});

// Close program modals when clicking a "Get Started" link inside them
document.addEventListener('click', (e) => {
  if (e.target.closest('.program-modal-cta')) {
    closeProgramModals();
  }
});

// ============================================
// READY STATE
// ============================================

console.log('%cDistrict Spanish website is live and ready!', 'color: #f69521; font-weight: bold; font-size: 12px;');
