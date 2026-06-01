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
        temperature: 0.9,
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
  lines.push('你是一位顶级架空小说作家。请根据以下「泥头车游戏-人生选择器」的配置单，为玩家撰写一篇**具有电影感的人生小说**。');
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
  lines.push('【核心要求】');
  lines.push('1. 严禁按年龄分段写大纲（禁止出现"童年""少年""青年""中年""晚年"这类阶段性小标题）。请以**具体场景和事件**为单位推进叙事，时间跨度可以在场景中自然流露，而非主动标注。');
  lines.push('2. 每一个配置选项都必须在故事中产生**可感知的具体影响**，不要一笔带过。比如「污染」不是设定介绍，要写出主人公皮肤下的异样蠕动、深夜梦见的呓语、旁人惊恐的眼神。');
  lines.push('3. 时代背景是故事的**空气和重力**。如果时代是炼狱，让读者感到氧气稀薄；如果是桃源，让读者感到阳光刺眼到不真实。');
  lines.push('4. 人物必须是**复杂和矛盾的**。不要让主人公单纯善良或单纯邪恶，让他的选择出于自私、恐惧、爱、虚荣的混合动机。配角同样要有自己的欲望和软肋。');
  lines.push('5. 如果存在「成长性」天赋，不要写成爽文升级。要写出成长背后的**代价**——失去的东西、变形的自我、回不去的日常。');
  lines.push('6. 故事背景和特殊遭遇不是装饰，而是**推动主人公做出不可挽回选择的深层力量**。让主人公的堕落或升华都有迹可循。');
  lines.push('7. 必须有**至少一段人物对话**，对话要承担叙事功能（揭示关系、推进冲突、暗示秘密），不要闲聊。');
  lines.push('8. 必须有**至少一个具象的感官细节**让读者身临其境：某种腐烂的气味、金属碰撞的回音、皮肤上传来的温度、突如其来的寂静。');
  lines.push('');
  lines.push('【文学风格】');
  lines.push('- 语言要有张力和节奏感，长短句交错，适当使用比喻和通感，但拒绝堆砌辞藻。');
  lines.push('- 允许留白，允许不解释一切，让读者在回味中自己拼凑真相。');
  lines.push('- 结局必须回应「被泥头车选中」这个荒诞开场，但方式要出人意料又合情合理。');
  lines.push('- 字数 2000-3500 字。宁可少写一千字，也不要多一句废话。');
  lines.push('');
  lines.push('【输出格式】');
  lines.push('直接输出小说正文，不要总结、不要作者点评、不要"以下是您的故事"。标题用《书名号》包裹，放在最开头。');

  return lines.join('\n');
}
