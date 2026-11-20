/**
 * Модуль анимированного персонажа-строителя
 * Персонаж следует за мышкой с различными состояниями и анимациями
 * @module builder-character
 */
import { createMason } from "./mason.js";
import { BrickWall } from "./brick-wall.js";
import { CONFIG, STATES } from "./builder-character-config.js";
import { trickMethods } from "./builder-character-tricks.js";

/**
 * Класс для управления персонажем-строителем
 */
class BuilderCharacter {
  constructor(progress) {
    this.element = null;
    this.currentState = null;
    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.lastMouseTime = 0;
    this.facingLeft = false;
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.animationFrame = null;
    this.velocityX = 0;
    this.velocityY = 0;
    this.stride = 0;
    this.stateTimeout = null;
    this.jumpCooldown = 0;

    this.mouseWasMoved = false;
    this.events = new AbortController();

    // Сохранение ссылок на обработчики для удаления
    this.mouseMoveHandler = null;
    this.scrollHandler = null;
    this.resizeHandler = null;
    this.mouseMoveThrottle = null;

    this.init(progress);
  }

  /**
   * Получение актуального размера персонажа в зависимости от ширины экрана
   * @returns {number} Размер персонажа в пикселях
   */
  getCharacterSize() {
    const width = window.innerWidth;
    if (width <= 767) {
      return CONFIG.CHARACTER_SIZE.mobile;
    } else if (width <= 1023) {
      return CONFIG.CHARACTER_SIZE.tablet;
    } else {
      return CONFIG.CHARACTER_SIZE.desktop;
    }
  }

  /**
   * Инициализация персонажа
   */
  init(progress) {
    // Проверка на мобильных устройствах
    if (window.innerWidth <= 767) {
      return;
    }

    this.wall = new BrickWall(progress);
    this.createElement();
    this.setInitialPosition();
    this.attachEventListeners();
    this.startAnimation();
  }

  /**
   * Создание HTML элемента персонажа (один div)
   */
  createElement() {
    this.element = document.createElement("div");
    this.element.className = "builder-character";
    this.element.setAttribute("aria-hidden", "true");

    const model = createMason();
    this.element.append(model);
    this.toolParts = {
      sleeve: model.querySelector(".mason-work-sleeve"),
      cuff: model.querySelector(".mason-work-cuff"),
      wrist: model.querySelector(".mason-work-wrist"),
      hand: model.querySelector(".mason-hand"),
    };
    document.body.appendChild(this.element);

    // Установка начального состояния
    this.setState(STATES.RUNNING);
  }

  /**
   * Начальная позиция возле площадки для кладки
   */
  setInitialPosition() {
    const size = this.getCharacterSize();

    this.currentX = CONFIG.BOUNDARY_OFFSET + size;
    this.currentY = window.innerHeight - size - CONFIG.BOUNDARY_OFFSET;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    this.setState(STATES.RESTING);
    this.updatePosition();
  }

