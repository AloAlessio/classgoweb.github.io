# 🎨 DISEÑO Y FUNCIÓN DE LA HOMEPAGE - CLASSGO
## 🎯 ¿Qué es la Homepage?

La homepage de ClassGo es la **página principal** donde los usuarios ven las categorías educativas, estadísticas y clases disponibles. Funciona en dos partes:

1. **Pantalla de Bienvenida** (`index.html`) - Aparece 2 segundos
2. **Dashboard Principal** (`frontend/html/home.html`) - Página principal interactiva

---

## 📐 DISEÑO VISUAL

### 🎨 Paleta de Colores

**Color Principal**: Tonos Cyan-Teal (Azul verdoso)
```
- #0a5f62 (Teal oscuro)
- #0d7377 (Teal medio) 
- #14919b (Cyan brillante)
- #2dd4bf (Acento turquesa)
- #FFFFFF (Blanco para textos)
```

**Fondo Animado**:
- Gradiente que fluye suavemente
- Movimiento de 15 segundos
- Crea sensación de dinamismo

---

### ✨ Efectos Visuales Especiales

#### 1. **Glassmorphism** (Efecto de Vidrio Esmerilado)
**Dónde se usa**: Header (barra superior)

**Características**:
- Fondo semi-transparente
- Desenfoque del contenido detrás
- Bordes sutiles blancos
- Sombras suaves

**Resultado**: Parece una barra de cristal flotante

---

#### 2. **Floating Orbs** (Esferas Flotantes)
**Qué son**: Círculos de luz difusos en el fondo

