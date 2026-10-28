(() => {
  const video = document.querySelector('#player');
  const start = document.querySelector('#start');
  const status = document.querySelector('#play-status');
  const label = document.querySelector('#start-label');
  const chapters = [...document.querySelectorAll('[data-seek]')];
  let started = false;
  let requestedTime = Number(new URL(location.href).searchParams.get('t'));
  if (!Number.isFinite(requestedTime) || requestedTime < 0) requestedTime = 0;
  async function play() {
    try { await video.play(); status.textContent = ''; }
    catch (_) { if (!started) { start.hidden = false; status.textContent = '点击播放，开始观看。'; } }
  }
  function seek(time) {
    if (!Number.isFinite(video.duration)) { requestedTime = time; return; }
    video.currentTime = Math.max(0, Math.min(time, video.duration - 0.05));
    requestedTime = 0;
    play();
  }
  start.addEventListener('click', () => { video.muted = false; play(); });
  video.addEventListener('play', () => { started = true; start.hidden = true; status.textContent = ''; });
  video.addEventListener('ended', () => { label.textContent = '重新播放'; start.hidden = false; });
  video.addEventListener('error', () => { status.textContent = '视频暂时无法加载，请刷新页面后重试。'; });
  video.addEventListener('loadedmetadata', () => { if (requestedTime > 0) seek(requestedTime); });
  video.addEventListener('timeupdate', () => {
    let active = -1;
    chapters.forEach((button, index) => { if (video.currentTime >= Number(button.dataset.seek)) active = index; });
    chapters.forEach((button, index) => { if (index === active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current'); });
  });
  chapters.forEach(button => button.addEventListener('click', () => { seek(Number(button.dataset.seek)); }));
  play();
})();
