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
// CONTACT FORM HANDLING
// ============================================

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // Validate form
        if (!name || !email || !message) {
            alert('Please fill in all fields');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Show success message (in a real application, this would send to a server)
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        submitButton.textContent = '✓ Message Sent!';
        submitButton.style.backgroundColor = '#25D366';
        
        // Generate mailto link with form data
        const mailtoLink = `mailto:team@districtspanish.com?subject=New Contact: ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${encodeURIComponent(name)} (${encodeURIComponent(email)})`;
        
        // Reset form
        setTimeout(() => {
            contactForm.reset();
            submitButton.textContent = originalText;
            submitButton.style.backgroundColor = '';
        }, 2000);
    });
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
// READY STATE
// ============================================

console.log('%cDistrict Spanish website is live and ready!', 'color: #f69521; font-weight: bold; font-size: 12px;');
