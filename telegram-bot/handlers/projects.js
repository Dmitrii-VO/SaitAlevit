/**
 * Обработчики команд для управления проектами
 */
const dataManager = require('../utils/data-manager');
const fileManager = require('../utils/file-manager');
const TelegramBot = require('node-telegram-bot-api');

/**
 * Добавление нового проекта
 */
async function handleAdd(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  userStates[chatId] = {
    type: 'projects_add',
    step: 'name',
    data: {
      gallery: []
    }
  };
  
  await bot.sendMessage(
    chatId,
    '📝 <b>Добавление нового проекта</b>\n\n1️⃣ Введите название проекта:',
    { parse_mode: 'HTML' }
  );
}

/**
 * Список всех проектов
 */
async function handleList(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('projects');
    const projects = data.projects || [];
    
    if (projects.length === 0) {
      return bot.sendMessage(chatId, '📭 Проектов пока нет. Используйте /projects_add для добавления.');
    }
    
    let message = `<b>📋 Список проектов (${projects.length}):</b>\n\n`;
    
    projects.forEach((project, index) => {
      const status = project.status === 'published' ? '✅' : '🔒';
      message += `${index + 1}. ${status} <b>${project.title}</b>\n`;
      message += `   ID: ${project.id} | Площадь: ${project.area} м² | Стоимость: ${formatPrice(project.price)} ₽\n`;
      message += `   Этажность: ${project.floors}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка получения списка проектов:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении списка проектов.');
  }
}

/**
 * Редактирование проекта
 */
async function handleEdit(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('projects');
    const projects = data.projects || [];
    
    if (projects.length === 0) {
      return bot.sendMessage(chatId, '📭 Проектов пока нет для редактирования.');
    }
    
    let message = '<b>Выберите проект для редактирования:</b>\n\n';
    projects.forEach((project, index) => {
      message += `${index + 1}. ${project.title} (ID: ${project.id})\n`;
    });
    message += '\nВведите номер проекта или его ID:';
    
    userStates[chatId] = {
      type: 'projects_edit',
      step: 'select',
      projects: projects
    };
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка при редактировании проекта:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при загрузке списка проектов.');
  }
}

/**
 * Удаление проекта
 */
async function handleDelete(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  try {
    const data = await dataManager.readData('projects');
    const projects = data.projects || [];
    
    if (projects.length === 0) {
      return bot.sendMessage(chatId, '📭 Проектов пока нет для удаления.');
    }
    
    let message = '<b>Выберите проект для удаления:</b>\n\n';
    projects.forEach((project, index) => {
      message += `${index + 1}. ${project.title} (ID: ${project.id})\n`;
    });
    message += '\n⚠️ <b>Внимание!</b> Это действие нельзя отменить.\nВведите номер проекта или его ID:';
    
    userStates[chatId] = {
      type: 'projects_delete',
      step: 'select',
      projects: projects
    };
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка при удалении проекта:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при загрузке списка проектов.');
  }
}

/**
 * Обработка текстовых сообщений в процессе диалога
 */
async function handleMessage(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state) return;
  
  try {
    switch (state.step) {
      case 'name':
        state.data.title = msg.text.trim();
        state.step = 'floors';
        await bot.sendMessage(
          chatId,
          `✅ Название: <b>${state.data.title}</b>\n\n2️⃣ Выберите этажность:\nВведите "1 этаж" или "2 этажа":`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'floors':
        state.data.floors = msg.text.trim();
        state.step = 'area';
        await bot.sendMessage(
          chatId,
          `✅ Этажность: <b>${state.data.floors}</b>\n\n3️⃣ Введите площадь в м² (только число):`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'area':
        const area = parseInt(msg.text.trim());
        if (isNaN(area) || area <= 0) {
          return bot.sendMessage(chatId, '❌ Пожалуйста, введите корректное число (например: 136)');
        }
        state.data.area = area;
        state.step = 'price';
        await bot.sendMessage(
          chatId,
          `✅ Площадь: <b>${area} м²</b>\n\n4️⃣ Введите стоимость в рублях (только цифры, без пробелов):`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'price':
        const price = parseInt(msg.text.trim().replace(/\s/g, ''));
        if (isNaN(price) || price <= 0) {
          return bot.sendMessage(chatId, '❌ Пожалуйста, введите корректную сумму (например: 6120000)');
        }
        state.data.price = price;
        state.step = 'description';
        await bot.sendMessage(
          chatId,
          `✅ Стоимость: <b>${formatPrice(price)} ₽</b>\n\n5️⃣ Введите описание проекта (или /skip для пропуска):`,
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
        state.step = 'main_image';
        await bot.sendMessage(
          chatId,
          state.data.description 
            ? `✅ Описание сохранено\n\n6️⃣ 📸 Отправьте главное фото проекта:`
            : `✅ Описание пропущено\n\n6️⃣ 📸 Отправьте главное фото проекта:`,
          { parse_mode: 'HTML' }
        );
        break;
        
      case 'gallery':
        // Команда /done обрабатывается в handleDoneCommand
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
        
        // Сохраняем проект
        await saveProject(chatId, state.data, bot);
        delete userStates[chatId];
        break;
        
      case 'select': // Для редактирования/удаления
        const input = msg.text.trim();
        let selectedProject = null;
        
        // Пробуем найти по номеру
        const index = parseInt(input) - 1;
        if (!isNaN(index) && index >= 0 && index < state.projects.length) {
          selectedProject = state.projects[index];
        } else {
          // Пробуем найти по ID
          selectedProject = state.projects.find(p => String(p.id) === input);
        }
        
        if (!selectedProject) {
          return bot.sendMessage(chatId, '❌ Проект не найден. Попробуйте ещё раз или /cancel');
        }
        
        if (state.type === 'projects_delete') {
          await deleteProject(chatId, selectedProject.id, bot);
          delete userStates[chatId];
        } else if (state.type === 'projects_edit') {
          state.step = 'edit_field';
          state.selectedProject = selectedProject;
          await bot.sendMessage(
            chatId,
            `Выбран проект: <b>${selectedProject.title}</b>\n\nЧто хотите изменить?\nВведите название поля (название, этажность, площадь, стоимость, описание, статус) или /cancel:`,
            { parse_mode: 'HTML' }
          );
        }
        break;
        
      case 'edit_field':
        const field = msg.text.trim().toLowerCase();
        const project = state.selectedProject;

        // Определяем поле для редактирования
        if (field === 'название' || field === 'name' || field === 'title') {
          state.step = 'edit_value';
          state.editField = 'title';
          await bot.sendMessage(
            chatId,
            `Текущее название: <b>${project.title}</b>\n\nВведите новое название:`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'этажность' || field === 'floors') {
          state.step = 'edit_value';
          state.editField = 'floors';
          await bot.sendMessage(
            chatId,
            `Текущая этажность: <b>${project.floors}</b>\n\nВведите новую этажность (например: "1 этаж" или "2 этажа"):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'площадь' || field === 'area') {
          state.step = 'edit_value';
          state.editField = 'area';
          await bot.sendMessage(
            chatId,
            `Текущая площадь: <b>${project.area} м²</b>\n\nВведите новую площадь (только число):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'стоимость' || field === 'price') {
          state.step = 'edit_value';
          state.editField = 'price';
          await bot.sendMessage(
            chatId,
            `Текущая стоимость: <b>${formatPrice(project.price)} ₽</b>\n\nВведите новую стоимость (только цифры):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'описание' || field === 'description') {
          state.step = 'edit_value';
          state.editField = 'description';
          await bot.sendMessage(
            chatId,
            `Текущее описание: <b>${project.description || 'отсутствует'}</b>\n\nВведите новое описание (или /skip для очистки):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'статус' || field === 'status') {
          state.step = 'edit_value';
          state.editField = 'status';
          await bot.sendMessage(
            chatId,
            `Текущий статус: <b>${project.status === 'published' ? 'опубликован' : 'скрыт'}</b>\n\nВведите новый статус ("опубликован" или "скрыт"):`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'главное фото' || field === 'main_image' || field === 'фото') {
          state.step = 'edit_main_image';
          await bot.sendMessage(
            chatId,
            `📸 Отправьте новое главное фото для проекта:`,
            { parse_mode: 'HTML' }
          );
        } else if (field === 'галерея' || field === 'gallery') {
          state.step = 'edit_gallery_menu';
          await bot.sendMessage(
            chatId,
            `Текущая галерея содержит ${project.gallery?.length || 0} фото.\n\n` +
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
            'название, этажность, площадь, стоимость, описание, статус, главное фото, галерея\n\n' +
            'Попробуйте ещё раз или /cancel:'
          );
        }
        break;

      case 'edit_value':
        const editField = state.editField;
        const currentProject = state.selectedProject;
        let newValue = msg.text.trim();

        // Валидация и преобразование значения
        if (editField === 'area') {
          const area = parseInt(newValue);
          if (isNaN(area) || area <= 0) {
            return bot.sendMessage(chatId, '❌ Пожалуйста, введите корректное число');
          }
          newValue = area;
        } else if (editField === 'price') {
          const price = parseInt(newValue.replace(/\s/g, ''));
          if (isNaN(price) || price <= 0) {
            return bot.sendMessage(chatId, '❌ Пожалуйста, введите корректную сумму');
          }
          newValue = price;
        } else if (editField === 'status') {
          const statusText = newValue.toLowerCase();
          if (statusText === 'опубликован' || statusText === 'опубликовать' || statusText === 'да') {
            newValue = 'published';
          } else if (statusText === 'скрыт' || statusText === 'скрыть' || statusText === 'нет') {
            newValue = 'hidden';
          } else {
            return bot.sendMessage(chatId, '❌ Пожалуйста, введите "опубликован" или "скрыт"');
          }
        } else if (editField === 'description' && (newValue.toLowerCase() === '/skip' || newValue.toLowerCase() === 'skip')) {
          newValue = '';
        }

        // Обновляем проект
        await updateProjectField(chatId, currentProject.id, editField, newValue, bot);
        delete userStates[chatId];
        break;

      case 'edit_gallery_menu':
        const galleryAction = msg.text.trim();
        const proj = state.selectedProject;

        if (galleryAction === '1' || galleryAction.toLowerCase().includes('добавить')) {
          state.step = 'edit_gallery_add';
          state.tempGallery = [];
          await bot.sendMessage(
            chatId,
            `📷 Отправьте фото для добавления в галерею (можно несколько).\nКогда закончите, отправьте /done`,
            { parse_mode: 'HTML' }
          );
        } else if (galleryAction === '2' || galleryAction.toLowerCase().includes('очистить')) {
          await updateProjectField(chatId, proj.id, 'gallery', [], bot);
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
          const currentProject = state.selectedProject;
          const data = await dataManager.readData('projects');
          const projectToUpdate = data.projects.find(p => String(p.id) === String(currentProject.id));

          if (state.step === 'edit_gallery_add') {
            // Добавляем к существующей галерее
            projectToUpdate.gallery = [...(projectToUpdate.gallery || []), ...state.tempGallery];
          } else {
            // Заменяем галерею
            projectToUpdate.gallery = state.tempGallery;
          }

          await dataManager.writeData('projects', data);
          await bot.sendMessage(
            chatId,
            `✅ Галерея обновлена! Теперь в ней ${projectToUpdate.gallery.length} фото.\n\nИспользуйте /menu для возврата в главное меню.`,
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
  
  if (!state) return;
  
  try {
    const photo = msg.photo[msg.photo.length - 1]; // Берем самое большое фото
    const fileId = photo.file_id;
    
    // Проверяем размер файла
    if (photo.file_size > 10 * 1024 * 1024) {
      return bot.sendMessage(chatId, '❌ Файл слишком большой. Максимальный размер: 10 МБ');
    }
    
    // Безопасная загрузка файла с повторными попытками
    const { stream: fileStream, fileInfo } = await fileManager.getFileFromTelegram(bot, fileId);
    const fileName = fileInfo.file_path;
    
    if (state.step === 'main_image') {
      // Сохраняем главное фото
      const imagePath = await fileManager.saveFile(fileStream, fileName, 'projects');
      state.data.mainImage = imagePath;
      state.step = 'gallery';
      await bot.sendMessage(
        chatId,
        `✅ Главное фото сохранено\n\n7️⃣ 📷 Отправьте фото для галереи (можно несколько).\nКогда закончите, отправьте /done`,
        { parse_mode: 'HTML' }
      );
    } else if (state.step === 'gallery') {
      // Добавляем в галерею
      const imagePath = await fileManager.saveFile(fileStream, fileName, 'projects');
      state.data.gallery.push(imagePath);
      await bot.sendMessage(
        chatId,
        `✅ Фото добавлено в галерею (всего: ${state.data.gallery.length})\nОтправьте ещё фото или /done для завершения`
      );
    } else if (state.step === 'edit_main_image') {
      // Редактирование главного фото
      const imagePath = await fileManager.saveFile(fileStream, fileName, 'projects');
      await updateProjectField(chatId, state.selectedProject.id, 'mainImage', imagePath, bot);
      delete userStates[chatId];
    } else if (state.step === 'edit_gallery_add' || state.step === 'edit_gallery_replace') {
      // Добавление фото в галерею при редактировании
      const imagePath = await fileManager.saveFile(fileStream, fileName, 'projects');
      state.tempGallery = state.tempGallery || [];
      state.tempGallery.push(imagePath);
      await bot.sendMessage(
        chatId,
        `✅ Фото добавлено (всего: ${state.tempGallery.length})\nОтправьте ещё фото или /done для завершения`
      );
    } else {
      await bot.sendMessage(chatId, '❌ Фото не ожидается на этом шаге. Продолжите ввод текста или /cancel');
    }
  } catch (error) {
    console.error('Ошибка загрузки фото:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при сохранении фото. Попробуйте ещё раз или /cancel');
  }
}

/**
 * Сохранение проекта в JSON
 */
async function saveProject(chatId, projectData, bot) {
  try {
    const data = await dataManager.readData('projects');
    const projects = data.projects || [];
    
    // Генерируем ID
    const id = await dataManager.generateId('projects');
    
    // Создаём объект проекта
    const project = {
      id: id,
      title: projectData.title,
      floors: projectData.floors,
      area: projectData.area,
      price: projectData.price,
      description: projectData.description || '',
      mainImage: projectData.mainImage || '',
      gallery: projectData.gallery || [],
      status: projectData.status || 'published',
      createdAt: new Date().toISOString()
    };
    
    projects.push(project);
    data.projects = projects;
    
    await dataManager.writeData('projects', data);
    
    await bot.sendMessage(
      chatId,
      `✅ <b>Проект "${project.title}" успешно добавлен!</b>\n\n` +
      `ID: ${project.id}\n` +
      `Площадь: ${project.area} м²\n` +
      `Стоимость: ${formatPrice(project.price)} ₽\n` +
      `Статус: ${project.status === 'published' ? '✅ Опубликован' : '🔒 Скрыт'}\n\n` +
      `Используйте /projects_list для просмотра всех проектов.\n` +
      `Используйте /menu для возврата в главное меню.`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Ошибка сохранения проекта:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при сохранении проекта. Попробуйте ещё раз.');
    throw error;
  }
}

/**
 * Удаление проекта
 */
async function deleteProject(chatId, projectId, bot) {
  try {
    const deleted = await dataManager.deleteById('projects', projectId);
    
    if (deleted) {
      await bot.sendMessage(
        chatId,
        `✅ Проект с ID ${projectId} успешно удалён.\n\nИспользуйте /menu для возврата в главное меню.`
      );
    } else {
      await bot.sendMessage(chatId, '❌ Проект не найден.');
    }
  } catch (error) {
    console.error('Ошибка удаления проекта:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при удалении проекта.');
  }
}

/**
 * Обновление отдельного поля проекта
 */
async function updateProjectField(chatId, projectId, field, value, bot) {
  try {
    const data = await dataManager.readData('projects');
    const project = data.projects.find(p => String(p.id) === String(projectId));

    if (!project) {
      return bot.sendMessage(chatId, '❌ Проект не найден.');
    }

    const oldValue = project[field];
    project[field] = value;

    await dataManager.writeData('projects', data);

    const fieldNames = {
      title: 'Название',
      floors: 'Этажность',
      area: 'Площадь',
      price: 'Стоимость',
      description: 'Описание',
      status: 'Статус',
      mainImage: 'Главное фото',
      gallery: 'Галерея'
    };

    let message = `✅ <b>${fieldNames[field]} успешно обновлено!</b>\n\n`;

    if (field === 'price') {
      message += `Было: ${formatPrice(oldValue)} ₽\nСтало: ${formatPrice(value)} ₽`;
    } else if (field === 'status') {
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
    console.error('Ошибка обновления поля проекта:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при обновлении проекта.');
    throw error;
  }
}

/**
 * Форматирование цены
 */
function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price);
}

// Обработка команды /done для завершения галереи
async function handleDoneCommand(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (!state || state.step !== 'gallery') {
    return;
  }
  
  state.step = 'status';
  await bot.sendMessage(
    chatId,
    `✅ Галерея сохранена (${state.data.gallery.length} фото)\n\n8️⃣ Установить статус проекта:\nВведите "опубликован" или "скрыт":`,
    { parse_mode: 'HTML' }
  );
}

// Экспорт функций
module.exports = {
  handleAdd,
  handleList,
  handleEdit,
  handleDelete,
  handleMessage,
  handlePhoto,
  handleDoneCommand
};
