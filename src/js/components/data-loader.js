/**
 * Модуль загрузки данных из JSON файлов
 * @module components/data-loader
 */

import { fetchJSON } from '../utils/fetch.js';
import { getWorkStatusBadge } from '../utils/format.js';
import { createContactItem, createSocialLinks, createProjectCard, createVideoReviewCard, createTextReviewItem, createWorkCard, createHeroContactItem, createHeroContactsDropdown } from './ui-components.js';
import { updateFloatingButtons, updateSchemaOrg, updateProcessConsultationPhone } from './contacts.js';
import { initProjectsGalleryButtons, initWorksGalleryButtons } from './carousels.js';

/**
 * Фильтрует опубликованные элементы из массива
 * @param {Array<Object>} items - Массив элементов с полем status
 * @returns {Array<Object>} Отфильтрованные опубликованные элементы
 */
function filterPublished(items) {
    return items.filter(item => {
        const status = (item.status || '').toLowerCase();
        return status === 'published' || status === 'опубликован';
    });
}

/**
 * Определяет категорию проекта по количеству этажей
 * @param {Object} project - Объект проекта
 * @returns {string} Категория проекта ('1' или '2')
 */
function getProjectCategory(project) {
    const floors = (project.floors || '').toString().toLowerCase();
    if (floors.includes('2') || floors.includes('два') || floors.includes('двух')) {
        return '2';
    }
    return '1'; // По умолчанию 1 этаж
}

/**
 * Сохраняет все опубликованные проекты
 */
let allProjects = [];

/**
 * Отображает проекты выбранной категории
 * @param {string} category - Категория ('1' или '2')
 */
function renderProjectsByCategory(category) {
    const grid = document.getElementById('projects-grid');
    if (!grid) {
        console.error('Элемент #projects-grid не найден');
        return;
    }
    
    // Фильтруем проекты по категории
    const filteredProjects = allProjects.filter(project => {
        return getProjectCategory(project) === category;
    });
    
    // Добавляем класс для анимации исчезновения
    grid.classList.add('projects__grid--fade-out');
    
    // После завершения анимации обновляем контент
    setTimeout(() => {
        grid.innerHTML = '';
        
        if (filteredProjects.length === 0) {
            grid.innerHTML = '<div class="projects__empty"><p>В этой категории пока нет проектов</p></div>';
        } else {
            filteredProjects.forEach(project => {
                const card = createProjectCard(project);
                if (card) {
                    grid.appendChild(card);
                }
            });
            
            // Инициализируем кнопки галереи после добавления карточек
            initProjectsGalleryButtons();
        }
        
        // Убираем класс анимации для появления
        grid.classList.remove('projects__grid--fade-out');
    }, 200);
}

/**
 * Инициализирует переключатели категорий проектов
 */
function initProjectsTabs() {
    const tabs = document.querySelectorAll('.projects__tab');
    const grid = document.getElementById('projects-grid');
    
    if (!tabs.length || !grid) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Обновляем активный таб
            tabs.forEach(t => {
                t.classList.remove('projects__tab--active');
                t.setAttribute('aria-selected', 'false');
            });
            
            this.classList.add('projects__tab--active');
            this.setAttribute('aria-selected', 'true');
            
            // Обновляем aria-labelledby у grid
            grid.setAttribute('aria-labelledby', this.id);
            
            // Отображаем проекты выбранной категории
            renderProjectsByCategory(category);
        });
    });
    
    // По умолчанию показываем категорию "1 этаж"
    const defaultTab = document.querySelector('.projects__tab[data-category="1"]');
    if (defaultTab) {
        defaultTab.classList.add('projects__tab--active');
        defaultTab.setAttribute('aria-selected', 'true');
        grid.setAttribute('aria-labelledby', defaultTab.id);
        renderProjectsByCategory('1');
    }
}

/**
 * Загружает проекты из JSON файла
 * @returns {Promise<void>}
 */
export async function loadProjects() {
    try {
        const data = await fetchJSON('data/projects.json');
        if (!data) return;
        
        const projects = data.projects || [];
        const grid = document.getElementById('projects-grid');
        if (!grid) {
            console.error('Элемент #projects-grid не найден');
            return;
        }
        
        // Сохраняем все опубликованные проекты
        allProjects = filterPublished(projects);
        
        // Инициализируем табы и показываем проекты по умолчанию
        initProjectsTabs();
    } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
    }
}

/**
 * Загружает контакты из JSON файла
 * @returns {Promise<void>}
 */
