# 📚 ClassGo - Guía Completa de la Plataforma

## 🎯 ¿Qué es ClassGo?

ClassGo es una plataforma educativa web moderna diseñada para conectar estudiantes con tutores en un ambiente de aprendizaje interactivo. La plataforma permite gestionar clases, asistencias, mensajería y seguimiento del progreso académico de manera simple y eficiente.

---

## 🌟 Características Principales

### 1. **Sistema Multi-Usuario**
La plataforma soporta tres tipos de usuarios diferentes:

- **👑 Administrador**: Control total del sistema
- **🎓 Tutor**: Crea y gestiona clases
- **📚 Estudiante**: Participa en clases y realiza seguimiento de su progreso

### 2. **Gestión de Clases**
- Creación de clases por tutores
- Inscripción automática de estudiantes
- Visualización de clases disponibles
- Calendario de actividades

### 3. **Sistema de Asistencias con RFID**
- Registro automático de asistencia usando tarjetas RFID
- Seguimiento en tiempo real
- Historial completo de asistencias
- Validación automática de horarios

### 4. **Sistema de Mensajería**
- Chat en tiempo real entre usuarios
- Conversaciones privadas
- Notificaciones instantáneas
- Historial de mensajes

### 5. **Seguimiento y Estadísticas**
- Dashboard personalizado por rol
- Métricas de asistencia
- Progreso académico
- Reportes visuales

---

## 🏗️ Estructura de la Plataforma

### **Páginas Principales**

#### 📱 **Home (Página de Inicio)**
**Ubicación**: `/home` o `/frontend/html/home.html`

**¿Qué hace?**
- Punto de entrada principal para todos los usuarios
- Muestra información general de la plataforma
- Presenta estadísticas globales (clases disponibles, estudiantes activos, tutores)
- Muestra categorías de aprendizaje (Ciencias, Idiomas, Arte)
- Sección "Lo Más Popular" con temas tendencia

**Elementos importantes**:
- **Logo y navegación**: En la parte superior
- **Avatar de usuario**: Esquina superior derecha, abre menú contextual
- **Tarjetas de estadísticas**: Muestran números generales de la plataforma
- **Categorías**: Grid con diferentes áreas de estudio
- **Menú de usuario**: 
  - Si no has iniciado sesión: opción para login
  - Si has iniciado sesión: acceso a perfil, paneles y cerrar sesión

#### 🔐 **Login (Inicio de Sesión)**
**Ubicación**: `/frontend/html/login.html`

**¿Qué hace?**
- Permite a los usuarios acceder a su cuenta
- Valida credenciales (email y contraseña)
- Redirige al dashboard correspondiente según el rol
- Opción para registro de nuevos usuarios

**Proceso de inicio de sesión**:
1. Usuario ingresa email y contraseña
2. Sistema valida con Firebase Authentication
3. Recupera información del usuario desde Firestore
4. Guarda sesión en el navegador (localStorage)
5. Redirige al dashboard apropiado

#### 👨‍🎓 **Dashboard de Estudiante**
**Ubicación**: `/frontend/html/student-dashboard-new.html`

**¿Qué hace?**
- Centro de control para estudiantes
- Muestra clases en las que está inscrito
- Permite ver horarios y asistencias
- Acceso a mensajería
- Visualización de progreso personal

**Secciones principales**:
- **Mis Clases**: Lista de clases activas
- **Próximas Sesiones**: Calendario de clases
- **Mis Asistencias**: Historial de asistencia
- **Mensajes**: Comunicación con tutores
- **Mi Progreso**: Estadísticas personales

#### 👨‍🏫 **Dashboard de Tutor**
**Ubicación**: `/frontend/html/tutor-dashboard-new.html`

**¿Qué hace?**
- Centro de control para tutores
- Permite crear y gestionar clases
- Ver lista de estudiantes inscritos
- Gestionar asistencias manualmente
- Comunicarse con estudiantes

**Funcionalidades especiales**:
- **Crear Clase**: Formulario para nueva clase
  - Nombre de la materia
  - Descripción
  - Horario (inicio y fin)
  - Capacidad máxima
