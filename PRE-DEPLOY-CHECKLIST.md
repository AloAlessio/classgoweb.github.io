# 📝 Checklist Pre-Despliegue

Antes de subir tu código a GitHub y desplegar en Render, verifica:

## ✅ Seguridad

- [ ] El archivo `.env` está en `.gitignore`
- [ ] NO hay credenciales hardcodeadas en el código
- [ ] El archivo `.gitignore` está creado y funciona
- [ ] Las credenciales de Firebase están seguras

## ✅ Configuración

- [ ] `render.yaml` está configurado correctamente
- [ ] `.env.example` existe para referencia
- [ ] El `package.json` tiene todos los scripts necesarios
- [ ] Las dependencias están actualizadas

## ✅ Frontend

- [ ] `api-service.js` detecta automáticamente el entorno (✅ YA ESTÁ)
- [ ] No hay URLs de localhost hardcodeadas en otros archivos JS
- [ ] Los archivos estáticos se sirven correctamente

## ✅ Backend

- [ ] El puerto se lee de `process.env.PORT` (✅ YA ESTÁ)
- [ ] CORS está configurado para aceptar la URL de producción
- [ ] Firebase Admin SDK está configurado correctamente
- [ ] Las rutas de archivos estáticos son correctas

## ✅ Git y GitHub

- [ ] El repositorio está actualizado en GitHub
- [ ] No hay archivos `.env` en el historial de Git
- [ ] El branch `main` está limpio

## 📋 Comandos para verificar:

```powershell
# Verificar que .env NO esté en staging
git status

# Si aparece .env, eliminarlo del staging:
git rm --cached backend/.env

# Ver qué archivos se ignorarán
git check-ignore -v backend/.env

# Debería mostrar: .gitignore:XX:backend/.env
```

## 🚀 Listo para desplegar?

Si todas las casillas están marcadas, procede con:

1. `git add .`
2. `git commit -m "Preparar para despliegue en Render"`
3. `git push origin main`
4. Sigue la guía en `DEPLOY-RENDER.md`

---

**Fecha:** 2025-11-12
