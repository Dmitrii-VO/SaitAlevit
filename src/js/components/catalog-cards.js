import { escapeHtml } from "../utils/escape-html.js";

/**
 * Создает карточку проекта
 * @param {Object} project - Объект проекта
 * @param {string} project.title - Название проекта
 * @param {number} project.area - Площадь в м²
 * @param {number} project.price - Цена
 * @param {string} project.floors - Этажность
 * @param {string} project.mainImage - Главное изображение
 * @param {Array<string>} project.gallery - Массив изображений галереи
 * @param {string} project.id - ID проекта
 * @returns {HTMLElement} Созданная карточка проекта
 */
export function createProjectCard(project) {
  const card = document.createElement("div");
  card.className = "projects__card";

  const description =
    project.description || `одноэтажный дом ${project.area} м²`;
  const formattedPrice = new Intl.NumberFormat("ru-RU").format(project.price);
  const imageSrc = project.mainImage || "";
  const imageAlt = `${project.title} - ${description}`;
  const images = JSON.stringify(
    project.gallery || [project.mainImage].filter(Boolean),
  );

  card.innerHTML = `
        <div class="projects__card-image">
            <img src="${imageSrc}" alt="${escapeHtml(imageAlt)}" class="projects__card-img" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Crect fill=\\'%23f5f5f5\\' width=\\'400\\' height=\\'300\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3EНет фото%3C/text%3E%3C/svg%3E';">
        </div>
        ${project.planImage ? `<img class="projects__plan" src="${encodeURI(project.planImage)}" alt="Планировка дома" loading="lazy">` : ""}
        <div class="projects__card-content">
            <h3 class="projects__card-title">${escapeHtml(project.title)}</h3>
            <p class="projects__card-description">${escapeHtml(description)}</p>
            <ul class="projects__card-specs">
                <li class="projects__card-spec">
                    <span class="projects__card-spec-label">Этажность:</span>
                    <span class="projects__card-spec-value">${escapeHtml(project.floors || "1 этаж")}</span>
                </li>
                <li class="projects__card-spec">
                    <span class="projects__card-spec-label">Площадь:</span>
                    <span class="projects__card-spec-value"><strong>${project.area}</strong> м²</span>
                </li>
                <li class="projects__card-spec">
                    <span class="projects__card-spec-label">Стоимость:</span>
                    <span class="projects__card-spec-value"><strong>${formattedPrice}</strong> ₽</span>
                </li>
            </ul>
            <button class="btn btn--gold projects__gallery-btn"
                    data-project-id="${escapeHtml(project.id)}"
                    data-project-title="${escapeHtml(project.title)}"
                    data-images='${images}'>
                Смотреть все фото
            </button>
        </div>
    `;

  return card;
}

/**
 * Создает карточку видео отзыва
 * @param {Object} review - Объект отзыва
 * @param {string} review.clientName - Имя клиента
 * @param {string} review.houseName - Название дома
 * @param {string} review.reviewText - Текст отзыва
 * @param {string} review.videoUrl - URL видео (если есть)
 * @returns {HTMLElement} Созданная карточка отзыва
 */
export function createVideoReviewCard(review) {
  const card = document.createElement("article");
  card.className = "reviews__card";

  const videoHTML = review.videoUrl
    ? `<iframe src="${escapeHtml(review.videoUrl)}" class="reviews__card-video-iframe" frameborder="0" allowfullscreen></iframe>`
    : `<div class="reviews__card-video-placeholder">
            <svg class="reviews__card-video-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M10 8L16 12L10 16V8Z" fill="currentColor"/>
            </svg>
            <span class="reviews__card-video-text">Видео отзыв</span>
        </div>`;

  card.innerHTML = `
        <div class="reviews__card-video">
            ${videoHTML}
        </div>
        <div class="reviews__card-content">
            <p class="reviews__card-author">${escapeHtml(review.clientName || "Клиент")}</p>
            ${review.houseName ? `<p class="reviews__card-house">${escapeHtml(review.houseName)}</p>` : ""}
            <p class="reviews__card-text">"${escapeHtml(review.reviewText || "")}"</p>
        </div>
    `;

  return card;
}

