/**
 * Скрипт для отображения локального IP-адреса
 * Помогает подключиться к серверу с мобильного устройства в той же сети
 */

const os = require('os');
const { networkInterfaces } = os;

function getLocalIP() {
    const interfaces = networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Пропускаем внутренние и не-IPv4 адреса
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({
                    interface: name,
                    address: iface.address
                });
            }
        }
    }

    return addresses;
}

console.log('\n🌐 Локальные IP-адреса для доступа с мобильного устройства:\n');
console.log('═'.repeat(60));

const ips = getLocalIP();

if (ips.length === 0) {
    console.log('❌ Не найдено доступных IP-адресов');
    console.log('   Убедитесь, что вы подключены к Wi-Fi сети\n');
} else {
    ips.forEach((ip, index) => {
        console.log(`\n📱 Вариант ${index + 1}:`);
        console.log(`   Интерфейс: ${ip.interface}`);
        console.log(`   Адрес:     http://${ip.address}:3000`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n💡 Инструкция:');
    console.log('   1. Убедитесь, что мобильное устройство подключено к той же Wi-Fi сети');
    console.log('   2. Откройте браузер на мобильном устройстве');
    console.log(`   3. Введите один из адресов выше (например: http://${ips[0].address}:3000)`);
    console.log('   4. Сайт откроется на вашем мобильном устройстве\n');
}
