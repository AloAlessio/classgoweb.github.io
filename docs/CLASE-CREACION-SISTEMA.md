# 📚 Sistema de Creación de Clases - ClassGo

## 🎯 Descripción General

El sistema de creación de clases permite a los tutores crear asignaciones personalizadas con control total sobre:
- ✅ Selección de materia (12 categorías disponibles)
- ✅ Nivel de dificultad (Principiante, Intermedio, Avanzado)
- ✅ Fecha límite de entrega
- ✅ Asignación manual de estudiantes

---

## 🎨 Materias Disponibles

El tutor puede elegir entre 12 materias con sus respectivos iconos:

| Materia | Icono | Estudiantes | Recursos |
|---------|-------|-------------|----------|
| Ciencias | 🔬 | 2345 | 78 |
| Astronomía | 🌌 | 876 | 34 |
| Biología | 🧬 | 3210 | 89 |
| Arte | 🎨 | 1234 | 56 |
| Inglés | 🗣️ | 5678 | 123 |
| Matemáticas | 📐 | 4321 | 98 |
| Historia | 📚 | 2109 | 67 |
| Música | 🎵 | 987 | 45 |
| Programación | 💻 | 4567 | 95 |
| Geografía | 🌍 | 987 | 32 |
| Francés | FR | 1456 | 44 |
| Química | ⚗️ | 1876 | 56 |

---

## 🔄 Flujo de Creación (3 Pasos)

### **Paso 1: Selección de Materia**

El tutor ve una cuadrícula con las 12 materias disponibles:

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   🔬        │   🌌        │   🧬        │   🎨        │
│  Ciencias   │ Astronomía  │  Biología   │    Arte     │
│ 👥 2345 📖 78│👥 876 📖 34│👥 3210 📖 89│👥 1234 📖 56│
├─────────────┼─────────────┼─────────────┼─────────────┤
│   🗣️        │   📐        │   📚        │   🎵        │
│   Inglés    │Matemáticas  │  Historia   │   Música    │
│👥 5678 📖123│👥 4321 📖 98│👥 2109 📖 67│👥 987 📖 45 │
├─────────────┼─────────────┼─────────────┼─────────────┤
│   💻        │   🌍        │    FR       │   ⚗️        │
│Programación │  Geografía  │  Francés    │  Química    │
│👥 4567 📖 95│👥 987 📖 32 │👥 1456 📖 44│👥 1876 📖 56│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Interacciones:**
- 🖱️ Click en cualquier tarjeta para seleccionar
- ✨ Efecto de brillo y borde al seleccionar
- ▶️ Botón "Siguiente" se activa automáticamente

---

### **Paso 2: Detalles de la Clase**

Formulario completo con los siguientes campos:

#### **Campos Obligatorios (*)**
- **Título**: Nombre descriptivo de la clase
- **Descripción**: Resumen del contenido (textarea)
- **Dificultad**: 
  - 🟢 Principiante
  - 🟡 Intermedio
  - 🔴 Avanzado
- **Fecha Límite**: Selector de fecha y hora (debe ser futura)

#### **Campos Opcionales**
- **Objetivos de Aprendizaje**: ¿Qué aprenderán los estudiantes?

**Validaciones:**
- ✅ Todos los campos obligatorios deben completarse
- ✅ La fecha límite debe ser posterior a la fecha actual
- ✅ Se muestra la materia seleccionada en la parte superior

---

### **Paso 3: Asignar Estudiantes**

Lista interactiva de estudiantes disponibles:

```
┌────────────────────────────────────────────────┐
│  🔍 Buscar estudiante por nombre...            │
│  [Seleccionar Todos] [Deseleccionar Todos]     │
├────────────────────────────────────────────────┤
│  ☑️  [AA]  Ana Alvarado                        │
│            ana.alvarado@estudiante.com         │
├────────────────────────────────────────────────┤
│  ☑️  [JM]  Juan Martínez                       │
│            juan.martinez@estudiante.com        │
├────────────────────────────────────────────────┤
│  ☐  [MC]  María Contreras                      │
│            maria.contreras@estudiante.com      │
└────────────────────────────────────────────────┘

Seleccionados: 2 estudiantes
```

