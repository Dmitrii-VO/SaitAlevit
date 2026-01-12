/**
 * Тестовый скрипт для проверки переменных окружения
 * Запуск: node test-env.js
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('🔍 Проверка переменных окружения\n');
console.log('═'.repeat(70));

// Проверка наличия .env файла
const envPath = path.join(__dirname, '.env');
console.log('📄 Путь к .env:', envPath);
console.log('   Существует:', fs.existsSync(envPath) ? '✅ Да' : '❌ Нет');

if (!fs.existsSync(envPath)) {
  console.error('\n❌ Файл .env не найден!');
  console.error('   Создайте файл .env в корне проекта');
  process.exit(1);
}

console.log('\n📋 Проверка переменных:\n');

// Проверка токена
const token = process.env.TELEGRAM_BOT_TOKEN;
if (token) {
  console.log('✅ TELEGRAM_BOT_TOKEN:');
  console.log('   Длина:', token.length);
  console.log('   Первые 20 символов:', token.substring(0, 20) + '...');
  
  // Проверка формата
  if (token.match(/^\d+:[A-Za-z0-9_-]+$/)) {
    console.log('   Формат: ✅ Правильный');
  } else {
    console.log('   Формат: ❌ Неверный (должен быть: число:буквы)');
  }
} else {
  console.log('❌ TELEGRAM_BOT_TOKEN: не найден');
  console.log('   Добавьте в .env: TELEGRAM_BOT_TOKEN=ваш_токен');
}

// Проверка ID администраторов
const adminIds = process.env.ADMIN_IDS;
if (adminIds) {
  console.log('\n✅ ADMIN_IDS:');
  console.log('   Значение:', adminIds);
  
  const ids = adminIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  if (ids.length > 0) {
    console.log('   Количество:', ids.length);
    console.log('   ID:', ids.join(', '));
    console.log('   Формат: ✅ Правильный');
  } else {
    console.log('   Формат: ❌ Неверный (должны быть только цифры)');
  }
} else {
  console.log('\n❌ ADMIN_IDS: не найден');
  console.log('   Добавьте в .env: ADMIN_IDS=ваш_telegram_id');
  console.log('   Чтобы узнать ID, напишите боту @userinfobot');
}

console.log('\n' + '═'.repeat(70));

// Итоговая проверка
const hasToken = !!token && token.match(/^\d+:[A-Za-z0-9_-]+$/);
const hasAdminIds = !!adminIds && adminIds.split(',').some(id => !isNaN(parseInt(id.trim())));

if (hasToken && hasAdminIds) {
  console.log('\n✅ Все переменные настроены правильно!');
  console.log('   Можно запускать: node test-telegram-send.js');
  process.exit(0);
} else {
  console.log('\n❌ Есть проблемы с настройкой переменных');
  console.log('   Исправьте ошибки выше и попробуйте снова');
  process.exit(1);
}
