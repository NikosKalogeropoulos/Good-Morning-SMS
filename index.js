import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import qrcode from 'qrcode-terminal';

dotenv.config();

function isItEvening() {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return false;
  return true;
}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) throw new Error('Missing OPENAI_API_KEY in .env');

const RECIPIENT = process.env.RECIPIENT_PHONE;
if (!RECIPIENT) throw new Error('Missing RECIPIENT_PHONE in .env');

const OPENAI_MODEL = process.env.OPENAI_MODEL;
if (!OPENAI_MODEL) throw new Error('Missing OPENAI_MODEL in .env');

const SYSTEM_CONTEXT = process.env.OPENAI_PROMPT_CONTEXT_SYSTEM;
if (!SYSTEM_CONTEXT) throw new Error('Missing SYSTEM_CONTEXT in .env');

const USER_CONTEXT = process.env.OPENAI_PROMPT_CONTEXT_USER;
console.log(USER_CONTEXT);
if (!USER_CONTEXT) throw new Error('Missing USER_CONTEXT in .env');

const DB_FILE = 'example.json';
const context = process.argv[2] || '';

const openai = new OpenAI({ apiKey: API_KEY });

// --------------------
// Database Helpers
// --------------------
function loadDB() {
  try {
    return JSON.parse(readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading DB, creating fresh one:', err.message);
    return [{ morning_messages: [], evening_messages: [], used_messages: [] }];
  }
}

function writeDB(data) {
  try {
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('DB updated successfully');
  } catch (err) {
    console.error('Error writing DB:', err.message);
  }
}

// --------------------
// OpenAI Helpers
// --------------------

async function generateMessage(context) {
  const messages = [
    {
      role: 'system',
      content: SYSTEM_CONTEXT,
    },
    {
      role: 'user',
      content: `Generate ${context} and ${USER_CONTEXT} be`,
    },
  ];
  const tryOnce = async (maxOut = 300, model = OPENAI_MODEL) => {
    try {
    console.log('IM HEREEE');
    const res = await openai.chat.completions.create({
      model,
      messages,
      max_completion_tokens: maxOut,
      stream: false,
    });

    console.dir(res, { depth: null });

    const text = res.choices[0]?.message?.content?.trim() || '';
    console.log(`Extracted text: ${text}`);
    return text;
  } catch (err) {
    console.error("OpenAI error:", err.message);
    return '';
  }
}


  let text = await tryOnce(1500, OPENAI_MODEL);
  if (!text) text = await tryOnce(3000, OPENAI_MODEL);
  if (!text) {
    console.warn (`${OPENAI_MODEL} failed, falling back to gpt-4o-mini`);
    text = await tryOnce(400, "gpt-4o-mini");
  }

  console.log(`return text: ${text}`)
  return text || 'Γειά σου τι κάνεις;';
}

async function generateNewData(prompt) {
  const raw = await generateMessage(prompt + ' ' + context);
  console.log(raw);
  return raw
    .split(':')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function createMessage() {
  const data = loadDB();
  const evening = isItEvening();

  const key = evening ? 'evening_messages' : 'morning_messages';

  if (!data[0][key] || data[0][key].length === 0) {
    const prompt = evening
      ? 'Generate multiple messages for good night'
      : 'Generate multiple messages for good morning';

    data[0][key] = await generateNewData(prompt);
  }
  const phrase = data[0][key].shift();
  if (!phrase) {
    console.warn('No phrase available even after generation.');
    return 'Τι κάνεις πως είσαι;';
  }
  data[0].used_messages.push(phrase);
  writeDB(data);
  return phrase;
}

// -----------------
// Run script
// -----------------

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
  const sock = makeWASocket({ auth: state });

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Scan this QR code with WhatsApp:');
    }

    if (connection === 'open') {
      console.log('Logged in to WhatsApp!');
      try {
        const jid = `${RECIPIENT}@s.whatsapp.net`;
        const msg = await createMessage();
        if (!msg) throw new Error('No message generated');

        console.log(`Generated message: ${msg}`);
        await sock.sendMessage(jid, { text: msg });
        console.log(`Message sent to ${RECIPIENT}`);
        process.exit(0);
      } catch (err) {
        console.error(`Message send failed: ${err.message}`);
        process.exit(1);
      }
    }

    if (connection === 'close') {
      const reason =
        lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error;
      if (reason === 515) {
        console.log(
          'Expected restart due to stream error 515. Reconnection in 5s...',
        );
        setTimeout(start, 5000);
      } else {
        console.error(`Connection closed: ${reason}`);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
}
start();
