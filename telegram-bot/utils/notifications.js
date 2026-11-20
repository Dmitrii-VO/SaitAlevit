/**
 * Модуль для отправки уведомлений о заявках в Telegram
 * @module utils/notifications
 */

const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

// Загружаем .env из корня проекта
// Пробуем несколько путей
const possibleEnvPaths = [
  path.join(__dirname, '..', '..', '.env'),  // Из telegram-bot/utils/ -> корень проекта
  path.join(process.cwd(), '.env'),          // Текущая рабочая директория
  '.env'                                      // Относительный путь
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    envLoaded = true;
    break;
  }
}

// Если не нашли, пробуем стандартную загрузку
if (!envLoaded) {
  require('dotenv').config();
}

// Создаём экземпляр бота только для отправки сообщений
let notificationBot = null;

/**
 * Инициализирует бота для отправки уведомлений
 */
function initNotificationBot() {
  if (notificationBot) {
    return notificationBot;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN не установлен в .env файле');
    console.error('   Проверьте наличие файла .env в корне проекта');
    console.error('   Убедитесь, что в нём есть строка: TELEGRAM_BOT_TOKEN=ваш_токен');
    return null;
  }

  // Проверка формата токена
  if (!botToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
    console.error('❌ Неверный формат токена');
    console.error('   Токен должен быть вида "123456:ABC-DEF..."');
    console.error('   Первые 20 символов токена:', botToken.substring(0, 20) + '...');
    console.error('   Получите новый токен у @BotFather в Telegram');
    return null;
  }

  try {
    // Создаём бота без polling (только для отправки)
    notificationBot = new TelegramBot(botToken, { polling: false });
    return notificationBot;
  } catch (error) {
    console.error('❌ Ошибка создания бота для уведомлений:');
    console.error('   Тип:', error.name);
    console.error('   Сообщение:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    return null;
  }
}

/**
 * Получает ID администраторов из переменных окружения
 * @returns {number[]} Массив ID администраторов
 */
function getAdminIds() {
  const adminIds = process.env.ADMIN_IDS;
  if (!adminIds) {
    console.warn('⚠️ ADMIN_IDS не найден в переменных окружения');
    return [];
  }
  
  const ids = adminIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  if (ids.length === 0) {
    console.warn('⚠️ ADMIN_IDS пуст или содержит неверные значения');
    console.warn('   Значение из .env:', adminIds);
  }
  return ids;
}

/**
 * Форматирует данные заявки для отправки в Telegram
 * @param {Object} formData - Данные формы
 * @returns {string} Отформатированное сообщение
 */
function formatFormMessage(formData) {
  const { name, phone, area, type, floors, finish, formType = 'CTA' } = formData;
  
  const formTypeNames = {
    'CTA': '📋 Заявка на бесплатный проект',
    'calculator': '🧮 Заявка из калькулятора',
    'contact': '📞 Заявка из формы контактов'
  };
  
  const houseTypes = {
    'gas-block': 'Газобетон',
    'clay-block': 'Керамзитобетон',
    'brick': 'Кирпич'
  };
  
  const finishTypes = {
    'shell': 'Черновая отделка',
    'box': 'Черновая отделка',
    'clean': 'Чистовая отделка',
    'turnkey': 'Под ключ'
  };
  
  let message = `🎯 <b>${formTypeNames[formType] || '📋 Новая заявка'}</b>\n\n`;
  
  // Информация о клиенте
  if (name && name !== 'Не указано') {
    message += `👤 <b>Имя:</b> ${name}\n`;
  }
  
  if (phone && phone !== 'Не указан') {
    message += `📱 <b>Телефон:</b> <code>${phone}</code>\n`;
  }
  
  // Информация о доме (для калькулятора)
  if (formType === 'calculator') {
    if (area) {
      message += `📐 <b>Площадь:</b> ${area} м²\n`;
    }
    if (type && houseTypes[type]) {
      message += `🏗️ <b>Тип дома:</b> ${houseTypes[type]}\n`;
    }
    if (floors) {
      const floorsText = floors === '1' ? '1 этаж' : floors === '2' ? '2 этажа' : floors;
      message += `🏠 <b>Этажность:</b> ${floorsText}\n`;
    }
    if (finish && finishTypes[finish]) {
      message += `🔨 <b>Отделка:</b> ${finishTypes[finish]}\n`;
    }
  } else if (area) {
    // Для CTA формы
    message += `📐 <b>Желаемая площадь:</b> ${area} м²\n`;
  }
  
  message += `\n⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  
  return message;
}

/**
 * Отправляет уведомление о новой заявке администраторам
 * @param {Object} formData - Данные формы
 * @returns {Promise<boolean>} true если отправлено успешно
 */
async function sendFormNotification(formData) {
  try {
    const bot = initNotificationBot();
    if (!bot) {
      console.error('❌ Бот для уведомлений не инициализирован');
      console.error('   Проверьте TELEGRAM_BOT_TOKEN в .env файле');
      return false;
    }

    const adminIds = getAdminIds();
    if (adminIds.length === 0) {
      console.error('❌ ADMIN_IDS не установлен или пуст');
      console.error('   Проверьте ADMIN_IDS в .env файле');
      console.error('   Формат: ADMIN_IDS=123456789,987654321');
      console.error('   Чтобы узнать свой ID, напишите боту @userinfobot');
      return false;
    }

    const message = formatFormMessage(formData);
    console.log('📤 Отправка уведомления в Telegram...');
    console.log(`   Администраторов: ${adminIds.length}`);
    console.log(`   ID: ${adminIds.join(', ')}`);
    
    const sentPromises = adminIds.map(adminId => {
      return bot.sendMessage(adminId, message, { parse_mode: 'HTML' })
        .then(() => {
          console.log(`✅ Уведомление отправлено администратору ${adminId}`);
          return true;
        })
        .catch(error => {
          console.error(`❌ Ошибка отправки администратору ${adminId}:`);
          if (error.code) {
            console.error(`   Код: ${error.code}`);
          }
          if (error.response) {
            console.error(`   Response: ${JSON.stringify(error.response, null, 2)}`);
          }
          console.error(`   Сообщение: ${error.message || error}`);
          
          // Полезные подсказки по кодам ошибок
          if (error.code === 403) {
            console.error('   💡 Решение: Администратор должен написать боту /start');
          } else if (error.code === 400) {
            console.error('   💡 Решение: Проверьте формат токена и ID администратора');
          }
          return false;
        });
    });

    const results = await Promise.allSettled(sentPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

    if (successCount > 0) {
      console.log(`✅ Уведомление отправлено ${successCount} из ${adminIds.length} администраторам`);
      return true;
    } else {
      console.error('❌ Не удалось отправить уведомление ни одному администратору');
      console.error('   Возможные причины:');
      console.error('   1. Администратор не написал боту /start (откройте бота и отправьте /start)');
      console.error('   2. Неверный Telegram ID администратора (проверьте через @userinfobot)');
      console.error('   3. Проблемы с сетью или Telegram API');
      return false;
    }
  } catch (error) {
    console.error('❌ Критическая ошибка при отправке уведомления:');
    console.error('   Тип:', error.name);
    console.error('   Сообщение:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    return false;
  }
}

module.exports = {
  sendFormNotification,
  initNotificationBot
};
