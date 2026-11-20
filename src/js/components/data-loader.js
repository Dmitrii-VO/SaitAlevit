/**
 * Модуль загрузки данных из JSON файлов
 * @module components/data-loader
 */

import { fetchJSON } from "../utils/fetch.js";
import { getWorkStatusBadge } from "../utils/format.js";
import {
  createContactItem,
  createSocialLinks,
  createProjectCard,
  createVideoReviewCard,
  createTextReviewItem,
  createWorkCard,
} from "./ui-components.js";
import {
  updateFloatingButtons,
  updateSchemaOrg,
  updateProcessConsultationPhone,
} from "./contacts.js";
import {
  initProjectsGalleryButtons,
  initWorksGalleryButtons,
} from "./carousels.js";

/**
 * Фильтрует опубликованные элементы из массива
 * @param {Array<Object>} items - Массив элементов с полем status
 * @returns {Array<Object>} Отфильтрованные опубликованные элементы
 */
function filterPublished(items) {
  return items.filter((item) => {
    const status = (item.status || "").toLowerCase();
    return status === "published" || status === "опубликован";
  });
}

/**
 * Определяет категорию проекта по количеству этажей
 * @param {Object} project - Объект проекта
 * @returns {string} Категория проекта ('1' или '2')
 */
function getProjectCategory(project) {
  const floors = (project.floors || "").toString().toLowerCase();
  if (
    floors.includes("2") ||
    floors.includes("два") ||
    floors.includes("двух")
  ) {
    return "2";
  }
  return "1"; // По умолчанию 1 этаж
}

/**
 * Сохраняет все опубликованные проекты
 */
let allProjects = [];

/**
 * Отображает проекты выбранной категории
 * @param {string} category - Категория ('1' или '2')
 */
function renderProjectsByCategory(category) {
  const grid = document.getElementById("projects-grid");
  if (!grid) {
    console.error("Элемент #projects-grid не найден");
    return;
  }

  // Фильтруем проекты по категории
  const filteredProjects = allProjects.filter((project) => {
    return getProjectCategory(project) === category;
  });

  // Добавляем класс для анимации исчезновения
  grid.classList.add("projects__grid--fade-out");

  // После завершения анимации обновляем контент
  setTimeout(() => {
    grid.innerHTML = "";

    if (filteredProjects.length === 0) {
      grid.innerHTML =
        '<div class="projects__empty"><p>В этой категории пока нет проектов</p></div>';
    } else {
      filteredProjects.forEach((project) => {
        const card = createProjectCard(project);
        if (card) {
          grid.appendChild(card);
        }
      });

      // Инициализируем кнопки галереи после добавления карточек
      initProjectsGalleryButtons();
    }

    // Убираем класс анимации для появления
    grid.classList.remove("projects__grid--fade-out");
  }, 200);
}

/**
 * Инициализирует переключатели категорий проектов
 */
function initProjectsTabs() {
  const tabs = document.querySelectorAll(".projects__tab");
  const grid = document.getElementById("projects-grid");

  if (!tabs.length || !grid) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const category = this.getAttribute("data-category");

      // Обновляем активный таб
      tabs.forEach((t) => {
        t.classList.remove("projects__tab--active");
        t.setAttribute("aria-selected", "false");
      });

      this.classList.add("projects__tab--active");
      this.setAttribute("aria-selected", "true");

      // Обновляем aria-labelledby у grid
      grid.setAttribute("aria-labelledby", this.id);

      // Отображаем проекты выбранной категории
      renderProjectsByCategory(category);
    });
  });

  const categories = new Set(allProjects.map(getProjectCategory));
  tabs.forEach(tab => { tab.hidden = !categories.has(tab.dataset.category); });
  const tablist = document.querySelector(".projects__tabs");
  tablist.hidden = categories.size < 2;
  const first = [...tabs].find(tab => !tab.hidden);
  if (first) first.click();
  else renderProjectsByCategory("1");
}

/**
 * Загружает проекты из JSON файла
 * @returns {Promise<void>}
 */
export async function loadProjects() {
  try {
    const data = await fetchJSON("data/projects.json");
    if (!data) return;

    const projects = data.projects || [];
    const grid = document.getElementById("projects-grid");
    if (!grid) {
      console.error("Элемент #projects-grid не найден");
      return;
    }

    // Сохраняем все опубликованные проекты
    allProjects = filterPublished(projects);

    // Инициализируем табы и показываем проекты по умолчанию
    initProjectsTabs();
  } catch (error) {
    console.error("Ошибка загрузки проектов:", error);
  }
}

/**
 * Форматирует телефон: +79066010357 -> +7 (906) 601-03-57
 * @param {string} phone
 * @returns {string}
 */
function formatPhone(phone) {
  const d = phone.replace(/\D/g, "");
  return d.length === 11
    ? `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`
    : phone;
}

/**
 * Загружает контакты из JSON файла
 * @returns {Promise<void>}
 */
