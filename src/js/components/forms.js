/**
 * Компоненты для работы с формами
 * @module components/forms
 */

import { showNotification } from './notifications.js';
import { formatPhone } from '../utils/format.js';

/**
 * Добавляет анимацию тряски к элементу
 * @param {HTMLElement} element - Элемент для анимации
 * @returns {void}
 */
function shakeElement(element) {
    // Добавляем класс shake к самому элементу или его контейнеру
    const targetElement = element.type === 'checkbox' 
        ? element.closest('.cta__form-checkbox') || element
        : element;
    
    targetElement.classList.add('shake');
    setTimeout(() => {
        targetElement.classList.remove('shake');
    }, 500);
}

/**
 * Валидирует поле имени
 * @param {HTMLInputElement} input - Поле ввода имени
 * @param {boolean} showError - Показывать ли сообщение об ошибке
 * @returns {boolean} true если валидный, false если нет
 */
export function validateNameInput(input, showError = false) {
    const nameValue = input.value.trim();
    const errorElement = document.getElementById('cta-name-error');

    // Валидация: минимум 2 символа, только буквы, пробелы и дефисы
    const isValid = nameValue.length >= 2 && /^[А-Яа-яЁёA-Za-z\s\-]+$/.test(nameValue);

    // Очищаем предыдущее сообщение об ошибке
    if (errorElement) {
        errorElement.textContent = '';
    }

    // Визуальная индикация
    if (nameValue.length > 0) {
        if (isValid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
            input.setAttribute('aria-invalid', 'false');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
            input.setAttribute('aria-invalid', 'true');
            if (showError && errorElement) {
                shakeElement(input);
                if (nameValue.length < 2) {
                    errorElement.textContent = 'Имя должно содержать минимум 2 символа';
                } else {
                    errorElement.textContent = 'Имя может содержать только буквы, пробелы и дефисы';
                }
            }
        }
    } else {
        input.classList.remove('valid', 'invalid');
        if (showError && errorElement) {
            input.setAttribute('aria-invalid', 'true');
            shakeElement(input);
            errorElement.textContent = 'Пожалуйста, укажите ваше имя';
        } else {
            input.setAttribute('aria-invalid', 'false');
        }
    }

    return isValid;
}

/**
 * Валидирует поле телефона
 * @param {HTMLInputElement} input - Поле ввода телефона
 * @param {boolean} showError - Показывать ли сообщение об ошибке
 * @returns {boolean} true если валидный, false если нет
 */
export function validatePhoneInput(input, showError = false) {
    const phoneValue = input.value.replace(/\D/g, '');
    const errorElement = document.getElementById('cta-phone-error');

    // Форматирование телефона
    const formattedPhone = formatPhone(phoneValue);
    input.value = formattedPhone;

    // Валидация: проверяем длину цифр и правильность начала номера (должен начинаться с 7 и иметь 11 цифр)
    const digitsOnly = formattedPhone.replace(/\D/g, '');
    const isValid = digitsOnly.length === 11 &&
                    digitsOnly.startsWith('7') &&
                    /^[489]/.test(digitsOnly[1]); // Второй символ должен быть 4, 8 или 9

    // Очищаем предыдущее сообщение об ошибке
    if (errorElement) {
        errorElement.textContent = '';
    }

    // Визуальная индикация
    if (formattedPhone.length > 0) {
        if (isValid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
            input.setAttribute('aria-invalid', 'false');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
            input.setAttribute('aria-invalid', 'true');
            if (showError && errorElement) {
                if (digitsOnly.length >= 5) {
                    shakeElement(input);
                    errorElement.textContent = 'Укажите полный номер телефона (11 цифр, например: +7 (900) 123-45-67)';
                } else if (digitsOnly.length > 0) {
                    // Не показываем ошибку для очень коротких номеров при blur
                }
            }
        }
    } else {
        input.classList.remove('valid', 'invalid');
        if (showError && errorElement) {
            input.setAttribute('aria-invalid', 'true');
            shakeElement(input);
            errorElement.textContent = 'Пожалуйста, укажите ваш телефон';
        } else {
            input.setAttribute('aria-invalid', 'false');
        }
    }

    return isValid;
}

/**
 * Валидирует поле площади
 * @param {HTMLInputElement} input - Поле ввода площади
 * @param {boolean} showError - Показывать ли сообщение об ошибке
 * @returns {boolean} true если валидный, false если нет
 */
