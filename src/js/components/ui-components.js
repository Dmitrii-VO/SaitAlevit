import { escapeHtml } from "../utils/escape-html.js";

const CONTACT_ICONS = {
  phone: `<path d="M22 16.92V19.92C22 20.52 21.52 21 20.92 21C9.4 21 0 11.6 0 0.08C0 -0.52 0.48 -1 1.08 -1H4.08C4.68 -1 5.16 -0.52 5.16 0.08C5.16 1.08 5.36 2.04 5.72 2.92C5.88 3.32 5.84 3.8 5.6 4.16L3.88 6.88C4.6 9.24 6.76 11.4 9.12 12.12L11.84 10.4C12.2 10.16 12.68 10.12 13.08 10.28C13.96 10.64 14.92 10.84 15.92 10.84C16.52 10.84 17 11.32 17 11.92V14.92C17 15.52 16.52 16 15.92 16H22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  email: `<path d="M4 4H20C21 4 22 5 22 6V18C22 19 21 20 20 20H4C3 20 2 19 2 18V6C2 5 3 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  address: `<path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
};

/**
 * Создает элемент контакта (телефон, email, адрес)
 * @param {string} type - Тип контакта: 'phone', 'email', 'address'
 * @param {string} title - Заголовок элемента
 * @param {string} value - Значение контакта
 * @param {string|null} href - Ссылка для клика
 * @param {boolean} isText - Отображать как текст (true) или ссылку (false)
 * @returns {HTMLElement} Созданный элемент контакта
 */
export function createContactItem(type, title, value, href, isText = false) {
  const item = document.createElement("div");
  item.className = "contacts__item";

  const escapedTitle = escapeHtml(title);
  const escapedValue = escapeHtml(value);
  const escapedHref = href ? escapeHtml(href) : "#";

  item.innerHTML = `
        <div class="contacts__item-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${CONTACT_ICONS[type] || ""}
            </svg>
        </div>
        <div class="contacts__item-content">
            <h3 class="contacts__item-title">${escapedTitle}</h3>
            ${
              isText
                ? `<p class="contacts__item-text">${escapedValue}</p>`
                : `<a href="${escapedHref}" class="contacts__item-link">${escapedValue}</a>`
            }
        </div>
    `;

  return item;
}

/**
 * Создает элемент контакта для hero-блока (компактный формат)
 * @param {string} type - Тип контакта: 'phone', 'email'
 * @param {string} value - Значение контакта
 * @param {string|null} href - Ссылка для клика
 * @returns {HTMLElement} Созданный элемент контакта
 */
export function createHeroContactItem(type, value, href) {
  const item = document.createElement(href ? "a" : "div");
  item.className = "hero__contacts-item";
  if (href) {
    item.href = href;
  }

  const escapedValue = escapeHtml(value);
  const iconPath = CONTACT_ICONS[type] || "";

  item.innerHTML = `
        <div class="hero__contacts-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${iconPath}
            </svg>
        </div>
        <span class="hero__contacts-item-text">${escapedValue}</span>
    `;

  return item;
}

/**
 * Создает выпадающее меню контактов для hero-блока
 * @param {Object} contacts - Объект с контактами
 * @param {string} contacts.phone - Телефон
 * @param {string} contacts.email - Email
 * @param {string} contacts.whatsapp - WhatsApp
 * @param {string} contacts.telegram - Telegram
 * @returns {HTMLElement} Созданный контейнер с выпадающим меню
 */
