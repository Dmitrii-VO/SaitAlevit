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

    this.jumpRemaining = .36;
    this.velocityX = (this.targetX - this.currentX) / this.jumpRemaining;
    this.velocityY = (this.targetY - this.currentY) / this.jumpRemaining -
      CONFIG.GRAVITY * this.jumpRemaining / 2;
  },

  /**
   * Запуск зависания
   */
  triggerHanging() {
    this.setState(STATES.HANGING);

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

    this.velocityX *= .4;
    this.velocityY = Math.min(160, Math.max(-200, this.velocityY));
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