export function validateAreaInput(input, showError = false) {
    const areaValue = parseFloat(input.value);
    const errorElement = document.getElementById('cta-area-error');

    // Валидация: от 20 до 500 м²
    const isValid = !isNaN(areaValue) && areaValue >= 20 && areaValue <= 500;

    // Очищаем предыдущее сообщение об ошибке
    if (errorElement) {
        errorElement.textContent = '';
    }

    // Визуальная индикация
    if (input.value.trim().length > 0) {
        if (isValid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
            input.setAttribute('aria-invalid', 'false');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
            input.setAttribute('aria-invalid', 'true');
            if (showError && errorElement) {
                shakeElement(input);
                if (isNaN(areaValue)) {
                    errorElement.textContent = 'Укажите площадь числом';
                } else if (areaValue < 20) {
                    errorElement.textContent = 'Минимальная площадь дома — 20 м²';
                } else if (areaValue > 500) {
                    errorElement.textContent = 'Максимальная площадь дома — 500 м²';
                }
            }
        }
    } else {
        input.classList.remove('valid', 'invalid');
        input.setAttribute('aria-invalid', 'false');
        // Поле площади необязательное, поэтому не показываем ошибку для пустого значения
    }

    return isValid;
}

/**
 * Валидирует чекбокс согласия
 * @param {HTMLInputElement} checkbox - Чекбокс согласия
 * @param {boolean} showError - Показывать ли сообщение об ошибке
 * @returns {boolean} true если валидный, false если нет
 */
export function validateAgreementCheckbox(checkbox, showError = false) {
    const errorElement = document.getElementById('cta-agreement-error');
    const isValid = checkbox.checked;

    // Очищаем предыдущее сообщение об ошибке
    if (errorElement) {
        errorElement.textContent = '';
    }

    // Визуальная индикация
    if (isValid) {
        checkbox.setAttribute('aria-invalid', 'false');
        checkbox.closest('.cta__form-checkbox')?.classList.remove('invalid');
    } else {
        checkbox.setAttribute('aria-invalid', 'true');
        checkbox.closest('.cta__form-checkbox')?.classList.add('invalid');
        if (showError && errorElement) {
            shakeElement(checkbox);
            errorElement.textContent = 'Необходимо дать согласие на обработку персональных данных';
        }
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
 * @returns {Promise<void>}
 */
async function handleCTAFormSubmit(form, submitButton, submitText, submitLoading, updateProgress) {
    // Валидация всех полей перед отправкой
    const nameInput = form.querySelector('#cta-name');
    const phoneInput = form.querySelector('#cta-phone');
    const areaInput = form.querySelector('#cta-area');
    const agreementCheckbox = form.querySelector('#cta-agreement');

    const isNameValid = validateNameInput(nameInput, true);
    const isPhoneValid = validatePhoneInput(phoneInput, true);
    const isAreaValid = !areaInput || validateAreaInput(areaInput, true);
    const isAgreementValid = validateAgreementCheckbox(agreementCheckbox, true);

    // Если хотя бы одно поле невалидно, прерываем отправку
    if (!isNameValid || !isPhoneValid || !isAreaValid || !isAgreementValid) {
        return;
    }

    submitButton.disabled = true;
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline-block';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Добавляем тип формы
    data.formType = 'CTA';

    // Отправка на сервер
    try {
        const response = await fetch('/api/submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Спасибо! Мы свяжемся с вами в течение 15 минут', 'success');
            
            // Сброс формы
            form.reset();
            // Очищаем классы валидации после сброса формы
            form.querySelectorAll('.valid, .invalid').forEach(input => {
                input.classList.remove('valid', 'invalid');
            });
            // Очищаем aria-invalid атрибуты
            form.querySelectorAll('[aria-invalid]').forEach(input => {
                input.setAttribute('aria-invalid', 'false');
            });
            // Очищаем класс invalid у чекбокса
            form.querySelectorAll('.cta__form-checkbox.invalid').forEach(checkbox => {
                checkbox.classList.remove('invalid');
            });
            // Очищаем сообщения об ошибках
            form.querySelectorAll('.cta__form-error').forEach(error => {
                error.textContent = '';
            });
            updateProgress();
        } else {
            showNotification(result.error || 'Произошла ошибка. Пожалуйста, попробуйте ещё раз или позвоните нам.', 'error');
        }
    } catch (error) {
        console.error('Ошибка отправки формы:', error);
        showNotification('Произошла ошибка при отправке. Пожалуйста, попробуйте ещё раз или позвоните нам.', 'error');
    } finally {
        submitButton.disabled = false;
        submitText.style.display = 'inline-block';
        submitLoading.style.display = 'none';
    }
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

        // Добавляем валидацию для каждого типа поля
        if (input.type === 'text' && input.id === 'cta-name') {
            input.addEventListener('input', () => validateNameInput(input));
            input.addEventListener('blur', () => validateNameInput(input, true));
        } else if (input.type === 'tel' && input.id === 'cta-phone') {
            input.addEventListener('input', () => validatePhoneInput(input));
            input.addEventListener('blur', () => validatePhoneInput(input, true));
        }
    });

    // Добавляем валидацию для поля площади (необязательное поле)
    const areaInput = form.querySelector('#cta-area');
    if (areaInput) {
        areaInput.addEventListener('input', () => {
            validateAreaInput(areaInput);
            updateProgress();
        });
        areaInput.addEventListener('blur', () => validateAreaInput(areaInput, true));
    }

    // Добавляем валидацию для чекбокса согласия
    const agreementCheckbox = form.querySelector('#cta-agreement');
    if (agreementCheckbox) {
        agreementCheckbox.addEventListener('change', () => {
            validateAgreementCheckbox(agreementCheckbox);
            updateProgress();
        });
    }

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
 * Валидирует чекбокс согласия в форме калькулятора
 * @param {HTMLInputElement} checkbox - Чекбокс согласия
 * @param {boolean} showError - Показывать ли сообщение об ошибке
 * @returns {boolean} true если валидный, false если нет
 */