- **Gestionar Estudiantes**: Ver quién está inscrito
- **Tomar Asistencia**: Manual o con RFID
- **Ver Estadísticas**: Rendimiento de la clase

#### 👑 **Panel de Administrador**
**Ubicación**: Modal en `/home` (solo para admins)

**¿Qué hace?**
- Control total del sistema
- Gestión de usuarios (crear, editar, eliminar)
- Cambiar roles de usuarios
- Activar/desactivar cuentas
- Ver estadísticas del sistema completo

**Opciones del panel**:
1. **Gestión de Usuarios**:
   - Lista completa de usuarios registrados
   - Filtrado por rol (Admin, Tutor, Estudiante)
   - Botones de acción:
     - **Cambiar Rol**: Asignar nuevo rol al usuario
     - **Desactivar/Activar**: Suspender o reactivar cuenta
     - **Eliminar**: Borrar usuario del sistema
   
2. **Estadísticas del Sistema**:
   - Total de usuarios por rol
   - Clases activas
   - Asistencias registradas
   - Métricas de uso

---

## 🎨 Diseño y Experiencia de Usuario

### **Tema Visual**
- **Colores principales**: Turquesa (#0d7377), Verde agua (#2dd4bf)
- **Estilo**: Modern, limpio con efecto "liquid glass" (vidrio líquido)
- **Efectos**: Gradientes suaves, sombras, transparencias

### **Responsive Design**
La plataforma se adapta automáticamente a diferentes tamaños de pantalla:

- **📱 Móviles**: 375px - 640px
- **📱 Tablets**: 640px - 1024px
- **💻 Desktop**: 1024px en adelante

**Optimizaciones móviles**:
- Menús adaptados al tamaño de pantalla
- Botones y textos más grandes en móvil
- Navegación simplificada
- Touch gestures optimizados

### **Animaciones**
- Transiciones suaves entre páginas
- Hover effects en botones
- Menús con animaciones de entrada/salida
- Loading states informativos

---

## 🔒 Seguridad

### **Autenticación**
- Sistema de login seguro con Firebase
- Contraseñas encriptadas
- Sesiones con tokens JWT
- Cierre automático de sesión por inactividad

### **Autorización**
- Permisos basados en roles
- Validación de acceso en cada página
- Protección de rutas del backend
- Middleware de verificación de tokens

### **Protección de Datos**
- Reglas de seguridad en Firestore
- Validación de datos en frontend y backend
- Sanitización de inputs
- HTTPS obligatorio en producción

---

## 📊 Progressive Web App (PWA)

ClassGo es una PWA, lo que significa que:

### **✅ Funciona Offline**
- Caché inteligente de recursos
- Service Worker activo
- Datos sincronizados cuando hay conexión

### **✅ Instalable**
- Se puede instalar como app nativa
- Icono en el escritorio/menú de apps
- Experiencia de pantalla completa
- Sin necesidad de tiendas de apps

### **✅ Rápida**
- Carga inicial optimizada
- Recursos cacheados
- Experiencia fluida

**Archivos PWA importantes**:
- `manifest.json`: Configuración de la app
- `sw.js`: Service Worker para caché
- Iconos en `/frontend/images/`

---

## 🔄 Flujo de Datos

### **Cómo viaja la información**

1. **Usuario interactúa** con la interfaz (frontend)
2. **JavaScript procesa** la acción
3. **API Service** envía solicitud al backend
4. **Backend valida** tokens y permisos
5. **Firestore/Firebase** lee o escribe datos
6. **Backend responde** con resultado
7. **Frontend actualiza** la interfaz

### **Ejemplo: Crear una clase**

```
1. Tutor llena formulario → 2. Click en "Crear Clase"
↓
3. JavaScript valida datos → 4. Envía POST a /classes/create
↓
5. Backend verifica token → 6. Valida que sea tutor
↓
7. Guarda en Firestore → 8. Retorna confirmación
↓
9. Frontend muestra "✓ Clase creada" → 10. Actualiza lista
```

---

## 📱 Navegación y Menús

### **Menú Principal (Home)**
Ubicado en el avatar del usuario (esquina superior derecha):

**Para usuarios autenticados**:
- 👤 Mi Perfil (redirige a su dashboard)
- Paneles específicos (solo admin ve todos)
- 💭 Soporte
- 🚪 Cerrar Sesión

**Para invitados**:
- 👤 Ver Mi Perfil (pide login)
- Iniciar Sesión

### **Menú de Dashboards**
**Estudiante y Tutor**:
- 🏠 Inicio (volver al home)
- 🔧 Configurar Lector RFID (solo estudiante)
- 🚪 Cerrar Sesión

### **Navegación entre páginas**
- Logo → Vuelve al home
- Botones de acción → Acciones específicas
- Breadcrumbs → Ubicación actual (donde aplica)

---

## 🎯 Casos de Uso Comunes

### **Caso 1: Estudiante inscrito en clase**
1. Login → Dashboard de Estudiante
2. Ve "Mis Clases"
3. Click en una clase → Ve detalles
4. Revisa próximas sesiones
5. Llega a clase → Pasa tarjeta RFID
6. Asistencia registrada automáticamente

### **Caso 2: Tutor crea clase nueva**
1. Login → Dashboard de Tutor
2. Click "Crear Nueva Clase"
3. Llena formulario (materia, horario, etc.)
4. Click "Crear Clase"
5. Clase aparece en su lista
6. Estudiantes pueden inscribirse

### **Caso 3: Admin gestiona usuario**
1. Login → Home
2. Avatar → Panel de Administración
3. "Gestión de Usuarios"
4. Busca usuario específico
5. Click "Cambiar Rol" o "Desactivar"
6. Confirma acción
7. Usuario actualizado

---

## 🔧 Mantenimiento y Actualizaciones

### **Versionado**
Los archivos CSS y JS incluyen parámetros de versión:
```html
<link rel="stylesheet" href="/css/styles.css?v=101">
```

**¿Por qué?**
- Fuerza al navegador a recargar archivos actualizados
- Evita problemas de caché
- Asegura que todos vean la última versión

### **Actualizaciones de Contenido**
Para actualizar información en la plataforma:
1. Edita los archivos correspondientes
2. Incrementa número de versión (`?v=102`)
3. Guarda cambios
4. Los usuarios verán la actualización en su próxima visita

---

## 📞 Soporte y Ayuda

### **Dentro de la plataforma**
- Botón "💭 Soporte" en menú de usuario
- Sistema de mensajería para contactar tutores/admin
- Notificaciones en pantalla para eventos importantes

### **Resolución de problemas comunes**

**Problema**: "No puedo ver mis clases"
- **Solución**: Verifica que hayas iniciado sesión y estés inscrito

**Problema**: "Mi asistencia no se registró"
- **Solución**: Verifica configuración RFID o contacta al tutor

**Problema**: "No puedo crear una clase"
- **Solución**: Solo tutores pueden crear clases, verifica tu rol

---

## 🚀 Ventajas de ClassGo

1. **Simple**: Interfaz intuitiva, fácil de usar
2. **Rápida**: Carga instantánea, respuestas inmediatas
3. **Segura**: Datos protegidos con Firebase
4. **Accesible**: Funciona en cualquier dispositivo
5. **Moderna**: Tecnologías actuales y mejores prácticas
6. **Offline**: Funciona sin conexión (PWA)
7. **Escalable**: Soporta muchos usuarios simultáneos

---

## 📝 Resumen

ClassGo es una plataforma educativa completa que facilita la gestión de clases, seguimiento de asistencias y comunicación entre estudiantes y tutores. Con una interfaz moderna y responsive, sistema de autenticación robusto, y funcionalidades avanzadas como registro RFID y mensajería en tiempo real, ClassGo proporciona una experiencia de aprendizaje digital eficiente y agradable.

**Características clave**:
- ✅ Multi-usuario (Admin, Tutor, Estudiante)
- ✅ Gestión completa de clases
- ✅ Asistencias automáticas con RFID
- ✅ Mensajería en tiempo real
- ✅ Dashboards personalizados
- ✅ PWA instalable y offline
- ✅ Responsive design
- ✅ Seguridad con Firebase

---

*Documentación actualizada: Noviembre 2025*
