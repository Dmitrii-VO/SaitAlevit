/**
 * Модуль анимированного персонажа-строителя
 * Персонаж следует за мышкой с различными состояниями и анимациями
 * @module builder-character
 */

/**
 * Конфигурация персонажа
 */
const CONFIG = {
    // Расстояния
    JUMP_PREPARE_DISTANCE: 45,        // px - расстояние для подготовки к прыжку (уменьшено для более близкого прыжка)
    HANGING_DISTANCE: 18,             // px - расстояние для зависания
    HANGING_OFFSET_X: 5,             // px - смещение персонажа влево относительно курсора (для выравнивания рук)
    HANGING_OFFSET_Y: 25,             // px - смещение персонажа вниз относительно курсора (руки на уровне курсора)
    
    // Скорость движения
    MOVEMENT_SPEED: 0.008,             // коэффициент скорости (0.8% расстояния за кадр) - очень медленное плавное движение
    FAST_MOUSE_THRESHOLD: 0.75,       // px/ms - порог быстрого движения мыши (150px за 200ms = 0.75)
    FAST_MOUSE_TIME: 200,             // ms - время для определения быстрого движения
    
    // Тайминги анимаций
    PREPARE_JUMP_DURATION: 450,       // ms - длительность подготовки к прыжку
    LYING_DURATION: 1800,             // ms - длительность лежания на земле
    GETTING_UP_DURATION: 800,         // ms - длительность вставания
    JUMP_COOLDOWN: 1000,              // ms - задержка после прыжка перед следующим
    
    // Границы
    BOUNDARY_OFFSET: 20,              // px - отступ от краев экрана
    
    // Размер
    CHARACTER_SIZE: {
        desktop: 100,                 // px - высота на desktop
        tablet: 80,                   // px - высота на tablet
        mobile: 60                    // px - высота на mobile (если показывать)
    },
    
    // Z-index
    Z_INDEX: 1000,                    // z-index персонажа
    
    // Скролл
    SCROLL_DEBOUNCE: 100,             // ms - задержка для определения скролла
};

/**
 * Состояния персонажа
 */
const STATES = {
    RUNNING: 'running',
    PREPARE_JUMP: 'prepare-jump',
    JUMP: 'jump',
    HANGING: 'hanging',
    FALLING: 'falling',
    LYING: 'lying',
    GETTING_UP: 'getting-up'
};

/**
 * Класс для управления персонажем-строителем
 */
class BuilderCharacter {
    constructor() {
        this.element = null;
        this.currentState = STATES.RUNNING;
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
        this.spriteFrame = 0;              // Текущий кадр спрайта (0-7)
        this.spriteFrameCount = 8;         // Количество кадров в спрайте
        this.lastFrameTime = 0;            // Время последнего переключения кадра
        this.frameInterval = 80;           // Интервал между кадрами (мс) - 80мс = ~12.5 FPS

        // Автономное блуждание
        this.wanderTargetX = 0;            // Случайная целевая позиция X для блуждания
        this.wanderTargetY = 0;            // Случайная целевая позиция Y для блуждания
        this.mouseWasMoved = false;        // Флаг, была ли мышь перемещена пользователем
        
        // Целевая позиция для прыжка (для плавного перемещения)
        this.jumpTargetX = 0;              // Целевая позиция X для прыжка
        this.jumpTargetY = 0;              // Целевая позиция Y для прыжка

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
        
        this.createElement();
        this.setInitialPosition();
        this.attachEventListeners();
        this.startAnimation();
    }
    
    /**
     * Создание HTML элемента персонажа (один div)
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'builder-character';
        this.element.setAttribute('aria-hidden', 'true');

        document.body.appendChild(this.element);

        // Установка начального состояния
        this.setState(STATES.RUNNING);
    }
    
    /**
     * Установка начальной позиции (случайная)
     */
    setInitialPosition() {
        const size = this.getCharacterSize();

        // Границы для случайной позиции
        const minX = CONFIG.BOUNDARY_OFFSET;
        const maxX = window.innerWidth - CONFIG.BOUNDARY_OFFSET - size;
        const minY = CONFIG.BOUNDARY_OFFSET;
        const maxY = window.innerHeight - CONFIG.BOUNDARY_OFFSET - size;

        // Случайная позиция в пределах экрана
        this.currentX = minX + Math.random() * (maxX - minX);
        this.currentY = minY + Math.random() * (maxY - minY);

        // Инициализация позиции мыши на текущей позиции персонажа
        const centerX = this.currentX + size / 2;
        const centerY = this.currentY + size / 2;
        this.mouseX = centerX;
        this.mouseY = centerY;

        // Устанавливаем первую случайную цель для блуждания
        this.setRandomWanderTarget();
        
        // Используем случайную цель для движения
        this.targetX = this.wanderTargetX;
        this.targetY = this.wanderTargetY;

        this.updatePosition();
    }
    
    /**
     * Установка случайной целевой позиции для блуждания
     */
    setRandomWanderTarget() {
        const size = this.getCharacterSize();
        const minX = CONFIG.BOUNDARY_OFFSET;
        const maxX = window.innerWidth - CONFIG.BOUNDARY_OFFSET - size;
        const minY = CONFIG.BOUNDARY_OFFSET;
        const maxY = window.innerHeight - CONFIG.BOUNDARY_OFFSET - size;
        
        this.wanderTargetX = minX + Math.random() * (maxX - minX);
        this.wanderTargetY = minY + Math.random() * (maxY - minY);
    }
    
