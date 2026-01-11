/**
 * Обработчики команд для управления работами
 */
const dataManager = require('../utils/data-manager');
const fileManager = require('../utils/file-manager');
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
 * Обработка текстовых сообщений
 */
async function handleMessage(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state) return;
  
  try {
    switch (state.step) {
      case 'name':
        state.data.title = msg.text.trim();
        state.step = 'area';
        await bot.sendMessage(
          chatId,
          `✅ Название: <b>${state.data.title}</b>\n\n2️⃣ Введите площадь в м² (только число):`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'area':
        const area = parseInt(msg.text.trim());
        if (isNaN(area) || area <= 0) {
          return bot.sendMessage(chatId, '❌ Пожалуйста, введите корректное число (например: 136)');
        }
        state.data.area = area;
        state.step = 'format';
        await bot.sendMessage(
          chatId,
          `✅ Площадь: <b>${area} м²</b>\n\n3️⃣ Введите формат (коробка, чистовая отделка, под ключ):`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'format':
        state.data.format = msg.text.trim();
        state.step = 'workStatus';
        await bot.sendMessage(
          chatId,
          `✅ Формат: <b>${state.data.format}</b>\n\n4️⃣ Введите статус работы (построен, строится, сдан в эксплуатацию):`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'workStatus':
        state.data.workStatus = msg.text.trim();
        state.step = 'description';
        await bot.sendMessage(
          chatId,
          `✅ Статус: <b>${state.data.workStatus}</b>\n\n5️⃣ Введите описание работы (или /skip для пропуска):`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'description':
        const descText = msg.text.trim().toLowerCase();
        if (descText === '/skip' || descText === 'skip') {
          state.data.description = '';
        } else {
          state.data.description = msg.text.trim();
        }
        state.step = 'address';
        await bot.sendMessage(
          chatId,
          `6️⃣ Введите адрес/локацию работы (или /skip для пропуска):`,
          { parse_mode: 'HTML' }
        );
        break;

      case 'address':
        const addrText = msg.text.trim().toLowerCase();
        if (addrText === '/skip' || addrText === 'skip') {
          state.data.address = '';
        } else {
          state.data.address = msg.text.trim();
        }
        state.step = 'main_image';
        await bot.sendMessage(
          chatId,
          `7️⃣ 📸 Отправьте главное фото работы:`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'gallery':
        if (msg.text && msg.text.trim().toLowerCase() === '/done') {
          await handleDoneCommand(bot, msg, userStates);
        } else {
          await bot.sendMessage(chatId, 'Отправьте фото для галереи или /done для завершения');
        }
        break;
        
      case 'status':
        const statusText = msg.text.trim().toLowerCase();
        if (statusText === 'опубликован' || statusText === 'опубликовать' || statusText === 'да') {
          state.data.status = 'published';
        } else if (statusText === 'скрыт' || statusText === 'скрыть' || statusText === 'нет') {
          state.data.status = 'hidden';
        } else {
          return bot.sendMessage(chatId, '❌ Пожалуйста, введите "опубликован" или "скрыт"');
        }
        
        await saveWork(chatId, state.data, bot);
        delete userStates[chatId];
        break;
        
      case 'select':
        const input = msg.text.trim();
        let selectedWork = null;
        
        const index = parseInt(input) - 1;
        if (!isNaN(index) && index >= 0 && index < state.works.length) {
          selectedWork = state.works[index];
        } else {
          selectedWork = state.works.find(w => String(w.id) === input);
        }
        
        if (!selectedWork) {
          return bot.sendMessage(chatId, '❌ Работа не найдена. Попробуйте ещё раз или /cancel');
        }
        
        if (state.type === 'works_delete') {
          await deleteWork(chatId, selectedWork.id, bot);
          delete userStates[chatId];
        } else if (state.type === 'works_edit') {
          state.step = 'edit_field';
          state.selectedWork = selectedWork;
          await bot.sendMessage(
            chatId,
            `Выбрана работа: <b>${selectedWork.title}</b>\n\nЧто хотите изменить?\nВведите название поля (название, площадь, формат, статус работы, описание, адрес, главное фото, галерея, статус публикации) или /cancel:`,
            { parse_mode: 'HTML' }
          );
        }
        break;

      case 'edit_field':
        const field = msg.text.trim().toLowerCase();
        const work = state.selectedWork;

        if (field === 'название' || field === 'name' || field === 'title') {
          state.step = 'edit_value';
          state.editField = 'title';
          await bot.sendMessage(
            chatId,
            `Текущее название: <b>${work.title}</b>\n\nВведите новое название:`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'площадь' || field === 'area') {
          state.step = 'edit_value';
          state.editField = 'area';
          await bot.sendMessage(
            chatId,
            `Текущая площадь: <b>${work.area} м²</b>\n\nВведите новую площадь (только число):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'формат' || field === 'format') {
          state.step = 'edit_value';
          state.editField = 'format';
          await bot.sendMessage(
            chatId,
            `Текущий формат: <b>${work.format}</b>\n\nВведите новый формат (коробка, чистовая отделка, под ключ):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'статус работы' || field === 'workstatus') {
          state.step = 'edit_value';
          state.editField = 'workStatus';
          await bot.sendMessage(
            chatId,
            `Текущий статус работы: <b>${work.workStatus}</b>\n\nВведите новый статус (построен, строится, сдан в эксплуатацию):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'описание' || field === 'description') {
          state.step = 'edit_value';
          state.editField = 'description';
          await bot.sendMessage(
            chatId,
            `Текущее описание: <b>${work.description || 'отсутствует'}</b>\n\nВведите новое описание (или /skip для очистки):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'адрес' || field === 'address') {
          state.step = 'edit_value';
          state.editField = 'address';
          await bot.sendMessage(
            chatId,
            `Текущий адрес: <b>${work.address || 'отсутствует'}</b>\n\nВведите новый адрес (или /skip для очистки):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'статус публикации' || field === 'статус' || field === 'status') {
          state.step = 'edit_value';
          state.editField = 'status';
          await bot.sendMessage(
            chatId,
            `Текущий статус публикации: <b>${work.status === 'published' ? 'опубликован' : 'скрыт'}</b>\n\nВведите новый статус ("опубликован" или "скрыт"):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'главное фото' || field === 'main_image' || field === 'фото') {
          state.step = 'edit_main_image';
          await bot.sendMessage(
            chatId,
            `📸 Отправьте новое главное фото для работы:`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'галерея' || field === 'gallery') {
          state.step = 'edit_gallery_menu';
          await bot.sendMessage(
            chatId,
            `Текущая галерея содержит ${work.gallery?.length || 0} фото.\n\n` +
            `Что хотите сделать?\n` +
            `1. Добавить фото\n` +
            `2. Очистить галерею\n` +
            `3. Заменить галерею\n\n` +
            `Введите номер действия:`,
            { parse_mode: 'HTML' }
          );
        } else {
          await bot.sendMessage(
            chatId,
            '❌ Неверное поле. Доступные поля:\n' +
            'название, площадь, формат, статус работы, описание, адрес, главное фото, галерея, статус публикации\n\n' +
            'Попробуйте ещё раз или /cancel:'
          );
        }
        break;

      case 'edit_value':
        const editField = state.editField;
        const currentWork = state.selectedWork;
        let newValue = msg.text.trim();

        // Валидация и преобразование значения
        if (editField === 'area') {
          const area = parseInt(newValue);
          if (isNaN(area) || area <= 0) {
            return bot.sendMessage(chatId, '❌ Пожалуйста, введите корректное число');
          }
          newValue = area;
        } else if (editField === 'status') {
          const statusText = newValue.toLowerCase();
          if (statusText === 'опубликован' || statusText === 'опубликовать' || statusText === 'да') {
            newValue = 'published';
          } else if (statusText === 'скрыт' || statusText === 'скрыть' || statusText === 'нет') {
            newValue = 'hidden';
          } else {
            return bot.sendMessage(chatId, '❌ Пожалуйста, введите "опубликован" или "скрыт"');
          }
        } else if ((editField === 'description' || editField === 'address') && (newValue.toLowerCase() === '/skip' || newValue.toLowerCase() === 'skip')) {
          newValue = '';
        }

        // Обновляем работу
        await updateWorkField(chatId, currentWork.id, editField, newValue, bot);
        delete userStates[chatId];
        break;

      case 'edit_gallery_menu':
        const galleryAction = msg.text.trim();
        const wrk = state.selectedWork;

        if (galleryAction === '1' || galleryAction.toLowerCase().includes('добавить')) {
          state.step = 'edit_gallery_add';
          state.tempGallery = [];
          await bot.sendMessage(
            chatId,
            `📷 Отправьте фото для добавления в галерею (можно несколько).\nКогда закончите, отправьте /done`,
            { parse_mode: 'HTML' }
          );
        } else if (galleryAction === '2' || galleryAction.toLowerCase().includes('очистить')) {
          await updateWorkField(chatId, wrk.id, 'gallery', [], bot);
          delete userStates[chatId];
        } else if (galleryAction === '3' || galleryAction.toLowerCase().includes('заменить')) {
          state.step = 'edit_gallery_replace';
          state.tempGallery = [];
          await bot.sendMessage(
            chatId,
            `📷 Отправьте новые фото для галереи (можно несколько).\nКогда закончите, отправьте /done`,
            { parse_mode: 'HTML' }
          );
        } else {
          await bot.sendMessage(chatId, '❌ Введите номер от 1 до 3 или /cancel');
        }
        break;

      case 'edit_gallery_add':
      case 'edit_gallery_replace':
        if (msg.text && msg.text.trim().toLowerCase() === '/done') {
          const currentWorkItem = state.selectedWork;
          const data = await dataManager.readData('works');
          const workToUpdate = data.works.find(w => String(w.id) === String(currentWorkItem.id));

          if (state.step === 'edit_gallery_add') {
            workToUpdate.gallery = [...(workToUpdate.gallery || []), ...state.tempGallery];
          } else {
            workToUpdate.gallery = state.tempGallery;
          }

          await dataManager.writeData('works', data);
          await bot.sendMessage(
            chatId,
            `✅ Галерея обновлена! Теперь в ней ${workToUpdate.gallery.length} фото.\n\nИспользуйте /menu для возврата в главное меню.`,
            { parse_mode: 'HTML' }
          );
          delete userStates[chatId];
        } else {
          await bot.sendMessage(chatId, 'Отправьте фото или /done для завершения');
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

/**
 * Обработка команды /done
 */
async function handleDoneCommand(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state || state.step !== 'gallery') {
    return;
  }
  
  state.step = 'status';
  await bot.sendMessage(
    chatId,
    `✅ Галерея сохранена (${state.data.gallery.length} фото)\n\n9️⃣ Установить статус публикации:\nВведите "опубликован" или "скрыт":`,
    { parse_mode: 'HTML' }
  );
}

/**
 * Сохранение работы
 */
async function saveWork(chatId, workData, bot) {
  try {
    const data = await dataManager.readData('works');
    const works = data.works || [];
    
    const id = await dataManager.generateId('works');
    
    const work = {
      id: id,
      title: workData.title,
      area: workData.area,
      format: workData.format,
      workStatus: workData.workStatus,
      description: workData.description || '',
      address: workData.address || '',
      mainImage: workData.mainImage || '',
      gallery: workData.gallery || [],
      status: workData.status || 'published',
      createdAt: new Date().toISOString()
    };
    
    works.push(work);
    data.works = works;
    
    await dataManager.writeData('works', data);
    
    await bot.sendMessage(
      chatId,
      `✅ <b>Работа "${work.title}" успешно добавлена!</b>\n\n` +
      `ID: ${work.id}\n` +
      `Площадь: ${work.area} м²\n` +
      `Формат: ${work.format}\n` +
      `Статус: ${work.status === 'published' ? '✅ Опубликован' : '🔒 Скрыт'}\n\n` +
      `Используйте /works_list для просмотра всех работ.\n` +
      `Используйте /menu для возврата в главное меню.`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Ошибка сохранения работы:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при сохранении работы. Попробуйте ещё раз.');
    throw error;
  }
}

/**
 * Удаление работы
 */
async function deleteWork(chatId, workId, bot) {
  try {
    const deleted = await dataManager.deleteById('works', workId);

    if (deleted) {
      await bot.sendMessage(
        chatId,
        `✅ Работа с ID ${workId} успешно удалена.\n\nИспользуйте /menu для возврата в главное меню.`
      );
    } else {
      await bot.sendMessage(chatId, '❌ Работа не найдена.');
    }
  } catch (error) {
    console.error('Ошибка удаления работы:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при удалении работы.');
  }
}

/**
 * Обновление отдельного поля работы
 */
async function updateWorkField(chatId, workId, field, value, bot) {
  try {
    const data = await dataManager.readData('works');
    const work = data.works.find(w => String(w.id) === String(workId));

    if (!work) {
      return bot.sendMessage(chatId, '❌ Работа не найдена.');
    }

    const oldValue = work[field];
    work[field] = value;

    await dataManager.writeData('works', data);

    const fieldNames = {
      title: 'Название',
      area: 'Площадь',
      format: 'Формат',
      workStatus: 'Статус работы',
      description: 'Описание',
      address: 'Адрес',
      status: 'Статус публикации',
      mainImage: 'Главное фото',
      gallery: 'Галерея'
    };

    let message = `✅ <b>${fieldNames[field]} успешно обновлено!</b>\n\n`;

    if (field === 'status') {
      message += `Было: ${oldValue === 'published' ? 'опубликован' : 'скрыт'}\nСтало: ${value === 'published' ? 'опубликован' : 'скрыт'}`;
    } else if (field === 'mainImage') {
      message += `Новое главное фото загружено`;
    } else if (field === 'gallery') {
      message += `Галерея содержит ${value.length} фото`;
    } else {
      message += `Новое значение: ${value}`;
    }

    message += `\n\nИспользуйте /menu для возврата в главное меню.`;

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка обновления поля работы:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при обновлении работы.');
    throw error;
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
