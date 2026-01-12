/**
 * Тестовый скрипт для проверки отправки уведомлений в Telegram
 * Запуск: node test-telegram-send.js
 */

const { sendFormNotification } = require('./telegram-bot/utils/notifications');

console.log('🧪 Тест отправки уведомления в Telegram\n');
console.log('═'.repeat(70));

// Тестовые данные
const testData = {
  name: 'Тестовый пользователь',
  phone: '+7 (900) 123-45-67',
  area: '120',
  formType: 'CTA'
};

console.log('📋 Тестовые данные:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n' + '═'.repeat(70));
console.log('📤 Отправка уведомления...\n');

sendFormNotification(testData)
  .then(success => {
    console.log('\n' + '═'.repeat(70));
    if (success) {
      console.log('✅ ТЕСТ ПРОЙДЕН: Уведомление успешно отправлено!');
      console.log('   Проверьте Telegram - сообщение должно прийти.');
      process.exit(0);
    } else {
      console.log('❌ ТЕСТ НЕ ПРОЙДЕН: Не удалось отправить уведомление');
      console.log('   Проверьте логи выше для диагностики проблемы.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n' + '═'.repeat(70));
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:');
    console.error('   Тип:', error.name);
    console.error('   Сообщение:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  });
