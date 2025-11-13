# Guía Rápida: Probar Sistema de Mensajería

## ✅ Pre-requisitos

1. Backend corriendo: `node backend/server.js`
2. Tener al menos:
   - 1 tutor registrado
   - 1 estudiante registrado
   - 1 clase programada (status: 'scheduled')
   - Estudiante inscrito en la clase del tutor

## 🧪 Pasos para Probar

### 1. Preparar el Entorno

```bash
# Si necesitas crear usuarios de prueba
cd backend
node scripts/list-users.js  # Ver usuarios existentes
```

### 2. Inscribir Estudiante en Clase

Como **Estudiante**:
1. Login → Dashboard Estudiante
2. Ir a "Explorar Cursos"
3. Hacer clic en una clase con status "scheduled"
4. Confirmación: "¡Te has inscrito exitosamente! 🎉"
5. Auto-redirige a "Mis Cursos"

### 3. Probar Mensajería - Vista Estudiante

1. En dashboard de estudiante, clic en tab "Mensajes"
2. **Panel Izquierdo**: Verás lista de tutores
   - Debe aparecer el tutor de tu clase inscrita
   - Muestra: Nombre, Email, Badge "👨‍🏫 Tutor"
3. **Hacer clic en tutor**
   - Header del chat muestra: "💬 Chat con [Nombre Tutor]"
   - Panel derecho muestra: "No hay mensajes" (si es primera vez)
4. **Enviar mensaje**
   - Escribe: "Hola, tengo una pregunta"
   - Clic "Enviar"
   - Mensaje aparece alineado a la derecha
   - Timestamp se muestra debajo

### 4. Probar Mensajería - Vista Tutor

1. En dashboard de tutor, clic en tab "Mensajes"
2. **Panel Izquierdo**: Verás lista de estudiantes
   - Debe aparecer el estudiante inscrito
   - Muestra: Nombre, Email, Badge "👨‍🎓 Estudiante"
3. **Hacer clic en estudiante**
   - Header del chat muestra: "💬 Chat con [Nombre Estudiante]"
   - Panel derecho muestra el mensaje del estudiante (a la izquierda)
4. **Responder mensaje**
   - Escribe: "Claro, ¿cuál es tu duda?"
   - Clic "Enviar"
   - Tu mensaje aparece a la derecha
   - Mensaje del estudiante a la izquierda

### 5. Verificar Auto-actualización

**Setup**: Abre dos ventanas en navegadores diferentes (o modo incógnito)
- Ventana A: Login como estudiante
- Ventana B: Login como tutor

**Test**:
1. En Ventana A (estudiante): Envía mensaje
2. **Espera 5 segundos**
3. En Ventana B (tutor): El mensaje aparece automáticamente ✅
4. En Ventana B: Responde
5. **Espera 5 segundos**
6. En Ventana A: La respuesta aparece automáticamente ✅

### 6. Verificar Detención de Polling

1. En chat activo (enviando mensajes)
2. Cambiar a otra sección (ej: "Explorar Cursos")
3. **Resultado**: Polling se detiene (verificar en console: no más requests)
4. Volver a "Mensajes"
5. Abrir chat nuevamente
6. **Resultado**: Polling se reinicia

## 🐛 Problemas Comunes

### No veo tutores/estudiantes en la lista

**Causa**: No hay clases compartidas

**Solución**:
- Estudiante debe estar inscrito en clase
- Clase debe tener tutor asignado
- Verificar en Firestore que `students` array contiene el UID

### Mensaje no se envía

**Causa**: No hay conversación seleccionada

**Solución**:
- Hacer clic en un contacto primero
- Verificar que header del chat muestra nombre del contacto

### Auto-actualización no funciona

**Causa**: Polling no se inició

**Solución**:
- Abrir console del navegador
- Verificar que no hay errores
- Cerrar y reabrir el chat
- El polling se inicia al abrir conversación

