/**
 * Компонент галереи и модального окна
 * @module components/gallery
 */

let currentImages = [];
let currentIndex = 0;
let modal = null;
let prevButton = null;
let nextButton = null;
let thumbnailsContainer = null;

/**
 * Инициализирует модальное окно галереи
 * @returns {void}
 */
export function initGalleryModal() {
    modal = document.getElementById('gallery-modal');
    if (!modal) return;
    
    const closeButton = modal.querySelector('.gallery-modal__close');
    const overlay = modal.querySelector('.gallery-modal__overlay');
    prevButton = modal.querySelector('.gallery-modal__arrow--prev');
    nextButton = modal.querySelector('.gallery-modal__arrow--next');
    thumbnailsContainer = document.getElementById('gallery-thumbnails');
    
    window.openGallery = openGallery;
    
    if (closeButton) closeButton.addEventListener('click', closeGallery);
    if (overlay) overlay.addEventListener('click', closeGallery);
    
    if (prevButton) {
        prevButton.addEventListener('click', () => navigateGallery('prev'));
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => navigateGallery('next'));
    }
    
    document.addEventListener('keydown', handleGalleryKeyboard);
}

/**
 * Открывает галерею с указанными изображениями
 * @param {string} projectTitle - Название проекта
 * @param {Array<string>} images - Массив путей к изображениям
 * @returns {void}
 */
function openGallery(projectTitle, images) {
    if (!images || images.length === 0) {
        console.warn('Нет изображений для отображения');
        return;
    }
    
    currentImages = images;
    currentIndex = 0;
    
    const titleElement = document.getElementById('gallery-project-name');
    if (titleElement) {
        titleElement.textContent = projectTitle || 'Проект';
    }
    
    modal.classList.add('gallery-modal--active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    loadGalleryImages();
    updateGalleryCounter();
}

/**
 * Закрывает галерею
 * @returns {void}
 */
function closeGallery() {
    modal.classList.remove('gallery-modal--active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentImages = [];
    currentIndex = 0;
}

/**
 * Загружает текущее изображение в галерею
 * @returns {void}
 */
function loadGalleryImages() {
    const mainImage = document.getElementById('gallery-main-image');
    const loader = document.getElementById('gallery-loader');
    
    if (!mainImage || currentImages.length === 0) return;
    
    if (loader) loader.style.display = 'flex';
    
    const img = new Image();
    img.src = currentImages[currentIndex];
    
    img.onload = function() {
        mainImage.src = currentImages[currentIndex];
        mainImage.alt = `Фото проекта ${currentIndex + 1}`;
        if (loader) loader.style.display = 'none';
        updateGalleryThumbnails();
        updateGalleryButtons();
    };
    
    img.onerror = function() {
        mainImage.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'600\'%3E%3Crect fill=\'%23f5f5f5\' width=\'800\' height=\'600\'/%3E%3Ctext fill=\'%23999\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3EОшибка загрузки%3C/text%3E%3C/svg%3E';
        if (loader) loader.style.display = 'none';
    };
}

/**
 * Обновляет счетчик изображений в галерее
 * @returns {void}
 */
function updateGalleryCounter() {
    const currentEl = document.getElementById('gallery-current');
    const totalEl = document.getElementById('gallery-total');
    
    if (currentEl) currentEl.textContent = currentIndex + 1;
    if (totalEl) totalEl.textContent = currentImages.length;
}

/**
 * Обновляет миниатюры изображений в галерее
 * @returns {void}
 */
function updateGalleryThumbnails() {
    if (!thumbnailsContainer) return;
    
    thumbnailsContainer.innerHTML = '';
    
    currentImages.forEach((image, index) => {
        const thumbnail = createThumbnail(image, index);
        thumbnailsContainer.appendChild(thumbnail);
    });
}

/**
 * Создает миниатюру изображения
 * @param {string} image - Путь к изображению
 * @param {number} index - Индекс изображения
 * @returns {HTMLElement} Элемент миниатюры
 */
function createThumbnail(image, index) {
    const thumbnail = document.createElement('button');
    thumbnail.className = 'gallery-modal__thumbnail';
    thumbnail.setAttribute('aria-label', `Перейти к фото ${index + 1}`);
    thumbnail.setAttribute('role', 'tab');
    thumbnail.setAttribute('aria-selected', index === currentIndex);
    
    if (index === currentIndex) {
        thumbnail.classList.add('gallery-modal__thumbnail--active');
    }
    
    const img = document.createElement('img');
    img.src = image;
    img.alt = `Миниатюра ${index + 1}`;
    img.loading = 'lazy';
    
    thumbnail.appendChild(img);
    
    thumbnail.addEventListener('click', () => {
        currentIndex = index;
        loadGalleryImages();
        updateGalleryCounter();
    });
    
    return thumbnail;
}

/**
 * Обновляет состояние кнопок навигации галереи (prev/next)
 * @returns {void}
 */
function updateGalleryButtons() {
    if (prevButton) prevButton.disabled = currentIndex === 0;
    if (nextButton) nextButton.disabled = currentIndex >= currentImages.length - 1;
}

/**
 * Обрабатывает навигацию по галерее
 * @param {string} direction - Направление: 'prev' или 'next'
 * @returns {void}
 */
function navigateGallery(direction) {
    if (direction === 'prev' && currentIndex > 0) {
        currentIndex--;
        loadGalleryImages();
        updateGalleryCounter();
    } else if (direction === 'next' && currentIndex < currentImages.length - 1) {
        currentIndex++;
        loadGalleryImages();
        updateGalleryCounter();
    }
}

/**
 * Обрабатывает нажатия клавиш для галереи (ESC, стрелки)
 * @param {KeyboardEvent} e - Событие клавиатуры
 * @returns {void}
 */
function handleGalleryKeyboard(e) {
    if (e.key === 'Escape' && modal.classList.contains('gallery-modal--active')) {
        closeGallery();
        return;
    }
    
    if (!modal.classList.contains('gallery-modal--active')) return;
    
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
        currentIndex--;
        loadGalleryImages();
        updateGalleryCounter();
    } else if (e.key === 'ArrowRight' && currentIndex < currentImages.length - 1) {
        currentIndex++;
        loadGalleryImages();
        updateGalleryCounter();
    }
}
