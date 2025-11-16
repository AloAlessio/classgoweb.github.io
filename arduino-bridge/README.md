# 🔗 Arduino RFID Bridge

Conecta tu lector RFID Arduino con el backend de ClassGo para registro automático de asistencias.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar bridge
npm start
```

## ⚙️ Configuración

1. **Configurar puerto serial**:
   ```
   ClassGo> puerto COM3
   ```
   (En Linux/Mac: `/dev/ttyUSB0` o `/dev/cu.usbmodem14101`)

2. **Configurar clase activa**:
   ```
   ClassGo> clase <ID_DE_CLASE>
   ```

3. **Listo!** Pasa una tarjeta RFID y verás el registro en tiempo real.

## 📋 Comandos

- `clase <ID>` - Activar clase
- `backend <URL>` - Cambiar backend URL
- `puerto <COM>` - Cambiar puerto serial
- `puertos` - Listar puertos disponibles
- `estado` - Ver configuración
- `ayuda` - Mostrar ayuda
- `salir` - Cerrar

## 🔌 Conexiones Arduino

| RC522 | Arduino |
|-------|---------|
| SDA   | 10      |
| SCK   | 13      |
| MOSI  | 11      |
| MISO  | 12      |
| RST   | 9       |
| 3.3V  | 3.3V    |
| GND   | GND     |

| Buzzer | Arduino |
|--------|---------|
| +      | 3       |
| -      | GND     |

## 📚 Documentación Completa

Lee: `/docs/SISTEMA-ASISTENCIAS-RFID.md`

## ⚠️ Troubleshooting

**Puerto ocupado:**
- Cierra el Arduino IDE Serial Monitor
- Cierra otros programas que usen el puerto

**No detecta tarjetas:**
- Verifica conexiones
- RC522 debe estar a 3.3V (NO 5V)

**Backend no responde:**
- Verifica que el backend esté corriendo
- Usa `backend <URL>` para cambiar la URL

---

**¡Disfruta tu sistema de asistencias automatizado! 🎓**
