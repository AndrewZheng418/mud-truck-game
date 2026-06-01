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
    const { config } = req.body;
    const prompt = buildPrompt(config);

    const response = await fetch(baseURL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: '你是一位擅长写架空人生故事的小说家，文笔细腻，善于刻画人物命运与时代洪流交织的戏剧性。请根据玩家的人生配置单，撰写一份引人入胜的人生故事。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.85,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'LLM API error', detail: errText });
    }

    const data = await response.json();
    const story = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      ? data.choices[0].message.content
      : '';

    res.status(200).json({ story });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function buildPrompt(config) {
  var lines = [];
  lines.push('请根据以下「泥头车游戏-人生选择器」的配置单，为玩家撰写一份完整的人生故事。');
  lines.push('');
  lines.push('【配置单】');
  lines.push('玩家名字：' + (config.playerName || '被泥头车选中的人'));
  lines.push('时代：' + (config.era && config.era.name ? config.era.name : '未选择'));
  lines.push('体质：' + (config.physique && config.physique.name ? config.physique.name : '未选择'));
  lines.push('智力：' + (config.intel && config.intel.name ? config.intel.name : '未选择'));
  lines.push('魅力：' + (config.charm && config.charm.name ? config.charm.name : '未选择'));
  lines.push('运气：' + (config.luck && config.luck.name ? config.luck.name : '未选择'));
  lines.push('身世：' + (config.bg && config.bg.name ? config.bg.name : '未选择'));

  if (config.talents && config.talents.length) {
    lines.push('特殊天赋：' + config.talents.map(function(t){
      return t.growth ? t.name + '（已解锁成长性）' : t.name;
    }).join('、'));
  } else {
    lines.push('特殊天赋：无');
  }

  if (config.stories && config.stories.length) {
    lines.push('故事背景：' + config.stories.map(function(s){ return s.name || s; }).join('、'));
  } else {
    lines.push('故事背景：无');
  }

  if (config.events && config.events.length) {
    lines.push('特殊遭遇：' + config.events.map(function(e){ return e.name || e; }).join('、'));
  } else {
    lines.push('特殊遭遇：无');
  }

  lines.push('剩余点数：' + (config.points !== undefined ? config.points : 0));
  lines.push('');
  lines.push('【写作要求】');
  lines.push('1. 以第三人称撰写，故事要有清晰的时间线（童年、少年、青年、中年、晚年）；');
  lines.push('2. 充分融合配置单中的每一个选项，让它们对主人公的人生产生真实、深刻的影响；');
  lines.push('3. 时代背景决定了故事的整体基调，体质和智力决定了主人公的能力边界，魅力和运气决定了人际与机遇，身世决定了起点；');
  lines.push('4. 特殊天赋如果有「成长性」，要在故事中体现主人公从弱到强的成长弧光；');
  lines.push('5. 故事背景（如末日、死劫、仇敌等）要作为核心冲突驱动力；');
  lines.push('6. 特殊遭遇要作为人生转折点，自然融入叙事；');
  lines.push('7. 结局要有宿命感或史诗感，呼应「被泥头车选中」这一荒诞而浪漫的开场；');
  lines.push('8. 字数控制在 1500-2500 字之间，语言优美、节奏紧凑、情感真挚。');
  lines.push('');
  lines.push('【输出格式】');
  lines.push('直接输出故事正文，不要添加总结、分析或"以下是您的故事"之类的套话。标题用《书名号》包裹。');

  return lines.join('\n');
}
