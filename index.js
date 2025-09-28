import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import qrcode from 'qrcode-terminal';

dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: API_KEY,
});

async function generateMessage(context) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'system',
        content:
          'You are a boyfriend writing natural, sweet WhatsApp messages.',
      },
      {
        role: 'user',
        content: `Write a WhatsApp message with this context: ${context}`,
      },
    ],
    max_tokens: 200,
  });

  return completion.choices[0].message.content.trim();
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
  const sock = makeWASocket({ auth: state });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Scan this QR code with WhatsApp:');
    }
    if (connection === 'open') {
      console.log('Logged in to WhatsApp!');
    }
    if (connection === 'close'){
      const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error;
      if(reason === 515) {

      console.log('Expected restart due to stream error 515. Reconnection in 5s...');
      setTimeout(start, 5000);
      return;
      }
      console.error('Connection closed:', reason);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const context = process.argv[2] || 'Say good morning in a sweet way in Greek';
  console.log('Context:', context);
  //Example: send a generated message
  sock.ev.on('connection.update', async (update) => {
    if (update.connection === 'open') {
      try {
        const number = process.env.RECIPIENT_PHONE;
        if (!number) throw new Error('Missing RECIPIENT_PHONE in .env');
        const jid = number + '@s.whatsapp.net';
        const msg = await generateMessage(context);
        console.log('Generated message:', msg);
        await sock.sendMessage(jid, { text: msg });
        console.log('Message sent to', number);
      } catch (err) {
        console.error('Something went wrong matey', err.message);
        process.exit(1);
      }
    }
  });
}

start();
