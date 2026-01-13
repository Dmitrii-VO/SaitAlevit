/**
 * Модуль загрузки данных из JSON файлов
 * @module components/data-loader
 */

import { fetchJSON } from '../utils/fetch.js';
import { getWorkStatusBadge } from '../utils/format.js';
import { createContactItem, createSocialLinks, createProjectCard, createVideoReviewCard, createTextReviewItem, createWorkCard, createHeroContactItem, createHeroContactsDropdown } from './ui-components.js';
import { updateFloatingButtons, updateSchemaOrg } from './contacts.js';
import { initProjectsCarousel, initProjectsGalleryButtons, initWorksCarousel, initWorksGalleryButtons, resetWorksCarousel } from './carousels.js';

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
 * Загружает проекты из JSON файла
 * @returns {Promise<void>}
 */
export async function loadProjects() {
    try {
        const data = await fetchJSON('data/projects.json');
        if (!data) return;
        
        const projects = data.projects || [];
        const track = document.getElementById('projects-track');
        if (!track) {
            console.error('Элемент #projects-track не найден');
            return;
        }
        
        track.innerHTML = '';
        
        const publishedProjects = filterPublished(projects);
        
        if (publishedProjects.length === 0) {
            track.innerHTML = '<div class="projects__empty"><p>Проекты появятся здесь скоро</p></div>';
            return;
        }
        
        publishedProjects.forEach(project => {
            const card = createProjectCard(project);
            if (card) {
                track.appendChild(card);
            }
        });
        
        initProjectsCarousel();
        initProjectsGalleryButtons();
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
        const track = document.getElementById('works-track');
        if (!track) {
            console.error('Элемент #works-track не найден');
            return;
        }
        
        track.innerHTML = '';
        resetWorksCarousel();
        
        const publishedWorks = filterPublished(works);
        
        if (publishedWorks.length === 0) {
            track.innerHTML = '<div class="works__empty"><p>Работы появятся здесь скоро</p></div>';
            return;
        }
        
        publishedWorks.forEach(work => {
            const card = createWorkCard(work, getWorkStatusBadge);
            if (card) {
                track.appendChild(card);
            }
        });
        
        if (publishedWorks.length > 0) {
            setTimeout(() => {
                initWorksCarousel();
                initWorksGalleryButtons();
            }, 100);
        }
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
    }
}