    /**
     * Прикрепление обработчиков событий
     */
    attachEventListeners() {
        // Отслеживание движения мыши
        this.mouseMoveHandler = (e) => {
            if (this.mouseMoveThrottle) return;
            
            this.mouseMoveThrottle = requestAnimationFrame(() => {
                this.handleMouseMove(e);
                this.mouseMoveThrottle = null;
            });
        };
        document.addEventListener('mousemove', this.mouseMoveHandler);
        
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
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
        
        // Обработка изменения размера окна
        this.resizeHandler = () => {
            this.handleResize();
        };
        window.addEventListener('resize', this.resizeHandler);
    }
    
    /**
     * Обработка движения мыши
     */
    handleMouseMove(e) {
        const now = Date.now();
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
                Math.pow(this.mouseY - this.lastMouseY, 2)
            );
            const speed = distance / timeDelta; // px/ms
            
            // Проверка на быстрое движение мыши (если висит)
            if (this.currentState === STATES.HANGING && speed > CONFIG.FAST_MOUSE_THRESHOLD) {
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
                this.mouseX - halfWidth
            )
        );
        
        this.targetY = Math.max(
            CONFIG.BOUNDARY_OFFSET,
            Math.min(
                window.innerHeight - CONFIG.BOUNDARY_OFFSET - size,
                this.mouseY - halfHeight
            )
        );
    }
    
    /**
     * Обработка скролла
     */
    handleScroll() {
        if (!this.isScrolling) {
            this.isScrolling = true;
            
            // Если не в состоянии падения или лежания, запустить падение
            if (this.currentState !== STATES.FALLING && 
                this.currentState !== STATES.LYING && 
                this.currentState !== STATES.GETTING_UP) {
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
                this.element.style.display = 'none';
            }
            return;
        }
        
        if (this.element) {
            this.element.style.display = 'block';
        }
        
        // Обновление позиции с учетом новых границ
        this.updateTargetPosition();
    }
    
    /**
     * Запуск анимации движения
     */
    startAnimation() {
        const animate = () => {
            this.update();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Обновление состояния персонажа
     */
    update() {
        if (!this.element) return;
        
        const now = Date.now();
        
        // Обновление cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= 16; // ~60fps
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
        
        if (this.mouseWasMoved) {
            // Если мышь двигалась - следуем за курсором
            const halfWidth = size / 2;
            const halfHeight = size / 2;
            this.targetX = this.mouseX - halfWidth;
            this.targetY = this.mouseY - halfHeight;
        } else {
            // Если мышь не двигалась - блуждаем по экрану
            // Проверяем, достиг ли персонаж случайной цели
            // wanderTargetX и wanderTargetY - это координаты левого верхнего угла цели
            const wanderTargetCenterX = this.wanderTargetX + size / 2;
            const wanderTargetCenterY = this.wanderTargetY + size / 2;
            const wanderDistance = Math.sqrt(
                Math.pow(wanderTargetCenterX - centerX, 2) + 
                Math.pow(wanderTargetCenterY - centerY, 2)
            );
            
            // Если близко к цели (менее 50px) - выбираем новую случайную цель
            if (wanderDistance < 50) {
                this.setRandomWanderTarget();
            }
            
            this.targetX = this.wanderTargetX;
            this.targetY = this.wanderTargetY;
        }
        
        // Вычисление расстояния до текущей цели (мыши или случайной точки)
        const distance = Math.sqrt(
            Math.pow((this.targetX + size / 2) - centerX, 2) + 
            Math.pow((this.targetY + size / 2) - centerY, 2)
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
            this.moveToTarget();
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
        const imagePath = `/images/builders/builder-running-${frameNumber}.png`;
        this.element.style.backgroundImage = `url(${imagePath})`;
    }
    
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
            else if (distance <= CONFIG.JUMP_PREPARE_DISTANCE && this.jumpCooldown === 0) {
                this.triggerPrepareJump();
            }
        }
        // Если мышь не двигалась - просто продолжаем блуждание без прыжков и зависания
    }
    
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
    }
    
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
    }
    
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
    }
    
    /**
     * Запуск падения
     */
    triggerFalling() {
        if (this.currentState === STATES.FALLING || 
            this.currentState === STATES.LYING || 
            this.currentState === STATES.GETTING_UP) {
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
    }
    
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
    }
    
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
    }
    
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
        
        // Управление inline стилями в зависимости от состояния
        if (newState === STATES.RUNNING) {
            // Сброс анимации при возврате в состояние бега
            this.spriteFrame = 0;
            this.lastFrameTime = 0;
            // Установка начального изображения кадра через inline стиль
            this.updateFrameImage();
        } else {
            // Для других состояний очищаем inline backgroundImage,
            // чтобы CSS стили состояний работали корректно
            if (this.element) {
                this.element.style.backgroundImage = '';
            }
        }
    }
    
    /**
     * Плавное движение к целевой позиции
     */
    moveToTarget() {
        const dx = this.targetX - this.currentX;
        const dy = this.targetY - this.currentY;
        
        // Применение скорости движения
        this.currentX += dx * CONFIG.MOVEMENT_SPEED;
        this.currentY += dy * CONFIG.MOVEMENT_SPEED;
        
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
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        // Удаление элемента из DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

/**
 * Инициализация персонажа-строителя
 */
export function initBuilderCharacter() {
    // Проверка на мобильных устройствах
    if (window.innerWidth <= 767) {
        return null;
    }
    
    try {
        const character = new BuilderCharacter();
        return character;
    } catch (error) {
        console.error('Ошибка при инициализации персонажа:', error);
        return null;
    }
}
