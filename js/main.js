// Главный JavaScript файл
document.addEventListener('DOMContentLoaded', function() {
    
    // Плавная прокрутка для якорных ссылок
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Обработка формы контактов
    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Здесь можно добавить отправку данных на сервер
            // Данные формы отправляются на сервер
            
            // Показать сообщение об успешной отправке
            showNotification('Сообщение отправлено успешно!', 'success');
            
            // Очистить форму
            this.reset();
        });
    }
    
    // Обработка CTA формы с прогресс-баром
    const ctaForm = document.querySelector('#cta-form');
    if (ctaForm) {
        const progressBar = document.querySelector('#form-progress');
        const progressContainer = document.querySelector('.cta__form-progress');
        const submitButton = ctaForm.querySelector('.cta__form-submit');
        const submitText = submitButton.querySelector('.cta__form-submit-text');
        const submitLoading = submitButton.querySelector('.cta__form-submit-loading');
        const formInputs = ctaForm.querySelectorAll('input[required], select[required]');
        
        // Обновление прогресс-бара
        function updateProgress() {
            let filled = 0;
            formInputs.forEach(input => {
                if (input.type === 'checkbox') {
                    if (input.checked) filled++;
                } else {
                    if (input.value.trim() !== '') filled++;
                }
            });
            
            const progress = (filled / formInputs.length) * 100;
            if (progress > 0) {
                progressContainer.classList.add('active');
                progressBar.style.width = progress + '%';
            } else {
                progressContainer.classList.remove('active');
            }
        }
        
        // Слушатели для полей формы
        formInputs.forEach(input => {
            input.addEventListener('input', updateProgress);
            input.addEventListener('change', updateProgress);
            
            // Валидация телефона в реальном времени
            if (input.type === 'tel' && input.id === 'cta-phone') {
                input.addEventListener('input', function() {
                    validatePhoneInput(this);
                });
                input.addEventListener('blur', function() {
                    validatePhoneInput(this, true);
                });
            }
        });
        
        // Обработка отправки формы
        ctaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Показываем состояние загрузки
            submitButton.disabled = true;
            submitText.style.display = 'none';
            submitLoading.style.display = 'inline-block';
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Здесь можно добавить отправку данных на сервер
            // Данные CTA формы отправляются на сервер
            
            // Имитация отправки
            setTimeout(() => {
                showNotification('Спасибо! Мы свяжемся с вами в течение 15 минут', 'success');
                
                // Возвращаем кнопку в исходное состояние
                submitButton.disabled = false;
                submitText.style.display = 'inline-block';
                submitLoading.style.display = 'none';
                
                // Очищаем форму
                this.reset();
                updateProgress();
            }, 1500);
        });
    }
    
    // Калькулятор стоимости
    const calculatorForm = document.querySelector('#calculator-form');
    const calculatorResult = document.querySelector('#calculator-result');
    const resultPrice = document.querySelector('#result-price');
    
    if (calculatorForm && calculatorResult && resultPrice) {
        // Цены за м²
        const prices = {
            'gas-block': { box: 25000, clean: 35000, turnkey: 45000 },
            'brick': { box: 30000, clean: 40000, turnkey: 50000 },
            'frame': { box: 20000, clean: 30000, turnkey: 40000 }
        };
        
        // Функция форматирования цены
        function formatPrice(price) {
            return new Intl.NumberFormat('ru-RU').format(Math.round(price));
        }
        
        // Расчет стоимости
        function calculatePrice() {
            const area = parseFloat(document.querySelector('#calc-area').value) || 0;
            const type = document.querySelector('#calc-type').value;
            const finish = document.querySelector('#calc-finish').value;
            
            if (area < 20 || area > 500) {
                resultPrice.textContent = '—';
                return;
            }
            
            const pricePerM2 = prices[type]?.[finish] || 25000;
            const totalPrice = area * pricePerM2;
            
            // Добавляем разброс ±10%
            const minPrice = totalPrice * 0.9;
            const maxPrice = totalPrice * 1.1;
            
            if (minPrice === maxPrice) {
                resultPrice.textContent = formatPrice(minPrice);
            } else {
                resultPrice.textContent = formatPrice(minPrice);
            }
        }
        
        // Слушатели для полей калькулятора
        calculatorForm.addEventListener('input', calculatePrice);
        calculatorForm.addEventListener('change', calculatePrice);
        
        // Обработка отправки формы калькулятора
        calculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Прокрутка к форме заявки
            const ctaSection = document.querySelector('#cta');
            if (ctaSection) {
                ctaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Заполняем форму заявки данными из калькулятора
                setTimeout(() => {
                    const ctaAreaInput = document.querySelector('#cta-area');
                    if (ctaAreaInput) {
                        ctaAreaInput.value = data.area;
                    }
                }, 500);
            }
        });
        
        // Первоначальный расчет
        calculatePrice();
    }
    
    // Показ/скрытие плавающих кнопок при скролле
    const floatingButtons = document.querySelector('#floating-buttons');
    let lastScrollTop = 0;
    
    if (floatingButtons) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 300) {
                floatingButtons.style.display = 'flex';
                
                if (scrollTop > lastScrollTop) {
                    // Скроллим вниз - скрываем
                    floatingButtons.style.opacity = '0.7';
                } else {
                    // Скроллим вверх - показываем
                    floatingButtons.style.opacity = '1';
                }
            } else {
                floatingButtons.style.opacity = '0';
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    // Анимация появления элементов при прокрутке
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
    
    // Наблюдать за секциями для анимации
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Инициализация FAQ аккордеона
    initFAQ();
    
    // Инициализация мобильного меню (бургер)
    initMobileMenu();
});

