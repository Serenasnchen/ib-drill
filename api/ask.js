module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key 未配置，请联系管理员。' });
  }

  // Log key presence for debugging (never log the full key)
  console.log('[ask] key set:', !!apiKey, '| prefix:', apiKey.slice(0, 4) + '...');

  // Defensive body parsing — Vercel usually auto-parses, but handle string bodies too
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const {
    category,
    question,
    answer_en,
    answer_zh,
    explanation_zh,
    userQuestion,
    revealed
  } = body;

  if (!userQuestion || !question) {
    console.error('[ask] missing fields — userQuestion:', userQuestion, '| question:', question);
    return res.status(400).json({ error: '请求参数不完整。' });
  }

  const contextBlock = revealed
    ? `参考答案（英文）：\n${answer_en || ''}\n\n中文答案：\n${answer_zh || ''}\n\n解析：\n${explanation_zh || ''}`
    : `知识背景（教学提示）：\n${explanation_zh || ''}`;

  const prompt = `你是 IB 面试辅导 AI，专门帮助学生备考投行面试。请严格遵守以下规则：

【行为规则】
- 直接进入回答，禁止使用任何开场白或寒暄（如"同学你好"、"这是个好问题"、"您好"等）
- 禁止在结尾加收尾套话（如"希望对你有帮助"、"如有疑问欢迎继续提问"等）
- 语气专业但易懂，像有经验的 IB analyst 在辅导学弟学妹
- 回答要完整，解释到位为止，不要刻意压缩
- 逻辑适合分点时用分点，否则直接段落描述
- 金融专有名词（EV、EBITDA、DCF、WACC、LBO、IRR、UFCF、Equity Value、leverage、multiple 等）保留英文，其余用中文

【当前题目】
类别：${category || '未知'}
题目：${question}

【参考资料】
${contextBlock}

【学生的问题】
${userQuestion}

${revealed
  ? '学生已看过答案，请结合答案和解析深入解释背后逻辑，可以补充面试中如何更好地表达。'
  : '学生还未看答案，请从原理和逻辑角度引导分析，不要直接给出完整答案。'
}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const geminiErrMsg = data?.error?.message || JSON.stringify(data);
      console.error('[ask] Gemini error status:', geminiRes.status, '| message:', geminiErrMsg);
      return res.status(502).json({ error: `AI 错误 (${geminiRes.status}): ${geminiErrMsg}` });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('[ask] Gemini empty response:', JSON.stringify(data));
      return res.status(502).json({ error: 'AI 未返回有效回复，请重试。' });
    }

    return res.status(200).json({ answer: text });
  } catch (err) {
    console.error('[ask] fetch error:', err.message);
    return res.status(500).json({ error: `请求失败: ${err.message}` });
  }
};
