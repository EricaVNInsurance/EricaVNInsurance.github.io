(() => {
  const dropdowns = [...document.querySelectorAll('.learn-dropdown')];
  document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', () => {
    link.closest('.mobile-nav').open = false;
    dropdowns.forEach(menu => { menu.open = false; });
  }));
  dropdowns.forEach(menu => menu.addEventListener('toggle', () => {
    if (menu.open) dropdowns.filter(other => other !== menu).forEach(other => { other.open = false; });
  }));
  document.addEventListener('click', event => {
    dropdowns.forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
    const mobile = document.querySelector('.mobile-nav');
    if (mobile && !mobile.contains(event.target)) mobile.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const dropdown = dropdowns.find(menu => menu.open);
    const menu = dropdown || document.querySelector('.mobile-nav[open]');
    if (menu) { menu.open = false; menu.querySelector('summary').focus(); }
  });
})();
