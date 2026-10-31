(() => {
  document.querySelectorAll('[data-copy-prompt]').forEach(button => {
    button.addEventListener('click', async () => {
      const field = document.getElementById(button.dataset.copyPrompt);
      const status = button.parentElement.querySelector('.source-copy-status');
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(field.value);
        else { field.focus(); field.select(); if (!document.execCommand('copy')) throw new Error('copy'); }
        status.textContent = '已复制，请粘贴到 AI Agent。';
      } catch (_) { field.focus(); field.select(); status.textContent = '请选择并手动复制上方指令。'; }
    });
  });
})();
