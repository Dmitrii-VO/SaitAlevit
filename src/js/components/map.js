/**
 * Модуль для работы с Яндекс Картами
 * @module components/map
 */

import { fetchJSON } from '../utils/fetch.js';

/**
 * Определяет цвет метки по статусу работы
 * @param {string} workStatus - Статус работы
 * @returns {string} Цвет метки ('green', 'orange', 'red')
 */
function getMarkerColor(workStatus) {
    if (!workStatus) return 'red';
    
    const status = workStatus.toLowerCase();
    
    // Зелёные - построенные, сданы в эксплуатацию
    if (status.includes('сдан') || status.includes('эксплуатац')) {
        return 'green';
    }
    
    // Оранжевые - строящиеся дома
    if (status.includes('строит') || status.includes('в процессе')) {
        return 'orange';
    }
    
    // Красные - этап строительства, можно заказать
    return 'red';
}

/**
 * Инициализирует Яндекс Карту
 * @returns {Promise<void>}
 */
async function initYandexMap() {
    const mapContainer = document.getElementById('yandex-map');
    if (!mapContainer) {
        console.warn('Контейнер карты не найден');
        return;
    }

    try {

        // Загружаем данные работ
        const worksData = await fetchJSON('data/works.json');
        const works = (worksData.works || []).filter(work => {
            // Показываем только опубликованные работы с координатами
            return work.status === 'published' && 
                   work.coordinates && 
                   work.coordinates.lat && 
                   work.coordinates.lng;
        });

        if (works.length === 0) {
            mapContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Объекты на карте появятся после добавления координат</p>';
            return;
        }

        // Создаём карту
        const map = new ymaps.Map('yandex-map', {
            center: [50.5957, 36.5872], // Центр Белгорода
            zoom: 11,
            controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
        });

        // Создаём коллекцию меток
        const placemarks = [];
        const bounds = [];

        works.forEach(work => {
            // Проверяем валидность координат
            if (!work.coordinates || 
                typeof work.coordinates.lat !== 'number' || 
                typeof work.coordinates.lng !== 'number' ||
                isNaN(work.coordinates.lat) || 
                isNaN(work.coordinates.lng)) {
                console.warn(`⚠️ Пропущена работа "${work.title}" - невалидные координаты:`, work.coordinates);
                return;
            }

            const lat = Number(work.coordinates.lat);
            const lng = Number(work.coordinates.lng);

            // Проверяем диапазон координат
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                console.warn(`⚠️ Пропущена работа "${work.title}" - координаты вне допустимого диапазона:`, { lat, lng });
                return;
            }

            const color = getMarkerColor(work.workStatus);
            const fillColor = color === 'green' ? '#28a745' : color === 'orange' ? '#ff8c00' : '#dc3545';

            try {
                const placemark = new ymaps.Placemark(
                    [lat, lng],
                    {
                        balloonContentHeader: `<b>${work.title || 'Объект'}</b>`,
                        balloonContentBody: `
                            ${work.area ? `<p>Площадь: ${work.area} м²</p>` : ''}
                            ${work.format ? `<p>Формат: ${work.format}</p>` : ''}
                            ${work.workStatus ? `<p>Статус: ${work.workStatus}</p>` : ''}
                            ${work.address ? `<p>Адрес: ${work.address}</p>` : ''}
                        `,
                        balloonContentFooter: work.description || '',
                        hintContent: work.title || 'Объект'
                    },
                    {
                        iconLayout: 'default#imageWithContent',
                        iconImageHref: `data:image/svg+xml;base64,${btoa(`
                            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="16" cy="16" r="14" fill="${fillColor}" stroke="#fff" stroke-width="2"/>
                                <circle cx="16" cy="16" r="6" fill="#fff"/>
                            </svg>
                        `)}`,
                        iconImageSize: [32, 32],
                        iconImageOffset: [-16, -16]
                    }
                );

                placemarks.push(placemark);
                bounds.push([lat, lng]);
            } catch (error) {
                console.error(`❌ Ошибка создания метки для работы "${work.title}":`, error);
            }
        });

        // Добавляем метки на карту
        if (placemarks.length === 0) {
            mapContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Объекты на карте появятся после добавления координат</p>';
            return;
        }

        placemarks.forEach(placemark => {
            map.geoObjects.add(placemark);
        });

        // Если есть метки, подстраиваем границы карты
        if (bounds.length > 0) {
            try {
                // Проверяем, что все координаты валидны
                const validBounds = bounds.filter(coord => 
                    Array.isArray(coord) && 
                    coord.length === 2 && 
                    typeof coord[0] === 'number' && 
                    typeof coord[1] === 'number' &&
                    !isNaN(coord[0]) && 
                    !isNaN(coord[1])
                );

                if (validBounds.length === 0) {
                    console.warn('⚠️ Нет валидных координат для установки границ карты');
                } else if (validBounds.length === 1) {
                    // Если только одна метка, устанавливаем центр и зум
                    const [lat, lng] = validBounds[0];
                    map.setCenter([lat, lng], 15, {
                        duration: 300
                    });
                } else {
                    // Если несколько меток, устанавливаем границы
                    map.setBounds(validBounds, {
                        checkZoomRange: true,
                        duration: 300
                    });
                }
            } catch (error) {
                console.error('❌ Ошибка установки границ карты:', error);
                // Если ошибка, просто устанавливаем центр на первую метку
                if (bounds.length > 0 && Array.isArray(bounds[0]) && bounds[0].length === 2) {
                    try {
                        map.setCenter(bounds[0], 15);
                    } catch (centerError) {
                        console.error('❌ Ошибка установки центра карты:', centerError);
                    }
                }
            }
        }

        console.log(`✅ Карта инициализирована, добавлено меток: ${placemarks.length}`);
    } catch (error) {
        console.error('❌ Ошибка инициализации карты:', error);
        console.error('Детали ошибки:', {
            message: error.message,
            stack: error.stack,
            ymapsLoaded: typeof ymaps !== 'undefined'
        });
        
        let errorMessage = 'Ошибка загрузки карты';
        if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        
        mapContainer.innerHTML = `<p style="text-align: center; padding: 2rem; color: var(--color-gray);">${errorMessage}</p>`;
    }
}