**Características**:
- Se mueven lentamente (20 segundos)
- Cambian de tamaño sutilmente
- Color turquesa (#5eeae4)
- Muy desenfocados (blur)

**Resultado**: Da profundidad y movimiento al fondo

---

#### 3. **Shimmer Effect** (Efecto Brillante)
**Dónde se usa**: Pasa por el header cada 3 segundos

**Características**:
- Línea de luz que cruza de izquierda a derecha
- Color blanco semi-transparente
- Se repite infinitamente

**Resultado**: Como un destello de luz pasando

---

#### 4. **Hover Effects** (Efectos al Pasar el Ratón)

**Tarjetas de Estadísticas**:
- Se elevan 8px hacia arriba
- Sombra más grande y oscura
- Transición suave de 0.3 segundos

**Tarjetas de Categorías**:
- Se elevan 5px hacia arriba
- Crecen 2% más grandes
- Sombra expandida

**Resultado**: Sensación de profundidad y respuesta táctil

---

## 📋 COMPONENTES Y SU FUNCIÓN

### 1. 🎯 Header (Barra Superior)

**Qué muestra**:
```
┌─────────────────────────────────────────┐
│ 🔵 ClassGo              [👤 Avatar]    │
└─────────────────────────────────────────┘
```

**Elementos**:
- **Logo**: Círculo azul turquesa con "ClassGo"
- **Avatar del Usuario**: Círculo con iniciales (ej: "JD" para Juan Díaz)

**Función**:
- Identificación de la plataforma
- Acceso rápido al menú de usuario
- Click en avatar → Menú con: Perfil, Configuración, Cerrar Sesión

---

### 2. 👋 Welcome Section (Sección de Bienvenida)

**Qué muestra**:
```
¡Bienvenido a ClassGo! 👋
Explora nuestra plataforma educativa
```

**Función**:
- Da la bienvenida al usuario
- Si está autenticado: "¡Hola, [Nombre]! 👋"
- Mensaje amigable y acogedor

---

### 3. 📊 Stats Grid (Grid de Estadísticas)

**Qué muestra**: 4 tarjetas en fila con números importantes

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 1,200+  │ │ 15,000+ │ │  250+   │ │   95%   │
│ Clases  │ │Estudian.│ │ Tutores │ │  Éxito  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Información que muestra**:
1. **1,200+ Clases Disponibles** - Total de cursos en la plataforma
2. **15,000+ Estudiantes Activos** - Usuarios registrados
3. **250+ Tutores Expertos** - Profesores disponibles
4. **95% Tasa de Éxito** - Estudiantes que aprueban

**Función**:
- Mostrar credibilidad de la plataforma
- Impresionar con números reales
- Click en cada tarjeta → Muestra detalles expandidos

---

### 4. 🔖 Navigation Tabs (Pestañas de Navegación)

**Qué muestra**: 5 pestañas para filtrar categorías

```
[Todas] [Ciencias] [Idiomas] [Arte] [Favoritos]
  ^^^
 Activa
```

**Pestañas disponibles**:
1. **Todas las Categorías** - Muestra todo (por defecto)
2. **Ciencias** - Solo cursos de ciencias
3. **Idiomas** - Solo idiomas
4. **Arte** - Solo arte y creatividad
5. **Favoritos** - Cursos marcados como favoritos

**Función**:
- Filtrar qué categorías se muestran abajo
- Pestaña activa se resalta con color más brillante
- Click cambia el filtro instantáneamente

---

### 5. 📚 Categories Grid (Cuadrícula de Categorías)

**Qué muestra**: Tarjetas grandes con cada materia disponible

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   🔬         │ │   🌌         │ │   🧬         │
│ Ciencias     │ │ Astronomía   │ │ Biología     │
│ Explora el...│ │ Descubre...  │ │ Comprende... │
│ 1234 👥 45📖│ │ 856 👥 28📖 │ │ 1567 👥 52📖│
└──────────────┘ └──────────────┘ └──────────────┘
```

**8 Categorías Disponibles**:

| Emoji | Materia | Descripción | Estudiantes | Clases |
|-------|---------|-------------|-------------|---------|
| 🔬 | Ciencias | Física, química, ciencias naturales | 1,234 | 45 |
| 🌌 | Astronomía | Misterios del universo | 856 | 28 |
| 🧬 | Biología | Vida y organismos vivos | 1,567 | 52 |
| 🎨 | Arte | Pintura, dibujo, diseño | 2,341 | 67 |
| 🗣️ | Inglés | Idioma con tutores nativos | 3,456 | 89 |
| 📐 | Matemáticas | Pensamiento lógico | 2,890 | 73 |
| 📚 | Historia | Viaje a través del tiempo | 1,678 | 41 |
| 🎵 | Música | Instrumentos y teoría | 1,234 | 35 |

**Función de cada tarjeta**:
- Mostrar la materia con emoji llamativo
- Descripción breve de qué trata
- Número de estudiantes inscritos
- Número de clases disponibles
- Click → Abre página de esa categoría

---

### 6. 📅 Upcoming Classes (Clases Próximas)

**Qué muestra**: Lista de clases programadas para los próximos días

```
┌────────────────────────────────────────────────────┐
│ Astronomía: Sistema Solar                          │
│ Tutor: Dr. María González                          │
│ ⏰ Hoy, 3:00 PM - 4:30 PM        [Unirse Ahora]   │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Biología: Células y Organismos                     │
│ Tutor: Prof. Carlos Ramírez                        │
│ ⏰ Mañana, 10:00 AM - 11:30 AM    [Programada]    │
└────────────────────────────────────────────────────┘
```

**Información de cada clase**:
- **Título**: Materia y tema específico
- **Tutor**: Nombre del profesor
- **Horario**: Día y hora exactos
- **Botón de acción**: 
  - "Unirse Ahora" si la clase es hoy/ya empezó
  - "Programada" si es en el futuro

**Función**:
- Recordar clases próximas al usuario
- Acceso rápido para unirse a clase
- Ver quién es el tutor
- Click en la tarjeta → Detalles completos de la clase

---

## 🎨 DETALLES DE DISEÑO POR COMPONENTE

### Header - Estilo Líquido Flotante

**Aspecto Visual**:
- Fondo: Vidrio esmerilado (glassmorphism)
- Bordes: Redondeados (24px)
- Borde sutil: Línea blanca semi-transparente
- Sombra: Suave hacia abajo
- Animación: Brillo que pasa cada 3 segundos

**Espaciado**:
- Padding interno: 20px arriba/abajo, 32px izquierda/derecha
- Margen: 10px arriba, 40px abajo

---

### Stats Cards - Tarjetas de Estadísticas

**Aspecto Visual**:
- Fondo: Semi-transparente blanco (8%)
- Texto grande: Número en tamaño 36px, peso 700
- Texto pequeño: Etiqueta en tamaño 14px
- Espaciado: 24px de padding
- Bordes: Redondeados (16px)

**Efectos**:
- Hover: Se eleva 8px, sombra crece
- Transición: 0.3 segundos suave
- Clickeable: Cursor pointer

---

### Navigation Tabs - Pestañas

**Aspecto Visual**:
- Pestaña normal: Texto blanco 70% opacidad
- Pestaña activa: Texto 100% opacidad + fondo turquesa
- Padding: 12px arriba/abajo, 24px lados
- Bordes: Redondeados (12px)

**Efectos**:
- Hover: Fondo semi-transparente aparece
- Click: Se activa y resalta
- Transición: 0.2 segundos

---

### Category Cards - Tarjetas de Categoría

**Aspecto Visual**:
- Fondo: Blanco semi-transparente (10%)
- Emoji: 48px de tamaño
- Título: 20px, peso 600
- Descripción: 14px, opacidad 80%
- Estadísticas: Íconos 👥 📖 + números

**Estructura interna**:
```
┌─────────────────┐
│      🔬         │ ← Emoji grande
│   Ciencias      │ ← Título
│ Explora el...   │ ← Descripción
│ 1234👥  45📖   │ ← Estadísticas
└─────────────────┘
```

**Efectos**:
- Hover: Se eleva 5px, crece 2%
- Transición: 0.3 segundos
- Sombra: Crece al hacer hover

---

### Upcoming Classes - Items de Clase

**Aspecto Visual**:
- Fondo: Blanco semi-transparente (8%)
- Layout: Información izquierda, botón derecha
- Padding: 20px
- Bordes: Redondeados (12px)

**Estructura**:
```
┌──────────────────────────────────────────┐
│ Título de la Clase          [Botón]     │
│ Tutor: Nombre                            │
│ ⏰ Horario                               │
└──────────────────────────────────────────┘
```

**Botones**:
- "Unirse Ahora": Fondo verde brillante (#2dd4bf)
- "Programada": Fondo gris/blanco semi-transparente

---

## 🔄 CÓMO FUNCIONAN JUNTOS

### Flujo Visual del Usuario:

1. **Página carga** → Fondo animado cyan-teal aparece
2. **Header aparece** → Logo y avatar en la parte superior
3. **Bienvenida personalizada** → "¡Hola, [Nombre]!"
4. **Stats muestran números** → Impresionan con métricas
5. **Pestañas permiten filtrar** → Usuario elige qué ver
6. **Categorías se muestran** → Tarjetas con hover effects
7. **Clases próximas abajo** → Recordatorio de agenda

### Interacciones Principales:

**Click en Avatar**:
- Abre menú desplegable
- Opciones: Perfil, Configuración, Cerrar Sesión

**Click en Stat Card**:
- Muestra detalles expandidos
- Gráficos o información adicional

**Click en Nav Tab**:
- Filtra categorías mostradas
- Resalta pestaña activa
- Animación suave de transición

**Click en Category Card**:
- Navega a página de esa categoría
- Muestra todas las clases disponibles

**Click en Upcoming Class**:
- Abre detalles completos
- Permite unirse si está disponible
- Muestra más información del tutor

---

## 📐 LAYOUT Y ESTRUCTURA

### Responsive Grid System:

**Desktop (> 768px)**:
- Stats Grid: 4 columnas
- Categories Grid: 3 columnas
- Container: Max-width 1400px

**Tablet (768px)**:
- Stats Grid: 2 columnas
- Categories Grid: 2 columnas

**Mobile (< 480px)**:
- Stats Grid: 1 columna
- Categories Grid: 1 columna
- Todo apilado verticalmente

---

## 🎨 FILOSOFÍA DE DISEÑO

### Principios Visuales:

1. **Glassmorphism**: Sensación moderna y premium
2. **Gradientes Animados**: Vida y dinamismo
3. **Espacios Amplios**: Claridad y respiración
4. **Efectos Hover**: Feedback inmediato al usuario
5. **Colores Consistentes**: Paleta cyan-teal en todo
6. **Iconografía Clara**: Emojis grandes y reconocibles

### Experiencia de Usuario:

- **Inmediata**: Info importante arriba
- **Explorable**: Categorías fáciles de navegar
- **Personalizada**: Saludo con nombre del usuario
- **Accionable**: Botones claros para unirse a clases
- **Filtrable**: Pestañas para encontrar lo que buscan

---

## 🎯 RESUMEN VISUAL

```
┌────────────────────────────────────────────────┐
│ 🔵 ClassGo                         [👤]       │ ← Header
├────────────────────────────────────────────────┤
│       ¡Bienvenido a ClassGo! 👋                │ ← Welcome
│    Explora nuestra plataforma educativa       │
├────────────────────────────────────────────────┤
│ [1,200+] [15,000+] [250+] [95%]               │ ← Stats
│ Clases   Estudian. Tutores Éxito              │
├────────────────────────────────────────────────┤
│ [Todas] [Ciencias] [Idiomas] [Arte] [Favorit.]│ ← Tabs
├────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│ │🔬   │ │🌌   │ │🧬   │ │🎨   │              │ ← Categories
│ │Cien.│ │Astro│ │Biolo│ │Arte │              │
│ └─────┘ └─────┘ └─────┘ └─────┘              │
├────────────────────────────────────────────────┤
│ Próximas Clases:                               │
│ ┌────────────────────────────┐                 │
│ │ Astronomía: Sistema Solar  │ [Unirse]       │ ← Classes
│ │ Dr. María González         │                 │
│ │ ⏰ Hoy, 3:00 PM            │                 │
│ └────────────────────────────┘                 │
└────────────────────────────────────────────────┘
```

---

**Versión**: 2.0 - Enfoque en Diseño y Función  
**Fecha**: 27 de octubre de 2025  
**Proyecto**: ClassGo
