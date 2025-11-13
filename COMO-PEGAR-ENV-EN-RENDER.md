# 🔑 INSTRUCCIONES: Copiar Variables de Entorno a Render

## 📋 Método 1: Copiar TODO de una vez (RECOMENDADO)

En Render, cuando crees el Web Service, busca la opción **"Add from .env"** o **"Bulk Add"**.

**Copia y pega TODO el contenido del archivo `RENDER-ENV-VARIABLES.txt`**

---

## 📋 Método 2: Agregar una por una

Si no tienes la opción de bulk add, copia cada línea por separado:

### 1. NODE_ENV
```
production
```

### 2. PORT
```
10000
```

### 3. FRONTEND_URL
```

```
*(Déjalo VACÍO por ahora - lo llenarás después con la URL que Render te asigne)*

### 4. FIREBASE_PROJECT_ID
```
classgo-324dd
```

### 5. FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-fbsvc@classgo-324dd.iam.gserviceaccount.com
```

### 6. FIREBASE_PRIVATE_KEY
⚠️ **IMPORTANTE: Copia TODO, incluyendo las comillas y los \n**
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD3Cg8o2iMHagSE\neqdnmUonT9qzJIuFe8lzndCPlqlWWc3dLoFkE+53DObgMfzUXFo6AJ/JoZkP6Mp/\na97wj5BBKju7jOGQ8tXynfs5FE21FmxOLM2KNpIIxkishO4JkORs2mevIAF8+cyS\nmnNbYcqo24TLJnYlxhetz1qmyHPWfphNlrGtz2CRlBcgB625Y+CdytiucY5+TdwH\nCuUGTLovh5MmR5hItdJTEh61rQJ6X4YdDiLfiihftAgIxgQd76Sth4vwXvk8DCfN\nLLvmcnyXDlvDGrB+E7W+3oPF5+Dd7ELdOONbhiUHUMwrUkHUTpTErjMMYAbvnIZ9\nIjiq6DDTAgMBAAECggEAVbB3DrAPm3hCReO3op9Q0e8IiMAh5zTHbWOt3sifR1US\nK+kAN8MUIdZnVRfxv4WjRGBIDKwRiCuy5dz4cVAS9Q+dtZIKAfnBjY0QAb4RsEEt\nYzZ2Oz1vjTyeI71eRhIssbdWZLAA5CVPuQB7CBUVM1olp0PZkoOyXfdBVf3M9Ha5\njg1RM5gC7I/mlKEYZfEXJhObWjxARUFdPm2WP76jhr6NT1GxMo8CjLW4btOg78KN\nf2H8PV7B2GGp3SD6s2GmfUhh41JH/Q0AwsHH415oUA+0vLGg0AdIofx/4gSWDE6u\nURZ0mWOKnBD7wz6EXbSXb08A5RmeAduJm5ZcR32udQKBgQD8eLYPA1cqBanV6q7C\nsxqfdk79dJXpilLrjf5RNApRTAPNigWBJ8/4yEdr14TkWQUPuDF0JnjD5znoQIE6\nB9030Yj8Gpq4GZJTXs/DduBX/Jma8shqAXtfw0bDlAjnUYvIRzK0q9y3enDqKLbx\n7d/EZQ1MoKsPkkbmlTvG38gDvwKBgQD6femlto5qLHQ9OiX6DW/xKw5yaYbACWL7\nyBm6j/4vX1VC/aFCpTkDmd4ms77cJqQGVRoVfwVip+1JRBtIIZDgHAADPVpQmqbx\n9KHqs2rjqL2vMNa801FupdpAOE6nSPJUYPC/8uhihi8o0zLZm5cLNEuZJj8TMovW\nYxyS7/2H7QKBgCeGblojV74IbPJEb1+j0oMsbmlXmzCYqyqdbDciQos/r0i6VupF\nZVW5ZRUJBJELLrOrTnK0oytoQ7SMhK6lFIjskNmHALnZpwLOURB0x+J+dT3AzIdr\n+/ieBbIQtuQf7BZKrzGBxmgjDxJZlWqCpwmEGHTqol0ptVfb/SPBXPrZAoGASoQ6\nhXmRVDR1P+GUepaUvoG4goCx/V7Ne2lDfiRn0V/i1VLuLg1IsLGNTKYcGRHFqbyX\nTd3DlF2wUSNZmlOh7Ylm14/g1imrkD7eDBvjqGYCR6OXvgR/LRNZodEeVNV2gXN1\nKyTvzJ9uWA68CdAnVsXv11dxXBylTNmfHncWTOECgYEA1fUIkjajRlxjNxrZUhGf\nv61gqY/Cq6HH3Opdz7FHOBl553u3XDI4ljOQCIMMbeVJlgLwWu7P1ThXXpud+RLy\nQqkOSsYNS8RLJP9uq73eRMYUnJNXdSkkM8GH59+2KZKVZ7YldjFQdBv7qyjQsFvM\njKQdq6VclIs7rVY1x+YBJD0=\n-----END PRIVATE KEY-----\n"
```

### 7. FIREBASE_DATABASE_URL
```
https://classgo-324dd-default-rtdb.firebaseio.com/
```

### 8. JWT_SECRET
⚠️ **IMPORTANTE: Cambia esta clave en producción**
```
classgo-production-secret-key-change-this-in-render-2024-x9K2mP5nQ8wR7vL3zA
```
*O genera una nueva en: https://randomkeygen.com/*

### 9. RATE_LIMIT_WINDOW_MS
```
900000
```

### 10. RATE_LIMIT_MAX_REQUESTS
```
100
```

### 11. LOG_LEVEL
```
info
```

### 12. MEETING_PROVIDER
```
google-meet
```

### 13. MEETING_BASE_URL
```
https://meet.google.com
```

---

## ✅ Después del Despliegue

Cuando Render te asigne una URL (ejemplo: `https://classgo-app.onrender.com`):

1. Ve a **Environment** en Render
2. Edita la variable **FRONTEND_URL**
3. Pega tu URL completa: `https://classgo-app.onrender.com`
4. Click **Save Changes**
5. Render redesplegará automáticamente

---

## 🎯 Pasos Completos en Render:

1. **New +** → **Web Service**
2. Conecta repositorio: **classgoweb.github.io**
3. Click **Connect**
4. En **Environment Variables**, click **"Add from .env"** o **"Bulk Add"**
5. Pega el contenido de **`RENDER-ENV-VARIABLES.txt`**
6. Click **"Create Web Service"**
7. Espera 2-5 minutos
8. Cuando esté listo, actualiza **FRONTEND_URL** con la URL que te dieron
9. **¡Listo!** 🎉

---

**Archivo con todas las variables:** `RENDER-ENV-VARIABLES.txt`