export function createHeroContactsDropdown(contacts) {
  const container = document.createElement("div");
  container.className = "hero__contacts-dropdown";

  // Основной элемент - телефон (всегда видимый)
  const phoneItem = document.createElement("a");
  phoneItem.className = "hero__contacts-main";
  phoneItem.href = contacts.phone
    ? `tel:${contacts.phone.replace(/\D/g, "")}`
    : "#";

  const phoneIcon = CONTACT_ICONS.phone || "";
  const phoneValue = escapeHtml(contacts.phone || "");

  phoneItem.innerHTML = `
        <div class="hero__contacts-main-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${phoneIcon}
            </svg>
        </div>
        <span class="hero__contacts-main-text">${phoneValue}</span>
        <svg class="hero__contacts-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

  // Выпадающее меню
  const dropdown = document.createElement("div");
  dropdown.className = "hero__contacts-menu";

  let menuItems = "";

  if (contacts.email) {
    const emailIcon = CONTACT_ICONS.email || "";
    const emailValue = escapeHtml(contacts.email);
    menuItems += `
            <a href="mailto:${escapeHtml(contacts.email)}" class="hero__contacts-menu-item">
                <div class="hero__contacts-menu-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        ${emailIcon}
                    </svg>
                </div>
                <span>${emailValue}</span>
            </a>
        `;
  }

  if (contacts.whatsapp && contacts.whatsapp !== "#") {
    menuItems += `
            <a href="${escapeHtml(contacts.whatsapp)}" class="hero__contacts-menu-item" target="_blank">
                <div class="hero__contacts-menu-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382C17.231 14.283 15.243 13.432 14.875 13.305C14.507 13.178 14.273 13.115 14.04 13.385C13.806 13.655 13.011 14.477 12.81 14.699C12.608 14.921 12.406 14.958 12.165 14.859C11.925 14.76 10.876 14.449 9.593 13.305C8.556 12.38 7.83 11.237 7.628 10.967C7.427 10.697 7.593 10.562 7.765 10.395C7.914 10.25 8.084 10.03 8.215 9.85C8.346 9.67 8.409 9.53 8.508 9.33C8.607 9.13 8.545 8.95 8.446 8.8C8.347 8.65 7.496 6.662 7.195 5.87C6.899 5.09 6.6 5.19 6.435 5.18C6.27 5.17 6.08 5.17 5.89 5.17C5.7 5.17 5.445 5.23 5.225 5.48C5.005 5.73 4.405 6.33 4.405 7.63C4.405 8.93 5.305 10.17 5.425 10.35C5.545 10.53 7.183 13.305 9.703 14.5C10.483 14.9 11.063 15.12 11.483 15.27C12.023 15.47 12.503 15.45 12.883 15.38C13.303 15.3 14.333 14.7 14.583 14.05C14.833 13.4 14.833 12.82 14.733 12.68C14.633 12.54 14.473 12.48 14.232 12.38H17.472Z" fill="currentColor"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12C0 13.894 0.48 15.67 1.32 17.21L0 24L6.79 22.68C8.33 23.52 10.106 24 12 24C18.627 24 24 18.627 24 12C24 5.373 18.627 0 12 0ZM12 21.6C10.39 21.6 8.88 21.12 7.6 20.28L7.2 20.04L3.12 21.12L4.2 17.16L3.96 16.76C3.12 15.48 2.64 13.97 2.64 12.36C2.64 6.756 6.756 2.64 12.36 2.64C17.964 2.64 22.08 6.756 22.08 12.36C22.08 17.964 17.964 22.08 12.36 22.08H12Z" fill="currentColor"/>
                    </svg>
                </div>
                <span>WhatsApp</span>
            </a>
        `;
  }

  if (contacts.telegram && contacts.telegram !== "#") {
    menuItems += `
            <a href="${escapeHtml(contacts.telegram)}" class="hero__contacts-menu-item" target="_blank">
                <div class="hero__contacts-menu-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.373 0 0 5.373 0 12C0 18.627 5.373 24 12 24C18.627 24 24 18.627 24 12C24 5.373 18.627 0 12 0ZM17.894 8.221L15.68 17.896C15.68 17.896 15.474 18.5 14.842 18.5C14.21 18.5 13.789 18.105 13.789 18.105L10.842 15.526L9.263 14.105L6.316 11.158C6.316 11.158 5.737 10.579 6.316 10C6.895 9.421 7.474 9.421 7.474 9.421L14.842 13.263L17.789 10.316C17.789 10.316 18.368 9.737 17.789 9.158C17.21 8.579 16.421 8.579 16.421 8.579L8.421 11.526L6.316 10.737C6.316 10.737 5.737 10.368 6.316 9.789C6.895 9.21 7.684 9.21 7.684 9.21L17.684 7.684C17.684 7.684 18.5 7.263 17.894 8.221Z" fill="currentColor"/>
                    </svg>
                </div>
                <span>Telegram</span>
            </a>
        `;
  }

  if (menuItems) {
    dropdown.innerHTML = menuItems;
    container.appendChild(phoneItem);
    container.appendChild(dropdown);
  } else {
    // Если нет дополнительных контактов, просто показываем телефон
    container.appendChild(phoneItem);
  }

  return container;
}

export function createSocialLinks(telegram, phone) {
  const social = document.createElement("div");
  social.className = "contacts__social";
  social.innerHTML = `
    <h3 class="contacts__social-title">Мессенджеры и соцсети</h3>
    <div class="contacts__social-links">
      ${createTelegramLink(telegram)}
      <span>MAX · Поиск по номеру ${escapeHtml(phone)}</span>
      <span>Instagram · Ссылка появится позже</span>
    </div>`;
  return social;
}

/**
 * Создает HTML для ссылки Telegram
 * @param {string} telegramData - Username, номер телефона или ссылка на Telegram
 * @returns {string} HTML разметка
 */
function createTelegramLink(telegramData) {
  let href = "#";

  if (!telegramData || telegramData === "#") {
    return "";
  }

  const telegramUrl = telegramData.trim();

  // Если это уже полная ссылка, используем её
  if (telegramUrl.startsWith("http://") || telegramUrl.startsWith("https://")) {
    href = telegramUrl;
  }
  // Если это username (с @ или без), формируем ссылку t.me
  else if (telegramUrl.startsWith("@") || /^[a-zA-Z0-9_]+$/.test(telegramUrl)) {
    const username = telegramUrl
      .replace("@", "")
      .replace("https://t.me/", "")
      .replace("http://t.me/", "");
    href = `https://t.me/${username}`;
  }
  // Если это номер телефона, используем https://t.me/+номер (универсальный формат)
  else if (/^\+?[\d\s\-()]+$/.test(telegramUrl)) {
    const phoneNumber = telegramUrl.replace(/\D/g, "");
    // Если номер начинается с 8, заменяем на 7
    if (phoneNumber.startsWith("8")) {
      href = `https://t.me/+7${phoneNumber.substring(1)}`;
    } else if (phoneNumber.startsWith("7")) {
      href = `https://t.me/+${phoneNumber}`;
    } else {
      href = `https://t.me/+7${phoneNumber}`;
    }
  }

  const escapedHref = escapeHtml(href);
  return `
        <a href="${escapedHref}" class="contacts__social-link contacts__social-link--telegram" aria-label="Telegram" target="_blank" rel="noopener noreferrer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.373 0 0 5.373 0 12C0 18.627 5.373 24 12 24C18.627 24 24 18.627 24 12C24 5.373 18.627 0 12 0ZM17.894 8.221L15.68 17.896C15.68 17.896 15.474 18.5 14.842 18.5C14.21 18.5 13.789 18.105 13.789 18.105L10.842 15.526L9.263 14.105L6.316 11.158C6.316 11.158 5.737 10.579 6.316 10C6.895 9.421 7.474 9.421 7.474 9.421L14.842 13.263L17.789 10.316C17.789 10.316 18.368 9.737 17.789 9.158C17.21 8.579 16.421 8.579 16.421 8.579L8.421 11.526L6.316 10.737C6.316 10.737 5.737 10.368 6.316 9.789C6.895 9.21 7.684 9.21 7.684 9.21L17.684 7.684C17.684 7.684 18.5 7.263 17.894 8.221Z" fill="currentColor"/>
            </svg>
            <span>Telegram</span>
        </a>
    `;
}

export { createProjectCard, createVideoReviewCard, createTextReviewItem, createWorkCard } from "./catalog-cards.js";
