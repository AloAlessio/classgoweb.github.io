# 🚀 Despliegue en Render con Arduino Local

## Arquitectura Híbrida

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Arduino   │ USB  │  Arduino Bridge  │ HTTP │  Backend Render │
│   (Local)   │─────►│     (Local)      │─────►│  (Nube Render)  │
└─────────────┘      └──────────────────┘      └─────────────────┘
                              ▲                          │
                              │                          │
                              └──────────────────────────┘
                              Frontend consulta backend
```

## 📋 Pasos para Configurar

### 1. **Backend en Render** (Ya desplegado)

Tu backend debe estar funcionando en Render:
- URL: `https://tu-app.onrender.com`
- Tiene acceso a Firebase
- Maneja endpoints de asistencia

### 2. **Arduino Bridge Local** (En tu computadora)

El Arduino Bridge DEBE correr localmente porque:
- ✅ Necesita acceso físico al puerto USB/Serial
- ✅ Arduino está conectado a tu computadora
- ✅ No se puede subir a Render (no tiene hardware)

#### Configuración local:

1. **Crear archivo `.env`:**
```bash
cd arduino-bridge
cp .env.example .env
```

2. **Editar `.env`:**
```env
SERIAL_PORT=COM16
BACKEND_URL=https://tu-app.onrender.com/api
HTTP_PORT=3001
```

3. **Instalar dependencias:**
```bash
npm install dotenv
```

4. **Actualizar `package.json`:**
```json
{
  "dependencies": {
    "serialport": "^12.0.0",
    "@serialport/parser-readline": "^12.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  }
}
```

5. **Iniciar Arduino Bridge:**
```bash
npm start
# o
node rfid-bridge.js
```

### 3. **Frontend - Ajuste CORS**

El frontend en Render necesita conectarse al Arduino Bridge LOCAL.

**Opción A: Usar ngrok (Recomendado para desarrollo)**

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer Arduino Bridge
ngrok http 3001
```

Esto te da una URL pública: `https://abc123.ngrok.io`

Actualiza el frontend para usar esa URL:
```javascript
const response = await fetch('https://abc123.ngrok.io/status');
```

**Opción B: Solo funciona en red local**

Si tu frontend también está en tu red local (localhost):
```javascript
const response = await fetch('http://localhost:3001/status');
```

### 4. **Backend - Actualizar CSP**

En `backend/server.js`, agrega el dominio de ngrok:

```javascript
helmet.contentSecurityPolicy({
    directives: {
        connectSrc: [
            "'self'",
            "http://localhost:3001",
            "https://*.ngrok.io",  // Agregar esto
            "https://fonts.googleapis.com",
            // ... resto
        ]
    }
})
```

## 🔄 Flujo de Trabajo Completo

### En Desarrollo Local:
```bash
# Terminal 1: Backend local
cd backend
npm start

# Terminal 2: Arduino Bridge
cd arduino-bridge
node rfid-bridge.js

# Terminal 3: Frontend local
# Abrir navegador en localhost
```

### En Producción (Render + Local):
```bash
# En tu computadora (donde está el Arduino):
cd arduino-bridge
# Editar .env con URL de Render
BACKEND_URL=https://tu-app.onrender.com/api
node rfid-bridge.js

# En otra terminal:
ngrok http 3001
# Copiar URL de ngrok

# Actualizar frontend en Render con la URL de ngrok
```

## ⚡ Solución Alternativa: Tunnel Permanente

### Usar LocalTunnel (Gratis y persistente):

```bash
npm install -g localtunnel

# Exponer Arduino Bridge
lt --port 3001 --subdomain tu-app-arduino
```

URL resultante: `https://tu-app-arduino.loca.lt`

## 🎯 Configuración Recomendada

1. **Backend**: Render ✅
2. **Frontend**: Render ✅  
3. **Arduino Bridge**: Tu computadora (con ngrok) ✅
4. **Arduino**: Conectado USB a tu computadora ✅

## 📝 Archivo .env Final

```env
# Arduino Bridge Local
SERIAL_PORT=COM16
BACKEND_URL=https://classgo-web.onrender.com/api
HTTP_PORT=3001

# Si usas ngrok, actualiza en frontend:
# const ARDUINO_BRIDGE_URL = 'https://tu-subdominio.ngrok.io'
```

## ⚠️ Importante

- El Arduino Bridge SIEMPRE debe correr en tu máquina local
- No puedes subirlo a Render (no tiene acceso a puertos seriales)
- Usa ngrok o localtunnel para exponer el bridge al frontend
- El backend en Render funciona normalmente
- Asegúrate que el firewall permita conexiones al puerto 3001

## 🚨 Troubleshooting

**Problema**: Frontend no puede conectar al Arduino Bridge
- **Solución**: Verifica que ngrok esté corriendo y usa HTTPS

**Problema**: CORS bloqueado
- **Solución**: Agrega headers CORS en Arduino Bridge y actualiza CSP en backend

**Problema**: Arduino no detecta tarjetas
- **Solución**: Verifica que el Arduino Bridge esté corriendo y conectado al puerto correcto

## 📱 Para Acceso Remoto

Si quieres que funcione desde cualquier lugar:

1. Deja tu computadora encendida con Arduino Bridge corriendo
2. Usa ngrok con cuenta pro (subdominios fijos)
3. O usa una Raspberry Pi en el salón con el Arduino conectado
