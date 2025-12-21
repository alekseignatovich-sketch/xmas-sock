export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    // Поддержка JSON и form-data
    if (req.headers['content-type']?.includes('application/json')) {
      body = JSON.parse(req.body);
    } else {
      // Парсим form-data
      const params = new URLSearchParams(req.body);
      body = {
        sockId: params.get('sockId'),
        contactTg: params.get('contactTg'),
        message: params.get('message'),
        fileUrl: params.get('fileUrl')
      };
    }
  } catch (e) {
    console.error('Ошибка парсинга:', e.message, 'Тело:', req.body);
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { sockId, contactTg, message, fileUrl } = body;

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
      body: JSON.stringify({ chat_id: contactTg, text })
    });

    if (resp.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'Telegram error' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
