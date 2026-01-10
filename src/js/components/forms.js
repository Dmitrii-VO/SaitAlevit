/**
 * Компоненты для работы с формами
 * @module components/forms
 */

import { showNotification } from './notifications.js';
import { formatPhone } from '../utils/format.js';

/**
 * Валидирует поле телефона
 * @param {HTMLInputElement} input - Поле ввода телефона
 * @param {boolean} showError - Показывать ли сообщение об ошибке
 * @returns {boolean} true если валидный, false если нет
 */
export function validatePhoneInput(input, showError = false) {
    const phoneValue = input.value.replace(/\D/g, '');
    const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    
    // Форматирование телефона
    const formattedPhone = formatPhone(phoneValue);
    input.value = formattedPhone;
    
    // Валидация
    const isValid = phoneRegex.test(formattedPhone.replace(/\D/g, '')) && 
                    formattedPhone.replace(/\D/g, '').length === 11;
    
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

/**
 * Обновляет прогресс-бар формы
 * @param {HTMLElement} progressBar - Элемент прогресс-бара
 * @param {HTMLElement} progressContainer - Контейнер прогресс-бара
 * @param {NodeList} formInputs - Поля формы
 * @returns {void}
 */
function updateFormProgress(progressBar, progressContainer, formInputs) {
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

/**
 * Обрабатывает отправку CTA формы
 * @param {HTMLElement} form - Элемент формы
 * @param {HTMLElement} submitButton - Кнопка отправки
 * @param {HTMLElement} submitText - Текст кнопки
 * @param {HTMLElement} submitLoading - Индикатор загрузки
 * @param {Function} updateProgress - Функция обновления прогресса
 * @returns {void}
 */
function handleCTAFormSubmit(form, submitButton, submitText, submitLoading, updateProgress) {
    submitButton.disabled = true;
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline-block';
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Имитация отправки
    setTimeout(() => {
        showNotification('Спасибо! Мы свяжемся с вами в течение 15 минут', 'success');
        
        submitButton.disabled = false;
        submitText.style.display = 'inline-block';
        submitLoading.style.display = 'none';
        
        form.reset();
        updateProgress();
    }, 1500);
}

/**
 * Инициализирует CTA форму с прогресс-баром
 * @param {HTMLElement} form - Элемент формы
 * @returns {void}
 */
export function initCTAForm(form) {
    const progressBar = document.querySelector('#form-progress');
    const progressContainer = document.querySelector('.cta__form-progress');
    const submitButton = form.querySelector('.cta__form-submit');
    const submitText = submitButton.querySelector('.cta__form-submit-text');
    const submitLoading = submitButton.querySelector('.cta__form-submit-loading');
    const formInputs = form.querySelectorAll('input[required], select[required]');
    
    const updateProgress = () => updateFormProgress(progressBar, progressContainer, formInputs);
    
    formInputs.forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
        
        if (input.type === 'tel' && input.id === 'cta-phone') {
            input.addEventListener('input', () => validatePhoneInput(input));
            input.addEventListener('blur', () => validatePhoneInput(input, true));
        }
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleCTAFormSubmit(form, submitButton, submitText, submitLoading, updateProgress);
    });
}

/**
 * Инициализирует форму контактов
 * @param {HTMLElement} form - Элемент формы
 * @returns {void}
 */
export function initContactForm(form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Здесь можно добавить отправку данных на сервер
        showNotification('Сообщение отправлено успешно!', 'success');
        this.reset();
    });
}

/**
 * Цены за м² по типам домов и форматам отделки
 */
const CALCULATOR_PRICES = {
    'gas-block': { box: 25000, clean: 35000, turnkey: 45000 },
    'brick': { box: 30000, clean: 40000, turnkey: 50000 },
    'frame': { box: 20000, clean: 30000, turnkey: 40000 }
};

/**
 * Рассчитывает стоимость дома
 * @param {number} area - Площадь в м²
 * @param {string} type - Тип дома
 * @param {string} finish - Формат отделки
 * @returns {number|null} Рассчитанная цена или null при невалидных данных
 */
function calculateHousePrice(area, type, finish) {
    if (area < 20 || area > 500) {
        return null;
    }
    
    const pricePerM2 = CALCULATOR_PRICES[type]?.[finish] || 25000;
    const totalPrice = area * pricePerM2;
    return Math.round(totalPrice * 0.9);
}

/**
 * Обрабатывает отправку формы калькулятора
 * @param {HTMLElement} form - Элемент формы
 * @returns {void}
 */
function handleCalculatorSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    const ctaSection = document.querySelector('#cta');
    if (ctaSection) {
        ctaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        setTimeout(() => {
            const ctaAreaInput = document.querySelector('#cta-area');
            if (ctaAreaInput) {
                ctaAreaInput.value = data.area;
            }
        }, 500);
    }
}

/**
 * Инициализирует калькулятор стоимости домов
 * @returns {void}
 */
export function initCalculator() {
    const calculatorForm = document.querySelector('#calculator-form');
    const resultPrice = document.querySelector('#result-price');
    
    if (!calculatorForm || !resultPrice) return;
    
    function updatePrice() {
        const area = parseFloat(document.querySelector('#calc-area').value) || 0;
        const type = document.querySelector('#calc-type').value;
        const finish = document.querySelector('#calc-finish').value;
        
        const price = calculateHousePrice(area, type, finish);
        
        if (price === null) {
            resultPrice.textContent = '—';
        } else {
            resultPrice.textContent = new Intl.NumberFormat('ru-RU').format(price);
        }
    }
    
    calculatorForm.addEventListener('input', updatePrice);
    calculatorForm.addEventListener('change', updatePrice);
    calculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleCalculatorSubmit(this);
    });
    
    updatePrice();
}
