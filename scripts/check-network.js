/**
 * Скрипт для диагностики сетевых проблем
 * Помогает найти причину, почему Safari не может подключиться
 */

const os = require('os');
const { networkInterfaces } = os;
const http = require('http');

function getLocalIPs() {
    const interfaces = networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({
                    interface: name,
                    address: iface.address,
                    netmask: iface.netmask
                });
            }
        }
    }

    return addresses;
}

function testServer(port, host) {
    return new Promise((resolve, reject) => {
        const testServer = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
        });

        testServer.listen(port, host, () => {
            testServer.close(() => {
                resolve(true);
            });
        });

        testServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve('BUSY');
            } else {
                reject(err);
            }
        });
    });
}

console.log('\n' + '═'.repeat(70));
console.log('🔍 ДИАГНОСТИКА СЕТИ ДЛЯ ДОСТУПА С МОБИЛЬНОГО УСТРОЙСТВА');
console.log('═'.repeat(70));

// 1. Проверка IP-адресов
console.log('\n📡 1. Найденные сетевые интерфейсы:');
const ips = getLocalIPs();

if (ips.length === 0) {
    console.log('   ❌ Не найдено активных сетевых интерфейсов!');
    console.log('   💡 Убедитесь, что Wi-Fi или Ethernet подключены\n');
} else {
    ips.forEach((ip, index) => {
        console.log(`\n   ✅ Вариант ${index + 1}:`);
        console.log(`      Интерфейс: ${ip.interface}`);
        console.log(`      IP-адрес:  ${ip.address}`);
        console.log(`      Маска:     ${ip.netmask}`);
        console.log(`      URL:       http://${ip.address}:3000`);
    });
}

// 2. Проверка порта
console.log('\n\n🔌 2. Проверка порта 3000:');
testServer(3000, '0.0.0.0')
    .then((result) => {
        if (result === 'BUSY') {
            console.log('   ⚠️  Порт 3000 уже занят другим процессом');
            console.log('   💡 Закройте другие серверы или измените порт');
        } else {
            console.log('   ✅ Порт 3000 свободен и доступен');
        }
    })
    .catch((err) => {
        console.log(`   ❌ Ошибка при проверке порта: ${err.message}`);
    })
    .finally(() => {
        // 3. Инструкции
        console.log('\n\n📋 3. РЕКОМЕНДАЦИИ:');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (ips.length > 0) {
            console.log('\n   ✅ На iPhone/iPad в Safari:');
            console.log(`      1. Откройте Safari`);
            console.log(`      2. Введите: http://${ips[0].address}:3000`);
            console.log(`      3. Убедитесь, что устройство в той же Wi-Fi сети`);
        }
        
        console.log('\n   🔧 Если не работает, попробуйте:');
        console.log('      • Проверить брандмауэр Windows:');
        console.log('        - Откройте "Защитник Windows" → "Брандмауэр"');
        console.log('        - Разрешите входящие подключения на порт 3000');
        console.log('      • Проверить, что сервер запущен:');
        console.log('        - Запустите: npm start');
        console.log('        - Должно появиться сообщение "🚀 Сервер запущен!"');
        console.log('      • Попробовать другой порт:');
        console.log('        - Измените PORT в scripts/server.js на 8080');
        console.log('      • Проверить настройки Wi-Fi:');
        console.log('        - Убедитесь, что устройства в одной сети');
        console.log('        - Проверьте, нет ли изоляции клиентов в роутере');
        console.log('      • Попробовать Chrome на iPhone для проверки');
        
        console.log('\n   🌐 Альтернативные способы:');
        console.log('      • Используйте ngrok для туннеля:');
        console.log('        - Установите: npm install -g ngrok');
        console.log('        - Запустите: ngrok http 3000');
        console.log('        - Используйте предоставленный URL');
        console.log('      • Используйте локальный хостинг:');
        console.log('        - Загрузите файлы на GitHub Pages');
        console.log('        - Или используйте Netlify/Vercel');
        
        console.log('\n' + '═'.repeat(70) + '\n');
    });
