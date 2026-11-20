/**
 * Модуль для работы с Яндекс Картами
 * @module components/map
 */

import { fetchJSON } from "../utils/fetch.js";

function getMarkerColor(workStatus = "") {
  const status = workStatus.toLowerCase();
  if (status.includes("участок")) return "#ff8c00";
  if (status.includes("продаж")) return "#28a745";
  if (status.includes("строит") || status.includes("в процессе")) return "#f2c230";
  return "#dc3545";
}

/**
 * Инициализирует Яндекс Карту
 * @returns {Promise<void>}
 */
async function initYandexMap() {
  const mapContainer = document.getElementById("yandex-map");
  if (!mapContainer) {
    console.warn("Контейнер карты не найден");
    return;
  }

  try {
    // Загружаем данные работ
    const worksData = await fetchJSON("data/works.json");
    const works = (worksData.works || []).filter((work) => {
      // Показываем только опубликованные работы с координатами
      return (
        work.status === "published" &&
        work.coordinates &&
        work.coordinates.lat &&
        work.coordinates.lng
      );
    });

    if (works.length === 0) {
      mapContainer.innerHTML =
        '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Объекты на карте появятся после добавления координат</p>';
      return;
    }

    // Создаём карту
    mapContainer.classList.add("map__content--active");
    const map = new ymaps.Map("yandex-map", {
      center: [50.5957, 36.5872], // Центр Белгорода
      zoom: 11,
      controls: ["zoomControl", "typeSelector", "fullscreenControl"],
    });

    // Создаём коллекцию меток
    const placemarks = [];
    const bounds = [];

    works.forEach((work) => {
      // Проверяем валидность координат
      if (
        !work.coordinates ||
        typeof work.coordinates.lat !== "number" ||
        typeof work.coordinates.lng !== "number" ||
        isNaN(work.coordinates.lat) ||
        isNaN(work.coordinates.lng)
      ) {
        console.warn(
          `⚠️ Пропущена работа "${work.title}" - невалидные координаты:`,
          work.coordinates,
        );
        return;
      }

      const lat = Number(work.coordinates.lat);
      const lng = Number(work.coordinates.lng);

      // Проверяем диапазон координат
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn(
          `⚠️ Пропущена работа "${work.title}" - координаты вне допустимого диапазона:`,
          { lat, lng },
        );
        return;
      }

      const fillColor = getMarkerColor(work.workStatus);

      try {
        const placemark = new ymaps.Placemark(
          [lat, lng],
          {
            balloonContentHeader: `<b>${work.title || "Объект"}</b>`,
            balloonContentBody: `
                            ${work.area ? `<p>Площадь: ${work.area} м²</p>` : ""}
                            ${work.format ? `<p>Формат: ${work.format}</p>` : ""}
                            ${work.workStatus ? `<p>Статус: ${work.workStatus}</p>` : ""}
                            ${work.address ? `<p>Адрес: ${work.address}</p>` : ""}
                        `,
            balloonContentFooter: work.description || "",
            hintContent: work.title || "Объект",
          },
          {
            iconLayout: "default#imageWithContent",
            iconImageHref: `data:image/svg+xml;base64,${btoa(`
                            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 30V3" stroke="#333" stroke-width="3"/><path d="M7 3h21l-5 7 5 7H7z" fill="${fillColor}" stroke="#fff" stroke-width="1.5"/>
                            </svg>
                        `)}`,
            iconImageSize: [32, 32],
            iconImageOffset: [-6, -30],
          },
        );

        placemarks.push(placemark);
        bounds.push([lat, lng]);
      } catch (error) {
        console.error(
          `❌ Ошибка создания метки для работы "${work.title}":`,
          error,
        );
      }
    });

    // Добавляем метки на карту
    if (placemarks.length === 0) {
      mapContainer.innerHTML =
        '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Объекты на карте появятся после добавления координат</p>';
      return;
    }

    placemarks.forEach((placemark) => {
      map.geoObjects.add(placemark);
    });

    // Если есть метки, подстраиваем границы карты
    if (bounds.length > 0) {
      try {
        // Проверяем, что все координаты валидны
        const validBounds = bounds.filter(
          (coord) =>
            Array.isArray(coord) &&
            coord.length === 2 &&
            typeof coord[0] === "number" &&
            typeof coord[1] === "number" &&
            !isNaN(coord[0]) &&
            !isNaN(coord[1]),
        );

        if (validBounds.length === 0) {
          console.warn("⚠️ Нет валидных координат для установки границ карты");
        } else if (validBounds.length === 1) {
          // Если только одна метка, устанавливаем центр и зум
          const [lat, lng] = validBounds[0];
          map.setCenter([lat, lng], 15, {
            duration: 300,
          });
        } else {
          // Если несколько меток, устанавливаем границы
          map.setBounds(validBounds, {
            checkZoomRange: true,
            duration: 300,
          });
        }
      } catch (error) {
        console.error("❌ Ошибка установки границ карты:", error);
        // Если ошибка, просто устанавливаем центр на первую метку
        if (
          bounds.length > 0 &&
          Array.isArray(bounds[0]) &&
          bounds[0].length === 2
        ) {
          try {
            map.setCenter(bounds[0], 15);
          } catch (centerError) {
            console.error("❌ Ошибка установки центра карты:", centerError);
          }
        }
      }
    }

    console.log(
      `✅ Карта инициализирована, добавлено меток: ${placemarks.length}`,
    );
  } catch (error) {
    console.error("❌ Ошибка инициализации карты:", error);
    console.error("Детали ошибки:", {
      message: error.message,
      stack: error.stack,
      ymapsLoaded: typeof ymaps !== "undefined",
    });

    mapContainer.classList.remove("map__content--active");
    let errorMessage = "Ошибка загрузки карты";
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
  const mapContainer = document.getElementById("yandex-map");
  if (!mapContainer) {
    console.warn("Контейнер карты не найден");
    return;
  }

  // Функция для попытки инициализации
  const tryInit = () => {
    if (typeof ymaps !== "undefined" && typeof ymaps.ready === "function") {
      // Библиотека загружена, ждём готовности API
      try {
        ymaps.ready(() => {
          initYandexMap().catch((error) => {
            console.error("❌ Ошибка инициализации карты:", error);
            mapContainer.innerHTML =
              '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Ошибка загрузки карты</p>';
          });
        });
        return true;
      } catch (error) {
        console.error("❌ Ошибка при вызове ymaps.ready:", error);
        mapContainer.innerHTML =
          '<p style="text-align: center; padding: 2rem; color: var(--color-gray);">Ошибка инициализации карты</p>';
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
  document.getElementById("map-api")?.addEventListener("load", tryInit, { once: true });
}
