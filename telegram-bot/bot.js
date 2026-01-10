/**
 * Telegram бот для администрирования сайта АЛЕВИТ СТРОЙ
 */
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { isAuthorized } = require('./utils/auth');

// Импорт обработчиков команд
const projectsHandler = require('./handlers/projects');
const worksHandler = require('./handlers/works');
const reviewsHandler = require('./handlers/reviews');
const contactsHandler = require('./handlers/contacts');

// #region agent log
fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:15',message:'Creating bot instance',data:{tokenLength:config.botToken.length,tokenPrefix:config.botToken.substring(0,10) + '...',hasToken:!!config.botToken},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Создаём экземпляр бота
let bot;
try {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:20',message:'Initializing TelegramBot',data:{polling:true},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Настройки для более надежного подключения
  // В WSL/Windows могут быть проблемы с таймаутами, поэтому используем более консервативные значения
  // Используем только опции polling, так как библиотека может не поддерживать все опции request
  bot = new TelegramBot(config.botToken, { 
    polling: {
      interval: 1000, // 1 секунда между запросами
      autoStart: false,
      params: {
        timeout: 10 // 10 секунд таймаут для long polling
      }
    }
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:26',message:'Bot instance created',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:30',message:'Bot creation error',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  console.error('❌ Ошибка создания бота:', error);
  process.exit(1);
}

// Хранилище состояний пользователей для пошаговых диалогов
const userStates = {};

/**
 * Проверяет авторизацию перед выполнением команды
 */
function requireAuth(msg, callback) {
  if (!isAuthorized(msg.from.id)) {
    return bot.sendMessage(
      msg.chat.id,
      '❌ Доступ запрещён. Вы не авторизованы для использования этой команды.'
    );
  }
  return callback(msg);
}

/**
 * Главное меню
 */
function showMainMenu(chatId) {
  const menu = `
🔧 <b>Главное меню админ-панели</b>

Выберите раздел для управления:

📋 <b>Проекты</b>
/projects_add - Добавить проект
/projects_list - Список проектов
/projects_edit - Редактировать проект
/projects_delete - Удалить проект

🏗️ <b>Наши работы</b>
/works_add - Добавить работу
/works_list - Список работ
/works_edit - Редактировать работу
/works_delete - Удалить работу

⭐ <b>Отзывы</b>
/reviews_add - Добавить отзыв
/reviews_list - Список отзывов
/reviews_edit - Редактировать отзыв
/reviews_delete - Удалить отзыв

📞 <b>Контакты</b>
/contacts_view - Просмотр контактов
/contacts_edit - Редактировать контакты

/help - Помощь
/cancel - Отменить текущую операцию
  `;
  
  bot.sendMessage(chatId, menu, { parse_mode: 'HTML' });
}

/**
 * Команда /start
 */
bot.onText(/\/start/, (msg) => {
  requireAuth(msg, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      `👋 Добро пожаловать в админ-панель сайта АЛЕВИТ СТРОЙ!\n\nИспользуйте /menu для доступа к главному меню.`
    );
    showMainMenu(chatId);
  });
});

/**
 * Команда /menu
 */
bot.onText(/\/menu/, (msg) => {
  requireAuth(msg, (msg) => {
    showMainMenu(msg.chat.id);
  });
});

/**
 * Команда /help
 */
