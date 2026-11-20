/**
 * Обработчики команд для управления работами
 */
const dataManager = require('../utils/data-manager');
const fileManager = require('../utils/file-manager');
const { handleMessage, handleDoneCommand } = require('./work-message');
const { updateWorkField } = require('./work-storage');
const logger = require('../utils/logger');

/**
 * Добавление новой работы
 */
async function handleAdd(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  userStates[chatId] = {
    type: 'works_add',
    step: 'name',
    data: {
      gallery: []
    }
  };
  
  await bot.sendMessage(
    chatId,
    '🏗️ <b>Добавление новой работы</b>\n\n1️⃣ Введите название работы (например: "Дом 1а"):',
    { parse_mode: 'HTML' }
  );
}

/**
 * Список всех работ
 */
async function handleList(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('works');
    const works = data.works || [];
    
    if (works.length === 0) {
      return bot.sendMessage(chatId, '📭 Работ пока нет. Используйте /works_add для добавления.');
    }
    
    let message = `<b>📋 Список работ (${works.length}):</b>\n\n`;
    
    works.forEach((work, index) => {
      const status = work.status === 'published' ? '✅' : '🔒';
      message += `${index + 1}. ${status} <b>${work.title}</b>\n`;
      message += `   ID: ${work.id} | Площадь: ${work.area} м²\n`;
      message += `   Формат: ${work.format} | Статус: ${work.workStatus}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка получения списка работ:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении списка работ.');
  }
}

/**
 * Редактирование работы
 */
async function handleEdit(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('works');
    const works = data.works || [];
    
    if (works.length === 0) {
      return bot.sendMessage(chatId, '📭 Работ пока нет для редактирования.');
    }
    
    let message = '<b>Выберите работу для редактирования:</b>\n\n';
    works.forEach((work, index) => {
      message += `${index + 1}. ${work.title} (ID: ${work.id})\n`;
    });
    message += '\nВведите номер работы или её ID:';
    
    userStates[chatId] = {
      type: 'works_edit',
      step: 'select',
      works: works
    };
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка при редактировании работы:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при загрузке списка работ.');
  }
}

/**
 * Удаление работы
 */
async function handleDelete(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('works');
    const works = data.works || [];
    
    if (works.length === 0) {
      return bot.sendMessage(chatId, '📭 Работ пока нет для удаления.');
    }
    
    let message = '<b>Выберите работу для удаления:</b>\n\n';
    works.forEach((work, index) => {
      message += `${index + 1}. ${work.title} (ID: ${work.id})\n`;
    });
    message += '\n⚠️ <b>Внимание!</b> Это действие нельзя отменить.\nВведите номер работы или её ID:';
    
    userStates[chatId] = {
      type: 'works_delete',
      step: 'select',
      works: works
    };
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка при удалении работы:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при загрузке списка работ.');
  }
}

/**
 * Обработка загрузки фото
 */
async function handlePhoto(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state) {
    logger.warn('Получено фото без активного состояния', { chatId });
    return;
  }
  
  try {
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;

    logger.info(`📸 Получено фото`, { 
      fileId: fileId.substring(0, 20) + '...', 
      fileSize: photo.file_size, 
      step: state.step,
      chatId 
    });

    if (photo.file_size > 10 * 1024 * 1024) {
      logger.warn('Файл слишком большой', { fileSize: photo.file_size, maxSize: 10 * 1024 * 1024 });
      return bot.sendMessage(chatId, '❌ Файл слишком большой. Максимальный размер: 10 МБ');
    }

    // Безопасная загрузка файла с повторными попытками
    logger.debug('Начинаем загрузку файла через getFileFromTelegram', { fileId: fileId.substring(0, 20) + '...' });
    const { buffer, fileInfo } = await fileManager.getFileFromTelegram(bot, fileId);
    logger.debug('Файл успешно загружен, получаем имя файла', { filePath: fileInfo.file_path, bufferSize: buffer.length });
    const fileName = fileInfo.file_path;

    if (state.step === 'main_image') {
      logger.debug('Сохранение главного фото', { fileName, bufferSize: buffer.length });
      const imagePath = await fileManager.saveFile(buffer, fileName, 'works');
      state.data.mainImage = imagePath;
      state.step = 'gallery';
      logger.info(`✅ Главное фото сохранено`, { imagePath, chatId });
      await bot.sendMessage(
        chatId,
        `✅ Главное фото сохранено\n\n8️⃣ 📷 Отправьте фото для галереи (можно несколько).\nКогда закончите, отправьте /done`,
        { parse_mode: 'HTML' }
      );
    } else if (state.step === 'gallery') {
      const imagePath = await fileManager.saveFile(buffer, fileName, 'works');
      state.data.gallery.push(imagePath);
      console.log(`✅ Фото добавлено в галерею: ${imagePath}`);
      await bot.sendMessage(
        chatId,
        `✅ Фото добавлено в галерею (всего: ${state.data.gallery.length})\nОтправьте ещё фото или /done для завершения`
      );
    } else if (state.step === 'edit_main_image') {
      // Редактирование главного фото
      const imagePath = await fileManager.saveFile(buffer, fileName, 'works');
      console.log(`✅ Главное фото обновлено: ${imagePath}`);
      await updateWorkField(chatId, state.selectedWork.id, 'mainImage', imagePath, bot);
      delete userStates[chatId];
    } else if (state.step === 'edit_gallery_add' || state.step === 'edit_gallery_replace') {
      // Добавление фото в галерею при редактировании
      const imagePath = await fileManager.saveFile(buffer, fileName, 'works');
      state.tempGallery = state.tempGallery || [];
      state.tempGallery.push(imagePath);
      console.log(`✅ Фото добавлено в temp галерею: ${imagePath}`);
      await bot.sendMessage(
        chatId,
        `✅ Фото добавлено (всего: ${state.tempGallery.length})\nОтправьте ещё фото или /done для завершения`
      );
    } else {
      console.warn(`⚠️ Фото получено на неожиданном шаге: ${state.step}`);
      await bot.sendMessage(chatId, '❌ Фото не ожидается на этом шаге. Продолжите ввод текста или /cancel');
    }
  } catch (error) {
    logger.error('❌ Ошибка загрузки фото', error, { chatId, step: state?.step });
    try {
      await bot.sendMessage(chatId, `❌ Ошибка при сохранении фото: ${error.message}\n\nПопробуйте ещё раз или /cancel`);
    } catch (sendError) {
      logger.error('❌ Ошибка отправки сообщения об ошибке', sendError, { chatId });
    }
  }
}

module.exports = {
  handleAdd,
  handleList,
  handleEdit,
  handleDelete,
  handleMessage,
  handlePhoto,
  handleDoneCommand
};
