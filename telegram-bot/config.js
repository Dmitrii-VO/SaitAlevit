/**
 * Конфигурация Telegram бота
 */
require('dotenv').config();

const config = {
  // Токен бота из переменных окружения
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  
  // ID администраторов (через запятую в .env или массив)
  adminIds: process.env.ADMIN_IDS 
    ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim()))
    : [],
  
  // Пути к JSON файлам с данными
  dataPaths: {
    projects: './data/projects.json',
    works: './data/works.json',
    reviews: './data/reviews.json',
    contacts: './data/contacts.json'
  },
  
  // Путь для сохранения загруженных изображений
  imagesPath: './images',
  
  // Максимальный размер файла (в байтах) - 10 МБ
  maxFileSize: 10 * 1024 * 1024,
  
  // Разрешенные типы изображений
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
};

// Валидация конфигурации
if (!config.botToken) {
  console.error('❌ Ошибка: TELEGRAM_BOT_TOKEN не установлен в .env файле');
  process.exit(1);
}

// Проверка формата токена (должен быть вида "123456:ABC-DEF...")
if (!config.botToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
  console.error('❌ Ошибка: Неверный формат токена. Токен должен быть вида "123456:ABC-DEF..."');
  console.error('Текущий токен (первые 20 символов):', config.botToken.substring(0, 20));
  process.exit(1);
}

if (config.adminIds.length === 0) {
  console.error('❌ Ошибка: ADMIN_IDS не установлен в .env файле');
  process.exit(1);
}

// #region agent log
(async () => {
  try {
    const http = require('http');
    const data = JSON.stringify({location:'config.js:44',message:'Config validation passed',data:{tokenValid:true,adminCount:config.adminIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'});
    const options = {method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}};
    const req = http.request('http://127.0.0.1:7243/ingest/7fdb07ad-effa-4787-9e01-77043e8a757f',options,()=>{}).on('error',()=>{});
    req.write(data);req.end();
  } catch(e){}
})();
// #endregion

module.exports = config;
