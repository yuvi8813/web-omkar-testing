const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    loadFrontendCars();
    loadFrontendTestimonials();
    loadFrontendLocalPackages();
});

async function loadFrontendCars() {
    const grid = document.getElementById('frontend-cars-grid');
    if (!grid) return;

    try {
        const res = await fetch(`${API_BASE_URL}/cars`);
        const cars = await res.json();
        
        if (cars.length === 0) return; // Keep existing if none
        
        grid.innerHTML = '';
        cars.forEach(car => {
            let featuresHtml = '';
            if (car.features && Array.isArray(car.features)) {
                featuresHtml = car.features.map(f => `<li>${f}</li>`).join('');
            }

            grid.innerHTML += `
                <div class="car-card">
                    <div class="car-image">
                        <img src="${car.image}" alt="${car.name}">
                    </div>
                    <div class="car-info">
                        <h4>${car.name}</h4>
                        <p class="price">${car.price}</p>
                        <ul class="features">
                            ${featuresHtml}
                        </ul>
                        <a href="book-fleet.html?id=${car.id}" class="btn btn-dark btn-full">Book Now</a>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error('Error loading cars:', err);
    }
}

async function loadFrontendTestimonials() {
    const container = document.getElementById('frontend-testimonials-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/cards`);
        const cards = await res.json();
        
        if (cards.length === 0) return;

        container.innerHTML = '';
        cards.forEach((card, index) => {
            const stars = '★'.repeat(card.rating) + '☆'.repeat(5 - card.rating);
            const activeClass = index === 0 ? 'active' : '';
            container.innerHTML += `
                <div class="testimonial-slide ${activeClass}">
                    <div class="stars">${stars}</div>
                    <p>"${card.text}"</p>
                    <h5>- ${card.author}</h5>
                </div>
            `;
        });

        // Re-initialize slider if needed, assuming existing script.js handles it or we might need to reset it.
        // The existing slider might depend on the elements being there at load. 
        // A simple re-init or just letting it be if script.js runs after might work.
        // Wait, script.js might have already run. So we might need to dispatch an event or call a function.
        // Actually, if we just replace it, we might need to manually trigger the first slide.
    } catch (err) {
        console.error('Error loading testimonials:', err);
    }
}

async function loadFrontendLocalPackages() {
    const container = document.getElementById('frontend-local-packages-grid');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/local_packages`);
        const lps = await res.json();
        
        if (lps.length === 0) return;

        container.innerHTML = '';
        lps.forEach(lp => {
            container.innerHTML += `
                <div class="local-package-card">
                    <div class="lp-img-wrapper">
                        <img src="${lp.image}" alt="${lp.title}">
                    </div>
                    <div class="lp-content">
                        <h3>${lp.title}</h3>
                        <div class="lp-price-pill">
                            ${lp.price}
                        </div>
                        <div class="lp-desc">
                            ${lp.description}
                        </div>
                    </div>
                    <div class="lp-action">
                        <a href="book-local.html?id=${lp.id}" class="btn-book">BOOK NOW</a>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error('Error loading local packages:', err);
    }
}
