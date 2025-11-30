# 📄 ClassGo - Descripción del Proyecto y Proceso de Despliegue en RENDER

## Información del Documento
- **Proyecto:** ClassGo - Plataforma Educativa Integral
- **Autor:** Equipo de Desarrollo
- **Fecha:** Noviembre 2025
- **Versión:** 1.0
- **Plataforma:** Render.com (Despliegue en la Nube)

---

# 1. INTRODUCCIÓN

## 1.1 Descripción del Proyecto

**ClassGo** es una plataforma web educativa moderna e integral diseñada para conectar estudiantes, tutores y administradores en un ambiente de aprendizaje interactivo y organizado. La plataforma optimiza la gestión educativa a través de un ecosistema integrado que maneja la gestión de clases, comunicación en tiempo real, seguimiento de asistencias y monitoreo del progreso académico.

### Qué Hace Único a ClassGo

ClassGo no es solo otra herramienta educativa—es un **ecosistema completo de gestión del aprendizaje** que aborda el problema de fragmentación en instituciones educativas donde estudiantes y tutores típicamente manejan múltiples herramientas desconectadas (WhatsApp, correo electrónico, hojas de Excel, listas de asistencia en papel, etc.).

## 1.2 Objetivo Principal

Proporcionar a las instituciones educativas una **plataforma unificada, moderna y accesible** que:

- **Conecta** a todos los involucrados (estudiantes, tutores, administradores) en un solo lugar
- **Organiza** clases, horarios, inscripciones y comunicaciones eficientemente
- **Rastrea** asistencias automáticamente (con integración opcional de RFID) y monitorea el progreso
- **Funciona en cualquier lugar** como una Aplicación Web Progresiva (PWA) con capacidades offline

## 1.3 Funcionalidades Clave

### 🎓 Sistema Multi-Usuario
| Rol | Capacidades |
|-----|-------------|
| **Administrador** | Control total del sistema, gestión de usuarios, estadísticas |
| **Tutor** | Crear/gestionar clases, seguimiento de estudiantes, tomar asistencia |
| **Estudiante** | Inscribirse en clases, ver progreso, comunicarse con tutores |

### 📚 Gestión de Clases
- Crear y configurar clases con horarios
- Sistema de inscripción de estudiantes
- Gestión de capacidad
- Visualización de calendario de clases

### 💬 Sistema de Mensajería Integrado
- Chat en tiempo real entre tutores y estudiantes
- Historial de conversaciones
- Sistema de notificaciones
- Comunicación académica separada de canales personales

### 📊 Dashboards Personalizados
- Vistas y métricas específicas por rol
- Seguimiento de progreso y estadísticas
- Reportes visuales y analíticas

### 📡 Sistema de Asistencias Inteligente
- Toma de asistencia manual por tutores
- Asistencia automática opcional por RFID
- Historial y estadísticas de asistencia
- Validación de horarios

### 📱 Aplicación Web Progresiva (PWA)
- Instalable en cualquier dispositivo
- Funcionalidad offline
- Carga rápida con caché
- Sin necesidad de tienda de aplicaciones

---

# 2. PROCESO DE DESPLIEGUE EN LA NUBE EN RENDER

## 2.1 Visión General

Esta sección detalla el procedimiento completo paso a paso para desplegar ClassGo en **Render.com**, una plataforma cloud moderna que ofrece:
- ✅ Nivel gratuito para servicios web
- ✅ SSL/HTTPS automático
- ✅ Integración con GitHub para despliegues automáticos
- ✅ Gestión fácil de variables de entorno

## 2.2 Prerrequisitos

Antes de comenzar el despliegue, asegúrate de tener:

| Requisito | Estado | Detalles |
|-----------|--------|----------|
| Cuenta de GitHub | Requerido | Alojamiento del repositorio |
| Repositorio en GitHub | Requerido | Código del proyecto subido |
| Proyecto de Firebase | Requerido | Autenticación y Base de Datos |
| Credenciales de Firebase | Requerido | Clave de cuenta de servicio |
| Cuenta de Render | Requerido | Cuenta gratuita es suficiente |

---

## 2.3 Paso 1: Preparación del Entorno

### 2.3.1 Instalación de Dependencias Localmente

Primero, verifica que todas las dependencias estén correctamente instaladas en tu entorno local:

```powershell
# Navegar a la raíz del proyecto
cd c:\Users\Alonso\Downloads\AloAlessio.github.io-main

# Instalar dependencias del backend
cd backend
npm install

# Verificar instalación
npm list --depth=0
```

