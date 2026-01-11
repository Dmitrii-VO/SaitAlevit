# Устранение проблем с Telegram ботом

## Ошибка: EFATAL: AggregateError при запуске

Эта ошибка означает, что бот не может подключиться к Telegram API.

### Возможные причины и решения

#### 1. Telegram API заблокирован в вашем регионе

**Решение: Использовать прокси или VPN**

1. Скопируйте файл `.env.example` в `.env`:
   ```bash
   cp telegram-bot/.env.example telegram-bot/.env
   ```

2. Отредактируйте `.env` файл и настройте прокси:
   ```env
   PROXY_ENABLED=true
   PROXY_PROTOCOL=socks5  # или http
   PROXY_HOST=127.0.0.1
   PROXY_PORT=1080
   ```

3. Если используете SOCKS прокси, установите дополнительный пакет:
   ```bash
   npm install socks-proxy-agent
   ```

**Варианты прокси:**
- **Shadowsocks** (рекомендуется)
- **V2Ray**
- **HTTP/HTTPS прокси**
- **VPN** (работает без настройки прокси в боте)

#### 2. Проблемы с DNS в WSL

**Решение 1: Изменить DNS сервер**

```bash
# Временно изменить DNS (до перезагрузки WSL)
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# Постоянно изменить DNS
sudo nano /etc/wsl.conf
```

Добавьте в файл `/etc/wsl.conf`:
```ini
[network]
generateResolvConf = false
```

Затем создайте `/etc/resolv.conf`:
```bash
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
sudo chattr +i /etc/resolv.conf  # Защита от изменений
```

Перезапустите WSL:
```powershell
# В PowerShell (Windows)
wsl --shutdown
```

**Решение 2: Запустить бота из Windows вместо WSL**

```bash
# В Windows PowerShell или CMD
cd D:\myprojects\saitgusia
npm run bot:dev
```

#### 3. Проверка токена бота

Убедитесь, что токен бота правильный:

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/mybots`
3. Выберите вашего бота → **API Token**
4. Скопируйте токен и добавьте в `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   ```

#### 4. Проверка интернет-соединения

```bash
# Проверка доступности Telegram API
ping api.telegram.org

# Проверка через curl
curl -I https://api.telegram.org

# Если не работает - используйте прокси или VPN
```

#### 5. Firewall или антивирус

Временно отключите firewall/антивирус:

**Windows:**
```
Параметры → Обновление и безопасность → Безопасность Windows → Брандмауэр
```

**WSL:**
```bash
sudo ufw disable  # если установлен
```

#### 6. Использование альтернативного базового URL (для экспертов)

Если у вас есть свой Telegram Bot API сервер:

```bash
npm install telegram-bot-api-server  # Опционально
```

Обратитесь к документации node-telegram-bot-api для настройки `baseApiUrl`.

## Другие проблемы

### Бот запускается, но не отвечает

1. Проверьте ID администратора:
   ```bash
   # Узнайте свой Telegram ID
   # Напишите боту @userinfobot
   ```

2. Убедитесь, что ID добавлен в `.env`:
   ```env
   ADMIN_IDS=ваш_id_здесь
   ```

3. Перезапустите бота

### Ошибки при загрузке фото

- Проверьте размер фото (максимум 10 МБ)
- Убедитесь, что папки `images/projects`, `images/works`, `images/reviews` существуют
- Проверьте права доступа к папкам

### Ошибка "Identifier already declared"

Это была ошибка в коде, уже исправлена в последней версии. Выполните:

```bash
git pull origin main
npm install
```

## Полезные команды

```bash
# Проверка логов бота
npm run bot:dev

# Остановка бота
# Нажмите Ctrl+C

# Очистка и переустановка зависимостей
rm -rf node_modules package-lock.json
npm install

# Проверка версии Node.js (требуется >= 14)
node --version
```

## Получение помощи

Если проблема не решена:

1. Проверьте Issues на GitHub
2. Создайте новый Issue с описанием:
   - Версия Node.js (`node --version`)
   - ОС (Windows/WSL/Linux/macOS)
   - Полный текст ошибки
   - Шаги для воспроизведения
