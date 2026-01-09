/**
 * Скрипт сборки HTML из шаблона и компонентов
 * Использование: node scripts/build-html.js
 */

const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'src', 'html', 'index.template.html');
const outputPath = path.join(__dirname, '..', 'index.html');
const partialsDir = path.join(__dirname, '..', 'src', 'html', 'partials');

if (!fs.existsSync(templatePath)) {
    console.error(`❌ Шаблон не найден: ${templatePath}`);
    process.exit(1);
}

let content = fs.readFileSync(templatePath, 'utf-8');

// Заменяем @include на содержимое файлов
content = content.replace(/<!-- @include (.+?) -->/g, (match, filePath) => {
    // Убираем "partials/" из начала пути, если есть
    const cleanPath = filePath.trim().replace(/^partials\//, '');
    const fullPath = path.join(partialsDir, cleanPath);
    if (fs.existsSync(fullPath)) {
        const partialContent = fs.readFileSync(fullPath, 'utf-8');
        return partialContent.trim();
    }
    console.warn(`⚠️  Файл не найден: ${fullPath}`);
    return `<!-- Файл не найден: ${filePath} -->`;
});

// Сохраняем собранный HTML
fs.writeFileSync(outputPath, content, 'utf-8');

const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2);
const lines = content.split('\n').length;

console.log('✅ HTML собран успешно!');
console.log(`📄 Файл: ${outputPath}`);
console.log(`📊 Размер: ${sizeKB} KB`);
console.log(`📝 Строк: ${lines}`);
