(() => {
  document.querySelectorAll('[data-copy-prompt]').forEach(button => {
    button.addEventListener('click', async () => {
      const field = document.getElementById(button.dataset.copyPrompt);
      const status = button.parentElement.querySelector('.source-copy-status');
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(field.value);
        else { field.closest('details').open = true; field.focus(); field.select(); if (!document.execCommand('copy')) throw new Error('copy'); }
        document.dispatchEvent(new CustomEvent('stella:copy-success',{detail:/mac$/i.test(button.dataset.copyPrompt)?'mac':'windows'}));
        status.textContent = '已复制，请粘贴到这台电脑上的 AI 助手对话框。';
      } catch (_) { field.closest('details').open = true; field.focus(); field.select(); status.textContent = '请在展开的指令中全选并手动复制。'; }
    });
  });
})();
