(() => {
  const root = document.querySelector('[data-walkthrough]');
  const tools = window.StellaScrollPreview;
  if (document.documentElement.classList.contains('embedded-guide') || !root || !tools || !('IntersectionObserver' in window) ||
      !window.CSS?.supports('position', 'sticky')) return;

  const scenes = [
    {
      title: '复制安装指令', detail: '选择 Mac 或 Windows',
      heading: '先复制适合你电脑的指令',
      tip: '正式安装指令在演示下方，可以按你的电脑系统复制。',
      art: `<div class="walk-platforms"><span>Mac</span><span>Windows</span></div>
        <div class="walk-clipboard"><strong>复制 Mac 安装指令</strong><span data-copy-feedback>✓ 已复制</span></div>`
    },
    {
      title: '粘贴并发送', detail: '交给本机 AI 助手',
      heading: '将指令交给能操作电脑的 AI 助手',
      tip: '打开工作或智能体模式。粘贴指令后，点击发送。',
      art: `<div class="walk-chat"><div class="walk-chat-message" data-chat-message>请在这台电脑上安装 Stella，检查环境并验证结果。</div>
        <div class="walk-compose"><span data-composer-placeholder>在这里粘贴指令 · ⌘V / Ctrl+V</span>
        <strong data-composer-text>请在这台电脑上安装 Stella，检查环境并验证结果。</strong><b data-send>发送</b></div></div>`
    },
    {
      title: '助手执行安装', detail: '按需确认权限',
      heading: '查看安装进度并按需确认',
      tip: '安装时间因电脑和网络而异。遇到权限请求，请先阅读助手的说明。',
      art: `<ol class="walk-process"><li>检查电脑环境</li><li>获取源码并准备依赖</li><li>安装并编译 Stella</li><li>启动客户端并检查</li></ol>`
    },
    {
      title: '验证并打开', detail: '确认安装结果',
      heading: '验证安装结果，再打开 Stella',
      tip: '请以助手在你的电脑上验证的结果为准。',
      art: `<div class="walk-result"><img src="assets/favicon.svg" alt="" width="40" height="40">
        <div><strong>Stella 已安装</strong><small>客户端已打开并完成基本验证</small></div><span>✓</span></div>`
    }
  ];

  const stage = document.createElement('div');
  stage.className = 'walk-stage';
  stage.hidden = true;
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `
    <div class="walk-lead"><div><p>安装演示</p><h3>从一条指令，到打开 Stella</h3></div>
      <span>由滚动推进</span></div>
    <div class="walk-layout">
      <ol class="walk-nav">${scenes.map(({ title, detail }) => `<li><strong>${title}</strong><small>${detail}</small></li>`).join('')}</ol>
      <div class="walk-player">
        <div class="walk-top"><span>模拟画面</span><span data-walk-counter></span></div>
        <div class="walk-meter"><i></i></div>
        <div class="walk-screen">${scenes.map(({ heading, tip, art }, index) => `
          <article class="walk-scene" data-scene="${index}" hidden>
            <h4>${heading}</h4><p>${tip}</p><div class="walk-art">${art}</div>
          </article>`).join('')}</div>
      </div>
    </div>`;
  const fallback = root.querySelector('.walk-fallback');
  root.append(stage);

  const compact = matchMedia('(min-width: 720px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)');
  const panels = [...stage.querySelectorAll('[data-scene]')];
  const steps = [...stage.querySelectorAll('.walk-nav li')];
  const counter = stage.querySelector('[data-walk-counter]');
  const progressBar = stage.querySelector('.walk-meter i');
  const copy = stage.querySelector('[data-copy-feedback]');
  const chat = stage.querySelector('[data-chat-message]');
  const placeholder = stage.querySelector('[data-composer-placeholder]');
  const composed = stage.querySelector('[data-composer-text]');
  const send = stage.querySelector('[data-send]');
  const tasks = [...stage.querySelectorAll('.walk-process li')];
  const result = stage.querySelector('.walk-result');
  let active = -1;

  function render(progress) {
    if (!compact.matches) return;
    const position = progress * scenes.length;
    const index = Math.min(scenes.length - 1, Math.floor(position));
    const within = position - index;

    if (active !== index) {
      active = index;
      panels.forEach((panel, i) => { panel.hidden = i !== index; });
      steps.forEach((step, i) => step.classList.toggle('is-current', i === index));
      counter.textContent = `0${index + 1} / 0${scenes.length}`;
    }

    progressBar.style.transform = `scaleX(${within})`;
    const ramp = tools.ramp;
    if (index === 0) {
      copy.style.opacity = ramp(within, .26, .43);
      copy.closest('.walk-clipboard').style.setProperty('--walk-press', ramp(within, .18, .28) - ramp(within, .29, .40));
    } else if (index === 1) {
      const paste = ramp(within, .14, .27);
      const sent = ramp(within, .56, .74);
      chat.style.opacity = sent;
      chat.style.transform = `translateY(${(1 - sent) * 14}px)`;
      const hasDraft = within >= .14 && sent < 1;
      placeholder.style.visibility = hasDraft ? 'hidden' : 'visible';
      composed.style.visibility = hasDraft ? 'visible' : 'hidden';
      composed.style.clipPath = `inset(0 ${(1 - paste) * 100}% 0 0)`;
      composed.style.opacity = 1 - sent;
      send.classList.toggle('is-sent', within >= .66);
    } else if (index === 2) {
      tasks.forEach((task, i) => task.classList.toggle('is-done', within >= [0.13, 0.33, 0.56, 0.85][i]));
    } else {
      const verified = ramp(within, .08, .36);
      result.style.opacity = verified;
      result.style.transform = `translateY(${(1 - verified) * 13}px)`;
    }
  }

  const refresh = tools.track(root, stage, render);

  function sync() {
    root.classList.toggle('is-scroll-walk', compact.matches);
    stage.hidden = !compact.matches;
    fallback.classList.toggle('walk-fallback-sr', compact.matches);
    refresh();
  }

  compact.addEventListener('change', sync);
  sync();
})();
