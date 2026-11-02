/* Apply an explicit preference before the page paints; cream/green is the default. */
(() => {
  const key = 'ericavn-display-theme';
  let theme = 'light';
  try {
    if (localStorage.getItem(key) === 'dark') theme = 'dark';
  } catch (_) { /* The switch still works when storage is unavailable. */ }
  document.documentElement.dataset.theme = theme;

  function init() {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    function update() {
      const dark = document.documentElement.dataset.theme === 'dark';
      button.textContent = dark ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    button.hidden = false;
    update();
    button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(key, next); } catch (_) { /* No persistence available. */ }
      update();
    });
    window.addEventListener('storage', event => {
      if (event.key === key || event.key === null) {
        document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
        update();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