bot.onText(/\/help/, (msg) => {
  requireAuth(msg, (msg) => {
    const helpText = `
📖 <b>Помощь по использованию бота</b>

<b>Основные команды:</b>
/menu - Главное меню
/help - Эта справка
/cancel - Отменить текущую операцию

<b>Управление проектами:</b>
/projects_add - Добавить новый типовой проект
/projects_list - Просмотреть все проекты
/projects_edit - Редактировать проект (все поля + галерея)
/projects_delete - Удалить проект

<b>Управление работами:</b>
/works_add - Добавить выполненную работу
/works_list - Просмотреть все работы
/works_edit - Редактировать работу (все поля + галерея)
/works_delete - Удалить работу

<b>Управление отзывами:</b>
/reviews_add - Добавить отзыв клиента
/reviews_list - Просмотреть все отзывы
/reviews_edit - Редактировать отзыв (включая смену типа)
/reviews_delete - Удалить отзыв

<b>Контакты:</b>
/contacts_view - Просмотреть текущие контакты
/contacts_edit - Изменить контактную информацию

<b>Загрузка файлов:</b>
При добавлении/редактировании элементов отправляйте фото прямо в чат. Можно отправлять несколько фото подряд для галереи.

<b>Статусы:</b>
Для проектов и работ можно установить статус "опубликован" или "скрыт". Скрытые элементы не отображаются на сайте, но сохраняются в базе.

<b>Отмена операции:</b>
В любой момент можно отменить текущую операцию командой /cancel
    `;
    
    bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'HTML' });
  });
});

/**
 * Команда /cancel - отмена текущей операции
 */
bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  delete userStates[chatId];
  bot.sendMessage(
    chatId,
    '✅ Операция отменена. Используйте /menu для доступа к главному меню.'
  );
});

// Регистрация обработчиков команд для проектов
bot.onText(/\/projects_add/, (msg) => {
  requireAuth(msg, (msg) => projectsHandler.handleAdd(bot, msg, userStates));
});

bot.onText(/\/projects_list/, (msg) => {
  requireAuth(msg, (msg) => projectsHandler.handleList(bot, msg));
});

bot.onText(/\/projects_edit/, (msg) => {
  requireAuth(msg, (msg) => projectsHandler.handleEdit(bot, msg, userStates));
});

bot.onText(/\/projects_delete/, (msg) => {
  requireAuth(msg, (msg) => projectsHandler.handleDelete(bot, msg, userStates));
});

// Регистрация обработчиков команд для работ
bot.onText(/\/works_add/, (msg) => {
  requireAuth(msg, (msg) => worksHandler.handleAdd(bot, msg, userStates));
});

bot.onText(/\/works_list/, (msg) => {
  requireAuth(msg, (msg) => worksHandler.handleList(bot, msg));
});

bot.onText(/\/works_edit/, (msg) => {
  requireAuth(msg, (msg) => worksHandler.handleEdit(bot, msg, userStates));
});

bot.onText(/\/works_delete/, (msg) => {
  requireAuth(msg, (msg) => worksHandler.handleDelete(bot, msg, userStates));
});

// Регистрация обработчиков команд для отзывов
bot.onText(/\/reviews_add/, (msg) => {
  requireAuth(msg, (msg) => reviewsHandler.handleAdd(bot, msg, userStates));
});

bot.onText(/\/reviews_list/, (msg) => {
  requireAuth(msg, (msg) => reviewsHandler.handleList(bot, msg));
});

bot.onText(/\/reviews_edit/, (msg) => {
  requireAuth(msg, (msg) => reviewsHandler.handleEdit(bot, msg, userStates));
});

bot.onText(/\/reviews_delete/, (msg) => {
  requireAuth(msg, (msg) => reviewsHandler.handleDelete(bot, msg, userStates));
});

// Регистрация обработчиков команд для контактов
bot.onText(/\/contacts_view/, (msg) => {
  requireAuth(msg, (msg) => contactsHandler.handleView(bot, msg));
});

bot.onText(/\/contacts_edit/, (msg) => {
  requireAuth(msg, (msg) => contactsHandler.handleEdit(bot, msg, userStates));
});

// Команда /done для завершения загрузки галереи
bot.onText(/\/done/, (msg) => {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state) {
    return bot.sendMessage(chatId, 'Нет активной операции для завершения.');
  }
  
  if (state.type && state.type.startsWith('projects_') && state.step === 'gallery') {
    projectsHandler.handleDoneCommand(bot, msg, userStates);
  } else if (state.type && state.type.startsWith('works_') && state.step === 'gallery') {
    worksHandler.handleDoneCommand(bot, msg, userStates);
  } else if (state.type && state.type.startsWith('reviews_') && state.step === 'photo') {
    reviewsHandler.handleDoneCommand(bot, msg, userStates);
  }
});

