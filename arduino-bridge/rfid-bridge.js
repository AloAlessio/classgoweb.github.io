// Arduino RFID Bridge - Conecta Arduino con el backend de ClassGo
// Este servidor lee del puerto serial y envía las asistencias al backend
// NUEVO: Auto-detección de puerto Arduino + Auto-inicio

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');
const readline = require('readline');
const http = require('http'); // Para servidor HTTP

// ============= CONFIGURACIÓN =============

const CONFIG = {
    // Puerto serial del Arduino - AUTO-DETECTA si no se especifica
    // Windows: 'COM3', 'COM4', etc.
    // Linux/Mac: '/dev/ttyUSB0', '/dev/cu.usbmodem14101', etc.
    SERIAL_PORT: process.env.SERIAL_PORT || 'AUTO',
    BAUD_RATE: 9600,
    
    // URL del backend - Detecta automáticamente local vs producción
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000/api',
    // En producción Render: 'https://classgo-app.onrender.com/api'
    
    // ID de la clase activa (se puede cambiar en runtime)
    ACTIVE_CLASS_ID: null,
    
    // Puerto HTTP para recibir comandos del frontend
    HTTP_PORT: process.env.HTTP_PORT || 3001,
    
    // Mapeo de UIDs a formato correcto
    AUTO_FORMAT_UID: true,
    
    // Intervalo de reconexión (ms)
    RECONNECT_INTERVAL: 5000,
    
    // Auto-scan de puertos
    AUTO_SCAN_INTERVAL: 10000
};

// ============= MAPEO UID → USUARIO =============
// Mapeo temporal mientras vinculas tarjetas desde el dashboard
const UID_MAP = {
    '13:C9:46:14': 'STUDENT_ID_1',  // Reemplaza con IDs reales de Firebase
    // Agrega más tarjetas aquí temporalmente
};

// ============= INICIALIZACIÓN =============

let port;
let parser;
let isConnected = false;
let autoScanInterval = null;
let detectedPort = null;

console.log('🎓 ClassGo - Arduino RFID Bridge');
console.log('================================');
console.log('🔌 Modo: Auto-detección de Arduino');
console.log('');

// ============= AUTO-DETECCIÓN DE PUERTO =============