**Funcionalidades:**
- 🔍 **Búsqueda en tiempo real** por nombre o email
- ☑️ **Selección individual** con checkboxes
- 📋 **Seleccionar/Deseleccionar todos** con botones
- 👥 **Contador dinámico** de estudiantes seleccionados
- 🔄 **Scroll** para listas largas (max-height: 300px)

**Validación:**
- ⚠️ Debe seleccionar al menos 1 estudiante para crear la clase

---

## 💾 Estructura de Datos

Cuando el tutor envía el formulario, se crea un objeto con la siguiente estructura:

```javascript
{
  // Materia seleccionada
  subject: "biologia",
  subjectIcon: "🧬",
  subjectName: "Biología",
  
  // Detalles de la clase
  title: "Introducción a la Genética",
  description: "Conceptos básicos de herencia y ADN",
  difficulty: "intermedio",
  deadline: "2024-02-15T18:00:00",
  objectives: "Comprender estructura del ADN y leyes de Mendel",
  
  // Estudiantes asignados
  assignedStudents: ["uid1", "uid2", "uid3"],
  
  // Datos del tutor (automáticos)
  tutorId: "tutor_uid",
  tutorName: "Prof. García",
  
  // Metadatos
  status: "active",
  createdAt: "2024-01-15T10:30:00Z"
}
```

---

## 🔌 API Endpoint

