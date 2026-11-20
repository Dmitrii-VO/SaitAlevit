const { readData, writeData, getDefaultStructure } = require('../utils/data-manager');

/**
 * Показывает текущие цены за м²
 */
async function handleView(bot, msg) {
  try {
    let data = await readData('prices');
    if (!data || !data.prices) {
      data = getDefaultStructure('prices');
    }

    const prices = data.prices || {};
    const shell = prices.shell || 45000;
    const clean = prices.clean || 70000;
    const turnkey = prices.turnkey || 80000;

    const text = [
      '📊 <b>Текущие примерные цены за м²</b>',
      '',
      `1) Черновая отделка: <b>${shell.toLocaleString('ru-RU')} ₽/м²</b>`,
      `2) Чистовая отделка: <b>${clean.toLocaleString('ru-RU')} ₽/м²</b>`,
      `3) Под ключ: <b>${turnkey.toLocaleString('ru-RU')} ₽/м²</b>`,
      '',
      'Изменить: /prices_edit'
    ].join('\n');

    await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Ошибка при чтении цен:', error);
    await bot.sendMessage(msg.chat.id, '❌ Не удалось прочитать текущие цены. Попробуйте позже.');
  }
}

/**
 * Запускает режим редактирования цен
 */
async function handleEdit(bot, msg, userStates) {
  const chatId = msg.chat.id;

  userStates[chatId] = {
    type: 'prices_edit',
    step: 'shell',
    data: {}
  };

  await bot.sendMessage(
    chatId,
    '✏️ Введите цену за м² <b>для черновой отделки</b> (например: 45000):',
    { parse_mode: 'HTML' }
  );
}

/**
 * Обрабатывает пошаговый ввод цен
 */
async function handleMessage(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  const text = (msg.text || '').trim().replace(/\s+/g, '');

  if (!state || state.type !== 'prices_edit') return;

  const value = parseInt(text, 10);
  if (isNaN(value) || value <= 0) {
    return bot.sendMessage(chatId, 'Пожалуйста, введите число в рублях, например: 45000');
  }

  if (state.step === 'shell') {
    state.data.shell = value;
    state.step = 'clean';
    return bot.sendMessage(
      chatId,
      'Введите цену за м² для <b>чистовой отделки</b> (например: 70000):',
      { parse_mode: 'HTML' }
    );
  }

  if (state.step === 'clean') {
    state.data.clean = value;
    state.step = 'turnkey';
    return bot.sendMessage(
      chatId,
      'Введите цену за м² <b>под ключ</b> (например: 80000):',
      { parse_mode: 'HTML' }
    );
  }

  if (state.step === 'turnkey') {
    state.data.turnkey = value;

    try {
      await writeData('prices', { prices: state.data });
      delete userStates[chatId];

      const shell = state.data.shell.toLocaleString('ru-RU');
      const clean = state.data.clean.toLocaleString('ru-RU');
      const turnkey = state.data.turnkey.toLocaleString('ru-RU');

      const textConfirm = [
        '✅ Цены обновлены:',
        '',
        `1) Черновая отделка: <b>${shell} ₽/м²</b>`,
        `2) Чистовая отделка: <b>${clean} ₽/м²</b>`,
        `3) Под ключ: <b>${turnkey} ₽/м²</b>`
      ].join('\n');

      await bot.sendMessage(chatId, textConfirm, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Ошибка при сохранении цен:', error);
      await bot.sendMessage(chatId, '❌ Не удалось сохранить цены. Попробуйте позже.');
    }
  }
}

module.exports = {
  handleView,
  handleEdit,
  handleMessage
};

