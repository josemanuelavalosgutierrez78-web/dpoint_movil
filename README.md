# 💱 DollarPoint X — App Móvil con Expo Go

Prueba la app directamente en tu celular Android **sin compilar nada**.

---

## 📲 Cómo correr en tu celular (3 pasos)

### Paso 1 — Instala dependencias
```bash
cd DollarPointX
npm install
```

### Paso 2 — Inicia el servidor
```bash
npx expo start
```
Verás un **código QR** en la terminal.

### Paso 3 — Abre en tu celular Android
1. Descarga **Expo Go** desde la Play Store
2. Abre Expo Go → toca **"Scan QR code"**
3. Escanea el QR
4. ¡La app carga en segundos! 🎉

> **Tu PC y tu celular deben estar en la misma WiFi.**

---

## 🌐 Si no están en la misma red WiFi

```bash
npx expo start --tunnel
```

---

## ⚙️ Cambiar URL del backend

Edita `app.json`:
```json
"extra": {
  "apiBaseUrl": "https://dollarpoint-4.onrender.com/api/v1",
  "whatsappNumber": "51999999999"
}
```

---

## 🐛 Problemas comunes

| Problema | Solución |
|---|---|
| QR no carga | Misma WiFi en PC y celular |
| Metro se cuelga | `npx expo start --clear` |
| Módulo no encontrado | Borra `node_modules` y corre `npm install` |
| API tarda | El backend en Render demora ~30s en despertar |
