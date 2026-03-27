function cleanText(s) {
  return s
    .replace(/\*\*(.*?)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*(.*?)\*/g, '$1')       // *italic* → italic
    .replace(/^#{1,6}\s+/gm, '')       // ## 标题 → 标题
    .trim();
}

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

  const prompt = `你是一个懂投行技术面试的人，正在直接给朋友讲解 IB 面试考点。

【回答风格要求】
- 直接给结论，不要任何开场铺垫
- 严格禁用以下表达：先想一下、我们来看、可以从几个角度、这是个好问题、同学你好、希望对你有帮助、如有疑问欢迎继续提问
- 不要输出任何 markdown 格式，不要使用 **、##、* 等符号
- 结构：先一句话给核心结论，再展开 2-4 个关键点，最后如果有必要补一句面试里怎么讲
- 金融专有名词（EV、EBITDA、DCF、WACC、LBO、IRR、UFCF、Equity Value、leverage、multiple、UFCF 等）保留英文，其余用中文

【回答风格示例】
问：M&A 里的 synergies 通常分哪几类？
答：Synergies 通常分为两类：收入协同和成本协同。收入协同来自交叉销售、渠道扩张和定价能力提升；成本协同主要来自人员、采购、生产和后台整合。面试里回答这类问题时，最好先分类，再各举一两个例子，最后补一句实现难度和执行风险，显得更有深度。

【当前题目】
类别：${category || '未知'}
题目：${question}

【参考资料】
${contextBlock}

【问题】
${userQuestion}

${revealed
  ? '结合上面的参考答案，深入解释背后的逻辑，可以补充面试里更好的表达方式。'
  : '从原理和逻辑角度解释，不要直接说出完整答案，给引导性分析。'
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

    return res.status(200).json({ answer: cleanText(text) });
  } catch (err) {
    console.error('[ask] fetch error:', err.message);
    return res.status(500).json({ error: `请求失败: ${err.message}` });
  }
};
