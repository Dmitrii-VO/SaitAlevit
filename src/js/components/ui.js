/**
 * UI компоненты: меню, FAQ, скролл и т.д.
 * @module components/ui
 */

/**
 * Инициализирует мобильное меню-бургер
 * @returns {void}
 */
export function initMobileMenu() {
    const burgerButton = document.querySelector('.nav__burger');
    const navMenu = document.querySelector('.nav__menu');
    const navContainer = document.querySelector('.nav__container');
    
    if (!burgerButton || !navMenu) return;
    
    burgerButton.addEventListener('click', () => {
        const isActive = navMenu.classList.contains('nav__menu--active');
        
        navMenu.classList.toggle('nav__menu--active');
        burgerButton.classList.toggle('nav__burger--active');
        burgerButton.setAttribute('aria-label', isActive ? 'Открыть меню' : 'Закрыть меню');
        burgerButton.setAttribute('aria-expanded', !isActive);
        
        if (!isActive) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
    
    // Закрываем меню при клике на ссылку
    const navLinks = navMenu.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('nav__menu--active');
            burgerButton.classList.remove('nav__burger--active');
            burgerButton.setAttribute('aria-label', 'Открыть меню');
            burgerButton.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });
    
    // Закрываем меню при клике вне его области
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('nav__menu--active') && 
            !navContainer.contains(e.target) && 
            !burgerButton.contains(e.target)) {
            navMenu.classList.remove('nav__menu--active');
            burgerButton.classList.remove('nav__burger--active');
            burgerButton.setAttribute('aria-label', 'Открыть меню');
            burgerButton.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Инициализирует FAQ аккордеон
 * @returns {void}
 */
export function initFAQ() {
    const faqItems = document.querySelectorAll('.faq__item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq__question');
        if (!question) return;
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Закрываем все другие элементы
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherQuestion = otherItem.querySelector('.faq__question');
                    if (otherQuestion) {
                        otherQuestion.setAttribute('aria-expanded', 'false');
                    }
                }
            });
            
            // Переключаем текущий элемент
            if (isActive) {
                item.classList.remove('active');
                question.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/**
 * Инициализирует плавную прокрутку для якорных ссылок
 * @returns {void}
 */
export function initSmoothScroll() {
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // Пропускаем пустые якоря и якоря только с #
            if (!href || href === '#' || href === '#!') {
                return;
            }
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                console.warn(`Элемент с ID ${href} не найден`);
            }
        });
    });
}

/**
 * Инициализирует показ/скрытие плавающих кнопок при скролле
 * @returns {void}
 */
export function initFloatingButtons() {
    const floatingButtons = document.querySelector('#floating-buttons');
    if (!floatingButtons) return;
    
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 300) {
            floatingButtons.style.display = 'flex';
            
            if (scrollTop > lastScrollTop) {
                floatingButtons.style.opacity = '0.7';
            } else {
                floatingButtons.style.opacity = '1';
            }
        } else {
            floatingButtons.style.opacity = '0';
        }
        
        lastScrollTop = scrollTop;
    });
}

/**
 * Инициализирует анимацию появления элементов при прокрутке
 * @returns {void}
 */
export function initScrollAnimation() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });
}
