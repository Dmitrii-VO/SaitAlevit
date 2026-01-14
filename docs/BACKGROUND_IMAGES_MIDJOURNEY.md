# Фоновые изображения для секций главной страницы - Инструкция по реализации с Midjourney

## 📍 Структура главной страницы

У нас **одна главная страница** (index.html), которая состоит из **нескольких секций (блоков)**:

1. **hero** - Первый экран (уже есть фоновое изображение ✅)
2. **advantages** - Почему выбирают нас
3. **calculator** - Калькулятор стоимости
4. **projects** - Типовые проекты
5. **works** - Наши работы
6. **services** - Услуги
7. **process** - Этапы строительства
8. **about** - О компании
9. **reviews** - Отзывы
10. **faq** - FAQ
11. **cta** - Призыв к действию
12. **map** - Карта объектов

## 🎯 Текущая реализация на Hero секции

На секции **Hero** (первый экран) фоновое изображение уже реализовано:

### HTML структура (`src/html/partials/hero.html`):
```html
<section class="hero" id="hero">
    <div class="hero__image-wrapper">
        <img src="images/houses/hero/hero-main.png" alt="Дом построенный компанией АЛЕВИТ СТРОЙ" class="hero__image">
        <div class="hero__overlay"></div>
    </div>
    <div class="hero__container">
        <!-- Контент -->
    </div>
</section>
```

### CSS реализация (`src/css/components/hero.css`):
```css
.hero {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
}

.hero__image-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.hero__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.hero__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        135deg,
        rgba(0, 0, 0, 0.85) 0%,
        rgba(26, 26, 26, 0.75) 50%,
        rgba(0, 0, 0, 0.7) 100%
    );
    z-index: 2;
}

.hero__container {
    position: relative;
    z-index: 3;
}
```

## 🎨 Предложение по реализации для других секций

### Структура папок для изображений:

```
images/
├── houses/
│   └── hero/
│       └── hero-main.png (уже есть)
└── backgrounds/
    ├── advantages-background.png
    ├── calculator-background.png
    ├── projects-background.png
    ├── works-background.png
    ├── services-background.png
    ├── process-background.png
    ├── about-background.png
    ├── reviews-background.png
    ├── faq-background.png
    ├── cta-background.png
    └── map-background.png
```

### Общий паттерн реализации

Для каждой секции нужно:

1. **Добавить HTML структуру** (image-wrapper, img, overlay)
2. **Добавить CSS стили** (позиционирование, overlay градиент)
3. **Создать изображение в Midjourney** по промпту

---

## 📋 Детальный план для каждой секции

### 1. Advantages (Почему выбирают нас)

**HTML** (`src/html/partials/advantages.html`):
```html
<section class="advantages" id="advantages">
    <div class="advantages__image-wrapper">
        <img src="images/backgrounds/advantages-background.png" alt="" class="advantages__image">
        <div class="advantages__overlay"></div>
    </div>
    <div class="advantages__container">
        <!-- Существующий контент -->
    </div>
</section>
```

**CSS** (`src/css/components/advantages.css`):
```css
.advantages {
    position: relative;
    padding: var(--spacing-xxl) var(--container-padding);
    overflow: hidden;
}

.advantages__image-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.advantages__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.advantages__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(245, 245, 245, 0.92) 50%,
        rgba(255, 255, 255, 0.95) 100%
    );
    z-index: 2;
}

.advantages__container {
    position: relative;
    z-index: 3;
}
```

**Промпт для Midjourney:**
```
Beautiful minimalist background image for advantages section, construction company website, 
elegant light theme with subtle golden accents, premium luxury style, abstract architectural 
elements and construction tools, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, reliability and quality theme
```

---

### 2. Calculator (Калькулятор стоимости)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for calculator section, construction company website, 
elegant light theme with subtle golden accents, premium luxury style, abstract architectural 
elements and calculation symbols, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, calculation and pricing theme
```

**Overlay:** Светлый (белый с прозрачностью) - для светлого контента

---

### 3. Projects (Типовые проекты)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for projects section, construction company website, 
elegant dark theme with subtle golden accents, premium luxury style, abstract architectural 
blueprints and house designs, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, architectural design theme
```

**Overlay:** Тёмный (чёрный с прозрачностью) - для светлого текста поверх

---

### 4. Works (Наши работы)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for works portfolio section, construction company website, 
elegant dark theme with subtle golden accents, premium luxury style, abstract architectural 
elements and completed construction projects, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, portfolio and achievements theme
```

**Overlay:** Тёмный (чёрный с прозрачностью)

---

### 5. Services (Услуги)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for services section, construction company website, 
elegant light theme with subtle golden accents, premium luxury style, abstract architectural 
elements and service icons, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, comprehensive services theme
```

