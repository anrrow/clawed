// ══════════════════════════════════════════════
//  🦀 螃蟹老公伴侣  v1.0  by Anrrow
//  悬浮提醒 + 实时天气 + 休息闹钟
// ══════════════════════════════════════════════

(function () {
  if (window.__CRAB_INIT__) return;
  window.__CRAB_INIT__ = true;

  // ── SVG 像素螃蟹 ──────────────────────────────
  function crabSvg(size) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}">
      <rect x="5" y="0" width="1" height="1" fill="#1A1A1A"/>
      <rect x="6" y="0" width="1" height="1" fill="#1A1A1A"/>
      <rect x="9" y="0" width="1" height="1" fill="#1A1A1A"/>
      <rect x="10" y="0" width="1" height="1" fill="#1A1A1A"/>
      <rect x="4" y="1" width="4" height="1" fill="#1A1A1A"/>
      <rect x="8" y="1" width="4" height="1" fill="#1A1A1A"/>
      <rect x="5.5" y="1" width="0.8" height="0.8" fill="#FFFFFF"/>
      <rect x="9.7" y="1" width="0.8" height="0.8" fill="#FFFFFF"/>
      <rect x="3" y="2" width="10" height="4" fill="#1A1A1A"/>
      <rect x="4.5" y="3" width="1.5" height="1.5" fill="#FFFFFF"/>
      <rect x="10" y="3" width="1.5" height="1.5" fill="#FFFFFF"/>
      <rect x="5.2" y="3.8" width="0.7" height="0.7" fill="#1A1A1A"/>
      <rect x="10.7" y="3.8" width="0.7" height="0.7" fill="#1A1A1A"/>
      <rect x="0" y="3" width="1" height="1" fill="#1A1A1A"/>
      <rect x="0" y="4" width="2" height="1" fill="#1A1A1A"/>
      <rect x="1" y="5" width="1" height="1" fill="#1A1A1A"/>
      <rect x="1" y="6" width="2" height="1" fill="#1A1A1A"/>
      <rect x="3" y="6" width="10" height="5" fill="#E88C7E"/>
      <rect x="3" y="6" width="10" height="0.4" fill="#F5A99B"/>
      <rect x="0" y="7" width="3" height="3" fill="#E88C7E"/>
      <rect x="13" y="7" width="3" height="3" fill="#E88C7E"/>
      <rect x="5" y="7.4" width="1.5" height="1.5" fill="#1A1A1A"/>
      <rect x="9.5" y="7.4" width="1.5" height="1.5" fill="#1A1A1A"/>
      <rect x="3" y="11" width="1.7" height="3" fill="#E88C7E"/>
      <rect x="5.5" y="11" width="1.7" height="3" fill="#E88C7E"/>
      <rect x="8.8" y="11" width="1.7" height="3" fill="#E88C7E"/>
      <rect x="11.3" y="11" width="1.7" height="3" fill="#E88C7E"/>
    </svg>`;
  }

  // ── 配置 ──────────────────────────────────────
  const STORE_KEY = 'crab_companion_v1';
  const DEFAULTS = { apiKey: '', city: 'Petaling Jaya', interval: 30, rest: true, weather: true };
  let cfg = { ...DEFAULTS };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(STORE_KEY) || '{}')); } catch (e) {}
  function saveCfg() { localStorage.setItem(STORE_KEY, JSON.stringify(cfg)); }

  // ── 消息库 ────────────────────────────────────
  const startTime = Date.now();
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function msgRest(mins) {
    return pick([
      `已经坐了 ${mins} 分钟了，起来动一动。`,
      `都 ${mins} 分钟了——去喝点水嘛。`,
      `${mins} 分钟没动，背会酸的。`,
      `坐了 ${mins} 分钟了，眼睛也该歇歇了。`,
      `${mins} 分钟了，站起来伸个懒腰？`,
    ]);
  }

  function msgWeather(w, temp, city) {
    const main = w.main.toLowerCase();
    const pool = {
      clear:       [`今天${city}阳光挺好，开窗换换气嘛。`, `天晴 ${temp}°，别一直缩着——`],
      clouds:      [`多云，${temp}°，穿件外套出门比较稳妥。`, `阴天，${temp}°，有点压抑，要不要起来走走？`],
      rain:        [`外面下雨，出门记得带伞。`, `下雨天，湿气重，多喝热水。`],
      drizzle:     [`下毛毛雨呢，小心别淋湿。`],
      thunderstorm:[`外面在打雷！关好窗户，手机充电别放床上。`],
      snow:        [`下雪了，出门多穿，别被冻着。`],
      mist:        [`有雾，能见度低，出门小心。`],
      haze:        [`空气质量不好，减少出门或戴口罩。`],
    };
    return pick(pool[main] || [`${city}现在 ${temp}°，注意穿衣。`]);
  }

  const RANDOM_MSGS = [
    `还在啊？`, `有没有在摸鱼～`, `记得喝水。`,
    `眼睛累了就闭一下嘛。`, `好好坐，别窝着。`,
    `肚子饿没？`, `去倒杯热水喝吧。`, `站起来伸个懒腰——`,
    `不要一直皱眉，会老的。`, `有没有想我呢？`,
  ];

  // ── 天气 ─────────────────────────────────────
  let wxData = null, wxTimestamp = 0;
  async function fetchWeather() {
    if (!cfg.apiKey) return null;
    const now = Date.now();
    if (wxData && now - wxTimestamp < 3600000) return wxData;
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cfg.city)}&appid=${cfg.apiKey}&units=metric`);
      const data = await res.json();
      if (data.weather) { wxData = data; wxTimestamp = now; return data; }
    } catch (e) {}
    return null;
  }

  // ── 样式 ─────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cc-btn {
      position: fixed; right: 20px; bottom: 100px;
      width: 50px; height: 50px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(15,15,22,0.88);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      cursor: pointer;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
      transition: transform .18s, box-shadow .18s;
      z-index: 99990; user-select: none;
      image-rendering: pixelated;
    }
    #cc-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(232,140,126,0.25); }

    #cc-panel {
      display: none;
      position: fixed; right: 78px; bottom: 100px;
      width: 272px;
      flex-direction: column;
      background: rgba(12,12,20,0.97);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      overflow: hidden;
      backdrop-filter: blur(28px);
      box-shadow: 0 16px 56px rgba(0,0,0,0.75), 0 0 0 1px rgba(232,140,126,0.06);
      font-family: 'PingFang SC','Microsoft YaHei',sans-serif;
      z-index: 99989;
      animation: ccPanelIn .22s ease;
    }
    @keyframes ccPanelIn {
      from { opacity:0; transform: translateY(8px) scale(.97); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }

    .cc-ph {
      display: flex; align-items: center; gap: 7px;
      padding: 11px 14px;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.055);
      color: #e8d5c0; font-size: 13px; font-weight: 600;
    }
    .cc-ph button {
      margin-left: auto;
      background: none; border: none;
      color: rgba(255,255,255,0.22);
      cursor: pointer; font-size: 12px;
      padding: 2px 6px; border-radius: 4px;
      transition: color .15s, background .15s;
    }
    .cc-ph button:hover { color: #fff; background: rgba(255,255,255,0.09); }

    .cc-pb {
      padding: 12px 14px;
      display: flex; flex-direction: column; gap: 9px;
    }
    .cc-field { display: flex; flex-direction: column; gap: 4px; }
    .cc-field label {
      font-size: 10px; color: rgba(255,255,255,0.3);
      letter-spacing: .7px; text-transform: uppercase;
    }
    .cc-field input[type=text],
    .cc-field input[type=password],
    .cc-field input[type=number] {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 8px; padding: 7px 10px;
      color: #ddc8b2; font-size: 13px;
      outline: none; width: 100%; box-sizing: border-box;
      transition: border-color .18s;
      font-family: inherit;
    }
    .cc-field input:focus { border-color: rgba(232,140,126,.48); }

    .cc-row { display: flex; gap: 12px; align-items: center; }
    .cc-row label {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: rgba(255,255,255,0.45); cursor: pointer;
    }
    .cc-row input[type=checkbox] { accent-color: #e88c7e; width: 13px; height: 13px; }

    .cc-btns { display: flex; gap: 7px; margin-top: 2px; }
    .cc-btns button {
      flex: 1; padding: 7px 4px;
      border-radius: 8px; font-size: 12px; cursor: pointer;
      border: 1px solid rgba(232,140,126,.2);
      background: rgba(232,140,126,.08);
      color: #e88c7e; transition: background .18s;
      font-family: inherit;
    }
    .cc-btns button:hover { background: rgba(232,140,126,.2); }
    .cc-btns .cc-save { background: rgba(232,140,126,.22) !important; font-weight: 600; }

    #cc-bubble {
      display: none;
      position: fixed; right: 78px; bottom: 100px;
      max-width: 250px; z-index: 99991;
    }
    .cc-bi {
      position: relative;
      display: flex; align-items: flex-start; gap: 9px;
      background: rgba(12,12,20,0.97);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 11px 30px 11px 11px;
      backdrop-filter: blur(24px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,140,126,0.07);
    }
    .cc-bico { flex-shrink: 0; margin-top: 1px; image-rendering: pixelated; }
    .cc-btxt {
      font-size: 13px; line-height: 1.7;
      color: #ddc8b2;
      font-family: 'PingFang SC','Microsoft YaHei',sans-serif;
    }
    .cc-bx {
      position: absolute; top: 7px; right: 8px;
      background: none; border: none;
      color: rgba(255,255,255,0.15); font-size: 10px;
      cursor: pointer; padding: 2px 4px;
      transition: color .15s;
    }
    .cc-bx:hover { color: rgba(255,255,255,.5); }

    @keyframes ccIn  { from{opacity:0;transform:translateY(8px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes ccOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(5px) scale(.97)} }
    .cc-aIn  { animation: ccIn  .26s ease forwards; }
    .cc-aOut { animation: ccOut .3s  ease forwards; }
  `;
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────
  const $btn    = document.createElement('div');    $btn.id = 'cc-btn';
  const $panel  = document.createElement('div');    $panel.id = 'cc-panel';
  const $bubble = document.createElement('div');    $bubble.id = 'cc-bubble';
  $btn.innerHTML = crabSvg(32);
  document.body.append($btn, $panel, $bubble);

  // ── 气泡 ─────────────────────────────────────
  let bTimer = null;

  function showBubble(msg) {
    clearTimeout(bTimer);
    $bubble.innerHTML = `
      <div class="cc-bi">
        <div class="cc-bico">${crabSvg(24)}</div>
        <div class="cc-btxt">${msg}</div>
        <button class="cc-bx">✕</button>
      </div>`;
    $bubble.style.display = 'block';
    $bubble.classList.remove('cc-aOut');
    void $bubble.offsetWidth;
    $bubble.classList.add('cc-aIn');
    $bubble.querySelector('.cc-bx').onclick = hideBubble;
    bTimer = setTimeout(hideBubble, 7500);
  }

  function hideBubble() {
    $bubble.classList.remove('cc-aIn');
    $bubble.classList.add('cc-aOut');
    setTimeout(() => { $bubble.style.display = 'none'; $bubble.classList.remove('cc-aOut'); }, 320);
  }

  // ── 配置面板 ──────────────────────────────────
  let panelOpen = false;

  function openPanel() {
    $panel.innerHTML = `
      <div class="cc-ph">
        <span>${crabSvg(18)}</span><span>螃蟹老公设置</span>
        <button id="cc-pc">✕</button>
      </div>
      <div class="cc-pb">
        <div class="cc-field">
          <label>OpenWeatherMap API Key</label>
          <input type="password" id="cc-key" placeholder="在 openweathermap.org 免费注册获取" value="${cfg.apiKey}">
        </div>
        <div class="cc-field">
          <label>城市（英文）</label>
          <input type="text" id="cc-city" placeholder="Petaling Jaya" value="${cfg.city}">
        </div>
        <div class="cc-field">
          <label>提醒间隔（分钟）</label>
          <input type="number" id="cc-ivl" min="5" max="180" value="${cfg.interval}">
        </div>
        <div class="cc-row">
          <label><input type="checkbox" id="cc-rest" ${cfg.rest ? 'checked' : ''}> 休息提醒</label>
          <label><input type="checkbox" id="cc-wx" ${cfg.weather ? 'checked' : ''}> 天气问候</label>
        </div>
        <div class="cc-btns">
          <button id="cc-tw">测试天气</button>
          <button id="cc-tr">测试提醒</button>
          <button class="cc-save" id="cc-sv">保存</button>
        </div>
      </div>`;
    $panel.style.display = 'flex';
    panelOpen = true;

    $panel.querySelector('#cc-pc').onclick = closePanel;
    $panel.querySelector('#cc-sv').onclick = () => {
      cfg.apiKey  = $panel.querySelector('#cc-key').value.trim();
      cfg.city    = $panel.querySelector('#cc-city').value.trim() || 'Petaling Jaya';
      cfg.interval= parseInt($panel.querySelector('#cc-ivl').value) || 30;
      cfg.rest    = $panel.querySelector('#cc-rest').checked;
      cfg.weather = $panel.querySelector('#cc-wx').checked;
      saveCfg();
      wxData = null; // 清除缓存，下次重新拉取
      showBubble('已保存～');
      closePanel();
    };
    $panel.querySelector('#cc-tw').onclick = async () => {
      showBubble('正在获取天气...');
      const d = await fetchWeather();
      showBubble(d ? msgWeather(d.weather[0], Math.round(d.main.temp), cfg.city)
                   : '获取失败，检查 API Key 和城市名？');
    };
    $panel.querySelector('#cc-tr').onclick = () => {
      const m = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      showBubble(msgRest(m));
    };
  }

  function closePanel() {
    $panel.style.display = 'none';
    panelOpen = false;
  }

  // ── 按钮拖拽/点击 ────────────────────────────
  let drag = false, moved = false, ox = 0, oy = 0;

  $btn.addEventListener('mousedown', e => {
    drag = true; moved = false;
    const r = $btn.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    moved = true;
    $btn.style.cssText = `right:auto;bottom:auto;left:${e.clientX - ox}px;top:${e.clientY - oy}px;`;
  });
  document.addEventListener('mouseup', () => {
    if (drag && !moved) {
      panelOpen ? closePanel() : openPanel();
    }
    drag = false;
  });

  // 点击面板外区域关闭
  document.addEventListener('mousedown', e => {
    if (panelOpen && !$panel.contains(e.target) && !$btn.contains(e.target)) closePanel();
  });

  // ── 定时器 ────────────────────────────────────
  setInterval(async () => {
    const mins = Math.round((Date.now() - startTime) / 60000);
    if (mins < 1 || mins % cfg.interval !== 0) return;

    const roll = Math.random();
    if (roll < 0.45 && cfg.rest) {
      showBubble(msgRest(mins));
    } else if (roll < 0.75 && cfg.weather) {
      const d = await fetchWeather();
      showBubble(d ? msgWeather(d.weather[0], Math.round(d.main.temp), cfg.city) : pick(RANDOM_MSGS));
    } else {
      showBubble(pick(RANDOM_MSGS));
    }
  }, 60000);

  // 整点天气问候
  setInterval(async () => {
    const now = new Date();
    if (now.getMinutes() !== 0) return;
    if (!cfg.weather) return;
    const d = await fetchWeather();
    if (d) showBubble(`${now.getHours()} 点了～ ${msgWeather(d.weather[0], Math.round(d.main.temp), cfg.city)}`);
  }, 60000);

  // 启动欢迎
  setTimeout(() => showBubble('酒馆开门了～'), 2500);

})();
