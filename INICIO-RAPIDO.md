# 🚀 Inicio Rápido - ClassGo

## ⚡ Iniciar el Servidor

### Opción 1: Script Automático (Recomendado)
```powershell
# Desde la raíz del proyecto
.\start-server.bat
```

### Opción 2: Manual
```powershell
cd backend
npm install
npm start
```

## ✅ Verificar que Funciona

1. **Health Check:**
   ```powershell
   curl http://localhost:3000/api/health
   ```
   Debería devolver: `{"status":"OK"}`

2. **Abrir en Navegador:**
   ```
   http://localhost:3000/login
   ```

3. **Iniciar Sesión:**
   - Email: tu-usuario@mail.com
   - Password: tu-contraseña

4. **Ir al Dashboard de Tutor:**
   - Automáticamente redirige después del login
   - O ir a: `http://localhost:3000/tutor-dashboard`

5. **Crear Nueva Clase:**
   - Click en "➕ Crear Nuevo Curso"
   - El modal debería aparecer correctamente
   - La lista de estudiantes debería cargar sin errores

## ⚠️ Problemas Comunes

### Error 404 en /api/users
**Solución:** Asegúrate de que el servidor backend esté corriendo.

### No aparecen estudiantes
**Solución:** Verifica que existan usuarios con rol "alumno" en Firestore.

### Modal no se ve bien
**Solución:** Limpia caché del navegador (Ctrl+Shift+R).

## 📚 Documentación Completa

Ver: `docs/SOLUCION-PROBLEMAS-CREACION-CLASES.md`

---

**¡Listo para usar! 🎉**
