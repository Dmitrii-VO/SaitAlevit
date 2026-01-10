/**
 * Обработчики команд для управления контактами
 */
const dataManager = require('../utils/data-manager');

/**
 * Просмотр текущих контактов
 */
async function handleView(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const contacts = await dataManager.readData('contacts');
    
    const message = `
📞 <b>Текущие контакты:</b>

📱 <b>Телефон:</b>
${contacts.phone || 'не указан'}

📧 <b>Email:</b>
${contacts.email || 'не указан'}

📍 <b>Адрес:</b>
${contacts.address || 'не указан'}

💬 <b>WhatsApp:</b>
${contacts.whatsapp || 'не указан'}

✈️ <b>Telegram:</b>
${contacts.telegram || 'не указан'}

Используйте /contacts_edit для изменения контактов.
    `;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка получения контактов:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении контактов.');
  }
}

/**
 * Редактирование контактов
 */
async function handleEdit(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  userStates[chatId] = {
    type: 'contacts_edit',
    step: 'select_field',
    data: {}
  };
  
  await bot.sendMessage(
    chatId,
    '📞 <b>Редактирование контактов</b>\n\nЧто хотите изменить?\n\n' +
    '1. Телефон\n' +
    '2. Email\n' +
    '3. Адрес\n' +
    '4. WhatsApp\n' +
    '5. Telegram\n' +
    '6. Все сразу\n\n' +
    'Введите номер поля или название:',
    { parse_mode: 'HTML' }
  );
}

/**
 * Обработка текстовых сообщений
 */
async function handleMessage(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state) return;
  
  try {
    switch (state.step) {
      case 'select_field':
        const input = msg.text.trim().toLowerCase();
        let field = null;
        
        // Определяем поле по номеру или названию
        if (input === '1' || input === 'телефон' || input === 'phone') {
          field = 'phone';
        } else if (input === '2' || input === 'email') {
          field = 'email';
        } else if (input === '3' || input === 'адрес' || input === 'address') {
          field = 'address';
        } else if (input === '4' || input === 'whatsapp') {
          field = 'whatsapp';
        } else if (input === '5' || input === 'telegram') {
          field = 'telegram';
        } else if (input === '6' || input === 'все' || input === 'все сразу' || input === 'all') {
          state.step = 'all_fields';
          state.currentField = 'phone';
          await bot.sendMessage(
            chatId,
            `1️⃣ Введите телефон (текущий: ${(await dataManager.readData('contacts')).phone || 'не указан'}):`,
            { parse_mode: 'HTML' }
          );
          return;
        } else {
          return bot.sendMessage(chatId, '❌ Неверный выбор. Введите номер от 1 до 6 или название поля.');
        }
        
        state.step = 'edit_field';
        state.field = field;
        
        const contacts = await dataManager.readData('contacts');
        const fieldNames = {
          phone: 'Телефон',
          email: 'Email',
          address: 'Адрес',
          whatsapp: 'WhatsApp',
          telegram: 'Telegram'
        };
        
        await bot.sendMessage(
          chatId,
          `Введите новое значение для "${fieldNames[field]}"\nТекущее значение: ${contacts[field] || 'не указано'}`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'edit_field':
        const value = msg.text.trim();
        state.data[state.field] = value;
        
        await saveContacts(chatId, state.data, state.field, bot);
        delete userStates[chatId];
        break;
        
      case 'all_fields':
        const currentContacts = await dataManager.readData('contacts');
        const currentField = state.currentField;
        state.data[currentField] = msg.text.trim();
        
        const fieldOrder = ['phone', 'email', 'address', 'whatsapp', 'telegram'];
        const fieldIndex = fieldOrder.indexOf(currentField);
        const nextField = fieldOrder[fieldIndex + 1];
        
        if (nextField) {
          state.currentField = nextField;
          const fieldNames = {
            phone: 'Телефон',
            email: 'Email',
            address: 'Адрес',
            whatsapp: 'WhatsApp',
            telegram: 'Telegram'
          };
          
          await bot.sendMessage(
            chatId,
            `✅ ${fieldNames[currentField]} сохранено\n\n${fieldIndex + 2}️⃣ Введите ${fieldNames[nextField].toLowerCase()} (текущий: ${currentContacts[nextField] || 'не указан'}):`,
            { parse_mode: 'HTML' }
          );
        } else {
          // Все поля заполнены
          await saveContacts(chatId, state.data, null, bot, true);
          delete userStates[chatId];
        }
        break;
    }
  } catch (error) {
    console.error('Ошибка обработки сообщения:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте ещё раз или /cancel');
    delete userStates[chatId];
  }
}

/**
 * Сохранение контактов
 */
async function saveContacts(chatId, newData, singleField, bot, allFields = false) {
  try {
    const contacts = await dataManager.readData('contacts');
    
    if (allFields) {
      // Сохраняем все поля сразу
      Object.assign(contacts, newData);
    } else {
      // Сохраняем одно поле
      contacts[singleField] = newData[singleField];
    }
    
    await dataManager.writeData('contacts', contacts);
    
    if (allFields) {
      await bot.sendMessage(
        chatId,
        `✅ <b>Все контакты успешно обновлены!</b>\n\nИспользуйте /contacts_view для просмотра.\nИспользуйте /menu для возврата в главное меню.`,
        { parse_mode: 'HTML' }
      );
    } else {
      const fieldNames = {
        phone: 'Телефон',
        email: 'Email',
        address: 'Адрес',
        whatsapp: 'WhatsApp',
        telegram: 'Telegram'
      };
      
      await bot.sendMessage(
        chatId,
        `✅ <b>${fieldNames[singleField]} успешно обновлён!</b>\n\nНовое значение: ${contacts[singleField]}\n\nИспользуйте /contacts_view для просмотра всех контактов.\nИспользуйте /menu для возврата в главное меню.`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (error) {
    console.error('Ошибка сохранения контактов:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при сохранении контактов. Попробуйте ещё раз.');
    throw error;
  }
}

module.exports = {
  handleView,
  handleEdit,
  handleMessage
};
