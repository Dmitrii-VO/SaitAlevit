/**
 * Простой HTTP сервер для разработки
 * Оптимизирован для работы с Safari на мобильных устройствах
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { sendFormNotification } = require('../telegram-bot/utils/notifications');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0'; // Доступен по сети

// MIME типы
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

/**
 * Парсит тело POST запроса
 * @param {http.IncomingMessage} req - Запрос
 * @returns {Promise<Object>} Распарсенные данные
 */
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });
        
        req.on('error', reject);
    });
}

/**
 * Отправляет JSON ответ
 * @param {http.ServerResponse} res - Ответ
 * @param {number} statusCode - Код статуса
 * @param {Object} data - Данные для отправки
 */
function sendJSON(res, statusCode, data) {
    const json = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(json);
}

const server = http.createServer(async (req, res) => {
    // Обработка OPTIONS запросов (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // Обработка API запросов
    if (req.method === 'POST' && req.url === '/api/submit-form') {
        console.log('📨 Получен запрос на отправку заявки');
        try {
            const formData = await parseRequestBody(req);
            console.log('📋 Данные заявки:', JSON.stringify(formData, null, 2));
            
            // Валидация данных
            if (!formData.name || !formData.phone) {
                console.warn('⚠️ Валидация не пройдена: отсутствуют имя или телефон');
                return sendJSON(res, 400, {
                    success: false,
                    error: 'Имя и телефон обязательны для заполнения'
                });
            }

            console.log('📤 Отправка уведомления в Telegram...');
            // Отправка уведомления в Telegram
            const sent = await sendFormNotification(formData);
            
            if (sent) {
                console.log('✅ Заявка успешно обработана');
                sendJSON(res, 200, {
                    success: true,
                    message: 'Заявка успешно отправлена'
                });
            } else {
                console.error('❌ Не удалось отправить уведомление');
                sendJSON(res, 500, {
                    success: false,
                    error: 'Ошибка при отправке заявки. Попробуйте позже.'
                });
            }
        } catch (error) {
            console.error('❌ Ошибка обработки заявки:', error);
            console.error('   Stack:', error.stack);
            sendJSON(res, 500, {
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
        return;
    }

    // Обработка статических файлов
    // Убираем query string и нормализуем путь
    let filePath = req.url.split('?')[0];
    
    // Если корневой путь, возвращаем index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Полный путь к файлу
    const fullPath = path.join(__dirname, '..', filePath);
    
    // Проверяем существование файла
    fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Если файл не найден, пробуем index.html
            if (filePath !== '/index.html') {
                const indexPath = path.join(__dirname, '..', 'index.html');
                return serveFile(indexPath, res);
            }
            // 404
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 - Файл не найден');
            return;
        }
        
        serveFile(fullPath, res);
    });
});

function serveFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 - Ошибка сервера');
            return;
        }
        
        const mimeType = getMimeType(filePath);
        
        // Заголовки для Safari и мобильных устройств
        const headers = {
            'Content-Type': mimeType,
            'Content-Length': data.length,
            // CORS заголовки для Safari
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            // Кэширование для статических файлов
            'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
            // Безопасность
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN'
        };
        
        res.writeHead(200, headers);
        res.end(data);
    });
}


server.listen(PORT, HOST, () => {
    const ip = getLocalIP();
    const allIPs = [];
    const interfaces = os.networkInterfaces();
    
    // Собираем все IP-адреса
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                allIPs.push({ name, address: iface.address });
            }
        }
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('🚀 Сервер запущен и готов к работе!');
    console.log('═'.repeat(70));
    
    if (allIPs.length > 0) {
        console.log(`\n📱 Для доступа с мобильного устройства (Safari, Chrome):`);
        allIPs.forEach((item, index) => {
            console.log(`   ${index + 1}. http://${item.address}:${PORT} (${item.name})`);
        });
    } else {
        console.log(`\n⚠️  Не найдено сетевых интерфейсов!`);
        console.log(`   Проверьте подключение к Wi-Fi или Ethernet`);
    }
    
    console.log(`\n💻 Для доступа с этого компьютера:`);
    console.log(`   http://localhost:${PORT}`);
    console.log('\n' + '═'.repeat(70));
    console.log('\n💡 ВАЖНО для Safari на iPhone/iPad:');
    console.log('   • Убедитесь, что устройство в той же Wi-Fi сети');
    console.log('   • Используйте IP-адрес (не localhost)');
    console.log('   • Если не работает, проверьте брандмауэр Windows');
    console.log('   • Запустите: node scripts/check-network.js для диагностики');
    console.log('\n   Нажмите Ctrl+C для остановки сервера\n');
});

// Обработка ошибок
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Порт ${PORT} уже занят!`);
        console.error('   Закройте другой процесс или измените порт в scripts/server.js\n');
    } else {
        console.error('\n❌ Ошибка сервера:', err.message);
    }
    process.exit(1);
});
