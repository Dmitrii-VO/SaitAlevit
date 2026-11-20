/**
 * Модуль анимированного персонажа-строителя
 * Персонаж следует за мышкой с различными состояниями и анимациями
 * @module builder-character
 */
import { BrickWall } from "./brick-wall.js";
import { CONFIG, STATES } from "./builder-character-config.js";
import { trickMethods } from "./builder-character-tricks.js";

/**
 * Класс для управления персонажем-строителем
 */
class BuilderCharacter {
  constructor() {
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
    this.stateTimeout = null;
    this.jumpCooldown = 0;

    // Анимация спрайта бега
    this.spriteFrame = 0; // Текущий кадр спрайта (0-7)
    this.spriteFrameCount = 8; // Количество кадров в спрайте
    this.lastFrameTime = 0; // Время последнего переключения кадра
    this.frameInterval = 80; // Интервал между кадрами (мс) - 80мс = ~12.5 FPS

    this.mouseWasMoved = false;
    this.events = new AbortController();

    // Целевая позиция для прыжка (для плавного перемещения)
    this.jumpTargetX = 0; // Целевая позиция X для прыжка
    this.jumpTargetY = 0; // Целевая позиция Y для прыжка

    // Сохранение ссылок на обработчики для удаления
    this.mouseMoveHandler = null;
    this.scrollHandler = null;
    this.resizeHandler = null;
    this.mouseMoveThrottle = null;

    this.init();
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
  init() {
    // Проверка на мобильных устройствах
    if (window.innerWidth <= 767) {
      return;
    }

    this.wall = new BrickWall();
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
    if (!this.element || this.wall.update(this, performance.now())) return;

    const now = Date.now();

    // Обновление cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= elapsed;
      if (this.jumpCooldown < 0) {
        this.jumpCooldown = 0;
      }
    }

    // Обновление кадров спрайта анимации (только в состоянии бега)
    if (this.currentState === STATES.RUNNING) {
      this.updateSpriteAnimation(now);
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

    // Логика состояний
    if (this.currentState === STATES.RUNNING) {
      this.handleRunningState(distance);
    } else if (this.currentState === STATES.PREPARE_JUMP) {
      // Состояние обрабатывается через таймаут
    } else if (this.currentState === STATES.JUMP) {
      // Плавное перемещение к целевой позиции прыжка
      const dx = this.jumpTargetX - this.currentX;
      const dy = this.jumpTargetY - this.currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Если еще не достиг цели прыжка - плавно перемещаемся
      if (distance > 2) {
        // Используем более быструю скорость для прыжка (15% за кадр)
        this.currentX += dx * 0.15;
        this.currentY += dy * 0.15;
        this.updatePosition();
      }
    } else if (this.currentState === STATES.HANGING) {
      // В состоянии зависания персонаж следует за курсором ТОЛЬКО если мышь двигалась
      if (this.mouseWasMoved) {
        const size = this.getCharacterSize();
        const halfWidth = size / 2;
        const halfHeight = size / 2;

        // Обновляем целевую позицию (персонаж чуть ниже и со смещением относительно курсора)
        this.targetX = this.mouseX - halfWidth + CONFIG.HANGING_OFFSET_X;
        this.targetY = this.mouseY - halfHeight + CONFIG.HANGING_OFFSET_Y;

        // Плавно перемещаем к курсору (быстрее чем бег)
        const dx = this.targetX - this.currentX;
        const dy = this.targetY - this.currentY;
        this.currentX += dx * 0.25; // 25% за кадр - быстрое следование
        this.currentY += dy * 0.25;
        this.updatePosition();
      } else {
        // Если мышь не двигалась - возвращаемся к блужданию
        this.setState(STATES.RUNNING);
      }
    } else if (this.currentState === STATES.FALLING) {
      // Плавное падение вниз
      // При падении персонаж плавно опускается вниз
      const fallSpeed = 3; // пикселей за кадр для падения
      this.currentY += fallSpeed;

      // Проверяем границы экрана (не падаем ниже экрана)
      const size = this.getCharacterSize();
      const maxY = window.innerHeight - CONFIG.BOUNDARY_OFFSET - size;
      if (this.currentY > maxY) {
        this.currentY = maxY;
      }

      this.updatePosition();
    } else if (this.currentState === STATES.LYING) {
      // При лежании не двигаемся к мыши
    } else if (this.currentState === STATES.GETTING_UP) {
      // Состояние обрабатывается через таймаут
    }

    // Плавное движение к целевой позиции (только в состоянии бега)
    if (this.currentState === STATES.RUNNING) {
      this.moveToTarget(elapsed);
    }

    // Обновление направления взгляда
    this.updateDirection();
  }

  /**
   * Обновление анимации бега с отдельными изображениями
   * @param {number} now - Текущее время в миллисекундах
   */
  updateSpriteAnimation(now) {
    // Инициализация времени последнего кадра
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = now;
      // Установка начального кадра
      this.updateFrameImage();
      return;
    }

    // Проверка, нужно ли переключать кадр
    const timeDelta = now - this.lastFrameTime;
    if (timeDelta >= this.frameInterval) {
      // Переход к следующему кадру
      this.spriteFrame = (this.spriteFrame + 1) % this.spriteFrameCount;

      // Обновление background-image на следующий файл
      this.updateFrameImage();

      // Обновление времени последнего кадра
      this.lastFrameTime = now;
    }
  }

  /**
   * Обновление изображения кадра анимации
   */
  updateFrameImage() {
    if (!this.element) return;

    // Номер кадра от 1 до 8 (spriteFrame от 0 до 7, но файлы от 1 до 8)
    const frameNumber = this.spriteFrame + 1;
    const imagePath = `images/builders/builder-running-${frameNumber}.webp`;
    this.element.style.backgroundImage = `url(${imagePath})`;
  }

  /**
   * Плавное движение к целевой позиции
   */
  moveToTarget(elapsed) {
    const dx = this.targetX - this.currentX;
    const dy = this.targetY - this.currentY;

    // Применение скорости движения
    const step = 1 - Math.exp(-elapsed / CONFIG.FOLLOW_TIME);
    this.currentX += dx * step;
    this.currentY += dy * step;

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
   * Обновление направления взгляда
   */
  updateDirection() {
    const size = this.getCharacterSize();
    const centerX = this.currentX + size / 2;
    // Определяем направление взгляда по целевой позиции (мышь или случайная точка)
    const targetCenterX = this.targetX + size / 2;
    // Инвертированная логика: если цель слева → смотрим вправо (scaleX(1))
    // Если цель справа → смотрим влево (scaleX(-1))
    // Это для случая, когда персонаж по умолчанию смотрит влево
    this.facingLeft = targetCenterX > centerX;
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
  let character = null;
  const sync = () => {
    if (allowed.matches && !document.hidden) {
      if (!character) character = new BuilderCharacter();
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
