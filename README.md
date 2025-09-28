# WhatsApp Message Bot 🤖💌

This project automatically sends sweet **WhatsApp messages** at the right time of day using:

- [Baileys](https://github.com/WhiskeySockets/Baileys) → WhatsApp Web API
- [OpenAI API](https://platform.openai.com/) → AI-generated personalized messages
- A lightweight JSON file (`example.json`) as a local database to track sent / unsent messages

---

## ✨ Features
- Detects **morning** 🌞 or **evening** 🌙 and generates a fitting message
- Uses **GPT-5** (with fallback to `gpt-4o-mini` if needed) to generate texts
- Keeps track of used messages in `example.json`
- Sends directly to your WhatsApp contact once connected

---

## 📦 Requirements
- Node.js ≥ 18
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A WhatsApp account (QR login required once)
- `.env` file configured correctly

---

## ⚙️ Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```ini
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-5
   RECIPIENT_PHONE=3069XXXXXXXX  # recipient's phone (without @s.whatsapp.net)
   OPENAI_PROMPT_CONTEXT_SYSTEM=You are a sweet boyfriend writing WhatsApp messages
   OPENAI_PROMPT_CONTEXT_USER=Write multiple short WhatsApp messages in Greek
   ```

3. Create `example.json` file with the structure:

   ```json
   [
     {
       "morning_messages": [],
       "evening_messages": [],
       "used_messages": []
     }
   ]
   ```

---

## ▶️ Usage

Run manually:

```bash
node index.js
```

- On the first run, a **QR code** appears in the terminal → scan it with WhatsApp on your phone.
- The bot will generate either a **morning** or **evening** message depending on the time, send it to your recipient, and then exit.

---

## 🕒 Scheduling (optional)

### Linux / macOS with cron
Run every day at 9 in the morning and at midnight:

```bash
crontab -e
```

Add this line:

```
0 0 * * * /usr/bin/node /path/to/index.js
0 9 * * * /usr/bin/node /path/to/index.js
```



### Using PM2
You can also use [PM2](https://pm2.keymetrics.io/) with cron:

```bash
pm2 start index.js --cron "0 0 * * *"
```

---

## 🗄 Database (`example.json`)

The bot uses a simple JSON file to manage messages:

```json
[
  {
    "morning_messages": [],
    "evening_messages": [],
    "used_messages": []
  }
]
```

- `morning_messages`: queue of unused morning messages
- `evening_messages`: queue of unused evening messages
- `used_messages`: archive of already sent messages

---

## 🛠 Debugging
- If GPT-5 returns empty messages, the bot automatically retries with `gpt-4o-mini`.
- Run with a custom context:

  ```bash
  node index.js "Say something specific"
  ```

Logs will print OpenAI responses to help debug.

---

## 📌 Notes
- Don’t commit your `.env` file to GitHub (contains your API key).
- The bot **exits after sending one message**. To automate daily runs, use cron or PM2.
- Made for fun and personal automation — avoid spamming 🚫.
