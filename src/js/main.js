/**
 * Главный файл инициализации приложения
 * @module main
 */

// Импорты модулей
import { loadProjects, loadContacts, loadReviews, loadWorks } from './components/data-loader.js';
import { showNotification } from './components/notifications.js';
import { initCTAForm, initCalculator, initContactForm } from './components/forms.js';
import { initSmoothScroll, initFloatingButtons, initScrollAnimation, initMobileMenu, initFAQ } from './components/ui.js';
import { initGalleryModal } from './components/gallery.js';
import { initPrivacyModal } from './components/privacy-modal.js';

/**
 * Инициализация приложения при загрузке DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM загружен, начинаем инициализацию');
    
    // Загрузка данных
    loadProjects().catch(error => {
        console.error('❌ Ошибка при загрузке проектов:', error);
    });
    
    loadContacts().catch(error => {
        console.error('❌ Ошибка при загрузке контактов:', error);
    });
    
    loadReviews().catch(error => {
        console.error('❌ Ошибка при загрузке отзывов:', error);
    });
    
    loadWorks().catch(error => {
        console.error('❌ Ошибка при загрузке работ:', error);
    });
    
    // Инициализация UI компонентов
    initSmoothScroll();
    initFloatingButtons();
    initScrollAnimation();
    initMobileMenu();
    initFAQ();
    initGalleryModal();
    initPrivacyModal();
    
    // Инициализация форм
    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        initContactForm(contactForm);
    }
    
    const ctaForm = document.querySelector('#cta-form');
    if (ctaForm) {
        initCTAForm(ctaForm);
    }
    
    // Инициализация калькулятора
    initCalculator();
});
