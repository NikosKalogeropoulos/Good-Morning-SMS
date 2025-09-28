# How to Run the Good Morning SMS Script

This guide explains step by step how to run your `Good-Morning-SMS` script using Node.js, Baileys (WhatsApp), and OpenAI.

---

## 1️⃣ Prerequisites

Before running the script, make sure you have the following installed:

* **Node.js** (v18+ recommended)
* **npm** (comes with Node.js)
* A valid **OpenAI API key**
* WhatsApp account for sending messages

---

## 2️⃣ Install Dependencies

Open your terminal in the project folder (where `package.json` is located) and run:

```bash
npm install
```

This will install all required packages:

* `@whiskeysockets/baileys` (WhatsApp client)
* `dotenv` (environment variables)
* `openai` (OpenAI API client)
* `qrcode-terminal` (for scanning QR codes)
* `pino-pretty` (for readable logs)

---

## 3️⃣ Set Up Environment Variables

Your `.env` file should contain:

```
OPENAI_API_KEY=your_openai_api_key_here
RECIPIENT_PHONE=your_recipient_phone_here
```

* Replace `your_openai_api_key_here` with your real OpenAI API key.
* Replace `your_recipient_phone_here` with the recipient's phone number (including country code, no plus sign).

Example:

```
OPENAI_API_KEY=sk-xxxxxx
RECIPIENT_PHONE=3069xxxxxxxx
```

---

## 4️⃣ Run the Script

In the terminal, run:

```bash
npm start
```

* This runs `node index.js | npx pino-pretty` (from your `package.json`), so logs will be human-readable.
* The first time, the script will display a **QR code** in the terminal. Scan it with WhatsApp to log in.
* Once logged in, the script will generate a message using OpenAI and send it to the recipient.

---

## 5️⃣ Optional: Run with Custom Context

By default, the script sends:

```
Say good morning in a sweet way in Greek
```

You can provide a custom context by passing an argument:

```bash
node index.js "Tell the recipient I love them in a funny way"
```

---

## 6️⃣ Error Handling

* If OpenAI fails (e.g., rate limit exceeded), the script prints the error and exits.
* If WhatsApp disconnects, the script logs the reason. For stream error 515, it will attempt to reconnect after 5 seconds.

---

## 7️⃣ Notes

* The `baileys_auth` folder stores WhatsApp session credentials so you don’t have to scan the QR code every time.
* Make sure the recipient phone number is correct, including the country code (no plus `+`).
* If you see human-readable logs with colors, everything is working as expected.

---

You’re ready to go! 🚀

Scan the QR, run the script, and your sweet WhatsApp message will be sent automatically.
