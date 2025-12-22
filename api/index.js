// api/index.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Логируем сырое тело и заголовки
  console.log('📥 Raw body:', req.body);
  console.log('📥 Content-Type:', req.headers['content-type']);

  let body;
  try {
    // Принудительно парсим как JSON
    body = JSON.parse(req.body);
  } catch (e) {
    console.error('❌ JSON parse error:', e.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { sockId, contactTg, message, fileUrl } = body;

  // Валидация
  if (!contactTg || typeof contactTg !== 'string' || !contactTg.startsWith('@')) {
    console.error('❌ Invalid contactTg:', contactTg);
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not set');
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
      console.log('✅ Уведомление отправлено');
      return res.status(200).json({ success: true });
    } else {
      const errorText = await resp.text();
      console.error('❌ Telegram API error:', errorText);
      return res.status(500).json({ error: 'Telegram error' });
    }
  } catch (e) {
    console.error('❌ Network error:', e.message);
    return res.status(500).json({ error: 'Network error' });
  }
}
