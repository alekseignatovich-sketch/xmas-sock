// api/index.js
export default async function handler(req, res) {
  // Разрешаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Читаем и парсим тело запроса
  let body;
  try {
    body = JSON.parse(req.body);
  } catch (parseError) {
    console.error('❌ JSON parse error:', parseError.message);
    console.error('Raw body received:', req.body);
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  // Деструктуризация с безопасными значениями по умолчанию
  const { 
    sockId = 'unknown', 
    contactTg = '', 
    message = '', 
    fileUrl = '' 
  } = body;

  // Проверка: contactTg должен начинаться с @
  if (!contactTg || !contactTg.startsWith('@')) {
    return res.status(400).json({ error: 'Invalid Telegram username (must start with @)' });
  }

  // Получаем токен из переменных окружения
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set in environment variables');
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  // Формируем текст сообщения
  const text = `🎄 Тебе оставили подарок в носке "${sockId}"!\n\nСообщение: ${message || '—'}\n${fileUrl ? `Файл: ${fileUrl}` : ''}`;

  try {
    // Отправляем запрос в Telegram API
    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
     headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        chat_id: contactTg,
        text: text,
        parse_mode: 'HTML'
      })
    });

    // Проверяем ответ от Telegram
    if (telegramResponse.ok) {
      console.log('✅ Telegram notification sent successfully');
      return res.status(200).json({ success: true });
    } else {
      const errorText = await telegramResponse.text();
      console.error('❌ Telegram API error:', errorText);
      return res.status(500).json({ error: 'Failed to send Telegram message' });
    }
  } catch (networkError) {
    console.error('❌ Network error when sending to Telegram:', networkError.message);
    return res.status(500).json({ error: 'Network error' });
  }
}
