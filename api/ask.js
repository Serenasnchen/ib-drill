module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key 未配置，请联系管理员。' });
  }

  const {
    category,
    question,
    answer_en,
    answer_zh,
    explanation_zh,
    userQuestion,
    revealed
  } = req.body || {};

  if (!userQuestion || !question) {
    return res.status(400).json({ error: '请求参数不完整。' });
  }

  const contextBlock = revealed
    ? `参考答案（英文）：\n${answer_en || ''}\n\n中文答案：\n${answer_zh || ''}\n\n解析：\n${explanation_zh || ''}`
    : `知识背景（教学提示）：\n${explanation_zh || ''}`;

  const prompt = `你是一位专业的投行（Investment Banking）面试辅导老师，正在帮助学生备考 IB 面试。

当前题目：
- 类别：${category || '未知'}
- 题目：${question}

${contextBlock}

学生的问题：${userQuestion}

请用中文回答。金融专有名词（如 EV、EBITDA、DCF、WACC、LBO、IRR、UFCF、Equity Value、leverage 等）保留英文。${
  revealed
    ? '学生已看过答案，请结合答案和解析，深入解释背后的逻辑。'
    : '学生还未看答案，请给引导性分析和提示，不要直接说出完整答案。'
}
回答简洁清晰，150-250 字左右。`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 512
          }
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini API error:', data);
      return res.status(502).json({ error: 'AI 服务暂时不可用，请稍后重试。' });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(502).json({ error: 'AI 未返回有效回复，请重试。' });
    }

    return res.status(200).json({ answer: text });
  } catch (err) {
    console.error('Ask AI error:', err);
    return res.status(500).json({ error: '网络错误，请稍后重试。' });
  }
};
