/**
 * Компоненты каруселей
 * @module components/carousels
 */

let projectsCarouselInitialized = false;
let worksCarouselInitialized = false;

/**
 * Инициализирует карусель проектов
 * @returns {void}
 */
export function initProjectsCarousel() {
    const track = document.querySelector('.projects__track');
    const prevButton = document.querySelector('.projects__arrow--prev');
    const nextButton = document.querySelector('.projects__arrow--next');
    
    if (!track || !prevButton || !nextButton) return;
    if (projectsCarouselInitialized) return;
    
    const cards = track.querySelectorAll('.projects__card');
    if (cards.length === 0) return;
    
    let currentScroll = 0;
    const cardWidth = cards[0].offsetWidth || 300;
    const gap = 24;
    const scrollAmount = cardWidth + gap;
    
    prevButton.addEventListener('click', () => {
        currentScroll = Math.max(0, currentScroll - scrollAmount);
        track.scrollTo({ left: currentScroll, behavior: 'smooth' });
        updateButtons();
    });
    
    nextButton.addEventListener('click', () => {
        const maxScroll = track.scrollWidth - track.offsetWidth;
        currentScroll = Math.min(maxScroll, currentScroll + scrollAmount);
        track.scrollTo({ left: currentScroll, behavior: 'smooth' });
        updateButtons();
    });
    
    function updateButtons() {
        prevButton.disabled = currentScroll <= 0;
        nextButton.disabled = currentScroll >= track.scrollWidth - track.offsetWidth - 10;
    }
    
    projectsCarouselInitialized = true;
    updateButtons();
    
    if (!window.projectsResizeHandler) {
        let resizeTimeout;
        window.projectsResizeHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateButtons, 250);
        };
        window.addEventListener('resize', window.projectsResizeHandler);
    }
}

/**
 * Инициализирует карусель работ
 * @returns {void}
 */
export function initWorksCarousel() {
    const track = document.querySelector('.works__track');
    const prevButton = document.querySelector('.works__arrow--prev');
    const nextButton = document.querySelector('.works__arrow--next');
    
    if (!track || !prevButton || !nextButton) return;
    if (worksCarouselInitialized) return;
    
    const cards = track.querySelectorAll('.works__card');
    if (cards.length === 0) return;
    
    let currentScroll = 0;
    const cardWidth = cards[0].offsetWidth || 300;
    const gap = 24;
    const scrollAmount = cardWidth + gap;
    
    prevButton.addEventListener('click', () => {
        currentScroll = Math.max(0, currentScroll - scrollAmount);
        track.scrollTo({ left: currentScroll, behavior: 'smooth' });
        updateButtons();
    });
    
    nextButton.addEventListener('click', () => {
        const maxScroll = track.scrollWidth - track.offsetWidth;
        currentScroll = Math.min(maxScroll, currentScroll + scrollAmount);
        track.scrollTo({ left: currentScroll, behavior: 'smooth' });
        updateButtons();
    });
    
    function updateButtons() {
        prevButton.disabled = currentScroll <= 0;
        nextButton.disabled = currentScroll >= track.scrollWidth - track.offsetWidth - 10;
    }
    
    worksCarouselInitialized = true;
    updateButtons();
    
    if (!window.worksResizeHandler) {
        let resizeTimeout;
        window.worksResizeHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateButtons, 250);
        };
        window.addEventListener('resize', window.worksResizeHandler);
    }
}

/**
 * Сбрасывает флаг инициализации карусели работ
 * @returns {void}
 */
export function resetWorksCarousel() {
    worksCarouselInitialized = false;
}

/**
 * Инициализирует кнопки галереи для проектов
 * @returns {void}
 */
export function initProjectsGalleryButtons() {
    const galleryButtons = document.querySelectorAll('.projects__gallery-btn');
    
    galleryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectTitle = this.getAttribute('data-project-title');
            const imagesJson = this.getAttribute('data-images');
            
            try {
                const images = JSON.parse(imagesJson || '[]');
                if (images.length > 0 && typeof window.openGallery === 'function') {
                    window.openGallery(projectTitle, images);
                }
            } catch (error) {
                console.error('Ошибка открытия галереи:', error);
            }
        });
    });
}

/**
 * Инициализирует кнопки галереи для работ
 * @returns {void}
 */
export function initWorksGalleryButtons() {
    const galleryButtons = document.querySelectorAll('.works__gallery-btn');
    
    galleryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectTitle = this.getAttribute('data-project');
            const imagesJson = this.getAttribute('data-images');
            
            try {
                const images = JSON.parse(imagesJson || '[]');
                if (images.length > 0 && typeof window.openGallery === 'function') {
                    window.openGallery(projectTitle, images);
                }
            } catch (error) {
                console.error('Ошибка открытия галереи:', error);
            }
        });
    });
}