export async function loadContacts() {
    try {
        const contacts = await fetchJSON('data/contacts.json');
        if (!contacts) return;
        
        // Загрузка контактов в основной блок контактов
        const container = document.getElementById('contacts-info');
        if (!container) {
            console.error('Элемент #contacts-info не найден');
        } else {
            container.innerHTML = '';
            
            if (contacts.phone) {
                const phoneItem = createContactItem(
                    'phone',
                    'Телефон',
                    contacts.phone,
                    `tel:${contacts.phone.replace(/\D/g, '')}`
                );
                container.appendChild(phoneItem);
            }
            
            if (contacts.email) {
                const emailItem = createContactItem(
                    'email',
                    'Email',
                    contacts.email,
                    `mailto:${contacts.email}`
                );
                container.appendChild(emailItem);
            }
            
            if (contacts.address) {
                const addressItem = createContactItem(
                    'address',
                    'Адрес',
                    contacts.address,
                    null,
                    true
                );
                container.appendChild(addressItem);
            }
            
            const socialContainer = createSocialLinks(contacts.whatsapp, contacts.telegram);
            if (socialContainer) {
                container.appendChild(socialContainer);
            }
            
            // Обновляем телефон в шаге "Консультация" из DOM
            updateProcessConsultationPhone();
        }
        
        // Загрузка контактов в блок "О компании"
        const aboutContainer = document.getElementById('about-contacts-info');
        if (aboutContainer) {
            aboutContainer.innerHTML = '';
            
            if (contacts.phone) {
                const phoneItem = createContactItem(
                    'phone',
                    'Телефон',
                    contacts.phone,
                    `tel:${contacts.phone.replace(/\D/g, '')}`
                );
                aboutContainer.appendChild(phoneItem);
            }
            
            if (contacts.email) {
                const emailItem = createContactItem(
                    'email',
                    'Email',
                    contacts.email,
                    `mailto:${contacts.email}`
                );
                aboutContainer.appendChild(emailItem);
            }
            
            if (contacts.address) {
                const addressItem = createContactItem(
                    'address',
                    'Адрес',
                    contacts.address,
                    null,
                    true
                );
                aboutContainer.appendChild(addressItem);
            }
            
            const socialContainer = createSocialLinks(contacts.whatsapp, contacts.telegram);
            if (socialContainer) {
                aboutContainer.appendChild(socialContainer);
            }
        }
        
        // Загрузка контактов в hero-блок (выпадающее меню)
        const heroContainer = document.getElementById('hero-contacts');
        if (!heroContainer) {
            console.error('Элемент #hero-contacts не найден');
        } else {
            heroContainer.innerHTML = '';
            
            if (contacts.phone) {
                const contactsDropdown = createHeroContactsDropdown(contacts);
                heroContainer.appendChild(contactsDropdown);
            }
        }
        
        updateFloatingButtons(contacts);
        updateSchemaOrg(contacts);
    } catch (error) {
        console.error('Ошибка загрузки контактов:', error);
    }
}

/**
 * Загружает отзывы из JSON файла
 * @returns {Promise<void>}
 */
export async function loadReviews() {
    try {
        const data = await fetchJSON('data/reviews.json');
        if (!data) return;
        
        const reviews = data.reviews || [];
        const gridContainer = document.getElementById('reviews-grid');
        const textContainer = document.getElementById('reviews-text');
        
        if (!gridContainer || !textContainer) {
            console.error('Элементы #reviews-grid или #reviews-text не найдены');
            return;
        }
        
        gridContainer.innerHTML = '';
        textContainer.innerHTML = '';
        
        const publishedReviews = filterPublished(reviews);
        
        const videoReviews = publishedReviews.filter(r => r.isVideo || r.videoUrl);
        const textReviews = publishedReviews.filter(r => !r.isVideo && !r.videoUrl);
        
        if (videoReviews.length === 0 && textReviews.length === 0) {
            gridContainer.innerHTML = '<div class="reviews__empty"><p>Отзывы появятся здесь скоро</p></div>';
            return;
        }
        
        videoReviews.forEach(review => {
            const card = createVideoReviewCard(review);
            if (card) {
                gridContainer.appendChild(card);
            }
        });
        
        textReviews.forEach(review => {
            const item = createTextReviewItem(review);
            if (item) {
                textContainer.appendChild(item);
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
    }
}

/**
 * Загружает работы из JSON файла
 * @returns {Promise<void>}
 */
export async function loadWorks() {
    try {
        const data = await fetchJSON('data/works.json');
        if (!data) return;
        
        const works = data.works || [];
        const grid = document.getElementById('works-grid');
        if (!grid) {
            console.error('Элемент #works-grid не найден');
            return;
        }
        
        grid.innerHTML = '';
        
        const publishedWorks = filterPublished(works);
        
        if (publishedWorks.length === 0) {
            grid.innerHTML = '<div class="works__empty"><p>Работы появятся здесь скоро</p></div>';
            return;
        }
        
        publishedWorks.forEach(work => {
            const card = createWorkCard(work, getWorkStatusBadge);
            if (card) {
                grid.appendChild(card);
            }
        });
        
        if (publishedWorks.length > 0) {
            initWorksGalleryButtons();
        }
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
    }
}

/**
 * Загружает и отображает примерные цены за м² под калькулятором
 * @returns {Promise<void>}
 */
export async function loadPrices() {
    try {
        const data = await fetchJSON('data/prices.json');
        if (!data || !data.prices) return;

        const { shell, clean, turnkey } = data.prices;
        const formatPrice = (value) => {
            if (!value || isNaN(value)) return null;
            return `${new Intl.NumberFormat('ru-RU').format(value)} ₽/м²`;
        };

        const shellEl = document.querySelector('[data-price-key="shell"]');
        const cleanEl = document.querySelector('[data-price-key="clean"]');
        const turnkeyEl = document.querySelector('[data-price-key="turnkey"]');

        if (shellEl && formatPrice(shell)) {
            shellEl.textContent = formatPrice(shell);
        }
        if (cleanEl && formatPrice(clean)) {
            cleanEl.textContent = formatPrice(clean);
        }
        if (turnkeyEl && formatPrice(turnkey)) {
            turnkeyEl.textContent = formatPrice(turnkey);
        }
    } catch (error) {
        console.error('Ошибка загрузки цен калькулятора:', error);
    }
}
