/**
 * Скрипт для разбиения styles.css на модули
 * Использование: node scripts/split-css.js
 */

const fs = require('fs');
const path = require('path');

const stylesPath = path.join(__dirname, '..', 'styles.css');
const outputDir = path.join(__dirname, '..', 'src', 'css', 'components');

// Читаем файл
const content = fs.readFileSync(stylesPath, 'utf-8');

// Регулярное выражение для поиска секций
const sectionRegex = /\/\* =+ \*\/\n\/\* ([^*]+) \*\/\n\/\* =+ \*\/\n([\s\S]*?)(?=\/\* =+ \*\/|$)/g;

let match;
const sections = [];

while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const css = match[2].trim();
    
    sections.push({ title, css });
}

// Создаем файлы для каждой секции
sections.forEach(({ title, css }) => {
    // Преобразуем название секции в имя файла
    const fileName = title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '') + '.css';
    
    const filePath = path.join(outputDir, fileName);
    
    // Создаем содержимое файла
    const fileContent = `/* ============================================ */\n/* ${title.toUpperCase()} */\n/* ============================================ */\n\n${css}\n`;
    
    // Записываем файл
    fs.writeFileSync(filePath, fileContent, 'utf-8');
    console.log(`✓ Создан файл: ${fileName}`);
});

console.log(`\n✓ Всего создано ${sections.length} файлов компонентов`);
