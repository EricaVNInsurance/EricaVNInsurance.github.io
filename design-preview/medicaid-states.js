(() => {
  const search = document.getElementById('state-search');
  if (!search) return;
  const entries = [...document.querySelectorAll('.state-entry')];
  const count = document.getElementById('state-count');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const texts = entries.map(entry => normalize(entry.textContent));
  const filter = () => {
    const query = normalize(search.value);
    let matches = 0;
    entries.forEach((entry, index) => {
      entry.hidden = !texts[index].includes(query);
      if (!entry.hidden) matches++;
    });
    count.textContent = query ? `${matches} of 51 locations shown.` : '50 states and Washington, D.C.';
    document.getElementById('no-state-results').hidden = matches !== 0;
  };
  document.querySelector('.state-search').hidden = false;
  document.querySelector('.state-search').addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', filter);
  document.getElementById('clear-state-search').addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
})();