**Overlay:** Светлый (белый с прозрачностью)

---

### 6. Process (Этапы строительства)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for construction process section, construction company website, 
elegant dark theme with subtle golden accents, premium luxury style, abstract architectural 
elements and construction stages timeline, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, construction process and workflow theme
```

**Overlay:** Тёмный (чёрный с прозрачностью)

---

### 7. About (О компании)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for about company section, construction company website, 
elegant light theme with subtle golden accents, premium luxury style, abstract architectural 
elements and team collaboration, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, company and team theme
```

**Overlay:** Светлый (белый с прозрачностью)

---

### 8. Reviews (Отзывы)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for reviews section, construction company website, 
elegant dark theme with subtle golden accents, premium luxury style, abstract architectural 
elements and trust symbols, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, trust and testimonials theme
```

**Overlay:** Тёмный (чёрный с прозрачностью)

---

### 9. FAQ (Часто задаваемые вопросы)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for FAQ section, construction company website, 
elegant light theme with subtle golden accents, premium luxury style, abstract architectural 
elements and question symbols, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, information and support theme
```

**Overlay:** Светлый (белый с прозрачностью)

---

### 10. CTA (Призыв к действию)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for call to action section, construction company website, 
elegant dark theme with subtle golden accents, premium luxury style, abstract architectural 
elements and action symbols, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, action and conversion theme
```

**Overlay:** Тёмный (чёрный с прозрачностью) - для яркого CTA

---

### 11. Map (Карта объектов)

**Промпт для Midjourney:**
```
Beautiful minimalist background image for map section, construction company website, 
elegant light theme with subtle golden accents, premium luxury style, abstract architectural 
elements and location symbols, black (#000000) and gold (#D4AF37) color palette, 
professional business atmosphere, soft gradients, wide landscape format 16:9, 
high quality, detailed, minimalist design, sophisticated, modern, location and geography theme
```

**Overlay:** Светлый (белый с прозрачностью)

---

## 🎯 Типы overlay (градиентов)

### Тёмный overlay (для секций с светлым текстом):
```css
background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(26, 26, 26, 0.75) 50%,
    rgba(0, 0, 0, 0.7) 100%
);
```
**Используется для:** Projects, Works, Process, Reviews, CTA

### Светлый overlay (для секций со светлым контентом):
```css
background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(245, 245, 245, 0.92) 50%,
    rgba(255, 255, 255, 0.95) 100%
);
```
**Используется для:** Advantages, Calculator, Services, About, FAQ, Map

---

## 📐 Технические параметры изображений

### Рекомендации для Midjourney:

1. **Формат:** PNG или JPG
2. **Размер:** Минимум 1920x1080px (Full HD)
   - Для широких экранов: 2560x1440px (2K) или 3840x2160px (4K)
3. **Соотношение сторон:** 16:9 (ландшафтная ориентация)
4. **Цветовая палитра:**
   - Основные: чёрный (#000000, #1a1a1a) + золото (#D4AF37, #B8860B)
   - Допустимые: белый (#FFFFFF), серый (#F5F5F5, #808080, #333333)
5. **Стиль:**
   - Премиальный, элегантный, минималистичный
   - Ассоциации: уверенность, надёжность, уют
   - Абстрактные архитектурные элементы

### Общие ключевые слова для всех промптов:

```
minimalist, premium, luxury, elegant, sophisticated, modern, 
black and gold color palette, professional, construction company, 
abstract architectural elements, soft gradients, wide landscape format 16:9, 
high quality, detailed
```

---

## 🔧 Техническая реализация

### Шаблон HTML для новой секции:

```html
<section class="section-name" id="section-name">
    <div class="section-name__image-wrapper">
        <img src="images/backgrounds/section-name-background.png" alt="" class="section-name__image">
        <div class="section-name__overlay"></div>
    </div>
    <div class="section-name__container">
        <!-- Существующий контент секции -->
    </div>
</section>
```

### Шаблон CSS для новой секции:

```css
/* Если секция была без position: relative, добавить */
.section-name {
    position: relative;
    overflow: hidden;
    /* Существующие стили */
}

/* Добавить новые стили */
.section-name__image-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.section-name__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.section-name__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    /* Тёмный или светлый градиент в зависимости от типа секции */
}

