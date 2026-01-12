/**
 * Компонент для работы с контактами
 * @module components/contacts
 */

import { parseAddress } from '../utils/format.js';

/**
 * Обновляет плавающие кнопки с контактами
 * @param {Object} contacts - Объект контактов
 * @param {string} contacts.phone - Телефон
 * @param {string} contacts.whatsapp - Ссылка на WhatsApp
 * @returns {void}
 */
export function updateFloatingButtons(contacts) {
    // Телефон
    const phoneButton = document.querySelector('.floating-button--phone');
    if (phoneButton && contacts.phone) {
        const phoneHref = `tel:${contacts.phone.replace(/\D/g, '')}`;
        phoneButton.setAttribute('href', phoneHref);
    }
    
    // WhatsApp
    const whatsappButton = document.querySelector('.floating-button--whatsapp');
    if (whatsappButton && contacts.whatsapp && contacts.whatsapp !== '#') {
        // Если это номер телефона, преобразуем в ссылку WhatsApp
        let whatsappHref = contacts.whatsapp;
        if (whatsappHref.startsWith('+') || /^\d/.test(whatsappHref)) {
            // Убираем все нецифровые символы, кроме +
            const phoneNumber = whatsappHref.replace(/[^\d+]/g, '').replace(/^\+/, '');
            whatsappHref = `https://wa.me/${phoneNumber}`;
        }
        whatsappButton.setAttribute('href', whatsappHref);
    }
}

/**
 * Обновляет Schema.org данные в head
 * @param {Object} contacts - Объект контактов
 * @param {string} contacts.phone - Телефон
 * @param {string} contacts.email - Email
 * @param {string} contacts.address - Адрес
 * @returns {void}
 */
export function updateSchemaOrg(contacts) {
    if (!contacts) return;
    
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    schemaScripts.forEach(script => {
        try {
            const schema = JSON.parse(script.textContent);
            let updated = false;
            
            // Обновляем телефон
            if (contacts.phone) {
                if (schema.telephone) {
                    schema.telephone = contacts.phone;
                    updated = true;
                }
                if (schema.contactPoint && schema.contactPoint.telephone) {
                    schema.contactPoint.telephone = contacts.phone;
                    updated = true;
                }
            }
            
            // Обновляем email
            if (contacts.email && schema.email) {
                schema.email = contacts.email;
                updated = true;
            }
            
            // Обновляем адрес
            if (contacts.address && schema.address) {
                const addressParts = parseAddress(contacts.address);
                if (addressParts) {
                    if (addressParts.streetAddress) schema.address.streetAddress = addressParts.streetAddress;
                    if (addressParts.addressLocality) schema.address.addressLocality = addressParts.addressLocality;
                    if (addressParts.addressRegion) schema.address.addressRegion = addressParts.addressRegion;
                    updated = true;
                }
            }
            
            if (updated) {
                script.textContent = JSON.stringify(schema, null, 2);
            }
        } catch (e) {
            console.error('Ошибка обновления schema.org:', e);
        }
    });
}