export async function loadContacts() {
  try {
    const contacts = await fetchJSON("data/contacts.json");
    if (!contacts) return;

    // Загрузка контактов в основной блок контактов
    const container = document.getElementById("contacts-info");
    if (!container) {
      console.error("Элемент #contacts-info не найден");
    } else {
      container.innerHTML = "";

      if (contacts.phone) {
        const phoneItem = createContactItem(
          "phone",
          "Телефон",
          formatPhone(contacts.phone),
          `tel:+${contacts.phone.replace(/\D/g, "")}`,
        );
        container.appendChild(phoneItem);
      }

      if (contacts.phone2) {
        container.appendChild(
          createContactItem(
            "phone",
            "Второй телефон",
            formatPhone(contacts.phone2),
            `tel:+${contacts.phone2.replace(/\D/g, "")}`,
          ),
        );
      }

      container.appendChild(createContactItem(
        "email",
        "Электронная почта",
        contacts.email || "Адрес появится позже",
        contacts.email ? `mailto:${contacts.email}` : null,
        !contacts.email,
      ));

      if (contacts.address) {
        const addressItem = createContactItem(
          "address",
          "Адрес",
          contacts.address,
          null,
          true,
        );
        container.appendChild(addressItem);
      }

      const socialContainer = createSocialLinks(
        contacts.telegram,
        formatPhone(contacts.phone),
      );
      if (socialContainer) {
        container.appendChild(socialContainer);
      }

      // Обновляем телефон в шаге "Консультация" из DOM
      updateProcessConsultationPhone();
    }

    // Загрузка контактов в футер
    updateFooterContacts(contacts);

    updateFloatingButtons(contacts);
    updateSchemaOrg(contacts);
  } catch (error) {
    console.error("Ошибка загрузки контактов:", error);
  }
}

/**
 * Обновляет контакты в футере
 * @param {Object} contacts - Объект с контактами
 */
function updateFooterContacts(contacts) {
  // Обновляем телефон
  const phoneLink = document.getElementById("footer-phone");
  if (phoneLink && contacts.phone) {
    const phoneNumber = contacts.phone.replace(/\D/g, "");
    const formattedPhone =
      phoneNumber.length === 11
        ? `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`
        : contacts.phone;
    phoneLink.textContent = formattedPhone;
    phoneLink.href = `tel:+${phoneNumber}`;
  }

  const phoneLink2 = document.getElementById("footer-phone-2");
  if (phoneLink2 && contacts.phone2) {
    phoneLink2.textContent = formatPhone(contacts.phone2);
    phoneLink2.href = `tel:+${contacts.phone2.replace(/\D/g, "")}`;
  }

  // Обновляем email
  const emailLink = document.getElementById("footer-email");
  if (emailLink && contacts.email) {
    emailLink.textContent = contacts.email;
    emailLink.href = `mailto:${contacts.email}`;
  }

  // Обновляем адрес
  const addressText = document.getElementById("footer-address");
  if (addressText && contacts.address) {
    addressText.textContent = contacts.address;
  }

  // Обновляем контакты в модальном окне privacy-modal
  const privacyModalPhone = document.getElementById("privacy-modal-phone");
  if (privacyModalPhone && contacts.phone) {
    const phoneNumber = contacts.phone.replace(/\D/g, "");
    const formattedPhone =
      phoneNumber.length === 11
        ? `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`
        : contacts.phone;
    privacyModalPhone.textContent = formattedPhone;
    privacyModalPhone.href = `tel:+${phoneNumber}`;
  }

  // Обновляем email в модальном окне privacy-modal
  const privacyModalEmail = document.getElementById("privacy-modal-email");
  if (privacyModalEmail && contacts.email) {
    privacyModalEmail.textContent = contacts.email;
    privacyModalEmail.href = `mailto:${contacts.email}`;
  }

  const privacyModalEmail2 = document.getElementById("privacy-modal-email-2");
  if (privacyModalEmail2 && contacts.email) {
    privacyModalEmail2.textContent = contacts.email;
    privacyModalEmail2.href = `mailto:${contacts.email}`;
  }

  // Обновляем адрес в модальном окне privacy-modal
  const privacyModalAddress = document.getElementById("privacy-modal-address");
  if (privacyModalAddress && contacts.address) {
    privacyModalAddress.textContent = contacts.address;
  }

  // Форматируем номер телефона для WhatsApp
  let whatsappPhoneNumber = null;
  if (contacts.whatsapp) {
    whatsappPhoneNumber = contacts.whatsapp.replace(/[^\d+]/g, "");
    // Если номер начинается с +7, убираем + для wa.me
    if (whatsappPhoneNumber.startsWith("+7")) {
      whatsappPhoneNumber = whatsappPhoneNumber.substring(1); // Убираем +, оставляем 7
    } else if (whatsappPhoneNumber.startsWith("8")) {
      whatsappPhoneNumber = "7" + whatsappPhoneNumber.substring(1); // Заменяем 8 на 7
    } else if (whatsappPhoneNumber.startsWith("+")) {
      whatsappPhoneNumber = whatsappPhoneNumber.substring(1); // Убираем + если есть
    }
  }

  // Обновляем ссылку WhatsApp в блоке социальных сетей
  const whatsappLink = document.getElementById("footer-whatsapp");
  if (whatsappLink && whatsappPhoneNumber) {
    whatsappLink.href = `https://wa.me/${whatsappPhoneNumber}`;
  }

  // Форматируем ссылку Telegram
  let telegramUrl = null;
  if (contacts.telegram && contacts.telegram !== "#") {
    telegramUrl = contacts.telegram.trim();

    // Если это уже полная ссылка, используем её
    if (
      telegramUrl.startsWith("http://") ||
      telegramUrl.startsWith("https://")
    ) {
      // Используем как есть
    }
    // Если это username (с @ или без), формируем ссылку t.me
    else if (
      telegramUrl.startsWith("@") ||
      /^[a-zA-Z0-9_]+$/.test(telegramUrl)
    ) {
      const username = telegramUrl
        .replace("@", "")
        .replace("https://t.me/", "")
        .replace("http://t.me/", "");
      telegramUrl = `https://t.me/${username}`;
    }
    // Если это номер телефона, используем https://t.me/+номер (универсальный формат)
    else if (/^\+?[\d\s\-()]+$/.test(telegramUrl)) {
      const phoneNumber = telegramUrl.replace(/\D/g, "");
      // Если номер начинается с 8, заменяем на 7
      if (phoneNumber.startsWith("8")) {
        telegramUrl = `https://t.me/+7${phoneNumber.substring(1)}`;
      } else if (phoneNumber.startsWith("7")) {
        telegramUrl = `https://t.me/+${phoneNumber}`;
      } else {
        telegramUrl = `https://t.me/+7${phoneNumber}`;
      }
    }
    // Если формат не распознан, сбрасываем
    else {
      telegramUrl = null;
    }
  }

  // Обновляем ссылку Telegram в блоке социальных сетей
  for (const telegramLink of document.querySelectorAll("#footer-telegram, #cta-telegram")) {
    if (telegramUrl) {
      telegramLink.href = telegramUrl;
      telegramLink.style.display = "";
    } else {
      telegramLink.style.display = "none";
    }
  }
}

