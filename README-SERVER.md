# Tijorat Markazi — server (AI + chat archive)

## Ishga tushirish / Запуск

```bash
cd /Users/open/Desktop/Tijorat Markazi

# 1) Demo rejim (AI kalitisiz) — ishlaydi, lekin javoblar namunaviy:
node server.js

# 2) Haqiqiy AI (Gemini) bilan:
GEMINI_API_KEY=YOUR_KEY node server.js
```

Yoki kalitni faylga yozing (xavfsizroq, brauzerda ko'rinmaydi):

```bash
echo "YOUR_GEMINI_KEY" > gemini.key
node server.js
```

Sayt: **http://localhost:4321**

## Nima saqlanadi (data/ papkasi)

| Fayl | Mazmun |
|------|--------|
| `data/chats.json` | Har bir email uchun barcha suhbatlar arxivi |
| `data/problems.json` | Barcha murojaatlar (xom ko'rinishda) |
| `data/problems.doc` | **Word** fayli — barcha foydalanuvchi savollari/muammolari |

- Foydalanuvchi assistant sahifasida **email** kiritadi → o'sha emailga bog'langan eski suhbatlar yon panelda chiqadi.
- Har bir savol avtomatik `problems.doc` (Word) ga yoziladi.
- "Murojaatlarni Word'ga yuklash" tugmasi — joriy foydalanuvchining savollarini Word'da yuklab beradi.

## Model
`GEMINI_MODEL` env bilan o'zgartirsa bo'ladi (default: `gemini-2.0-flash`).

## Telegram bot

Bir xil AI (Gemini, TIJORAT MARKAZI mavzusi, 3 til, ovoz, hujjatlar) Telegram bot sifatida.

1. Telegramda **@BotFather** ga `/newbot` yozing → bot nomi va username bering → **token** oling.
2. Tokenni faylga yozing:
   ```bash
   echo "123456:ABC-yourtoken" > telegram.key
   ```
3. Botni ishga tushiring (web server bilan parallel ishlashi mumkin):
   ```bash
   node bot.js
   ```

Bot imkoniyatlari:
- Matnli savollar (uz/ru/en — savol tilida javob beradi)
- 🎤 ovozli xabar (Gemini transkripsiya qiladi)
- 🖼 rasm (Gemini Vision)
- 📎 hujjat: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), matnli fayllar
- `/new` — yangi suhbat, `/help` — yordam
- Har bir foydalanuvchi tarixi `data/chats.json` da (`tg:<id>`), savollar `problems.doc` ga yoziladi

## Eslatma
Serversiz ochilsa (oddiy fayl yoki statik server) — sayt **demo rejimda** ishlaydi: suhbatlar brauzer (localStorage) da saqlanadi, AI o'rniga namunaviy javoblar.
