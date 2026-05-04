// Hero Slider
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.hero-slider .slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    currentSlideIndex = index;
    if (currentSlideIndex >= slides.length) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = slides.length - 1;
    
    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');
}

function nextSlide() {
    showSlide(currentSlideIndex + 1);
}

function currentSlide(index) {
    showSlide(index - 1);
}

// Auto slide
let sliderInterval = setInterval(nextSlide, 5000);

// Stop auto slide on interaction
dots.forEach(dot => {
    dot.addEventListener('click', () => {
        clearInterval(sliderInterval);
        sliderInterval = setInterval(nextSlide, 5000);
    });
});

// Testimonial Carousel
let currentTestimonialIndex = 0;
const testimonialSlides = document.querySelectorAll('.testimonial-slide');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const testimonialContainer = document.querySelector('.testimonial-container');

function showTestimonial(index) {
    if (index >= testimonialSlides.length) currentTestimonialIndex = 0;
    else if (index < 0) currentTestimonialIndex = testimonialSlides.length - 1;
    else currentTestimonialIndex = index;
    
    const offset = -currentTestimonialIndex * 100;
    testimonialContainer.style.transform = `translateX(${offset}%)`;
    
    testimonialSlides.forEach((slide, i) => {
        if (i === currentTestimonialIndex) slide.classList.add('active');
        else slide.classList.remove('active');
    });
}

if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => showTestimonial(currentTestimonialIndex - 1));
    nextBtn.addEventListener('click', () => showTestimonial(currentTestimonialIndex + 1));
}

// Auto testimonial slide
setInterval(() => showTestimonial(currentTestimonialIndex + 1), 6000);

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        mobileMenuBtn.classList.toggle('active');
        
        // Animate hamburger to X
        const spans = mobileMenuBtn.querySelectorAll('span');
        if (mobileNav.classList.contains('open')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close mobile nav when clicking a link
const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        const spans = mobileMenuBtn.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// Form Submission Handling
const bookingForm = document.getElementById('cab-booking-form');
if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            mobile: document.getElementById('mobile').value,
            from: document.getElementById('from').value,
            to: document.getElementById('to').value,
            date: document.getElementById('date').value
        };
        
        console.log('Booking submitted:', formData);
        
        // Show success message
        const submitBtn = bookingForm.querySelector('button');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Booking Successful!';
        submitBtn.style.backgroundColor = '#28a745';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            bookingForm.reset();
            submitBtn.innerText = originalText;
            submitBtn.style.backgroundColor = '';
            submitBtn.disabled = false;
        }, 3000);
    });
}

// Set min date to today for booking
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Main Hero Toggle (Cars vs Local Packages)
const btnToggleCars = document.getElementById("btn-toggle-cars");
const btnTogglePackages = document.getElementById("btn-toggle-packages");
const bookingWrapper = document.getElementById("booking");
const localPackagesWrapper = document.getElementById("local-packages-wrapper");
const trustSection = document.getElementById("trust-section");

if (btnToggleCars && btnTogglePackages) {
    btnToggleCars.addEventListener("click", () => {
        btnToggleCars.classList.add("active");
        btnTogglePackages.classList.remove("active");
        bookingWrapper.style.display = "block";
        localPackagesWrapper.style.display = "none";
        if(trustSection) trustSection.style.display = "flex";
    });

    btnTogglePackages.addEventListener("click", () => {
        btnTogglePackages.classList.add("active");
        btnToggleCars.classList.remove("active");
        bookingWrapper.style.display = "none";
        localPackagesWrapper.style.display = "block";
        if(trustSection) trustSection.style.display = "none";
    });
}