### **POST /api/classes**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subject": "biologia",
  "subjectIcon": "🧬",
  "subjectName": "Biología",
  "title": "Introducción a la Genética",
  "description": "Conceptos básicos...",
  "difficulty": "intermedio",
  "deadline": "2024-02-15T18:00:00",
  "objectives": "Comprender estructura del ADN...",
  "assignedStudents": ["uid1", "uid2"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "id": "class_uuid",
    "title": "Introducción a la Genética",
    "subject": "biologia",
    "assignedStudents": ["uid1", "uid2"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Validaciones del Backend:**
- ✅ Token de autenticación válido
- ✅ Usuario con rol `tutor` o `admin`
- ✅ Campos obligatorios presentes
- ✅ Dificultad válida: `principiante`, `intermedio`, `avanzado`
- ✅ Fecha límite en el futuro
- ✅ Al menos 1 estudiante asignado

---

## 🎭 Estilos Visuales

### **Modal**
- Ancho máximo: 900px
- Alto máximo: 90vh
- Fondo glassmorphism con blur
- Sombra pronunciada
- Scroll interno si el contenido excede

### **Tarjetas de Materias**
```css
/* Estado normal */
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
transition: 0.3s all

/* Hover */
transform: translateY(-5px)
box-shadow: 0 10px 30px rgba(45, 212, 191, 0.3)

/* Seleccionado */
background: rgba(45, 212, 191, 0.2)
border: 2px solid #2dd4bf
box-shadow: 0 0 20px rgba(45, 212, 191, 0.5)
```

### **Lista de Estudiantes**
- Avatar con iniciales (gradiente cian)
- Checkbox personalizado con animación
- Hover con fondo rgba(255,255,255,0.05)
- Scrollbar personalizada (cian)

---

## 📱 Responsive Design

### **Desktop (>768px)**
- Grid de materias: 4 columnas
- Modal: 900px de ancho
- Lista de estudiantes: altura completa

### **Mobile (<768px)**
- Grid de materias: 2 columnas
- Modal: 95% del ancho de pantalla
- Botones apilados verticalmente
- Padding reducido

---

## 🧪 Flujo de Prueba

### **Caso de Uso Completo:**

1. **Abrir Modal**
   - Click en "➕ Crear Nuevo Curso"
   - Modal aparece con animación fadeIn

2. **Seleccionar Materia**
   - Click en "🧬 Biología"
   - Tarjeta se ilumina con borde cian
   - Botón "Siguiente" se activa

3. **Llenar Detalles**
   - Título: "Genética Básica"
   - Descripción: "Introducción a la herencia..."
   - Dificultad: 🟡 Intermedio
   - Fecha: 15/02/2024 18:00
   - Objetivos: "Comprender ADN..."

4. **Asignar Estudiantes**
   - Buscar: "Ana"
   - Seleccionar: Ana Alvarado, Juan Martínez
   - Contador: "2 estudiantes"

5. **Enviar**
   - Click en "Crear Clase"
   - Loader durante petición
   - Notificación: "✅ Clase creada exitosamente"
   - Modal se cierra
   - Dashboard se recarga automáticamente

---

## 🚨 Manejo de Errores

### **Frontend (JavaScript)**

| Error | Mensaje |
|-------|---------|
| Sin materia seleccionada | "Por favor selecciona una materia" |
| Campos vacíos | "Por favor completa todos los campos obligatorios" |
| Fecha pasada | "La fecha límite debe ser en el futuro" |
| Sin estudiantes | "Debes seleccionar al menos un estudiante" |
| Error de red | "Error al crear la clase" |

### **Backend (API)**

| Código | Error | Mensaje |
|--------|-------|---------|
| 400 | Campos faltantes | "Missing required fields: ..." |
| 400 | Dificultad inválida | "Invalid difficulty level" |
| 400 | Fecha inválida | "Deadline must be in the future" |
| 400 | Sin estudiantes | "At least one student must be assigned" |
| 401 | Sin autenticación | "Unauthorized" |
| 403 | No es tutor | "Access denied. Tutors only" |
| 500 | Error del servidor | "Internal server error" |

---

## 📂 Archivos Modificados

### **1. Frontend - HTML**
- `frontend/html/tutor-dashboard-new.html`
  - Lines 147-303: Modal con wizard de 3 pasos
  - 12 tarjetas de materias
  - Formulario completo con validaciones
  - Lista de estudiantes con búsqueda

### **2. Frontend - CSS**
- `frontend/css/tutor-dashboard.css`
  - Lines 837-1117: Estilos del modal
  - Grid responsive de materias
  - Animaciones y efectos hover
  - Scrollbar personalizada

### **3. Frontend - JavaScript**
- `frontend/js/tutor-dashboard-api.js`
  - Lines 557-845: Funciones del modal
  - `selectSubject()` - Selección de materia
  - `nextStep()` / `previousStep()` - Navegación
  - `loadAvailableStudents()` - Cargar estudiantes
  - `toggleStudent()` - Toggle selección
  - `submitCreateCourse()` - Enviar al backend

### **4. Backend - API**
- `backend/routes/classes.js`
  - Lines 98-155: Endpoint POST actualizado
  - Validaciones de nuevos campos
  - Soporte para `difficulty`, `deadline`, `assignedStudents`
  - Respuesta con datos completos

---

## 🎯 Funcionalidades Clave

✅ **12 materias predefinidas** con iconos visuales  
✅ **Wizard de 3 pasos** con validación en cada paso  
✅ **Niveles de dificultad** con emojis indicadores  
✅ **Selector de fecha/hora** con validación de futuro  
✅ **Búsqueda de estudiantes** en tiempo real  
✅ **Selección múltiple** con checkboxes  
✅ **Contador dinámico** de estudiantes seleccionados  
✅ **Validación completa** frontend y backend  
✅ **Notificaciones visuales** de éxito/error  
✅ **Responsive design** para móviles  
✅ **Glassmorphism UI** consistente con el diseño de ClassGo  

---

## 🔮 Próximas Mejoras (Opcional)

- [ ] Agregar campo "Duración estimada" (horas)
- [ ] Permitir subir archivos/materiales al crear
- [ ] Vista previa antes de enviar
- [ ] Plantillas de clases predefinidas
- [ ] Duplicar clases existentes
- [ ] Asignación por grupo/clase
- [ ] Notificar estudiantes por email/push
- [ ] Calendario visual para deadline
- [ ] Estadísticas de materias más populares
- [ ] Etiquetas/tags personalizadas

---

## 📚 Referencias

- **Diseño UI**: Sistema de glassmorphism de ClassGo
- **API**: RESTful con JWT authentication
- **Base de datos**: Firestore (backend only)
- **Framework**: Vanilla JavaScript (sin dependencias)
- **Responsive**: Mobile-first approach
- **Iconos**: Emojis Unicode nativos

---

**Creado para ClassGo** - Sistema de gestión educativa  
**Versión**: 1.0  
**Fecha**: Enero 2024  
**Autor**: Equipo ClassGo