**Salida esperada:**
```
classgo-backend@1.0.0
├── compression@1.7.4
├── cors@2.8.5
├── dotenv@16.3.1
├── express@4.18.2
├── express-rate-limit@7.1.5
├── firebase-admin@13.5.0
├── helmet@7.1.0
├── joi@17.11.0
└── morgan@1.10.0
```

### 2.3.2 Configuración de Variables de Entorno

Crea o verifica el archivo `.env` en la carpeta `backend/`:

```
📁 AloAlessio.github.io-main/
├── 📁 backend/
│   ├── .env           ← Variables de entorno (NO subir a Git)
│   ├── .env.example   ← Plantilla de referencia
│   ├── package.json
│   └── server.js
```

**Variables de Entorno Requeridas:**

| Variable | Descripción | Valor de Ejemplo |
|----------|-------------|------------------|
| `NODE_ENV` | Modo del entorno | `production` |
| `PORT` | Puerto del servidor | `10000` (predeterminado de Render) |
| `FRONTEND_URL` | URL de la app en Render | `https://classgo-app.onrender.com` |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | `classgo-324dd` |
| `FIREBASE_CLIENT_EMAIL` | Email de cuenta de servicio | `firebase-adminsdk-xxx@project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Clave privada (con comillas y `\n`) | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `FIREBASE_DATABASE_URL` | URL de Realtime Database | `https://project-id.firebaseio.com/` |
| `JWT_SECRET` | Clave secreta para tokens | String aleatorio seguro |
| `RATE_LIMIT_WINDOW_MS` | Ventana de límite de tasa | `900000` (15 minutos) |
| `RATE_LIMIT_MAX_REQUESTS` | Máx. peticiones por ventana | `100` |
| `LOG_LEVEL` | Nivel de logging | `info` |

### 2.3.3 Protección de Credenciales

**CRÍTICO:** Asegúrate de que `.env` esté en `.gitignore` para prevenir exposición de credenciales:

```powershell
# Verificar que .gitignore incluye .env
Get-Content .gitignore | Select-String ".env"

# Si .env fue accidentalmente agregado a Git:
git rm --cached backend/.env
git add .gitignore
git commit -m "Proteger credenciales - agregar .env a gitignore"
```

---

## 2.4 Paso 2: Configuración del Repositorio y Conexión con la Nube

### 2.4.1 Verificar Configuración de render.yaml

El proyecto incluye un archivo `render.yaml` que automatiza la configuración del despliegue:

```yaml
services:
  - type: web
    name: classgo-app
    env: node
    region: oregon          # Región del nivel gratuito
    plan: free              # Plan gratuito
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### 2.4.2 Subir Código a GitHub

```powershell
# Navegar a la raíz del proyecto
cd c:\Users\Alonso\Downloads\AloAlessio.github.io-main

# Verificar estado actual
git status

# Agregar todos los archivos (excepto los que están en .gitignore)
git add .

# Hacer commit de los cambios
git commit -m "Preparar proyecto para despliegue en Render"

# Subir a GitHub
git push origin main
```

**Salida esperada:**
```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
Writing objects: 100% (150/150), 487.81 KiB | 5.42 MiB/s, done.
To https://github.com/AloAlessio/classgoweb.github.io.git
   abc1234..def5678  main -> main
```

### 2.4.3 Crear Cuenta en Render

1. Navega a **https://render.com**
2. Haz clic en **"Get Started"** o **"Sign Up"**
3. Selecciona **"Sign up with GitHub"**
4. Autoriza a Render para acceder a tus repositorios de GitHub

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDER.COM                                │
│                                                              │
│     ┌──────────────────────────────────────────────────┐    │
│     │                                                   │    │
│     │     🔗 Sign up with GitHub                       │    │
│     │                                                   │    │
│     │     Conecta tu cuenta de GitHub para habilitar   │    │
│     │     despliegues automáticos desde tus repos      │    │
│     │                                                   │    │
│     │     [  Sign up with GitHub  ]                    │    │
│     │                                                   │    │
│     └──────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2.5 Paso 3: Creación del Web Service

### 2.5.1 Nuevo Web Service

1. En el dashboard de Render, haz clic en **"New +"** (arriba a la derecha)
2. Selecciona **"Web Service"**
3. Busca tu repositorio: `classgoweb.github.io`
4. Haz clic en **"Connect"**

```
┌─────────────────────────────────────────────────────────────┐
│  RENDER DASHBOARD                            [New +] ▼      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Selecciona un repositorio para desplegar:                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔍 Buscar repositorios...                              │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ AloAlessio/classgoweb.github.io            [Connect]   │ │
│  │ ├── Último push: hace 2 minutos                        │ │
│  │ └── Branch: main                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.5.2 Configuración del Servicio

