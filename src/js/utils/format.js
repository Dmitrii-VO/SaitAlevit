/**
 * Утилиты для форматирования данных
 * @module utils/format
 */

/**
 * Форматирует цену с пробелами в качестве разделителя тысяч
 * @param {number} price - Цена для форматирования
 * @returns {string} Отформатированная цена
 */
export function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(price));
}

/**
 * Форматирует телефон в формат +7 (XXX) XXX-XX-XX
 * @param {string} phone - Номер телефона для форматирования
 * @returns {string} Отформатированный номер телефона
 */
export function formatPhone(phone) {
    const phoneValue = phone.replace(/\D/g, '');
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
    }
    
    return formattedPhone;
}

/**
 * Парсит адрес для schema.org структурированных данных
 * @param {string} address - Адрес для парсинга
 * @returns {Object|null} Объект с полями streetAddress, addressLocality, addressRegion или null
 */
export function parseAddress(address) {
    if (!address) return null;
    
    const parts = {
        streetAddress: '',
        addressLocality: '',
        addressRegion: ''
    };
    
    // Извлекаем улицу и дом
    const streetMatch = address.match(/(ул\.\s*[^,]+,\s*д\.\s*\d+)/i);
    if (streetMatch) {
        parts.streetAddress = streetMatch[1];
    }
    
    // Извлекаем населенный пункт
    const localityMatch = address.match(/(?:с\.|село|г\.|город|пос\.|посёлок)\s*([^,]+)/i);
    if (localityMatch) {
        parts.addressLocality = localityMatch[1].trim();
    }
    
    // Извлекаем регион
    const regionMatch = address.match(/([^,]+область)/i);
    if (regionMatch) {
        parts.addressRegion = regionMatch[1].trim();
    }
    
    return Object.keys(parts).some(key => parts[key]) ? parts : null;
}

/**
 * Получает текст бейджа по статусу работы с унифицированным форматом
 * @param {string} workStatus - Статус работы
 * @param {string} completionDate - Дата завершения (месяц/год)
 * @returns {string} Текст бейджа с унифицированным статусом
 */
export function getWorkStatusBadge(workStatus, completionDate) {
    if (!workStatus) return '';
    const status = workStatus.toLowerCase();
    let badgeText = '';
    
    // Унифицируем статус
    if (status.includes('построен') || status.includes('сдан')) {
        badgeText = 'Построен';
    } else if (status.includes('строит')) {
        badgeText = 'Строится';
    } else {
        badgeText = workStatus;
    }
    
    // Добавляем дату, если есть
    if (completionDate && (status.includes('построен') || status.includes('сдан'))) {
        badgeText += ` • ${completionDate}`;
    }
    
    return badgeText;
}
