import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';

dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: API_KEY,
});

try {
  const data = JSON.parse(readFileSync('example.json', 'utf8'));
  if (data[0].new_messages[0]) {
    handleDBUpdate();
    console.log('File content:', data[0].new_messages.shift());
    writeToDB(data);
  } else {
    data[0].new_messages = await generateNewData();
    console.log('Overall data of the db', data);
    writeToDB(data);
  }
} catch (err) {
  console.error('Error reading file:', err);
}
function handleDBUpdate(data) {
  const phraseUsedToday = data[0].new_messages.shift();
  data[0].used_messages.push(phraseUsedToday)
  writeToDB(data);
}

async function generateNewData() {
  const newData = await generateMessage("hey");
  const editedDataArrayOfStrings = newData.split(':').map((s) => s.trim());
  console.log('new data to go to db', editedData);
  return editedDataArrayOfStrings;
}
function writeToDB(data) {
  try {
    writeFileSync('example.json', JSON.stringify(data), 'utf8');
    console.log('File written successfully!');
  } catch (err) {
    console.error('Error writing file:', err.message);
  }
}

async function generateMessage(context) {
  const messages = [
    {
      role: 'system',
      content:
        'You are a boyfriend writing natural, sweet WhatsApp messages. Reply with multiple plain-text messages.',
    },
    {
      role: 'user',
      content: `Write multiple WhatsApp messages with this context: ${context}, also divide each message with : with no new line`,
    },
  ];
  async function tryOnce({ maxOut = 200, effort = 'minimal' }) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxOut,
    });
    console.log(completion.choices);
    const choice = completion.choices?.[0];
    const text = choice?.message?.content?.trim() || '';
    const finish = choice?.finish_reason;
    return { text, finish, raw: completion };
  }
  let res = await tryOnce({ maxOut: 200, effort: 'minimal' });

  if (!res.text || res.finish === 'length') {
    res = await tryOnce({ maxOut: 400, effort: 'minimal' });
  }

  if (!res.text) {
    console.error(
      'GPT-4 returned no visible text. Full response:',
      JSON.stringify(res.raw, null, 2),
    );
    return 'Καλημέρα';
  }
  console.log(res);
  return res.text;
}

// async function start() {
//   const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
//   const sock = makeWASocket({ auth: state });

//   sock.ev.on('connection.update', (update) => {
//     const { connection, qr, lastDisconnect } = update;
//     if (qr) {
//       qrcode.generate(qr, { small: true });
//       console.log('Scan this QR code with WhatsApp:');
//     }
//     if (connection === 'open') {
//       console.log('Logged in to WhatsApp!');
//     }
//     if (connection === 'close') {
//       const reason =
//         lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error;
//       if (reason === 515) {
//         console.log(
//           'Expected restart due to stream error 515. Reconnection in 5s...',
//         );
//         setTimeout(start, 5000);
//         return;
//       }
//       console.error('Connection closed:', reason);
//     }
//   });

//   sock.ev.on('creds.update', saveCreds);

//   const context = process.argv[2] || 'Say good morning in a sweet way in Greek';
//   console.log('Context:', context);
//   //Example: send a generated message
//   sock.ev.on('connection.update', async (update) => {
//     if (update.connection === 'open') {
//       try {
//         const number = process.env.RECIPIENT_PHONE;
//         if (!number) throw new Error('Missing RECIPIENT_PHONE in .env');
//         const jid = number + '@s.whatsapp.net';
//         const msg = await generateMessage(context);
//         console.log('Generated message:', msg);
//         await sock.sendMessage(jid, { text: msg });
//         console.log('Message sent to', number);
//         process.exit(0);
//       } catch (err) {
//         console.error('Something went wrong matey', err.message);
//         process.exit(1);
//       }
//     }
//   });
// }

// start();
