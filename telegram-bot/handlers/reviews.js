/**
 * Обработчики команд для управления отзывами
 */
const dataManager = require('../utils/data-manager');
const fileManager = require('../utils/file-manager');

/**
 * Добавление нового отзыва
 */
async function handleAdd(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  userStates[chatId] = {
    type: 'reviews_add',
    step: 'clientName',
    data: {}
  };
  
  await bot.sendMessage(
    chatId,
    '⭐ <b>Добавление нового отзыва</b>\n\n1️⃣ Введите имя клиента:',
    { parse_mode: 'HTML' }
  );
}

/**
 * Список всех отзывов
 */
async function handleList(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('reviews');
    const reviews = data.reviews || [];
    
    if (reviews.length === 0) {
      return bot.sendMessage(chatId, '📭 Отзывов пока нет. Используйте /reviews_add для добавления.');
    }
    
    let message = `<b>📋 Список отзывов (${reviews.length}):</b>\n\n`;
    
    reviews.forEach((review, index) => {
      const status = review.status === 'published' ? '✅' : '🔒';
      const type = review.videoUrl ? '🎥 Видео' : '📝 Текст';
      message += `${index + 1}. ${status} ${type} - <b>${review.clientName}</b>\n`;
      message += `   ID: ${review.id} | Дом: ${review.houseName || 'не указан'}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка получения списка отзывов:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении списка отзывов.');
  }
}

/**
 * Редактирование отзыва
 */
async function handleEdit(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('reviews');
    const reviews = data.reviews || [];
    
    if (reviews.length === 0) {
      return bot.sendMessage(chatId, '📭 Отзывов пока нет для редактирования.');
    }
    
    let message = '<b>Выберите отзыв для редактирования:</b>\n\n';
    reviews.forEach((review, index) => {
      message += `${index + 1}. ${review.clientName} (ID: ${review.id})\n`;
    });
    message += '\nВведите номер отзыва или его ID:';
    
    userStates[chatId] = {
      type: 'reviews_edit',
      step: 'select',
      reviews: reviews
    };
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка при редактировании отзыва:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при загрузке списка отзывов.');
  }
}

/**
 * Удаление отзыва
 */
async function handleDelete(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('reviews');
    const reviews = data.reviews || [];
    
    if (reviews.length === 0) {
      return bot.sendMessage(chatId, '📭 Отзывов пока нет для удаления.');
    }
    
    let message = '<b>Выберите отзыв для удаления:</b>\n\n';
    reviews.forEach((review, index) => {
      message += `${index + 1}. ${review.clientName} (ID: ${review.id})\n`;
    });
    message += '\n⚠️ <b>Внимание!</b> Это действие нельзя отменить.\nВведите номер отзыва или его ID:';
    
    userStates[chatId] = {
      type: 'reviews_delete',
      step: 'select',
      reviews: reviews
    };
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка при удалении отзыва:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при загрузке списка отзывов.');
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
      case 'clientName':
        state.data.clientName = msg.text.trim();
        state.step = 'houseName';
        await bot.sendMessage(
          chatId,
          `✅ Имя: <b>${state.data.clientName}</b>\n\n2️⃣ Введите название дома (например: "Дом 1а, 136 м², под ключ") или /skip:`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'houseName':
        const houseText = msg.text.trim().toLowerCase();
        if (houseText === '/skip' || houseText === 'skip') {
          state.data.houseName = '';
        } else {
          state.data.houseName = msg.text.trim();
        }
        state.step = 'reviewText';
        await bot.sendMessage(
          chatId,
          `3️⃣ Введите текст отзыва:`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'reviewText':
        state.data.reviewText = msg.text.trim();
        state.step = 'reviewType';
        await bot.sendMessage(
          chatId,
          `✅ Текст отзыва сохранен\n\n4️⃣ Это видео или текстовый отзыв?\nВведите "видео" или "текст":`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'reviewType':
        const type = msg.text.trim().toLowerCase();
        if (type === 'видео' || type === 'video') {
          state.data.isVideo = true;
          state.step = 'videoUrl';
          await bot.sendMessage(
            chatId,
            `5️⃣ Введите ссылку на видео (YouTube, Vimeo и т.д.):`,
            { parse_mode: 'HTML' }
          );
        } else {
          state.data.isVideo = false;
          state.step = 'photo';
          await bot.sendMessage(
            chatId,
            `5️⃣ Отправьте фото клиента (или /skip для пропуска):`,
            { parse_mode: 'HTML' }
          );
        }
        break;
        
      case 'videoUrl':
        const url = msg.text.trim();
        // Простая валидация URL
        if (!url.match(/^https?:\/\//)) {
          return bot.sendMessage(chatId, '❌ Пожалуйста, введите корректную ссылку (начинается с http:// или https://)');
        }
        state.data.videoUrl = url;
        state.step = 'status';
        await bot.sendMessage(
          chatId,
          `✅ Ссылка на видео сохранена\n\n6️⃣ Установить статус публикации:\nВведите "опубликован" или "скрыт":`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'photo':
        // Обработка фото происходит в handlePhoto
        // Если пришло текстовое сообщение, значит пользователь отправил /skip или skip
        const skipText = msg.text ? msg.text.trim().toLowerCase() : '';
        if (skipText === '/skip' || skipText === 'skip') {
          state.data.clientPhoto = '';
          state.step = 'status';
          await bot.sendMessage(
            chatId,
            `✅ Фото пропущено\n\n6️⃣ Установить статус публикации:\nВведите "опубликован" или "скрыт":`,
            { parse_mode: 'HTML' }
          );
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
        
        await saveReview(chatId, state.data, bot);
        delete userStates[chatId];
        break;
        
      case 'select':
        const input = msg.text.trim();
        let selectedReview = null;
        
        const index = parseInt(input) - 1;
        if (!isNaN(index) && index >= 0 && index < state.reviews.length) {
          selectedReview = state.reviews[index];
        } else {
          selectedReview = state.reviews.find(r => String(r.id) === input);
        }
        
        if (!selectedReview) {
          return bot.sendMessage(chatId, '❌ Отзыв не найден. Попробуйте ещё раз или /cancel');
        }
        
        if (state.type === 'reviews_delete') {
          await deleteReview(chatId, selectedReview.id, bot);
          delete userStates[chatId];
        } else if (state.type === 'reviews_edit') {
          state.step = 'edit_field';
          state.selectedReview = selectedReview;
          await bot.sendMessage(
            chatId,
            `Выбран отзыв от: <b>${selectedReview.clientName}</b>\n\nЧто хотите изменить?\nВведите название поля (имя, название дома, текст, тип, видео, фото, статус) или /cancel:`,
            { parse_mode: 'HTML' }
          );
        }
        break;

      case 'edit_field':
        const field = msg.text.trim().toLowerCase();
        const review = state.selectedReview;

        if (field === 'имя' || field === 'имя клиента' || field === 'clientname') {
          state.step = 'edit_value';
          state.editField = 'clientName';
          await bot.sendMessage(
            chatId,
            `Текущее имя: <b>${review.clientName}</b>\n\nВведите новое имя:`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'название дома' || field === 'дом' || field === 'housename') {
          state.step = 'edit_value';
          state.editField = 'houseName';
          await bot.sendMessage(
            chatId,
            `Текущее название дома: <b>${review.houseName || 'отсутствует'}</b>\n\nВведите новое название (или /skip для очистки):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'текст' || field === 'текст отзыва' || field === 'reviewtext') {
          state.step = 'edit_value';
          state.editField = 'reviewText';
          await bot.sendMessage(
            chatId,
            `Текущий текст отзыва:\n<b>${review.reviewText}</b>\n\nВведите новый текст:`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'тип' || field === 'type') {
          state.step = 'edit_review_type';
          await bot.sendMessage(
            chatId,
            `Текущий тип: <b>${review.isVideo ? 'Видео' : 'Текстовый'}</b>\n\nВведите новый тип ("видео" или "текст"):\n\n⚠️ Внимание: при смене типа данные (ссылка на видео или фото) будут очищены.`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'видео' || field === 'ссылка' || field === 'videourl') {
          if (!review.isVideo) {
            return bot.sendMessage(chatId, '❌ Это текстовый отзыв. Сначала измените тип на "видео".');
          }
          state.step = 'edit_value';
          state.editField = 'videoUrl';
          await bot.sendMessage(
            chatId,
            `Текущая ссылка: <b>${review.videoUrl}</b>\n\nВведите новую ссылку на видео:`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'фото' || field === 'clientphoto') {
          if (review.isVideo) {
            return bot.sendMessage(chatId, '❌ Это видео отзыв. Для видео отзывов фото не используется.');
          }
          state.step = 'edit_client_photo';
          await bot.sendMessage(
            chatId,
            `📸 Отправьте новое фото клиента (или /skip для удаления текущего):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'статус' || field === 'status') {
          state.step = 'edit_value';
          state.editField = 'status';
          await bot.sendMessage(
            chatId,
            `Текущий статус: <b>${review.status === 'published' ? 'опубликован' : 'скрыт'}</b>\n\nВведите новый статус ("опубликован" или "скрыт"):`,
            { parse_mode: 'HTML' }
          );
        } else {
          await bot.sendMessage(
            chatId,
            '❌ Неверное поле. Доступные поля:\n' +
            'имя, название дома, текст, тип, видео (только для видео отзывов), фото (только для текстовых), статус\n\n' +
            'Попробуйте ещё раз или /cancel:'
          );
        }
        break;

      case 'edit_value':
        const editField = state.editField;
        const currentReview = state.selectedReview;
        let newValue = msg.text.trim();

        // Валидация и преобразование значения
        if (editField === 'videoUrl') {
          if (!newValue.match(/^https?:\/\//)) {
            return bot.sendMessage(chatId, '❌ Пожалуйста, введите корректную ссылку (начинается с http:// или https://)');
          }
        } else if (editField === 'status') {
          const statusText = newValue.toLowerCase();
          if (statusText === 'опубликован' || statusText === 'опубликовать' || statusText === 'да') {
            newValue = 'published';
          } else if (statusText === 'скрыт' || statusText === 'скрыть' || statusText === 'нет') {
            newValue = 'hidden';
          } else {
            return bot.sendMessage(chatId, '❌ Пожалуйста, введите "опубликован" или "скрыт"');
          }
        } else if (editField === 'houseName' && (newValue.toLowerCase() === '/skip' || newValue.toLowerCase() === 'skip')) {
          newValue = '';
        }

        // Обновляем отзыв
        await updateReviewField(chatId, currentReview.id, editField, newValue, bot);
        delete userStates[chatId];
        break;

      case 'edit_review_type':
        const reviewType = msg.text.trim().toLowerCase();
        const rev = state.selectedReview;

        if (reviewType === 'видео' || reviewType === 'video') {
          // Меняем на видео отзыв
          const data = await dataManager.readData('reviews');
          const reviewToUpdate = data.reviews.find(r => String(r.id) === String(rev.id));
          reviewToUpdate.isVideo = true;
          reviewToUpdate.videoUrl = '';
          reviewToUpdate.clientPhoto = '';
          await dataManager.writeData('reviews', data);

          state.step = 'edit_value';
          state.editField = 'videoUrl';
          await bot.sendMessage(
            chatId,
            `✅ Тип изменён на "Видео"\n\nВведите ссылку на видео:`,
            { parse_mode: 'HTML' }
          );
        } else if (reviewType === 'текст' || reviewType === 'text' || reviewType === 'текстовый') {
          // Меняем на текстовый отзыв
          const data = await dataManager.readData('reviews');
          const reviewToUpdate = data.reviews.find(r => String(r.id) === String(rev.id));
          reviewToUpdate.isVideo = false;
          reviewToUpdate.videoUrl = '';
          reviewToUpdate.clientPhoto = '';
          await dataManager.writeData('reviews', data);

          await bot.sendMessage(
            chatId,
            `✅ Тип изменён на "Текстовый"\n\nМожете отправить фото клиента (или /skip для пропуска):`,
            { parse_mode: 'HTML' }
          );
          state.step = 'edit_client_photo';
        } else {
          await bot.sendMessage(chatId, '❌ Пожалуйста, введите "видео" или "текст"');
        }
        break;

      case 'edit_client_photo':
        const skipPhotoText = msg.text ? msg.text.trim().toLowerCase() : '';
        if (skipPhotoText === '/skip' || skipPhotoText === 'skip') {
          await updateReviewField(chatId, state.selectedReview.id, 'clientPhoto', '', bot);
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
 * Обработка загрузки фото
 */
async function handlePhoto(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state) return;
  
  try {
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;

    if (photo.file_size > 10 * 1024 * 1024) {
      return bot.sendMessage(chatId, '❌ Файл слишком большой. Максимальный размер: 10 МБ');
    }

    // Безопасная загрузка файла с повторными попытками
    const { buffer, fileInfo } = await fileManager.getFileFromTelegram(bot, fileId);
    const fileName = fileInfo.file_path;

    if (state.step === 'photo') {
      const imagePath = await fileManager.saveFile(buffer, fileName, 'reviews');
      state.data.clientPhoto = imagePath;
      state.step = 'status';
      await bot.sendMessage(
        chatId,
        `✅ Фото сохранено\n\n6️⃣ Установить статус публикации:\nВведите "опубликован" или "скрыт":`,
        { parse_mode: 'HTML' }
      );
    } else if (state.step === 'edit_client_photo') {
      // Редактирование фото клиента
      const imagePath = await fileManager.saveFile(buffer, fileName, 'reviews');
      await updateReviewField(chatId, state.selectedReview.id, 'clientPhoto', imagePath, bot);
      delete userStates[chatId];
    }
  } catch (error) {
    console.error('Ошибка загрузки фото:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при сохранении фото. Попробуйте ещё раз или /cancel');
  }
}

/**
 * Обработка команды /done (для reviews не используется, но нужна для совместимости)
 */
async function handleDoneCommand(bot, msg, userStates) {
  // Не используется для отзывов
}

/**
 * Сохранение отзыва
 */
async function saveReview(chatId, reviewData, bot) {
  try {
    const data = await dataManager.readData('reviews');
    const reviews = data.reviews || [];
    
    const id = await dataManager.generateId('reviews');
    
    const review = {
      id: id,
      clientName: reviewData.clientName,
      houseName: reviewData.houseName || '',
      reviewText: reviewData.reviewText,
      clientPhoto: reviewData.clientPhoto || '',
      videoUrl: reviewData.videoUrl || '',
      isVideo: reviewData.isVideo || false,
      status: reviewData.status || 'published',
      createdAt: new Date().toISOString()
    };
    
    reviews.push(review);
    data.reviews = reviews;
    
    await dataManager.writeData('reviews', data);
    
    const typeText = review.isVideo ? '🎥 Видео отзыв' : '📝 Текстовый отзыв';
    await bot.sendMessage(
      chatId,
      `✅ <b>${typeText} от "${review.clientName}" успешно добавлен!</b>\n\n` +
      `ID: ${review.id}\n` +
      `Дом: ${review.houseName || 'не указан'}\n` +
      `Статус: ${review.status === 'published' ? '✅ Опубликован' : '🔒 Скрыт'}\n\n` +
      `Используйте /reviews_list для просмотра всех отзывов.\n` +
      `Используйте /menu для возврата в главное меню.`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Ошибка сохранения отзыва:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при сохранении отзыва. Попробуйте ещё раз.');
    throw error;
  }
}

/**
 * Удаление отзыва
 */
async function deleteReview(chatId, reviewId, bot) {
  try {
    const deleted = await dataManager.deleteById('reviews', reviewId);

    if (deleted) {
      await bot.sendMessage(
        chatId,
        `✅ Отзыв с ID ${reviewId} успешно удалён.\n\nИспользуйте /menu для возврата в главное меню.`
      );
    } else {
      await bot.sendMessage(chatId, '❌ Отзыв не найден.');
    }
  } catch (error) {
    console.error('Ошибка удаления отзыва:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при удалении отзыва.');
  }
}

/**
 * Обновление отдельного поля отзыва
 */
async function updateReviewField(chatId, reviewId, field, value, bot) {
  try {
    const data = await dataManager.readData('reviews');
    const review = data.reviews.find(r => String(r.id) === String(reviewId));

    if (!review) {
      return bot.sendMessage(chatId, '❌ Отзыв не найден.');
    }

    const oldValue = review[field];
    review[field] = value;

    await dataManager.writeData('reviews', data);

    const fieldNames = {
      clientName: 'Имя клиента',
      houseName: 'Название дома',
      reviewText: 'Текст отзыва',
      clientPhoto: 'Фото клиента',
      videoUrl: 'Ссылка на видео',
      isVideo: 'Тип отзыва',
      status: 'Статус публикации'
    };

    let message = `✅ <b>${fieldNames[field]} успешно обновлено!</b>\n\n`;

    if (field === 'status') {
      message += `Было: ${oldValue === 'published' ? 'опубликован' : 'скрыт'}\nСтало: ${value === 'published' ? 'опубликован' : 'скрыт'}`;
    } else if (field === 'clientPhoto') {
      message += value ? `Новое фото клиента загружено` : `Фото клиента удалено`;
    } else if (field === 'videoUrl') {
      message += `Новая ссылка: ${value}`;
    } else if (field === 'isVideo') {
      message += `Новый тип: ${value ? 'Видео' : 'Текстовый'}`;
    } else {
      message += `Новое значение: ${value || 'не указано'}`;
    }

    message += `\n\nИспользуйте /menu для возврата в главное меню.`;

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка обновления поля отзыва:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при обновлении отзыва.');
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
