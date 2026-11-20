/**
 * Конфигурация и состояния персонажа-строителя
 * @module builder-character-config
 */

/**
 * Конфигурация персонажа
 */
export const CONFIG = {
  // Расстояния
  JUMP_PREPARE_DISTANCE: 45, // px - расстояние для подготовки к прыжку (уменьшено для более близкого прыжка)
  HANGING_DISTANCE: 18, // px - расстояние для зависания
  HANGING_OFFSET_X: 5, // px - смещение персонажа влево относительно курсора (для выравнивания рук)
  HANGING_OFFSET_Y: 25, // px - смещение персонажа вниз относительно курсора (руки на уровне курсора)

  // Скорость движения
  GRAVITY: 1850, // px/s²
  FAST_MOUSE_THRESHOLD: 0.75, // px/ms - порог быстрого движения мыши (150px за 200ms = 0.75)
  FAST_MOUSE_TIME: 200, // ms - время для определения быстрого движения

  // Тайминги анимаций
  PREPARE_JUMP_DURATION: 450, // ms - длительность подготовки к прыжку
  LYING_DURATION: 1800, // ms - длительность лежания на земле
  GETTING_UP_DURATION: 800, // ms - длительность вставания
  JUMP_COOLDOWN: 1000, // ms - задержка после прыжка перед следующим

  // Границы
  BOUNDARY_OFFSET: 20, // px - отступ от краев экрана

  // Размер
  CHARACTER_SIZE: {
    desktop: 100, // px - высота на desktop
    tablet: 80, // px - высота на tablet
    mobile: 60, // px - высота на mobile (если показывать)
  },

  // Z-index
  Z_INDEX: 1000, // z-index персонажа

  // Скролл
  SCROLL_DEBOUNCE: 100, // ms - задержка для определения скролла
};

/**
 * Состояния персонажа
 */
export const STATES = {
  BUILDING: "building",
  RESTING: "resting",
  RUNNING: "running",
  PREPARE_JUMP: "prepare-jump",
  JUMP: "jump",
  HANGING: "hanging",
  FALLING: "falling",
  LYING: "lying",
  GETTING_UP: "getting-up",
};