  /**
   * Прикрепление обработчиков событий
   */
  attachEventListeners() {
    const activity = () => this.wall.interrupt(this);
    const options = { capture: true, passive: true, signal: this.events.signal };
    for (const event of ["pointerdown", "keydown", "wheel", "touchmove", "scroll", "focusin", "input"]) {
      document.addEventListener(event, activity, options);
    }

    // Отслеживание движения мыши
    this.mouseMoveHandler = (e) => {
      if (this.mouseMoveThrottle) return;

      this.mouseMoveThrottle = requestAnimationFrame(() => {
        this.handleMouseMove(e);
        this.mouseMoveThrottle = null;
      });
    };
    document.addEventListener("mousemove", this.mouseMoveHandler);

    // Отслеживание скролла
    this.scrollHandler = () => {
      this.handleScroll();

      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
      }, CONFIG.SCROLL_DEBOUNCE);
    };
    window.addEventListener("scroll", this.scrollHandler, { passive: true });

    // Обработка изменения размера окна
    this.resizeHandler = () => {
      this.handleResize();
    };
    window.addEventListener("resize", this.resizeHandler);
  }

  /**
   * Обработка движения мыши
   */
  handleMouseMove(e) {
    const now = Date.now();
    this.wall.interrupt(this);
    if (this.currentState === STATES.RESTING) this.setState(STATES.RUNNING);
    const timeDelta = now - this.lastMouseTime;

    // Отмечаем, что мышь была перемещена пользователем
    this.mouseWasMoved = true;

    // Обновление позиции мыши
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    // Вычисление скорости движения мыши (px/ms)
    if (this.lastMouseTime > 0 && timeDelta > 0) {
      const distance = Math.sqrt(
        Math.pow(this.mouseX - this.lastMouseX, 2) +
          Math.pow(this.mouseY - this.lastMouseY, 2),
      );
      const speed = distance / timeDelta; // px/ms

      // Проверка на быстрое движение мыши (если висит)
      if (
        this.currentState === STATES.HANGING &&
        speed > CONFIG.FAST_MOUSE_THRESHOLD
      ) {
        this.triggerFalling();
      }
    }

    this.lastMouseX = this.mouseX;
    this.lastMouseY = this.mouseY;
    this.lastMouseTime = now;

    // Обновление целевой позиции с учетом границ
    this.updateTargetPosition();
  }

  /**
   * Обновление целевой позиции с учетом границ экрана
   */
  updateTargetPosition() {
    const size = this.getCharacterSize();
    const halfWidth = size / 2;
    const halfHeight = size / 2;

    this.targetX = Math.max(
      CONFIG.BOUNDARY_OFFSET,
      Math.min(
        window.innerWidth - CONFIG.BOUNDARY_OFFSET - size,
        this.mouseX - halfWidth,
      ),
    );

    this.targetY = Math.max(
      CONFIG.BOUNDARY_OFFSET,
      Math.min(
        window.innerHeight - CONFIG.BOUNDARY_OFFSET - size,
        this.mouseY - halfHeight,
      ),
    );
  }

  /**
   * Обработка скролла
   */
  handleScroll() {
    if (!this.isScrolling) {
      this.isScrolling = true;

      // Если не в состоянии падения или лежания, запустить падение
      if (
        this.currentState !== STATES.FALLING &&
        this.currentState !== STATES.LYING &&
        this.currentState !== STATES.GETTING_UP
      ) {
        this.triggerFalling();
      }
    }
  }

  /**
   * Обработка изменения размера окна
   */
  handleResize() {
    // Проверка на мобильных устройствах
    if (window.innerWidth <= 767) {
      if (this.element) {
        this.element.style.display = "none";
      }
      return;
    }

    if (this.element) {
      this.element.style.display = "block";
    }

    // Обновление позиции с учетом новых границ
    this.wall.interrupt(this);
    this.updateTargetPosition();
  }

  /**
   * Запуск анимации движения
   */
  startAnimation() {
    let previous = performance.now();
    const animate = (now = previous) => {
      this.update(Math.min(50, now - previous));
      previous = now;
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Обновление состояния персонажа
   */
  update(elapsed) {
    if (!this.element || this.wall.update(this, performance.now(), elapsed)) return;

    // Обновление cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= elapsed;
      if (this.jumpCooldown < 0) {
        this.jumpCooldown = 0;
      }
    }

    // Определение целевой позиции в зависимости от движения мыши
    const size = this.getCharacterSize();
    const centerX = this.currentX + size / 2;
    const centerY = this.currentY + size / 2;

    if (this.mouseWasMoved) this.updateTargetPosition();

    // Вычисление расстояния до текущей цели (мыши или случайной точки)
    const distance = Math.sqrt(
      Math.pow(this.targetX + size / 2 - centerX, 2) +
        Math.pow(this.targetY + size / 2 - centerY, 2),
    );

    if (this.currentState === STATES.RUNNING) {
      this.handleRunningState(distance);
      if (this.currentState === STATES.RUNNING) this.approach(this.targetX, this.targetY, elapsed);
    } else if (this.currentState === STATES.JUMP || this.currentState === STATES.FALLING) {
      this.advanceFlight(elapsed / 1000);
    } else if (this.currentState === STATES.HANGING) {
      this.approach(this.targetX + CONFIG.HANGING_OFFSET_X, this.targetY + CONFIG.HANGING_OFFSET_Y, elapsed);
    }
  }

  // A damped spring preserves momentum on a reversal. Limit the integration
  // step so the same tuning works at both low and high refresh rates.
  approach(x, y, elapsed) {
    const startX = this.currentX;
    const startY = this.currentY;
    for (let time = elapsed / 1000; time > 0; time -= 1 / 120) {
      const dt = Math.min(time, 1 / 120);
      const ax = (x - this.currentX) * 230 - this.velocityX * 29;
      const ay = (y - this.currentY) * 230 - this.velocityY * 29;
      this.velocityX += Math.max(-4800, Math.min(4800, ax)) * dt;
      this.velocityY += Math.max(-4800, Math.min(4800, ay)) * dt;
      const limit = Math.max(1, Math.hypot(this.velocityX, this.velocityY) / 830);
      this.velocityX /= limit;
      this.velocityY /= limit;
      this.currentX += this.velocityX * dt;
      this.currentY += this.velocityY * dt;
    }
    const arrived = Math.hypot(x - this.currentX, y - this.currentY) < 1.6 &&
      Math.hypot(this.velocityX, this.velocityY) < 25;
    if (arrived) {
      this.currentX = x;
      this.currentY = y;
      this.velocityX = this.velocityY = 0;
    }
    if (Math.abs(this.velocityX) > 8) this.facingLeft = this.velocityX > 0;
    this.stride = (this.stride + Math.hypot(this.currentX - startX, this.currentY - startY)) % 66;
    this.element.style.setProperty("--step-phase", (-this.stride / 66 * .5) + "s");
    this.updatePosition();
    return arrived;
  }

  advanceFlight(dt) {
    const jumping = this.currentState === STATES.JUMP;
    if (jumping) dt = Math.min(dt, this.jumpRemaining);
    this.currentX += this.velocityX * dt;
    this.currentY += this.velocityY * dt + CONFIG.GRAVITY * dt * dt / 2;
    this.velocityY += CONFIG.GRAVITY * dt;
    const size = this.getCharacterSize();
    this.currentX = Math.max(0, Math.min(document.documentElement.clientWidth - size, this.currentX));
    const floor = window.innerHeight - size * .94;
    if (jumping) {
      this.jumpRemaining -= dt;
      if (this.jumpRemaining <= 0) {
        this.velocityY = 0;
        this.setState(STATES.RUNNING);
      }
    } else if (this.currentY >= floor && this.velocityY >= 0) {
      this.currentY = floor;
      this.velocityX = this.velocityY = 0;
      this.triggerLying();
    }
    this.updatePosition();
  }

  /**
   * Обновление позиции элемента (через transform для плавности)
   */
  updatePosition() {
    if (this.element) {
      const scaleX = this.facingLeft ? -1 : 1;
      this.element.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scaleX(${scaleX})`;
    }
  }

  /**
   * Очистка ресурсов
   */
  destroy() {
    this.events.abort();
    this.wall?.destroy();
    cancelAnimationFrame(this.mouseMoveThrottle);
    // Отмена анимации
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Очистка таймаутов
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Удаление обработчиков событий
    if (this.mouseMoveHandler) {
      document.removeEventListener("mousemove", this.mouseMoveHandler);
    }
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }

    // Удаление элемента из DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

Object.assign(BuilderCharacter.prototype, trickMethods);

/**
 * Инициализация персонажа-строителя
 */
export function initBuilderCharacter() {
  const allowed = window.matchMedia("(min-width: 768px) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)");
  const progress = new Map();
  let character = null;
  const sync = () => {
    if (allowed.matches && !document.hidden) {
      if (!character) character = new BuilderCharacter(progress);
    } else {
      character?.destroy();
      character = null;
    }
  };
  allowed.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();
  return {
    destroy() {
      allowed.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      character?.destroy();
    },
  };
}