/**
 * Создает текстовый отзыв
 * @param {Object} review - Объект отзыва
 * @param {string} review.clientName - Имя клиента
 * @param {string} review.houseName - Название дома
 * @param {string} review.reviewText - Текст отзыва
 * @returns {HTMLElement} Созданный элемент отзыва
 */
export function createTextReviewItem(review) {
  const item = document.createElement("article");
  item.className = "reviews__text-item";

  item.innerHTML = `
        <div class="reviews__text-quote">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21C3 17.4 5.4 15 9 15C10.6 15 12 15.6 13 16.6M21 21C21 17.4 18.6 15 15 15C13.4 15 12 15.6 11 16.6M13 8C13 9.65685 11.6569 11 10 11C8.34315 11 7 9.65685 7 8C7 6.34315 8.34315 5 10 5C11.6569 5 13 6.34315 13 8ZM17 8C17 9.65685 15.6569 11 14 11C12.3431 11 11 9.65685 11 8C11 6.34315 12.3431 5 14 5C15.6569 5 17 6.34315 17 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <p class="reviews__text-content">"${escapeHtml(review.reviewText || "")}"</p>
        <div class="reviews__text-meta">
            <p class="reviews__text-author">${escapeHtml(review.clientName || "Клиент")}</p>
            ${review.houseName ? `<p class="reviews__text-house">${escapeHtml(review.houseName)}</p>` : ""}
        </div>
    `;

  return item;
}

/**
 * Создает карточку работы
 * @param {Object} work - Объект работы
 * @param {string} work.title - Название работы
 * @param {number} work.area - Площадь в м²
 * @param {string} work.format - Формат работы
 * @param {string} work.workStatus - Статус работы
 * @param {string} work.description - Описание
 * @param {string} work.mainImage - Главное изображение
 * @param {Array<string>} work.gallery - Массив изображений галереи
 * @param {Function} getBadgeText - Функция для получения текста бейджа
 * @returns {HTMLElement} Созданная карточка работы
 */
export function createWorkCard(work, getBadgeText) {
  const card = document.createElement("div");
  card.className = "works__card";

  const mainImage = work.mainImage || "";
  const images = work.gallery || [mainImage].filter(Boolean);
  const imagesJSON = JSON.stringify(images);
  const badgeText = getBadgeText
    ? getBadgeText(work.workStatus, work.completionDate)
    : "";

  // Формируем компактную строку с характеристиками
  const characteristics = [];
  if (work.rooms) characteristics.push(`${work.rooms} комн.`);
  if (work.material) characteristics.push(work.material);
  const characteristicsText =
    characteristics.length > 0 ? characteristics.join(" • ") : "";

  card.innerHTML = `
        <div class="works__card-image">
            <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(work.title || "Работа")} - построенный дом компании АЛЕВИТ СТРОЙ" class="works__card-img" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Crect fill=\\'%23f5f5f5\\' width=\\'400\\' height=\\'300\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3EНет фото%3C/text%3E%3C/svg%3E';">
            ${badgeText ? `<div class="works__card-badge works__card-badge--completed">${escapeHtml(badgeText)}</div>` : ""}
        </div>
        <div class="works__card-content">
            <h3 class="works__card-title">${escapeHtml(work.title || "Работа")}</h3>
            <ul class="works__card-specs">
                ${
                  work.area
                    ? `
                    <li class="works__card-spec">
                        <span class="works__card-spec-label">Площадь:</span>
                        <span class="works__card-spec-value"><strong>${work.area}</strong> м²</span>
                    </li>
                `
                    : ""
                }
                ${
                  characteristicsText
                    ? `
                    <li class="works__card-spec">
                        <span class="works__card-spec-label">Характеристики:</span>
                        <span class="works__card-spec-value">${escapeHtml(characteristicsText)}</span>
                    </li>
                `
                    : ""
                }
            </ul>
            ${images.length > 0 ? `<button class="btn btn--gold works__gallery-btn" data-project="${escapeHtml(work.title || "Работа")}" data-images='${imagesJSON}'>Смотреть все фото</button>` : ""}
        </div>
    `;

  return card;
}