/**
 * Инициализация мобильного меню-бургера
 */
function initMobileMenu() {
    const burgerButton = document.querySelector('.nav__burger');
    const navMenu = document.querySelector('.nav__menu');
    const navContainer = document.querySelector('.nav__container');
    
    if (!burgerButton || !navMenu) return;
    
    burgerButton.addEventListener('click', () => {
        const isActive = navMenu.classList.contains('nav__menu--active');
        
        // Переключаем состояние меню
        navMenu.classList.toggle('nav__menu--active');
        burgerButton.classList.toggle('nav__burger--active');
        burgerButton.setAttribute('aria-label', isActive ? 'Открыть меню' : 'Закрыть меню');
        burgerButton.setAttribute('aria-expanded', !isActive);
        
        // Блокируем скролл когда меню открыто
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

// Функция инициализации FAQ аккордеона
function initFAQ() {
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
 * Валидация поля телефона
 * @param {HTMLInputElement} input - Поле ввода телефона
 * @param {boolean} showError - Показывать ли сообщение об ошибке
 */
function validatePhoneInput(input, showError = false) {
    const phoneValue = input.value.replace(/\D/g, ''); // Убираем все нецифровые символы
    const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    
    // Форматирование телефона
    let formattedPhone = phoneValue;
    if (phoneValue.length > 0) {
        if (phoneValue.startsWith('8')) {
            formattedPhone = '+7' + phoneValue.slice(1);
        } else if (phoneValue.startsWith('7')) {
            formattedPhone = '+7' + phoneValue.slice(1);
        } else if (!phoneValue.startsWith('+7')) {
            formattedPhone = '+7' + phoneValue;
        }
        
        // Форматируем в формат +7 (XXX) XXX-XX-XX
        if (formattedPhone.length > 2) {
            const match = formattedPhone.match(/^\+7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
            if (match) {
                formattedPhone = '+7';
                if (match[1]) formattedPhone += ' (' + match[1];
                if (match[2]) formattedPhone += ') ' + match[2];
                if (match[3]) formattedPhone += '-' + match[3];
                if (match[4]) formattedPhone += '-' + match[4];
            }
        }
        
        input.value = formattedPhone;
    }
    
    // Валидация
    const isValid = phoneRegex.test(formattedPhone.replace(/\D/g, '')) && formattedPhone.replace(/\D/g, '').length === 11;
    
    // Визуальная индикация
    if (formattedPhone.length > 0) {
        if (isValid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
            if (showError && formattedPhone.length >= 5) {
                showNotification('Укажите корректный номер телефона', 'error');
            }
        }
    } else {
        input.classList.remove('valid', 'invalid');
    }
    
    return isValid;
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem',
        borderRadius: '0.375rem',
        color: 'white',
        zIndex: '9999',
        transition: 'all 0.3s ease',
        opacity: '0',
        transform: 'translateX(100%)'
    });
    
    // Цвета в зависимости от типа
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });
    
    // Удаление через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Утилиты для работы с DOM
const $ = {
    select: (selector) => document.querySelector(selector),
    selectAll: (selector) => document.querySelectorAll(selector),
    create: (tag, attributes = {}) => {
        const element = document.createElement(tag);
        Object.assign(element, attributes);
        return element;
    },
    ready: (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showNotification, $ };
}
