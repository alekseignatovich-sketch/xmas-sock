// api/index.js
export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    // 🔑 КЛЮЧЕВОЙ МОМЕНТ: используем req.text() для Edge Functions
    const text = await req.text();
    body = JSON.parse(text);
  } catch (e) {
    console.error('❌ JSON parse error:', e.message);
    console.error('Raw input:', await req.text()); // Логируем сырой ввод
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { sockId, contactTg, message, fileUrl } = body;

  // Валидация
  if (!contactTg || typeof contactTg !== 'string' || !contactTg.startsWith('@')) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Отправка в Telegram
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  const text = `🎄 Тебе оставили подарок в носке "${sockId}"!\n\nСообщение: ${message || '—'}\n${fileUrl ? `Файл: ${fileUrl}` : ''}`;
  
  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: contactTg, text })
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
