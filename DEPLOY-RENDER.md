# 🚀 Guía de Despliegue - Render.com

Esta guía te ayudará a desplegar tu aplicación ClassGo en Render de forma **GRATIS** con un dominio gratuito.

---

## 📋 Prerrequisitos

1. ✅ Cuenta de GitHub (ya la tienes: AloAlessio)
2. ✅ Repositorio en GitHub (ya lo tienes: classgoweb.github.io)
3. ✅ Credenciales de Firebase (las tienes en tu archivo `.env`)

---

## 🔐 Paso 1: Verificar que tus credenciales NO se suban a GitHub

**IMPORTANTE:** Antes de hacer push a GitHub, asegúrate de que el archivo `.env` NO se suba.

```powershell
# Verifica que .gitignore esté funcionando
git status
```

Si ves `backend/.env` en la lista de archivos a subir, **¡DETENTE!** y ejecuta:

```powershell
git rm --cached backend/.env
git add .gitignore
git commit -m "Add .gitignore to protect credentials"
```

---

## 📤 Paso 2: Subir tu código a GitHub

```powershell
# Desde la carpeta raíz de tu proyecto
cd c:\Users\Alonso\Downloads\AloAlessio.github.io-main

# Agregar todos los archivos (excepto los que están en .gitignore)
git add .

# Hacer commit
git commit -m "Preparar proyecto para despliegue en Render"

# Subir a GitHub
git push origin main
```

---

## 🌐 Paso 3: Crear cuenta en Render

1. Ve a **https://render.com**
2. Haz clic en **"Get Started"** o **"Sign Up"**
3. Selecciona **"Sign up with GitHub"**
4. Autoriza a Render para acceder a tu cuenta de GitHub

---

## 🚀 Paso 4: Crear un nuevo Web Service

1. En el dashboard de Render, haz clic en **"New +"** (arriba a la derecha)
2. Selecciona **"Web Service"**
3. Busca y selecciona tu repositorio: **`classgoweb.github.io`**
4. Haz clic en **"Connect"**

---

## ⚙️ Paso 5: Configurar el Web Service

Render debería detectar automáticamente el archivo `render.yaml`. Si no:

### Configuración Manual:

- **Name:** `classgo-app` (o el nombre que prefieras)
- **Region:** `Oregon (US West)` (región gratuita)
- **Branch:** `main`
- **Root Directory:** *(dejar vacío)*
- **Runtime:** `Node`
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`
- **Plan:** `Free` ✅

---

## 🔑 Paso 6: Agregar Variables de Entorno

Este es el paso **MÁS IMPORTANTE**. En la sección **"Environment Variables"**, agrega las siguientes:

| Nombre | Valor | Nota |
|--------|-------|------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Puerto de Render |
| `FRONTEND_URL` | *(déjalo en blanco por ahora)* | Lo agregarás después |
| `FIREBASE_PROJECT_ID` | `classgo-324dd` | Tu project ID |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@classgo-324dd.iam.gserviceaccount.com` | |
| `FIREBASE_PRIVATE_KEY` | *(copia completa de tu .env)* | Incluye las comillas y `\n` |
| `FIREBASE_DATABASE_URL` | `https://classgo-324dd-default-rtdb.firebaseio.com/` | |
| `JWT_SECRET` | *(genera una nueva clave)* | Usa: https://randomkeygen.com/ |
| `RATE_LIMIT_WINDOW_MS` | `900000` | |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | |
| `LOG_LEVEL` | `info` | |
| `MEETING_PROVIDER` | `google-meet` | |
| `MEETING_BASE_URL` | `https://meet.google.com` | |

### ⚠️ Nota sobre FIREBASE_PRIVATE_KEY:

Copia el valor COMPLETO de tu archivo `.env`, incluyendo:
- Las comillas `"`
- Los caracteres `\n` (no los reemplaces)
- Todo desde `"-----BEGIN PRIVATE KEY-----` hasta `-----END PRIVATE KEY-----\n"`

---

## 🎯 Paso 7: Desplegar

1. Haz clic en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu aplicación
3. Espera 2-5 minutos (verás los logs en tiempo real)
4. Cuando veas **"Your service is live 🎉"**, ¡está listo!

---

## 🌍 Paso 8: Obtener tu URL y actualizar FRONTEND_URL

1. Render te asignará una URL como: `https://classgo-app.onrender.com`
2. Copia esta URL
3. Ve a **"Environment"** en el panel izquierdo
4. Busca la variable `FRONTEND_URL`
5. Pégala: `https://classgo-app.onrender.com`
6. Haz clic en **"Save Changes"**
7. Render redesplegará automáticamente (1-2 minutos)

---

## 🔧 Paso 9: Actualizar URLs en tu código

Necesitas actualizar las URLs del backend en tu frontend:

### En `frontend/js/api-service.js`:

Busca:
```javascript
const API_BASE_URL = 'http://localhost:3000';
```

Cambia a:
```javascript
const API_BASE_URL = 'https://classgo-app.onrender.com'; // Tu URL de Render
```

### En `frontend/js/firebase-config.js` (si existe):

Actualiza cualquier referencia a localhost.

---

## 📦 Paso 10: Subir cambios y redesplegar

```powershell
# Agregar los cambios de las URLs
git add .
git commit -m "Actualizar URLs para producción en Render"
git push origin main
```

Render detectará automáticamente el push y redesplegará tu aplicación (2-3 minutos).

---

## ✅ Verificar que todo funciona

1. Abre tu URL: `https://classgo-app.onrender.com`
2. Prueba el login
3. Crea una clase
4. Verifica que todo funcione

---

## 🎉 ¡Listo! Tu app está en línea

**Tu URL gratuita:** `https://classgo-app.onrender.com` (o la que Render te asignó)

### Características del plan gratuito:

- ✅ 750 horas gratis/mes (suficiente para 1 app)
- ✅ SSL/HTTPS automático
- ✅ Despliegues automáticos desde GitHub
- ✅ URL personalizada gratuita
- ⚠️ Se apaga después de 15 minutos de inactividad (tarda 30-60 segundos en despertar)

---

## 🚨 Solución de Problemas

### Error: "Build failed"
- Verifica que `backend/package.json` tenga todas las dependencias
- Revisa los logs en Render

### Error: "Service Unavailable"
- La app puede estar "dormida" (plan gratuito)
- Espera 30-60 segundos y recarga

### Error: "Firebase Admin SDK initialization failed"
- Verifica que `FIREBASE_PRIVATE_KEY` esté correctamente copiada
- Asegúrate de incluir los `\n` y comillas

### Error: "CORS"
- Verifica que `FRONTEND_URL` esté configurada correctamente
- Debe ser la URL exacta que Render te dio

---

## 📞 Soporte

Si tienes problemas, revisa:
- Los logs en Render (botón "Logs" en el dashboard)
- La consola del navegador (F12)
- Los archivos de documentación en `docs/`

---

## 🔄 Próximos pasos (Opcional)

### Dominio personalizado (Gratis con algunas limitaciones):
- Render permite conectar dominios personalizados
- Puedes usar dominios gratuitos de Freenom, etc.

### Mantener la app "despierta":
- Usa servicios como UptimeRobot (https://uptimerobot.com) para hacer ping cada 5 minutos

---

**¡Felicidades! Tu aplicación ClassGo ya está en producción! 🎓🚀**
