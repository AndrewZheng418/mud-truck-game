export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = process.env.LLM_MODEL || 'deepseek-v3';

  if (!apiKey) {
    return res.status(500).json({ error: 'LLM_API_KEY not configured' });
  }

  try {
    const { config, partIndex, previousParts } = req.body;
    const idx = typeof partIndex === 'number' ? partIndex : 0;
    const prev = Array.isArray(previousParts) ? previousParts : [];
    const prompt = buildPartPrompt(config, idx, prev);

    const response = await fetch(baseURL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: '你是一位顶尖小说家，善于在架空世界观中写出有血肉的人物和有力的命运。你不写说明书，你写人生。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.92,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'LLM API error', detail: errText });
    }

    const data = await response.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      ? data.choices[0].message.content
      : '';

    res.status(200).json({ partIndex: idx, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function buildPartPrompt(config, idx, prev) {
  var lines = [];

  // 世界观速写：把配置单变成一段连贯的设定，而不是碎片列表
  var settingLines = [];
  settingLines.push('主人公「' + (config.playerName || '无名者') + '」出生在' + (config.era && config.era.name ? '「' + config.era.name + '」的时代' : '一个普通时代') + '，身世是' + (config.bg && config.bg.name ? '「' + config.bg.name + '」' : '普通') + '。');
  settingLines.push('他/她的体质' + (config.physique && config.physique.name ? '「' + config.physique.name + '」' : '普通') + '，智力' + (config.intel && config.intel.name ? '「' + config.intel.name + '」' : '普通') + '，魅力' + (config.charm && config.charm.name ? '「' + config.charm.name + '」' : '普通') + '，运气' + (config.luck && config.luck.name ? '「' + config.luck.name + '」' : '普通') + '。');

  var extras = [];
  if (config.talents && config.talents.length) {
    extras.push('特殊天赋：' + config.talents.map(function(t){ return t.growth ? t.name + '（成长性）' : t.name; }).join('、'));
  }
  if (config.stories && config.stories.length) {
    extras.push('故事背景：' + config.stories.map(function(s){ return s.name || s; }).join('、'));
  }
  if (config.events && config.events.length) {
    extras.push('特殊遭遇：' + config.events.map(function(e){ return e.name || e; }).join('、'));
  }
  if (extras.length) {
    settingLines.push(extras.join('；') + '。');
  }

  lines.push('请根据以下设定，撰写一部长篇人生小说的第 ' + (idx + 1) + ' / 5 部分。');
  lines.push('');
  lines.push('【世界观速写】');
  lines.push(settingLines.join(''));
  lines.push('');

  // 各段方向：极简，像给编剧的 brief
  var directions = [
    '写主人公的童年和少年。让时代和家庭像空气一样包围着他/她，让读者感受到这个孩子将在什么样的世界里长大。不需要解释全部设定，让它们在细节中自然流露。',
    '写主人公的青年时代。他/她第一次面对世界的真相，做出一个无法回头的选择。让体质、智力、魅力、运气在这个选择中各显其能，推动情节走向不可逆转的方向。',
    '写主人公的壮年。核心冲突全面爆发，主人公付出代价。如果存在成长性天赋，写出变强背后的畸变；如果存在故事背景，让它彻底撕裂主人公的生活。',
    '写主人公的中年。他/她得到了什么、失去了什么、变成了什么样的人？早期那个关键选择在此刻结出果实。让特殊遭遇作为转折点彻底改写人生轨迹。',
    '写主人公的晚年与死亡。所有属性在此做最终结算，结局要有重量感——不是煽情，而是让读者感到"这就是他/她应得的结局"。最后一句话要留白，像关门声。'
  ];

  lines.push('【本段方向】');
  lines.push(directions[idx] || directions[0]);
  lines.push('');

  // 前文衔接
  if (prev.length > 0) {
    lines.push('【前文衔接】');
    lines.push('前一段结尾的情节和氛围如下，请直接承接，不要重复设定介绍：');
    var lastPart = prev[prev.length - 1];
    lines.push(lastPart.substring(Math.max(0, lastPart.length - 800)));
    lines.push('');
  }

  // 极简铁律
  lines.push('【要求】');
  lines.push('- 因果清晰，动机可信，事件不要凭空发生。');
  lines.push('- 用场景和对话推进，不要写概述和总结。');
  lines.push('- 语言有质感但拒绝晦涩，比喻贴切，对话真实。');
  lines.push('- 严禁出现"泥头车""转生""前世""系统""游戏"等词。这是真实的人生。');
  lines.push('- 你可以自拟场景标题，不要用"第一章"这类编号。');
  lines.push('- 1500-2000字。');
  lines.push('');
  lines.push('【输出】');
  lines.push(idx === 0 ? '开头用《书名号》写小说总标题，然后直接输出正文。' : '直接承接前文输出正文，不要总标题。');

  return lines.join('\n');
}