Configura los siguientes ajustes:

| Configuración | Valor |
|---------------|-------|
| **Name** | `classgo-app` |
| **Region** | `Oregon (US West)` - Nivel gratuito |
| **Branch** | `main` |
| **Root Directory** | *(dejar vacío)* |
| **Runtime** | `Node` |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |
| **Plan** | `Free` ✅ |

```
┌─────────────────────────────────────────────────────────────┐
│  CREAR WEB SERVICE                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Nombre:          [ classgo-app                    ]        │
│                                                              │
│  Región:          [ Oregon (US West)          ▼ ]           │
│                   └── Nivel gratuito disponible             │
│                                                              │
│  Branch:          [ main                      ▼ ]           │
│                                                              │
│  Root Directory:  [                               ]         │
│                                                              │
│  Runtime:         [ Node                      ▼ ]           │
│                                                              │
│  Build Command:   [ cd backend && npm install     ]         │
│                                                              │
│  Start Command:   [ cd backend && npm start       ]         │
│                                                              │
│  Tipo Instancia:  ○ Free  ○ Starter  ○ Standard            │
│                   └── $0/mes, 750 horas gratis              │
│                                                              │
│                    [ Create Web Service ]                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2.6 Paso 4: Configuración de Variables de Entorno

### 2.6.1 Agregar Variables en Render

Navega a **Environment** en el panel izquierdo y agrega cada variable:

```
┌─────────────────────────────────────────────────────────────┐
│  VARIABLES DE ENTORNO                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────┬──────────────────────────────┐ │
│  │ Clave                   │ Valor                        │ │
│  ├─────────────────────────┼──────────────────────────────┤ │
│  │ NODE_ENV                │ production                   │ │
│  ├─────────────────────────┼──────────────────────────────┤ │
│  │ PORT                    │ 10000                        │ │
│  ├─────────────────────────┼──────────────────────────────┤ │
│  │ FRONTEND_URL            │ https://classgo-app.onren... │ │
│  ├─────────────────────────┼──────────────────────────────┤ │
│  │ FIREBASE_PROJECT_ID     │ classgo-324dd                │ │
│  ├─────────────────────────┼──────────────────────────────┤ │
│  │ FIREBASE_CLIENT_EMAIL   │ firebase-adminsdk-fbsvc@...  │ │
│  ├─────────────────────────┼──────────────────────────────┤ │
│  │ FIREBASE_PRIVATE_KEY    │ "-----BEGIN PRIVATE KEY..."  │ │
│  ├─────────────────────────┼──────────────────────────────┤ │
│  │ FIREBASE_DATABASE_URL   │ https://classgo-324dd-def... │ │
│  ├─────────────────────────┼──────────────────────────────┤ │
│  │ JWT_SECRET              │ ****************************  │ │
│  └─────────────────────────┴──────────────────────────────┘ │
│                                                              │
│  [+ Agregar Variable de Entorno]      [ Guardar Cambios ]   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.6.2 Nota Importante: FIREBASE_PRIVATE_KEY

La clave privada debe copiarse **exactamente** como aparece en tu archivo `.env`:
- Incluir las comillas `"`
- Mantener todos los caracteres `\n` (no reemplazarlos)
- Copiar desde `"-----BEGIN PRIVATE KEY-----` hasta `-----END PRIVATE KEY-----\n"`

---

## 2.7 Paso 5: Ejecución del Despliegue

### 2.7.1 Iniciar el Despliegue

1. Haz clic en **"Create Web Service"**
2. Render comienza el proceso de build automáticamente
3. Monitorea el progreso en tiempo real a través de los logs