.section-name__container {
    position: relative;
    z-index: 3;
    /* Существующие стили контейнера */
}
```

---

## 📋 Чек-лист реализации для каждой секции

### Для каждой секции:

- [ ] Создать изображение в Midjourney по соответствующему промпту
- [ ] Сохранить изображение в `images/backgrounds/` с правильным именем
- [ ] Оптимизировать изображение (WebP с fallback, если нужно)
- [ ] Обновить HTML (`src/html/partials/[section-name].html`):
  - [ ] Добавить `image-wrapper` с `img` и `overlay`
  - [ ] Обернуть существующий контент в `container` (если ещё не обёрнут)
- [ ] Обновить CSS (`src/css/components/[section-name].css`):
  - [ ] Добавить `position: relative` и `overflow: hidden` к основной секции
  - [ ] Добавить стили для `image-wrapper`, `image`, `overlay`
  - [ ] Добавить `position: relative` и `z-index: 3` к `container`
- [ ] Выбрать правильный тип overlay (тёмный/светлый) в зависимости от типа контента
- [ ] Проверить адаптивность на мобильных устройствах
- [ ] Проверить читаемость текста поверх изображения
- [ ] Оптимизировать размер файла изображения
- [ ] Добавить пустой alt текст (`alt=""`) для декоративного изображения

---

## 🔄 Адаптивность

Фоновые изображения должны корректно работать на всех устройствах:

```css
@media (max-width: 768px) {
    .section-name__image {
        object-position: center; /* Можно настроить для мобильных */
    }
    
    /* Возможно, более плотный overlay на мобильных для лучшей читаемости */
    .section-name__overlay {
        background: linear-gradient(...);
    }
}
```

---

## ⚠️ Важные замечания

### Производительность:

1. **Оптимизация изображений:**
   - Используйте оптимизированные изображения (WebP с fallback на JPG)
   - Рассмотрите использование `loading="lazy"` для изображений ниже fold
   - Оптимизируйте размер файлов (сжатие без потери качества)

2. **Lazy loading:**
   - Для секций ниже Hero можно использовать `loading="lazy"`
   ```html
   <img src="..." alt="" class="section-name__image" loading="lazy">
   ```

### Accessibility:

1. **Alt текст:**
   - Декоративные фоновые изображения должны иметь пустой alt текст: `alt=""`
   - Это указывает скринридерам, что изображение декоративное

2. **Контрастность:**
   - Overlay (градиент) должен обеспечивать достаточный контраст для текста
   - Проверьте читаемость текста поверх изображения на всех устройствах

### Читаемость:

1. **Выбор overlay:**
   - На светлых секциях (белый/светлый контент) используйте светлый overlay
   - На тёмных секциях (светлый текст) используйте тёмный overlay
   - Интенсивность overlay можно регулировать (прозрачность градиента)

2. **Тестирование:**
   - Проверьте читаемость на разных устройствах и разрешениях
   - Убедитесь, что контрастность достаточна для accessibility

---

## 🎨 Рекомендации по дизайну изображений

### Общие принципы:

1. **Единый стиль:**
   - Все изображения должны быть в едином стиле
   - Соответствовать визуальному стилю сайта (премиальный, минималистичный)

2. **Цветовая палитра:**
   - Строго следовать палитре проекта: чёрный + золото
   - Избегать ярких, кричащих цветов

3. **Тематика:**
   - Абстрактные архитектурные элементы
   - Не конкретные дома (по правилам проекта - только реальные фото домов)
   - Декоративные, атмосферные изображения

4. **Баланс:**
   - Изображения не должны отвлекать от контента
   - Должны создавать атмосферу, но не доминировать

---

## 📝 Пример полной реализации (Advantages)

### HTML (`src/html/partials/advantages.html`):
```html
<!-- ADVANTAGES - Почему выбирают нас -->
<section class="advantages" id="advantages">
    <div class="advantages__image-wrapper">
        <img src="images/backgrounds/advantages-background.png" alt="" class="advantages__image" loading="lazy">
        <div class="advantages__overlay"></div>
    </div>
    <div class="advantages__container">
        <h2 class="advantages__title">Почему выбирают нас</h2>
        <!-- Остальной контент -->
    </div>
</section>
```

### CSS (`src/css/components/advantages.css`):
```css
.advantages {
    position: relative;
    padding: var(--spacing-xxl) var(--container-padding);
    overflow: hidden;
    /* Существующие стили остаются */
}

.advantages__image-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.advantages__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.advantages__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(245, 245, 245, 0.92) 50%,
        rgba(255, 255, 255, 0.95) 100%
    );
    z-index: 2;
}

.advantages__container {
    position: relative;
    z-index: 3;
    /* Существующие стили контейнера остаются */
}
```

---

**Последнее обновление:** 2024  
**Статус:** Предложение по реализации фоновых изображений для всех секций главной страницы
