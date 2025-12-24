// api/index.js
import { Readable } from 'stream';

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
    const text = await readBody(req);
    body = JSON.parse(text);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { sockId, contactTg, message, fileUrl } = body;

  if (!contactTg || typeof contactTg !== 'string') {
    return res.status(400).json({ error: 'Invalid contactTg' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  // Определяем chat_id: username или числовой ID
  let chat_id;
  if (contactTg.startsWith('@')) {
    chat_id = contactTg;
  } else {
    chat_id = Number(contactTg);
    if (isNaN(chat_id)) {
      return res.status(400).json({ error: 'Invalid contactTg format' });
    }
    // НЕТ СТРОКИ chat_id = parsedId!
  }

  const text = `🎄 Тебе оставили подарок в носке "${sockId}"!\n\nСообщение: ${message || '—'}\n${fileUrl ? `Файл: ${fileUrl}` : ''}`;

  try {
    // 🔑 URL БЕЗ ПРОБЕЛОВ!
    const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text })
    });

    const result = await telegramRes.json();
    if (result.ok) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Telegram error:', result);
      return res.status(500).json({ error: 'Telegram send failed', details: result });
    }
  } catch (e) {
    console.error('Network error:', e);
    return res.status(500).json({ error: 'Network error' });
  }
}