/**
 * Инициализирует карту объектов
 * Проверяет наличие библиотеки Яндекс Карт и загружает данные
 */
export function initMap() {
    const mapContainer = document.getElementById('yandex-map');
    if (!mapContainer) {
        console.warn('Контейнер карты не найден');
        return;
    }

    // Функция для попытки инициализации
    const tryInit = () => {
        if (typeof ymaps !== 'undefined' && typeof ymaps.ready === 'function') {
            // Библиотека загружена, ждём готовности API
            try {
                ymaps.ready(() => {
                    initYandexMap().catch(error => {
                        console.error('❌ Ошибка инициализации карты:', error);
                        mapContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Ошибка загрузки карты</p>';
                    });
                });
                return true;
            } catch (error) {
                console.error('❌ Ошибка при вызове ymaps.ready:', error);
                mapContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Ошибка инициализации карты</p>';
                return true; // Прекращаем попытки
            }
        }
        return false;
    };

    // Пробуем сразу, если библиотека уже загружена
    if (tryInit()) {
        return;
    }

    // Если библиотека ещё не загружена, ждём её загрузки
    let attempts = 0;
    const maxAttempts = 100; // 10 секунд (100 * 100ms)
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (tryInit()) {
            clearInterval(checkInterval);
            return;
        }

        // Если превышен лимит попыток
        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Библиотека Яндекс Карт не загружена в течение 10 секунд');
            mapContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Карта временно недоступна. Проверьте подключение к интернету.</p>';
        }
    }, 100);
}
