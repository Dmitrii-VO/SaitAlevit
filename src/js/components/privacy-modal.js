/**
 * Модуль для работы с модальным окном согласия на обработку персональных данных
 * @module components/privacy-modal
 */

/**
 * Инициализирует модальное окно согласия на обработку персональных данных
 * @returns {void}
 */
export function initPrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    const overlay = modal?.querySelector('.privacy-modal__overlay');
    const closeButton = modal?.querySelector('.privacy-modal__close');
    const acceptButton = modal?.querySelector('.privacy-modal__accept');
    const privacyLinks = document.querySelectorAll('[data-privacy-modal]');

    if (!modal) return;

    /**
     * Открывает модальное окно
     */
    function openModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        modal.setAttribute('aria-hidden', 'false');
        
        // Фокус на кнопке закрытия для accessibility
        closeButton?.focus();
    }

    /**
     * Закрывает модальное окно
     */
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        modal.setAttribute('aria-hidden', 'true');
    }

    // Обработчики для открытия модального окна
    privacyLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });

    // Обработчики для закрытия модального окна
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    if (acceptButton) {
        acceptButton.addEventListener('click', closeModal);
    }

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Инициализация: модальное окно скрыто
    modal.setAttribute('aria-hidden', 'true');
}