// Обработка всех текстовых сообщений (для пошаговых диалогов)
bot.on('message', (msg) => {
  // Пропускаем команды (кроме /done, который обрабатывается выше)
  if (msg.text && msg.text.startsWith('/') && msg.text !== '/done') {
    return;
  }
  
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state) {
    return; // Нет активного диалога
  }
  
  // Перенаправляем в соответствующий обработчик
  if (state.type && state.type.startsWith('projects_')) {
    projectsHandler.handleMessage(bot, msg, userStates);
  } else if (state.type && state.type.startsWith('works_')) {
    worksHandler.handleMessage(bot, msg, userStates);
  } else if (state.type && state.type.startsWith('reviews_')) {
    reviewsHandler.handleMessage(bot, msg, userStates);
  } else if (state.type && state.type.startsWith('contacts_')) {
    contactsHandler.handleMessage(bot, msg, userStates);
  }
});

// Обработка загрузки фото
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state) {
    return; // Нет активного диалога для загрузки фото
  }
  
  // Перенаправляем в соответствующий обработчик
  if (state.type && state.type.startsWith('projects_')) {
    projectsHandler.handlePhoto(bot, msg, userStates);
  } else if (state.type && state.type.startsWith('works_')) {
    worksHandler.handlePhoto(bot, msg, userStates);
  } else if (state.type && state.type.startsWith('reviews_')) {
    reviewsHandler.handlePhoto(bot, msg, userStates);
  }
});

// #region agent log
fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:290',message:'Setting up error handlers',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// Обработка ошибок polling
bot.on('polling_error', (error) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:309',message:'Polling error occurred',data:{errorMessage:error.message,errorCode:error.code,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Обработка AggregateError (множественные ошибки)
  if (error.name === 'AggregateError' || error.code === 'AggregateError') {
    const errors = error.errors || [];
    const isNetworkError = errors.some(e => 
      e.code === 'EAI_AGAIN' || 
      e.code === 'ETIMEDOUT' || 
      e.code === 'ECONNRESET' ||
      e.message && (e.message.includes('getaddrinfo') || e.message.includes('timeout'))
    );
    
    if (isNetworkError) {
      // Это временная сетевая ошибка - игнорируем, бот продолжит попытки
      console.warn('⚠️ Временная сетевая ошибка при подключении к Telegram API (попытка будет повторена автоматически)');
      return;
    }
  }
  
  // Обработка DNS ошибок (getaddrinfo EAI_AGAIN)
  if (error.code === 'EFATAL' || error.code === 'EAI_AGAIN') {
    if (error.message && (error.message.includes('getaddrinfo') || error.message.includes('EAI_AGAIN'))) {
      console.warn('⚠️ Проблема с DNS при подключении к api.telegram.org (проверьте интернет-соединение)');
      console.warn('   Бот продолжит попытки подключения...');
      return;
    }
  }
  
  // Игнорируем таймауты и временные сетевые ошибки - это нормально
  if (error.code === 'EFATAL' && error.message && error.message.includes('ETIMEDOUT')) {
    console.warn('⚠️ Таймаут при запросе к Telegram API (это нормально при отсутствии новых сообщений)');
    return;
  }
  
  // Для критических ошибок выводим полную информацию
  console.error('❌ Ошибка polling:', error.message || error);
  if (error.code) {
    console.error(`   Код ошибки: ${error.code}`);
  }
  
  // Если это ошибка авторизации - критично
  if (error.response && error.response.statusCode === 401) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Неверный токен бота!');
    process.exit(1);
  }
});

