/**
 * Компонент для показа уведомлений
 * @module components/notifications
 */

/**
 * Показывает уведомление пользователю
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип уведомления: 'success', 'error', 'warning', 'info'
 * @returns {void}
 */
export function showNotification(message, type = 'info') {
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