function validateCalculatorAgreement(checkbox, showError = false) {
    const errorElement = document.getElementById('calc-agreement-error');
    const isValid = checkbox.checked;

    // Очищаем предыдущее сообщение об ошибке
    if (errorElement) {
        errorElement.textContent = '';
    }

    // Визуальная индикация
    if (isValid) {
        checkbox.setAttribute('aria-invalid', 'false');
        checkbox.closest('.calculator__form-checkbox')?.classList.remove('invalid');
    } else {
        checkbox.setAttribute('aria-invalid', 'true');
        checkbox.closest('.calculator__form-checkbox')?.classList.add('invalid');
        if (showError && errorElement) {
            errorElement.textContent = 'Необходимо дать согласие на обработку персональных данных';
        }
    }

    return isValid;
}

/**
 * Обрабатывает отправку формы калькулятора
 * @param {HTMLElement} form - Элемент формы
 * @returns {Promise<void>}
 */
async function handleCalculatorSubmit(form) {
    const agreementCheckbox = form.querySelector('#calc-agreement');
    
    // Валидация согласия
    if (agreementCheckbox && !validateCalculatorAgreement(agreementCheckbox, true)) {
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Если есть согласие, отправляем заявку в Telegram
    if (agreementCheckbox && agreementCheckbox.checked) {
        try {
            // Создаём данные для отправки (имя и телефон не обязательны для калькулятора)
            const submitData = {
                formType: 'calculator',
                area: data.area,
                type: data.type,
                finish: data.finish,
                name: 'Не указано',
                phone: 'Не указан'
            };

            // Отправляем в Telegram (не блокируем UI, отправляем в фоне)
            fetch('/api/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            }).catch(error => {
                console.error('Ошибка отправки заявки из калькулятора:', error);
            });
        } catch (error) {
            console.error('Ошибка подготовки данных калькулятора:', error);
        }
    }
    
    // Прокрутка к форме CTA
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
    
    // Добавляем валидацию для чекбокса согласия
    const agreementCheckbox = calculatorForm.querySelector('#calc-agreement');
    if (agreementCheckbox) {
        agreementCheckbox.addEventListener('change', () => {
            validateCalculatorAgreement(agreementCheckbox);
        });
    }

    calculatorForm.addEventListener('input', updatePrice);
    calculatorForm.addEventListener('change', updatePrice);
    calculatorForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleCalculatorSubmit(this);
    });
    
    updatePrice();
}
