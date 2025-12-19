// api/index.js
export default async function handler(req, res) {
  // Только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Читаем тело запроса вручную
  let body;
  try {
    body = JSON.parse(req.body);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { contactTg, message, fileUrl, sockId } = body;

  // Проверка Telegram username
  if (!contactTg || !contactTg.startsWith('@')) {
    return res.status(400).json({ error: 'Invalid Telegram username' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  const text = `🎄 Тебе оставили подарок в носке "${sockId}"!\n\nСообщение: ${message || '—'}\n${fileUrl ? `Файл: ${fileUrl}` : ''}`;
  
  try {
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: contactTg,
        text: text,
        parse_mode: 'HTML'
      })
    });

    if (resp.ok) {
      res.status(200).json({ success: true });
    } else {
      const errorText = await resp.text();
      console.error('Telegram API error:', errorText);
      res.status(500).json({ error: 'Failed to send Telegram message' });
    }
  } catch (e) {
    console.error('Fetch error:', e);
    res.status(500).json({ error: e.message });
  }
}
