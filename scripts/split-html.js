/**
 * Скрипт для разбиения index.html на модульные компоненты
 * Использование: node scripts/split-html.js
 */

const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const partialsDir = path.join(__dirname, '..', 'src', 'html', 'partials');
const templateDir = path.join(__dirname, '..', 'src', 'html');

// Создаем директории если их нет
if (!fs.existsSync(partialsDir)) {
    fs.mkdirSync(partialsDir, { recursive: true });
}
if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
}

// Читаем index.html
const content = fs.readFileSync(indexHtmlPath, 'utf-8');

// Функция для поиска секции по комментарию и ID
function findSection(commentText, idValue) {
    const commentIndex = content.indexOf(commentText);
    if (commentIndex === -1) return null;
    
    // Находим начало тега после комментариев (ищем id="...")
    const idPattern = `id="${idValue}"`;
    const idIndex = content.indexOf(idPattern, commentIndex);
    if (idIndex === -1) return null;
    
    // Находим начало тега (ищем < назад от id)
    let tagStart = content.lastIndexOf('<', idIndex);
    if (tagStart === -1) return null;
    
    // Определяем имя тега
    const tagEnd = content.indexOf(' ', tagStart + 1);
    const tagName = content.substring(tagStart + 1, tagEnd !== -1 ? tagEnd : content.indexOf('>', tagStart + 1));
    
    // Находим закрывающий тег
    const closingTag = `</${tagName}>`;
    let depth = 1;
    let pos = tagStart + 1;
    let tagEndPos = -1;
    
    while (depth > 0 && pos < content.length) {
        const nextOpen = content.indexOf(`<${tagName}`, pos);
        const nextClose = content.indexOf(closingTag, pos);
        
        if (nextClose === -1) break;
        
        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            pos = nextOpen + 1;
        } else {
            depth--;
            if (depth === 0) {
                tagEndPos = nextClose + closingTag.length;
                break;
            }
            pos = nextClose + closingTag.length;
        }
    }
    
    if (tagEndPos === -1) {
        // Простой случай - один тег
        tagEndPos = content.indexOf(closingTag, tagStart) + closingTag.length;
    }
    
    if (tagEndPos === -1) return null;
    
    return {
        start: commentIndex,
        end: tagEndPos
    };
}

// Разбиваем на части
const sections = [
    { key: 'head', comment: '<head>', id: null, file: 'head.html', startTag: '<head>', endTag: '</head>' },
    { key: 'header', comment: '<!-- HEADER - Навигация -->', id: 'header', file: 'header.html' },
    { key: 'hero', comment: '<!-- HERO - Первый экран -->', id: 'hero', file: 'hero.html' },
    { key: 'trust', comment: '<!-- TRUST - Блок доверия', id: 'trust', file: 'trust.html' },
    { key: 'advantages', comment: '<!-- ADVANTAGES - Почему выбирают нас -->', id: 'advantages', file: 'advantages.html' },
    { key: 'pricing', comment: '<!-- PRICING - Форматы домов и цены -->', id: 'pricing', file: 'pricing.html' },
    { key: 'projects', comment: '<!-- PROJECTS - Типовые проекты домов -->', id: 'projects', file: 'projects.html' },
    { key: 'works', comment: '<!-- WORKS - Наши работы', id: 'works', file: 'works.html' },
    { key: 'process', comment: '<!-- PROCESS - Этапы строительства -->', id: 'process', file: 'process.html' },
    { key: 'map', comment: '<!-- MAP - Карта объектов -->', id: 'map', file: 'map.html' },
    { key: 'services', comment: '<!-- SERVICES - Услуги', id: 'services', file: 'services.html' },
    { key: 'reviews', comment: '<!-- REVIEWS - Отзывы -->', id: 'reviews', file: 'reviews.html' },
    { key: 'about', comment: '<!-- ABOUT - О компании', id: 'about', file: 'about.html' },
    { key: 'calculator', comment: '<!-- CALCULATOR - Калькулятор стоимости -->', id: 'calculator', file: 'calculator.html' },
    { key: 'faq', comment: '<!-- FAQ - Часто задаваемые вопросы -->', id: 'faq', file: 'faq.html' },
    { key: 'cta', comment: '<!-- CTA - Призыв к действию и формы -->', id: 'cta', file: 'cta.html' },
    { key: 'contacts', comment: '<!-- CONTACTS - Контакты -->', id: 'contacts', file: 'contacts.html' },
    { key: 'footer', comment: '<!-- FOOTER - Подвал сайта -->', id: null, file: 'footer.html', startTag: '<footer', endTag: '</footer>' },
    { key: 'floatingButtons', comment: '<!-- FLOATING BUTTONS - Плавающие кнопки -->', id: 'floating-buttons', file: 'floating-buttons.html' },
    { key: 'galleryModal', comment: '<!-- GALLERY MODAL - Модальное окно галереи -->', id: 'gallery-modal', file: 'gallery-modal.html' }
];

const extractedParts = {};

for (const section of sections) {
    let partContent = '';
    
    if (section.startTag && section.endTag) {
        // Простой случай для head и footer
        const start = content.indexOf(section.startTag);
        const end = content.indexOf(section.endTag) + section.endTag.length;
        if (start !== -1 && end !== -1) {
            partContent = content.substring(start, end);
        }
    } else if (section.id) {
        // Используем функцию поиска
        const result = findSection(section.comment, section.id);
        if (result) {
            partContent = content.substring(result.start, result.end);
        }
    }
    
    if (partContent) {
        // Убираем комментарии-разделители для компонентов (кроме head)
        if (section.key !== 'head') {
            partContent = partContent.replace(/<!-- =+ -->\s*<!-- [^>]+ -->\s*<!-- =+ -->\s*/g, '');
        }
        
        const filePath = path.join(partialsDir, section.file);
        fs.writeFileSync(filePath, partContent.trim() + '\n', 'utf-8');
        extractedParts[section.key] = section.file;
        console.log(`✅ Создан: ${section.file}`);
    } else {
        console.warn(`⚠️  Не найдена секция: ${section.key}`);
    }
}

// Создаем шаблон index.template.html
const templateContent = `<!DOCTYPE html>
<html lang="ru">
<!-- @include partials/head.html -->
<body>
    <!-- @include partials/header.html -->
    
    <main class="main">
        <!-- @include partials/hero.html -->
        <!-- @include partials/trust.html -->
        <!-- @include partials/advantages.html -->
        <!-- @include partials/pricing.html -->
        <!-- @include partials/projects.html -->
        <!-- @include partials/works.html -->
        <!-- @include partials/process.html -->
        <!-- @include partials/map.html -->
        <!-- @include partials/services.html -->
        <!-- @include partials/reviews.html -->
        <!-- @include partials/about.html -->
        <!-- @include partials/calculator.html -->
        <!-- @include partials/faq.html -->
        <!-- @include partials/cta.html -->
        <!-- @include partials/contacts.html -->
    </main>
    
    <!-- @include partials/footer.html -->
    <!-- @include partials/floating-buttons.html -->
    <!-- @include partials/gallery-modal.html -->
    
    <script src="js/main.js"></script>
</body>
</html>
`;

const templatePath = path.join(templateDir, 'index.template.html');
fs.writeFileSync(templatePath, templateContent, 'utf-8');
console.log('✅ Создан шаблон: index.template.html');

console.log('\n✨ Разбиение завершено!');
console.log(`📁 Компоненты сохранены в: ${partialsDir}`);
console.log(`📄 Шаблон сохранен в: ${templatePath}`);