/**
 * Загружает отзывы из JSON файла
 * @returns {Promise<void>}
 */
export async function loadReviews() {
  try {
    const data = await fetchJSON("data/reviews.json");
    if (!data) return;

    const reviews = data.reviews || [];
    const gridContainer = document.getElementById("reviews-grid");
    const textContainer = document.getElementById("reviews-text");

    if (!gridContainer || !textContainer) {
      console.error("Элементы #reviews-grid или #reviews-text не найдены");
      return;
    }

    gridContainer.innerHTML = "";
    textContainer.innerHTML = "";

    const publishedReviews = filterPublished(reviews);

    const videoReviews = publishedReviews.filter(
      (r) => r.isVideo || r.videoUrl,
    );
    const textReviews = publishedReviews.filter(
      (r) => !r.isVideo && !r.videoUrl,
    );

    if (videoReviews.length === 0 && textReviews.length === 0) {
      gridContainer.innerHTML =
        '<div class="reviews__empty"><p>Отзывы появятся здесь скоро</p></div>';
      return;
    }

    videoReviews.forEach((review) => {
      const card = createVideoReviewCard(review);
      if (card) {
        gridContainer.appendChild(card);
      }
    });

    textReviews.forEach((review) => {
      const item = createTextReviewItem(review);
      if (item) {
        textContainer.appendChild(item);
      }
    });
  } catch (error) {
    console.error("Ошибка загрузки отзывов:", error);
  }
}

/**
 * Загружает работы из JSON файла
 * @returns {Promise<void>}
 */
export async function loadWorks() {
  try {
    const data = await fetchJSON("data/works.json");
    if (!data) return;

    const works = data.works || [];
    const grid = document.getElementById("works-grid");
    if (!grid) {
      console.error("Элемент #works-grid не найден");
      return;
    }

    grid.innerHTML = "";

    const publishedWorks = filterPublished(works);

    if (publishedWorks.length === 0) {
      grid.innerHTML =
        '<div class="works__empty"><p>Работы появятся здесь скоро</p></div>';
      return;
    }

    publishedWorks.forEach((work) => {
      const card = createWorkCard(work, getWorkStatusBadge);
      if (card) {
        grid.appendChild(card);
      }
    });

    if (publishedWorks.length > 0) {
      initWorksGalleryButtons();
    }
  } catch (error) {
    console.error("Ошибка загрузки работ:", error);
  }
}

/**
 * Загружает и отображает примерные цены за м² под калькулятором
 * @returns {Promise<void>}
 */
export async function loadPrices() {
  try {
    const data = await fetchJSON("data/prices.json");
    if (!data || !data.prices) return;

    document.querySelectorAll("[data-price-key]").forEach((element) => {
      const rate = Number(data.prices[element.dataset.priceKey]);
      if (Number.isFinite(rate) && rate > 0) {
        element.dataset.rate = rate;
        element.textContent = `${new Intl.NumberFormat("ru-RU").format(rate)} ₽/м²`;
      }
    });
    document.querySelector("#calculator-form")?.dispatchEvent(new Event("input"));
  } catch (error) {
    console.error("Ошибка загрузки цен калькулятора:", error);
  }
}
