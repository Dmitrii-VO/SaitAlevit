const dataManager = require('../utils/data-manager');

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
      coordinates: workData.coordinates || null,
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
      coordinates: 'Координаты',
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
    } else if (field === 'coordinates') {
      if (value === null) {
        message += `Координаты очищены`;
      } else {
        message += `Новые координаты: ${value.lat}, ${value.lng}`;
      }
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

module.exports = { saveWork, deleteWork, updateWorkField };