// Обработка ошибок подключения
bot.on('error', (error) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:306',message:'Bot error event',data:{errorMessage:error.message,errorCode:error.code,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  console.error('❌ Ошибка бота:', error);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (error) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:332',message:'Unhandled rejection',data:{errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  // Обработка AggregateError
  if (error && (error.name === 'AggregateError' || error.code === 'AggregateError')) {
    const errors = error.errors || [];
    const isNetworkError = errors.some(e => 
      e.code === 'EAI_AGAIN' || 
      e.code === 'ETIMEDOUT' || 
      e.code === 'ECONNRESET' ||
      e.message && (e.message.includes('getaddrinfo') || e.message.includes('timeout'))
    );
    
    if (isNetworkError) {
      console.warn('⚠️ Временная сетевая ошибка при подключении (попытка будет повторена)');
      return;
    }
  }
  
  // Игнорируем временные сетевые ошибки при запуске
  if (error && (
    (error.code === 'EFATAL' && error.message && error.message.includes('ETIMEDOUT')) ||
    error.code === 'EAI_AGAIN' ||
    (error.message && error.message.includes('getaddrinfo'))
  )) {
    console.warn('⚠️ Временная сетевая ошибка при подключении (попытка будет повторена)');
    return;
  }
  
  // Игнорируем ошибки преждевременного закрытия потока (могут происходить при загрузке файлов)
  if (error && error.code === 'ERR_STREAM_PREMATURE_CLOSE') {
    console.warn('⚠️ Поток был закрыт преждевременно (возможно, проблема с сетью при загрузке файла)');
    return;
  }
  
  // Для других ошибок выводим информацию
  if (error) {
    console.error('❌ Необработанная ошибка:', error.message || error);
    if (error.code) {
      console.error(`   Код: ${error.code}`);
    }
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
  }
});

// #region agent log
fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:319',message:'Starting bot polling',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
// #endregion

// Проверка доступности Telegram API
async function checkTelegramAPI() {
  try {
    const https = require('https');
    return new Promise((resolve, reject) => {
      const req = https.get('https://api.telegram.org', { 
        timeout: 5000,
        rejectUnauthorized: true
      }, (res) => {
        res.resume(); // Сбрасываем данные
        resolve(true);
      });
      req.on('error', () => reject(new Error('Connection error')));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.end();
    });
  } catch (error) {
    throw error;
  }
}

// Функция для запуска polling с повторными попытками
async function startPollingWithRetry(maxRetries = 5, delay = 5000) {
  // Проверяем доступность Telegram API перед запуском
  console.log('🔍 Проверка доступности Telegram API...');
  try {
    await checkTelegramAPI();
    console.log('✅ Telegram API доступен');
  } catch (error) {
    console.warn('⚠️ Не удалось проверить доступность Telegram API, продолжаем попытки...');
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:348',message:'Attempting to start polling',data:{attempt,maxRetries},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      console.log(`🔄 Попытка ${attempt}/${maxRetries} запуска polling...`);
      await bot.startPolling();
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:345',message:'Polling started successfully',data:{attempt},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      console.log('✅ Telegram бот запущен и готов к работе!');
      console.log(`📋 Администраторы: ${config.adminIds.join(', ')}`);
      return;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bot.js:350',message:'Polling start failed',data:{attempt,maxRetries,errorMessage:error.message,errorCode:error.code,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      console.error(`❌ Попытка ${attempt}/${maxRetries} запуска polling не удалась:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('❌ Не удалось запустить polling после всех попыток');
        console.error('');
        console.error('Возможные решения:');
        console.error('1. Проверьте правильность токена бота в .env файле');
        console.error('2. Проверьте интернет-соединение: ping api.telegram.org');
        console.error('3. Если используете WSL, проверьте DNS настройки:');
        console.error('   - Попробуйте: echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf');
        console.error('4. Проверьте настройки прокси (если используется)');
        console.error('5. Отключите firewall/антивирус на время тестирования');
        console.error('6. Попробуйте запустить из Windows вместо WSL');
        console.error('7. Проверьте, не блокирует ли провайдер Telegram');
        console.error('');
        console.error('Технические детали ошибки:');
        if (error.code) {
          console.error(`   Код ошибки: ${error.code}`);
        }
        if (error.message) {
          console.error(`   Сообщение: ${error.message}`);
        }
        process.exit(1);
      }
      
      console.log(`⏳ Повторная попытка через ${delay / 1000} секунд...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Запускаем polling с повторными попытками
startPollingWithRetry();

// Экспортируем бота и состояния для использования в обработчиках
module.exports = { bot, userStates };