```
┌─────────────────────────────────────────────────────────────┐
│  LOGS DE DESPLIEGUE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ==> Clonando desde https://github.com/AloAlessio/...       │
│  ==> Verificando commit abc1234                             │
│  ==> Usando versión de Node 18.17.0                         │
│  ==> Ejecutando comando de build: cd backend && npm install │
│                                                              │
│  npm WARN deprecated some-package@1.0.0                     │
│  added 127 packages in 15s                                  │
│                                                              │
│  ==> ¡Build exitoso! Iniciando servicio...                  │
│  ==> Ejecutando: cd backend && npm start                    │
│                                                              │
│  > classgo-backend@1.0.0 start                              │
│  > node server.js                                           │
│                                                              │
│  🚀 ClassGo Backend Server                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━                                │
│  ✅ Firebase Admin inicializado                             │
│  ✅ Servidor corriendo en puerto 10000                      │
│  ✅ Entorno: production                                     │
│                                                              │
│  ==> ¡Tu servicio está en línea! 🎉                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.7.2 Línea de Tiempo del Despliegue

| Fase | Duración | Descripción |
|------|----------|-------------|
| Clone | ~10 seg | Obtiene código de GitHub |
| Build | 1-3 min | Instala dependencias |
| Deploy | ~30 seg | Inicia el servidor |
| **Total** | **2-5 min** | Despliegue completo |

---

## 2.8 Paso 6: Verificación y Pruebas

### 2.8.1 Obtener Tu URL

Después del despliegue exitoso, Render asigna una URL:
```
https://classgo-app.onrender.com
```

### 2.8.2 Actualizar FRONTEND_URL

1. Ve a **Environment** en el dashboard de Render
2. Busca la variable `FRONTEND_URL`
3. Establécela con tu URL asignada: `https://classgo-app.onrender.com`
4. Haz clic en **"Save Changes"**
5. Render redesplegará automáticamente (1-2 minutos)

### 2.8.3 Pruebas Básicas de Funcionalidad

Realiza estas pruebas para verificar el despliegue exitoso:

| Prueba | Pasos | Resultado Esperado |
|--------|-------|-------------------|
| **Carga de Home** | Navegar a tu URL | Página de inicio muestra estadísticas |
| **Salud de API** | Acceder a `/api/health` | Retorna `{"status": "ok"}` |
| **Login** | Intentar iniciar sesión | Redirige al dashboard apropiado |
| **Crear Clase** | Como tutor, crear una clase nueva | La clase aparece en la lista |
| **Inscripción** | Como estudiante, inscribirse en una clase | Estudiante agregado al roster |

### 2.8.4 Comandos de Prueba

```powershell
# Probar endpoint de salud de API
curl https://classgo-app.onrender.com/api/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2025-11-26T10:30:00.000Z"}

# Probar endpoint de autenticación
curl https://classgo-app.onrender.com/api/auth/test

# Respuesta esperada:
# {"message":"Auth endpoint working","timestamp":"..."}
```

---

## 2.9 Resumen de Comandos y Herramientas

### 2.9.1 Comandos de Desarrollo Local

```powershell
# Instalar dependencias
cd backend && npm install

# Iniciar servidor de desarrollo
npm run dev

# Iniciar servidor de producción localmente
npm start

# Ejecutar pruebas
npm test
```

### 2.9.2 Comandos Git para Despliegue

```powershell
# Agregar cambios
git add .

# Commit con mensaje
git commit -m "Actualización para despliegue en producción"

# Push para activar auto-deploy
git push origin main
```

### 2.9.3 Render CLI (Opcional)

```bash
# Instalar Render CLI (si es necesario)
npm install -g render-cli

# Verificar estado del despliegue
render deploys list

# Ver logs
render logs --tail
```

---

## 2.10 Solución de Problemas Comunes

### Problema: Build Fallido

**Síntomas:** El despliegue se detiene con error durante la fase de build

**Soluciones:**
1. Verificar que `package.json` tenga todas las dependencias requeridas
2. Verificar compatibilidad de versión de Node.js
3. Revisar logs de build para errores específicos

```powershell
# Verificar que el build local funciona
cd backend
npm install
npm start
```

### Problema: Error de Conexión con Firebase

**Síntomas:** Los logs muestran "Firebase Admin SDK initialization failed"

**Soluciones:**
1. Verificar que `FIREBASE_PRIVATE_KEY` esté correctamente formateada
2. Asegurar que las comillas y caracteres `\n` estén preservados
3. Verificar que `FIREBASE_PROJECT_ID` coincida con tu proyecto

### Problema: Errores de CORS

**Síntomas:** La consola del navegador muestra errores de política CORS

**Soluciones:**
1. Verificar que `FRONTEND_URL` esté configurada correctamente
2. Asegurar que la URL no tenga barra diagonal al final
3. Verificar que la URL coincida exactamente con la asignada por Render

