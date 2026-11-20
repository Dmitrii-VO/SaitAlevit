const dataManager = require('../utils/data-manager');
const { saveWork, deleteWork, updateWorkField } = require('./work-storage');

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
          `✅ Площадь: <b>${area} м²</b>\n\n3️⃣ Введите формат (черновая отделка, чистовая отделка, под ключ):`,
          { parse_mode: 'HTML' }
        );
        break;

      case 'format':
        state.data.format = msg.text.trim();
        state.step = 'workStatus';
        await bot.sendMessage(
          chatId,
          `✅ Формат: <b>${state.data.format}</b>\n\n4️⃣ Введите статус работы (дом построен и сдан, дом строится, дом построен и готов к продаже, свободный участок):`,
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
        state.step = 'coordinates';
        await bot.sendMessage(
          chatId,
          `7️⃣ 📍 Введите координаты для карты (широта,долгота) или /skip для пропуска:\n\n` +
          `Пример: 50.5957,36.5872\n` +
          `Или отправьте /skip, если координаты неизвестны`,
          { parse_mode: 'HTML' }
        );
        break;

      case 'coordinates':
        const coordsText = msg.text.trim().toLowerCase();
        if (coordsText === '/skip' || coordsText === 'skip') {
          state.data.coordinates = null;
        } else {
          // Парсим координаты в формате "lat,lng" или "lat, lng"
          const coordsMatch = msg.text.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
          if (coordsMatch) {
            const lat = parseFloat(coordsMatch[1]);
            const lng = parseFloat(coordsMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              state.data.coordinates = { lat, lng };
            } else {
              return bot.sendMessage(
                chatId,
                '❌ Некорректные координаты. Широта должна быть от -90 до 90, долгота от -180 до 180.\nПопробуйте ещё раз или /skip:'
              );
            }
          } else {
            return bot.sendMessage(
              chatId,
              '❌ Неверный формат координат. Используйте формат: широта,долгота (например: 50.5957,36.5872)\nПопробуйте ещё раз или /skip:'
            );
          }
        }
        state.step = 'main_image';
        await bot.sendMessage(
          chatId,
          `8️⃣ 📸 Отправьте главное фото работы:`,
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
            `Выбрана работа: <b>${selectedWork.title}</b>\n\nЧто хотите изменить?\nВведите название поля (название, площадь, формат, статус работы, описание, адрес, координаты, главное фото, галерея, статус публикации) или /cancel:`,
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
            `Текущий формат: <b>${work.format}</b>\n\nВведите новый формат (черновая отделка, чистовая отделка, под ключ):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'статус работы' || field === 'workstatus') {
          state.step = 'edit_value';
          state.editField = 'workStatus';
          await bot.sendMessage(
            chatId,
            `Текущий статус работы: <b>${work.workStatus}</b>\n\nВведите новый статус (дом построен и сдан, дом строится, дом построен и готов к продаже, свободный участок):`,
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
        } else if (field === 'координаты' || field === 'coordinates' || field === 'координат') {
          state.step = 'edit_value';
          state.editField = 'coordinates';
          const currentCoords = work.coordinates
            ? `${work.coordinates.lat},${work.coordinates.lng}`
            : 'отсутствуют';
          await bot.sendMessage(
            chatId,
            `Текущие координаты: <b>${currentCoords}</b>\n\nВведите новые координаты (широта,долгота) или /skip для очистки:\nПример: 50.5957,36.5872`,
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
            'название, площадь, формат, статус работы, описание, адрес, координаты, главное фото, галерея, статус публикации\n\n' +
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
        } else if (editField === 'coordinates') {
          if (newValue.toLowerCase() === '/skip' || newValue.toLowerCase() === 'skip') {
            newValue = null;
          } else {
            // Парсим координаты в формате "lat,lng" или "lat, lng"
            const coordsMatch = newValue.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
            if (coordsMatch) {
              const lat = parseFloat(coordsMatch[1]);
              const lng = parseFloat(coordsMatch[2]);
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                newValue = { lat, lng };
              } else {
                return bot.sendMessage(
                  chatId,
                  '❌ Некорректные координаты. Широта должна быть от -90 до 90, долгота от -180 до 180.\nПопробуйте ещё раз или /skip:'
                );
              }
            } else {
              return bot.sendMessage(
                chatId,
                '❌ Неверный формат координат. Используйте формат: широта,долгота (например: 50.5957,36.5872)\nПопробуйте ещё раз или /skip:'
              );
            }
          }
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

module.exports = { handleMessage, handleDoneCommand };