async function autoDetectArduino() {
    try {
        const ports = await SerialPort.list();
        
        // Buscar puertos que parezcan Arduino
        const arduinoPorts = ports.filter(p => {
            const isArduino = 
                (p.manufacturer && p.manufacturer.toLowerCase().includes('arduino')) ||
                (p.manufacturer && p.manufacturer.toLowerCase().includes('ch340')) ||
                (p.manufacturer && p.manufacturer.toLowerCase().includes('ftdi')) ||
                (p.vendorId && ['2341', '1a86', '0403'].includes(p.vendorId.toLowerCase())) ||
                (p.path && p.path.includes('usbmodem')) ||
                (p.path && p.path.includes('ttyUSB')) ||
                (p.path && p.path.includes('ttyACM'));
            return isArduino;
        });
        
        if (arduinoPorts.length > 0) {
            // Usar el primer Arduino encontrado
            const selectedPort = arduinoPorts[0].path;
            console.log(`🔍 Arduino detectado automáticamente: ${selectedPort}`);
            if (arduinoPorts[0].manufacturer) {
                console.log(`   Fabricante: ${arduinoPorts[0].manufacturer}`);
            }
            return selectedPort;
        }
        
        // Si no encontró Arduino específico, buscar cualquier puerto COM disponible
        const comPorts = ports.filter(p => p.path.startsWith('COM') || p.path.includes('tty'));
        if (comPorts.length > 0) {
            console.log('⚠️ No se detectó Arduino específico, puertos disponibles:');
            comPorts.forEach(p => console.log(`   ${p.path} ${p.manufacturer || ''}`));
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error al escanear puertos:', error.message);
        return null;
    }
}

// ============= CONEXIÓN SERIAL =============

async function initSerial() {
    // Si está configurado en AUTO, detectar automáticamente
    if (CONFIG.SERIAL_PORT === 'AUTO' || !detectedPort) {
        console.log('🔍 Buscando Arduino...');
        detectedPort = await autoDetectArduino();
        
        if (!detectedPort) {
            console.log('⏳ Arduino no encontrado. Reintentando en 10 segundos...');
            console.log('   💡 Conecta el Arduino vía USB');
            
            // Programar reintento
            if (!autoScanInterval) {
                autoScanInterval = setTimeout(async () => {
                    autoScanInterval = null;
                    await initSerial();
                }, CONFIG.AUTO_SCAN_INTERVAL);
            }
            return;
        }
    }
    
    const portToUse = CONFIG.SERIAL_PORT === 'AUTO' ? detectedPort : CONFIG.SERIAL_PORT;
    
    try {
        port = new SerialPort({
            path: portToUse,
            baudRate: CONFIG.BAUD_RATE
        });

        parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        port.on('open', () => {
            console.log(`✅ Conectado a Arduino en ${portToUse}`);
            isConnected = true;
            // Cancelar auto-scan si estaba activo
            if (autoScanInterval) {
                clearTimeout(autoScanInterval);
                autoScanInterval = null;
            }
        });

        port.on('error', (err) => {
            console.error('❌ Error en puerto serial:', err.message);
            isConnected = false;
            detectedPort = null; // Resetear para re-escanear
        });

        port.on('close', () => {
            console.log('⚠️  Conexión serial cerrada');
            isConnected = false;
            detectedPort = null; // Resetear para re-escanear
            // Intentar reconectar después de 5 segundos
            setTimeout(async () => {
                console.log('🔄 Intentando reconectar...');
                await initSerial();
            }, CONFIG.RECONNECT_INTERVAL);
        });

        // Escuchar datos del Arduino
        parser.on('data', handleArduinoData);

    } catch (error) {
        console.error('❌ Error al inicializar puerto serial:', error.message);
        console.log('\n💡 Asegúrate de:');
        console.log(`   1. Arduino conectado al puerto ${CONFIG.SERIAL_PORT}`);
        console.log('   2. Permisos de puerto serial configurados');
        console.log('   3. Otro programa no esté usando el puerto\n');
        
        // Listar puertos disponibles
        listAvailablePorts();
    }
}

// ============= PROCESAMIENTO DE DATOS =============

let lastDetectedUID = null;
let lastDetectionTime = 0;
let cardJustDetected = false;
let cardRejected = false; // Nuevo: detectar rechazo
let lastRejectedUID = null; // Nuevo: UID rechazado
let lastRejectionTime = 0; // Nuevo: timestamp específico de rechazo

function handleArduinoData(data) {
    const line = data.trim();
    
    // Detectar líneas de UID
    if (line.startsWith('UID:')) {
        const rawUid = line.substring(4).trim();
        const formattedUid = formatUID(rawUid);
        lastDetectedUID = formattedUid;
        lastDetectionTime = Date.now();
        // NO activar cardJustDetected aquí - esperar a PERMITIDO o DENEGADO
        console.log(`\n🔖 Tarjeta detectada: ${formattedUid}`);
        console.log('⏳ Esperando validación...');
        
        return;
    }

    // Detectar acceso permitido - REGISTRAR ASISTENCIA
    if (line.includes('PERMITIDO')) {
        console.log('✅ Acceso permitido detectado');
        if (lastDetectedUID) {
            console.log(`📋 UID almacenado: ${lastDetectedUID}`);
            
            // ACTIVAR flag de tarjeta detectada (autorizada)
            cardJustDetected = true;
            cardRejected = false; // Asegurar que no esté en rechazo
            lastDetectionTime = Date.now(); // Actualizar timestamp para PERMITIDO
            
            console.log('🚀 Llamando a registerAttendance...');
            registerAttendance(lastDetectedUID);
            
            // Limpiar flag después de 5 segundos
            setTimeout(() => {
                cardJustDetected = false;
            }, 5000);
        } else {
            console.log('⚠️  No hay UID almacenado (esto no debería pasar)');
        }
        return;
    }

    // Detectar acceso denegado
    if (line.includes('DENEGADO')) {
        console.log('❌ Acceso denegado - Tarjeta no autorizada');
        
        // ACTIVAR flag de rechazo con timestamp específico
        cardRejected = true;
        lastRejectedUID = lastDetectedUID;
        lastRejectionTime = Date.now(); // Timestamp específico para rechazo
        cardJustDetected = false; // NO es una tarjeta autorizada
        
        console.log(`🚫 Rechazo registrado - UID: ${lastRejectedUID}, Time: ${lastRejectionTime}`);
        
        // Limpiar flag de rechazo después de 5 segundos
        setTimeout(() => {
            cardRejected = false;
            lastRejectedUID = null;
            lastDetectedUID = null;
            lastRejectionTime = 0;
        }, 5000);
        
        return;
    }
}

// Formatear UID a formato XX:XX:XX:XX
function formatUID(rawUid) {
    if (CONFIG.AUTO_FORMAT_UID) {
        // Limpiar espacios y convertir a mayúsculas
        const cleaned = rawUid.replace(/\s+/g, '').toUpperCase();
        
        // Si ya tiene formato de dos dígitos separados por :
        if (cleaned.includes(':')) {
            return cleaned;
        }
        
        // Si es una secuencia continua, dividir en pares
        const pairs = cleaned.match(/.{1,2}/g) || [];
        return pairs.join(':');
    }
    return rawUid;
}

// ============= REGISTRO DE ASISTENCIA =============

async function registerAttendance(uid) {
    console.log(`\n🔄 registerAttendance llamado con UID: ${uid}`);
    
    // MODO TEST: Usar clase por defecto si no hay ninguna configurada
    const classIdToUse = CONFIG.ACTIVE_CLASS_ID || 'TEST_CLASS_ID';
    
    if (!CONFIG.ACTIVE_CLASS_ID) {
        console.log('⚠️  No hay clase activa - usando clase de prueba');
        console.log(`   Clase test: ${classIdToUse}`);
    }

    console.log(`✅ Clase: ${classIdToUse}`);
    console.log(`🌐 Backend URL: ${CONFIG.BACKEND_URL}/attendance/register-test`);
    console.log(`📤 Enviando petición...`);

    try {
        // Usar endpoint de prueba que no valida nada
        const response = await axios.post(
            `${CONFIG.BACKEND_URL}/attendance/register-test`,
            {
                uid,
                classId: classIdToUse,
                timestamp: Date.now()
            },
            {
                timeout: 5000
            }
        );

        if (response.data.success) {
            console.log(`\n🎉 ASISTENCIA SIMULADA REGISTRADA`);
            console.log(`   UID Tarjeta: ${uid}`);
            console.log(`   Estudiante: ${response.data.studentName || 'Estudiante de Prueba'}`);
            console.log(`   Clase: ${response.data.className || classIdToUse}`);
            console.log(`   Timestamp: ${new Date().toLocaleString()}\n`);
            
            // Sonido de éxito (opcional)
            playSuccessSound();
        } else {
            console.log(`❌ Error: ${response.data.message}`);
        }

    } catch (error) {
        if (error.response) {
            console.error(`❌ Error del servidor: ${error.response.data.message}`);
        } else if (error.request) {
            console.error('❌ No se pudo conectar al backend');
            console.log(`   Backend URL: ${CONFIG.BACKEND_URL}`);
            console.log('   Asegúrate de que el servidor esté corriendo');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// ============= COMANDOS INTERACTIVOS =============

function setupCommands() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'ClassGo> '
    });

    console.log('\n📝 Comandos disponibles:');
    console.log('   clase <ID>    - Establecer clase activa');
    console.log('   backend <URL> - Cambiar URL del backend');
    console.log('   puerto <COM>  - Cambiar puerto serial');
    console.log('   puertos       - Listar puertos disponibles');
    console.log('   estado        - Ver estado de conexión');
    console.log('   ayuda         - Mostrar ayuda');
    console.log('   salir         - Cerrar el programa\n');

    rl.prompt();

    rl.on('line', (line) => {
        const [cmd, ...args] = line.trim().split(/\s+/);

        switch (cmd.toLowerCase()) {
            case 'clase':
                if (args[0]) {
                    CONFIG.ACTIVE_CLASS_ID = args[0];
                    console.log(`✅ Clase activa: ${CONFIG.ACTIVE_CLASS_ID}`);
                } else {
                    console.log('❌ Uso: clase <ID_DE_CLASE>');
                }
                break;

            case 'backend':
                if (args[0]) {
                    CONFIG.BACKEND_URL = args[0];
                    console.log(`✅ Backend: ${CONFIG.BACKEND_URL}`);
                } else {
                    console.log('❌ Uso: backend <URL>');
                }
                break;

            case 'puerto':
                if (args[0]) {
                    CONFIG.SERIAL_PORT = args[0];
                    console.log(`🔄 Reconectando a ${CONFIG.SERIAL_PORT}...`);
                    if (port && port.isOpen) {
                        port.close(() => initSerial());
                    } else {
                        initSerial();
                    }
                } else {
                    console.log('❌ Uso: puerto <COM3|/dev/ttyUSB0>');
                }
                break;

            case 'puertos':
                listAvailablePorts();
                break;

            case 'estado':
                showStatus();
                break;

            case 'ayuda':
                console.log('\n📖 Sistema de Asistencias RFID - ClassGo');
                console.log('==========================================');
                console.log('Este programa conecta Arduino con el backend para registrar asistencias.\n');
                console.log('Comandos:');
                console.log('  clase <ID>    - Activar una clase para registrar asistencias');
                console.log('  backend <URL> - Cambiar la URL del backend');
                console.log('  puerto <COM>  - Cambiar el puerto serial del Arduino');
                console.log('  puertos       - Mostrar puertos seriales disponibles');
                console.log('  estado        - Ver configuración actual');
                console.log('  ayuda         - Mostrar esta ayuda');
                console.log('  salir         - Cerrar el programa\n');
                break;

            case 'salir':
            case 'exit':
                console.log('👋 Cerrando bridge...');
                if (port && port.isOpen) {
                    port.close();
                }
                process.exit(0);
                break;

            default:
                if (cmd) {
                    console.log(`❌ Comando desconocido: ${cmd}`);
                    console.log('   Escribe "ayuda" para ver comandos disponibles');
                }
        }

        rl.prompt();
    });
}

// ============= UTILIDADES =============

async function listAvailablePorts() {
    try {
        const { SerialPort } = require('serialport');
        const ports = await SerialPort.list();
        
        console.log('\n📡 Puertos seriales disponibles:');
        if (ports.length === 0) {
            console.log('   No se encontraron puertos');
        } else {
            ports.forEach(port => {
                console.log(`   ${port.path}${port.manufacturer ? ` (${port.manufacturer})` : ''}`);
            });
        }
        console.log('');
    } catch (error) {
        console.error('Error listando puertos:', error.message);
    }
}

function showStatus() {
    console.log('\n📊 Estado del sistema:');
    console.log(`   Serial: ${isConnected ? '✅ Conectado' : '❌ Desconectado'} (${CONFIG.SERIAL_PORT})`);
    console.log(`   Backend: ${CONFIG.BACKEND_URL}`);
    console.log(`   Clase activa: ${CONFIG.ACTIVE_CLASS_ID || 'Ninguna'}`);
    console.log('');
}

function playSuccessSound() {
    // Beep en la consola (opcional)
    process.stdout.write('\x07');
}

// ============= INICIO =============

console.log('🚀 Iniciando bridge...\n');

// Validar dependencias
try {
    require('serialport');
    require('axios');
} catch (error) {
    console.error('❌ Faltan dependencias. Ejecuta:');
    console.log('   npm install serialport @serialport/parser-readline axios');
    process.exit(1);
}

// ============= SERVIDOR HTTP PARA COMANDOS REMOTOS =============

function startHttpServer() {
    const server = http.createServer((req, res) => {
        // Habilitar CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Manejar preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Endpoint /status acepta GET
        if (req.url === '/status' && req.method === 'GET') {
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                success: true,
                serial: {
                    connected: isConnected,
                    port: detectedPort || CONFIG.SERIAL_PORT,
                    autoDetect: CONFIG.SERIAL_PORT === 'AUTO'
                },
                backend: CONFIG.BACKEND_URL,
                activeClass: CONFIG.ACTIVE_CLASS_ID,
                lastUid: lastDetectedUID,
                cardDetected: cardJustDetected,
                cardRejected: cardRejected,
                rejectedUid: lastRejectedUID,
                lastDetectionTime: lastDetectionTime,
                lastRejectionTime: lastRejectionTime
            }));
            return;
        }
        
        // El resto de endpoints requieren POST
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        // Leer body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // Endpoint: /set-class
                if (req.url === '/set-class') {
                    if (data.classId) {
                        CONFIG.ACTIVE_CLASS_ID = data.classId;
                        console.log('\n🔧 Clase configurada remotamente:', data.classId);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: 'Clase configurada',
                            classId: data.classId 
                        }));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'classId requerido' }));
                    }
                }
                // Endpoint: /set-port
                else if (req.url === '/set-port') {
                    if (data.port) {
                        CONFIG.SERIAL_PORT = data.port;
                        console.log('\n🔧 Puerto configurado remotamente:', data.port);
                        // Reiniciar conexión serial
                        if (port && port.isOpen) {
                            port.close(() => initSerial());
                        } else {
                            initSerial();
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: 'Puerto configurado',
                            port: data.port 
                        }));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'port requerido' }));
                    }
                }
                else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
                }
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    });
    
    server.listen(CONFIG.HTTP_PORT, () => {
        console.log(`\n🌐 Servidor HTTP corriendo en http://localhost:${CONFIG.HTTP_PORT}`);
        console.log('   Endpoints disponibles:');
        console.log('   - GET /status');
        console.log('   - POST /set-class {"classId": "..."}');
        console.log('   - POST /set-port {"port": "COM3"}');
    });
    
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`⚠️ Puerto ${CONFIG.HTTP_PORT} ya está en uso`);
        } else {
            console.error('❌ Error en servidor HTTP:', error.message);
        }
    });
}

// Inicializar
initSerial();
setupCommands();
startHttpServer(); // Iniciar servidor HTTP

// Manejo de errores global
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error.message);
});

process.on('SIGINT', () => {
    console.log('\n👋 Cerrando bridge...');
    if (port && port.isOpen) {
        port.close();
    }
    process.exit(0);
});
