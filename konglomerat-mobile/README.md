# Tijorat Markazi — mobil ilova

Tijorat Markazi platformasining **kompaniya kabineti** uchun mobil ilova (React Native / Expo).
Mavjud Node server (`../Tijorat Markazi/server.js`, port **4321**) bilan ishlaydi — o'sha login/parol.

## Nima bor (1.0)

- **Kirish** — kompaniya login/parol (server: `/api/company/login`). Sessiya telefonda saqlanadi.
- **Bosh sahifa** — statistika (mahsulot / loyiha / xat soni), uyushma, so'nggi rasmiy xatlar.
- **Showroom** — mahsulot/xizmat katalogi (ko'rish, qo'shish, o'chirish).
- **Loyihalar** — investitsiya loyihalari (qo'shish/o'chirish).
- **Yangiliklar** — soha bo'yicha AI yangiliklar (uz / ru / en).
- **Kabinet** — kompaniya ma'lumotlari, onlayn uchrashuv havolasi, chiqish.

## Ishga tushirish

### 1. Serverni yoqing
```bash
cd ../Tijorat Markazi
node server.js        # → http://localhost:4321
```

### 2. Server manzilini sozlang
`config.js` faylida `API_BASE` — kompyuteringizning **LAN IP** manzili bo'lishi kerak
(telefonda `localhost` ishlamaydi). Hozir avtomatik qo'yilgan: `http://192.168.1.37:4321`.

IP o'zgarsa:
```bash
ipconfig getifaddr en0
```
va `config.js` dagi `API_BASE` ni yangilang. Telefon va kompyuter **bitta Wi-Fi** da bo'lsin.

### 3. Ilovani yoqing
```bash
npm install
npx expo start
```
Telefonga **Expo Go** (App Store / Play Market) o'rnating va terminaldagi QR kodni skanerlang.

## Tuzilma

```
app/
  _layout.js        root — auth gate + sessiya tekshiruvi
  login.js          kirish ekrani
  (tabs)/
    _layout.js      pastki tab navigatsiya
    index.js        Bosh sahifa (dashboard)
    showroom.js     Showroom
    projects.js     Investitsiya loyihalari
    news.js         AI yangiliklar
    profile.js      Kabinet + chiqish
src/
  api.js            server API klienti
  auth.js           auth context (AsyncStorage sessiya)
  ui.js             umumiy komponentlar (Card, Button, Screen…)
  theme.js          ranglar / uslub
config.js           API_BASE va brend nomi
```

## Keyingi qadamlar (reja)

- Showroom'ga rasm yuklash (`expo-image-picker` + `/api/upload`).
- Loyiha chati (`/api/company/chat`) ekrani.
- AI tahlil (sotuv jadvali + `/api/company/analyze`).
- Uyushma (association) va Rais panellari uchun rejim.
- Push-bildirishnomalar.