### Cache antigua (estilos no se ven)

**Causa**: Service Worker tiene cache v9

**Solución**:
```javascript
// En console del navegador:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// O simplemente:
// 1. DevTools → Application → Service Workers
// 2. Click "Unregister"
// 3. Refrescar página
```

## 🔍 Verificar en Firestore

### Colección: `conversations`

```javascript
{
  participants: ["uid_estudiante", "uid_tutor"],
  createdAt: Timestamp,
  lastMessage: "último mensaje enviado",
  lastMessageTime: Timestamp,
  unreadCount: {
    "uid_estudiante": 0,
    "uid_tutor": 0
  }
}
```

### Sub-colección: `conversations/{id}/messages`

```javascript
{
  text: "Contenido del mensaje",
  senderId: "uid_remitente",
  timestamp: Timestamp,
  read: false
}
```

## 📊 Console Logs Esperados

### Al Cargar Contactos
```
✅ Access granted. User role: alumno
Loading contacts...
GET /api/conversations/contacts/list → 200
Contacts loaded: 1
```

### Al Abrir Chat
```
Starting conversation with: uid_tutor
POST /api/conversations → 201
Conversation ID: abc123xyz
GET /api/conversations/abc123xyz/messages → 200
Messages loaded: 5
```

### Al Enviar Mensaje
```
Sending message: "Hola"
POST /api/conversations/abc123xyz/messages → 201
Message sent successfully
Reloading conversation...
```

### Polling Activo
```
(cada 5 segundos)
GET /api/conversations/abc123xyz/messages → 200
Messages refreshed
```

## ✅ Checklist de Funcionalidad

- [ ] Lista de contactos se carga
- [ ] Contactos muestran nombre, email y rol
- [ ] Click en contacto abre chat
- [ ] Header del chat se actualiza con nombre
- [ ] Mensajes históricos se cargan
- [ ] Enviar mensaje funciona
- [ ] Mensajes propios aparecen a la derecha
- [ ] Mensajes recibidos aparecen a la izquierda
- [ ] Timestamps se muestran correctamente
- [ ] Auto-actualización cada 5 segundos funciona
- [ ] Polling se detiene al cambiar de sección
- [ ] Polling se reinicia al volver a mensajes
- [ ] CSS se ve correctamente (v10 cache)
- [ ] No hay errores en console
- [ ] No hay errores en backend logs

## 🎉 Resultado Esperado

**Vista Estudiante**:
```
┌─────────────────────────────────────────────────┐
│ Mensajes                                        │
├──────────────┬──────────────────────────────────┤
│  📋 Tutores  │  💬 Chat con Prof. García        │
│              │                                  │
│ 👨‍🏫 Prof.   │  [Mensaje recibido]             │
│ García       │  "¿Cómo estás?"        10:30    │
│ prof@...     │                                  │
│              │            [Mensaje enviado]     │
│              │            "Bien, gracias" 10:31 │
│              │                                  │
│              │  ┌─────────────────────────────┐ │
│              │  │ Escribe un mensaje... [Enviar]│
│              │  └─────────────────────────────┘ │
└──────────────┴──────────────────────────────────┘
```

**Vista Tutor**:
```
┌─────────────────────────────────────────────────┐
│ Mensajes                                        │
├──────────────┬──────────────────────────────────┤
│ 👨‍🎓 Estudiantes│ 💬 Chat con Juan Pérez         │
│              │                                  │
│ 👤 Juan      │  [Mensaje recibido]             │
│ Pérez        │  "Tengo una duda"      14:20    │
│ juan@...     │                                  │
│              │            [Mensaje enviado]     │
│              │            "Dime" 14:21          │
│              │                                  │
│              │  ┌─────────────────────────────┐ │
│              │  │ Escribe un mensaje... [Enviar]│
│              │  └─────────────────────────────┘ │
└──────────────┴──────────────────────────────────┘
```
