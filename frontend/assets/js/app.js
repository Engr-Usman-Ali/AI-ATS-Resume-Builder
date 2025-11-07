// ============================================
// GLOBAL APP CONFIGURATION
// ============================================

// app.py (JavaScript contents)

// API Base URL - Update this when deploying
const API_BASE_URL = 'http://localhost:5000/api'; 
// ...
window.API_BASE_URL = API_BASE_URL; // Exporting to global scope

// ============================================
// UTILITY FUNCTIONS
// ============================================

const Utils = {
    // Show loading spinner
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="spinner"></div>';
            element.disabled = true;
        }
    },
    
    // Hide loading spinner
    hideLoading(elementId, originalText) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = originalText;
            element.disabled = false;
        }
    },
    
    // Show alert message
    showAlert(message, type = 'info', containerId = 'alert-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            // Fallback to browser alert if container doesn't exist
            alert(message);
            return;
        }
        
        const alertClasses = {
            success: 'alert-success',
            error: 'alert-error',
            warning: 'alert-warning',
            info: 'alert-info'
        };
        
        const alert = document.createElement('div');
        alert.className = `alert ${alertClasses[type]} animate-slide-down`;
        alert.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current hover:opacity-75">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    },
    
    // Validate email
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Format date
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ============================================
// MOBILE MENU FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                if (mobileMenu) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });
});

// ============================================
// EXPORT TO WINDOW
// ============================================

window.Utils = Utils;
window.API_BASE_URL = API_BASE_URL;

console.log("✅ App utilities loaded successfully");