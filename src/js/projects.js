/**
 * Модуль для динамической загрузки и отображения проектов
 */

/**
 * Форматирование цены для отображения
 */
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

/**
 * Форматирование описания проекта
 */
function formatDescription(description, area) {
    if (description && description.trim()) {
        return description;
    }
    // Генерируем описание на основе площади
    return `одноэтажный дом ${area} м²`;
}

/**
 * Создание HTML карточки проекта
 */
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'projects__card';
    
    const description = formatDescription(project.description, project.area);
    const formattedPrice = formatPrice(project.price);
    
    // Создаем изображение с обработкой ошибок загрузки
    const imageSrc = project.mainImage || '';
    const imageAlt = `${project.title} - ${description}`;
    
    card.innerHTML = `
        <div class="projects__card-image">
            <img src="${imageSrc}" alt="${imageAlt}" class="projects__card-img" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Crect fill=\\'%23f5f5f5\\' width=\\'400\\' height=\\'300\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3EНет фото%3C/text%3E%3C/svg%3E';">
        </div>
        <div class="projects__card-content">
            <h3 class="projects__card-title">${project.title}</h3>
            <ul class="projects__card-specs">
                <li class="projects__card-spec">
                    <span class="projects__card-spec-label">Этажность:</span>
                    <span class="projects__card-spec-value">${project.floors || '1 этаж'}</span>
                </li>
                <li class="projects__card-spec">
                    <span class="projects__card-spec-label">Площадь:</span>
                    <span class="projects__card-spec-value"><strong>${project.area}</strong> м²</span>
                </li>
                <li class="projects__card-spec">
                    <span class="projects__card-spec-label">Стоимость:</span>
                    <span class="projects__card-spec-value"><strong>${formattedPrice}</strong> ₽</span>
                </li>
            </ul>
            <button class="btn btn--primary projects__gallery-btn" 
                    data-project-id="${project.id}" 
                    data-project-title="${project.title}"
                    data-images='${JSON.stringify(project.gallery || [project.mainImage].filter(Boolean))}'>
                Смотреть все фото
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Загрузка проектов из JSON файла
 */
async function loadProjects() {
    try {
        const response = await fetch('data/projects.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.projects || [];
    } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
        return [];
    }
}

/**
 * Отображение проектов в карусели
 */
function renderProjects(projects) {
    const track = document.getElementById('projects-track');
    if (!track) {
        console.error('Элемент #projects-track не найден');
        return;
    }
    
    // Фильтруем только опубликованные проекты
    const publishedProjects = projects.filter(project => project.status === 'published');
    
    if (publishedProjects.length === 0) {
        track.innerHTML = '<div class="projects__empty"><p>Проекты появятся здесь скоро</p></div>';
        return;
    }
    
    // Очищаем контейнер
    track.innerHTML = '';
    
    // Создаем карточки для каждого проекта
    publishedProjects.forEach(project => {
        const card = createProjectCard(project);
        track.appendChild(card);
    });
    
    // Инициализируем карусель после рендеринга
    initProjectsCarousel();
    
    // Инициализируем обработчики для кнопок галереи
    initGalleryButtons();
}

/**
 * Инициализация карусели проектов
 */
function initProjectsCarousel() {
    const track = document.querySelector('.projects__track');
    const prevButton = document.querySelector('.projects__arrow--prev');
    const nextButton = document.querySelector('.projects__arrow--next');
    const indicatorsContainer = document.getElementById('projects-indicators');
    
    if (!track || !prevButton || !nextButton) {
        return;
    }
    
    const cards = track.querySelectorAll('.projects__card');
    if (cards.length === 0) {
        return;
    }
    
    // Вычисляем количество видимых карточек
    const cardWidth = cards[0].offsetWidth;
    const gap = parseInt(getComputedStyle(track).gap) || 24;
    const containerWidth = track.offsetWidth;
    const cardsPerView = Math.floor(containerWidth / (cardWidth + gap));
    const totalSlides = Math.ceil(cards.length / cardsPerView);
    
    let currentSlide = 0;
    
    // Функция обновления позиции карусели
    function updateCarousel() {
        const scrollAmount = currentSlide * containerWidth;
        track.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
        
        // Обновляем состояние кнопок
        prevButton.disabled = currentSlide === 0;
        nextButton.disabled = currentSlide >= totalSlides - 1;
        
        // Обновляем индикаторы
        updateIndicators();
    }
    
    // Функция обновления индикаторов
    function updateIndicators() {
        if (!indicatorsContainer) return;
        
        indicatorsContainer.innerHTML = '';
        
        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'projects__indicator';
            indicator.setAttribute('aria-label', `Перейти к слайду ${i + 1}`);
            if (i === currentSlide) {
                indicator.classList.add('projects__indicator--active');
            }
            indicator.addEventListener('click', () => {
                currentSlide = i;
                updateCarousel();
            });
            indicatorsContainer.appendChild(indicator);
        }
    }
    
    // Обработчики кнопок навигации
    prevButton.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    });
    
    nextButton.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
        }
    });
    
    // Обработка прокрутки колесиком мыши
    let isScrolling = false;
    track.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const scrollLeft = track.scrollLeft;
                const newSlide = Math.round(scrollLeft / containerWidth);
                if (newSlide !== currentSlide) {
                    currentSlide = newSlide;
                    updateIndicators();
                    prevButton.disabled = currentSlide === 0;
                    nextButton.disabled = currentSlide >= totalSlides - 1;
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    });
    
    // Инициализация
    updateCarousel();
    
    // Обработка изменения размера окна
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newCardWidth = cards[0].offsetWidth;
            const newCardsPerView = Math.floor(track.offsetWidth / (newCardWidth + gap));
            const newTotalSlides = Math.ceil(cards.length / newCardsPerView);
            totalSlides = newTotalSlides;
            currentSlide = Math.min(currentSlide, totalSlides - 1);
            updateCarousel();
        }, 250);
    });
}

/**
 * Инициализация обработчиков для кнопок галереи
 */
function initGalleryButtons() {
    const galleryButtons = document.querySelectorAll('.projects__gallery-btn');
    
    galleryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project-id');
            const projectTitle = this.getAttribute('data-project-title');
            const imagesJson = this.getAttribute('data-images');
            
            try {
                const images = JSON.parse(imagesJson || '[]');
                if (images.length > 0 && typeof window.openGallery === 'function') {
                    window.openGallery(projectTitle, images);
                } else {
                    console.warn('Функция openGallery не найдена или нет изображений');
                }
            } catch (error) {
                console.error('Ошибка парсинга изображений галереи:', error);
            }
        });
    });
}

/**
 * Инициализация модуля проектов
 */
async function initProjects() {
    const projects = await loadProjects();
    renderProjects(projects);
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initProjects, loadProjects, renderProjects };
}