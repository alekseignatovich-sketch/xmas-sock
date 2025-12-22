// api/index.js
import { createReadStream } from 'fs';
import { Readable } from 'stream';

// Вспомогательная функция для чтения тела запроса
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    // 🔑 Читаем тело запроса в Node.js
    const text = await readBody(req);
    body = JSON.parse(text);
  } catch (e) {
    console.error('❌ JSON parse error:', e.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { sockId, contactTg, message, fileUrl } = body;

  if (!contactTg || typeof contactTg !== 'string' || !contactTg.startsWith('@')) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  const text = `🎄 Тебе оставили подарок в носке "${sockId}"!\n\nСообщение: ${message || '—'}\n${fileUrl ? `Файл: ${fileUrl}` : ''}`;
  
  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      const chat_id = contactTg.startsWith('@') ? contactTg : Number(contactTg);

body: JSON.stringify({ chat_id, text })
    });

    if (telegramRes.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorText = await telegramRes.text();
      console.error('Telegram API error:', errorText);
      return res.status(500).json({ error: 'Telegram send failed' });
    }
  } catch (e) {
    console.error('Network error:', e.message);
    return res.status(500).json({ error: 'Network error' });
  }
}