### Problema: Servicio No Disponible (503)

**Síntomas:** La app tarda 30-60 segundos en responder

**Explicación:** Las apps del nivel gratuito "duermen" después de 15 minutos de inactividad

**Soluciones:**
1. Esperar 30-60 segundos para que la app despierte
2. Usar un servicio de monitoreo como UptimeRobot para mantenerla activa

---

# 3. CONCLUSIONES

## 3.1 Retos Encontrados

### Retos Técnicos

1. **Gestión de Variables de Entorno**
   - *Reto:* Asegurar que las credenciales sensibles (clave privada de Firebase) estén correctamente formateadas en el entorno de Render
   - *Solución:* Atención cuidadosa a preservar los caracteres `\n` y las comillas
   - *Aprendizaje:* Las plataformas cloud manejan las variables de entorno de manera diferente a los archivos `.env` locales

2. **Configuración de CORS**
   - *Reto:* Errores iniciales de CORS cuando el frontend intentaba comunicarse con el backend
   - *Solución:* Configuración apropiada de `FRONTEND_URL` y actualización de endpoints de API
   - *Aprendizaje:* Los despliegues en producción requieren configuración explícita de CORS

3. **Demoras de Cold Start**
   - *Reto:* Las apps del nivel gratuito duermen después de inactividad, causando respuestas iniciales lentas
   - *Solución:* Entender que este es el comportamiento esperado; usar servicios de monitoreo si es necesario
   - *Aprendizaje:* Trade-offs entre costo y rendimiento en despliegues cloud

### Retos de Proceso

1. **Seguridad de Credenciales**
   - Asegurar que `.gitignore` excluya apropiadamente los archivos sensibles
   - Nunca hacer commit de credenciales reales al control de versiones

2. **Actualizaciones de URL**
   - Recordar actualizar URLs de localhost hardcodeadas a URLs de producción
   - Gestionar configuraciones específicas por entorno

## 3.2 Aprendizajes Clave

### Mejores Prácticas de Despliegue Cloud

| Práctica | Por Qué Importa |
|----------|-----------------|
| **Variables de Entorno** | Separa configuración del código; permite diferentes ajustes por entorno |
| **Integración CI/CD** | Los despliegues automáticos ahorran tiempo y reducen errores humanos |
| **Endpoints de Salud** | Verificación fácil de que los servicios están funcionando correctamente |
| **Logging** | Esencial para debuguear problemas en producción |

### Habilidades Técnicas Adquiridas

- **Infraestructura como Código:** Usando `render.yaml` para despliegues reproducibles
- **Gestión de Entornos:** Manejar diferentes configuraciones para dev/producción
- **Uso de Plataformas Cloud:** Navegar el dashboard y opciones de configuración de Render
- **Debugging de Problemas en Producción:** Leer logs, rastrear errores y aplicar correcciones

### Crecimiento Profesional

- **Documentación:** Importancia de documentar procesos de despliegue para referencia futura
- **Resolución de Problemas:** Enfoque sistemático para solucionar problemas de despliegue
- **Mejores Prácticas:** Entender estándares de la industria para despliegues seguros y confiables

## 3.3 Reflexión Final

Desplegar ClassGo en Render demostró que las plataformas cloud modernas han simplificado significativamente el proceso de despliegue. Lo que antes requería extenso conocimiento de DevOps ahora puede lograrse con:

- Un proyecto bien estructurado
- Configuración apropiada del entorno
- Entendimiento de los requisitos de la plataforma

La experiencia reforzó que **la preparación es clave**:
- Organización limpia del código
- Gestión apropiada de dependencias
- Clara separación de configuración y código

ClassGo ahora es accesible para usuarios en todo el mundo a través de su despliegue en Render, demostrando que la tecnología educativa puede ser tanto poderosa como accesible a través de la computación en la nube.

---

## 3.4 URL de Producción

**🌐 Aplicación en Vivo:** `https://classgo-app.onrender.com`

**Funcionalidades Disponibles:**
- ✅ Autenticación de usuarios (Admin, Tutor, Estudiante)
- ✅ Gestión de clases e inscripciones
- ✅ Mensajería en tiempo real
- ✅ Seguimiento de asistencias
- ✅ Estadísticas de progreso
- ✅ Instalación como PWA
- ✅ Funcionalidad offline

---

*Documento creado: Noviembre 2025*
*Última actualización: Noviembre 2025*
*Plataforma: Render.com*
