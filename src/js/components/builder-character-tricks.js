/**
 * Трюки персонажа-строителя: прыжок, зависание, падение, подъём и смена состояний.
 * Методы подмешиваются в прототип BuilderCharacter.
 * @module builder-character-tricks
 */

import { CONFIG, STATES } from "./builder-character-config.js";

export const trickMethods = {
  /**
   * Обработка состояния бега
   */
  handleRunningState(distance) {
    // Прыжки и зависание работают только если мышь двигалась
    if (this.mouseWasMoved) {
      // Сначала проверяем очень близкое расстояние (зависание)
      if (distance <= CONFIG.HANGING_DISTANCE) {
        this.triggerHanging();
      }
      // Затем проверяем близкое расстояние (подготовка к прыжку), но только если нет cooldown
      else if (
        distance <= CONFIG.JUMP_PREPARE_DISTANCE &&
        this.jumpCooldown === 0
      ) {
        this.triggerPrepareJump();
      }
    }
    // Если мышь не двигалась - просто продолжаем блуждание без прыжков и зависания
  },

  /**
   * Запуск подготовки к прыжку
   */
  triggerPrepareJump() {
    if (this.currentState === STATES.RUNNING) {
      this.setState(STATES.PREPARE_JUMP);

      // После подготовки - прыжок
      if (this.stateTimeout) {
        clearTimeout(this.stateTimeout);
      }
      this.stateTimeout = setTimeout(() => {
        this.triggerJump();
      }, CONFIG.PREPARE_JUMP_DURATION);
    }
  },

  /**
   * Запуск прыжка
   */
  triggerJump() {
    this.setState(STATES.JUMP);

    // Установка cooldown
    this.jumpCooldown = CONFIG.JUMP_COOLDOWN;

    // Вычисляем расстояние до текущей цели перед прыжком
    const size = this.getCharacterSize();
    const centerX = this.currentX + size / 2;
    const centerY = this.currentY + size / 2;
    const targetCenterX = this.targetX + size / 2;
    const targetCenterY = this.targetY + size / 2;
    const dx = targetCenterX - centerX;
    const dy = targetCenterY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Устанавливаем целевую позицию для плавного прыжка
    // Перемещаем на 65% расстояния до цели
    if (distance > CONFIG.HANGING_DISTANCE) {
      const jumpDistance = distance * 0.65; // Перемещаем на 65% расстояния
      const jumpDx = (dx / distance) * jumpDistance;
      const jumpDy = (dy / distance) * jumpDistance;

      // Сохраняем целевую позицию для плавного перемещения во время прыжка
      this.jumpTargetX = this.currentX + jumpDx;
      this.jumpTargetY = this.currentY + jumpDy;
    } else {
      // Если уже близко - не двигаемся при прыжке
      this.jumpTargetX = this.currentX;
      this.jumpTargetY = this.currentY;
    }

    // После прыжка возвращаемся в состояние бега
    // Персонаж продолжит движение к текущей цели (мыши или случайной точке)
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
    }
    this.stateTimeout = setTimeout(() => {
      this.setState(STATES.RUNNING);
    }, 500);
  },

  /**
   * Запуск зависания
   */
  triggerHanging() {
    this.setState(STATES.HANGING);

    // Перемещаем персонажа на позицию курсора мыши (чуть ниже курсора)
    const size = this.getCharacterSize();
    const halfWidth = size / 2;
    const halfHeight = size / 2;

    // Позиционируем персонажа так, чтобы он был немного ниже и со смещением относительно курсора
    this.currentX = this.mouseX - halfWidth + CONFIG.HANGING_OFFSET_X;
    this.currentY = this.mouseY - halfHeight + CONFIG.HANGING_OFFSET_Y;
    this.updatePosition();
  },

  /**
   * Запуск падения
   */
  triggerFalling() {
    if (
      this.currentState === STATES.FALLING ||
      this.currentState === STATES.LYING ||
      this.currentState === STATES.GETTING_UP
    ) {
      return;
    }

    this.setState(STATES.FALLING);

    // Очистка предыдущих таймаутов
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
    }

    // После падения - лежание
    this.stateTimeout = setTimeout(() => {
      this.triggerLying();
    }, 800);
  },

  /**
   * Запуск лежания
   */
  triggerLying() {
    this.setState(STATES.LYING);

    // После лежания - вставание
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
    }
    this.stateTimeout = setTimeout(() => {
      this.triggerGettingUp();
    }, CONFIG.LYING_DURATION);
  },

  /**
   * Запуск вставания
   */
  triggerGettingUp() {
    this.setState(STATES.GETTING_UP);

    // После вставания - бег
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
    }
    this.stateTimeout = setTimeout(() => {
      this.setState(STATES.RUNNING);
    }, CONFIG.GETTING_UP_DURATION);
  },

  /**
   * Установка состояния персонажа
   */
  setState(newState) {
    if (this.currentState === newState) return;

    // Удаление предыдущего состояния
    this.element.classList.remove(`builder-character--${this.currentState}`);

    // Установка нового состояния
    this.currentState = newState;
    this.element.classList.add(`builder-character--${this.currentState}`);

  },
};
