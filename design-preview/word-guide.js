(() => {
  const search = document.getElementById('word-search');
  if (!search) return;
  const entries = [...document.querySelectorAll('.word-entry')];
  const searchText = new Map(entries.map(entry => [entry, [...entry.children].filter(child => !child.classList.contains('word-related')).map(child => child.textContent).join(' ').toLocaleLowerCase()]));
  const groups = [...document.querySelectorAll('.word-group')];
  const count = document.getElementById('word-count');
  document.querySelector('.word-search').hidden = false;
  const filter = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let matches = 0;
    entries.forEach(entry => {
      entry.hidden = !searchText.get(entry).includes(query);
      if (!entry.hidden) matches++;
    });
    groups.forEach(group => { group.hidden = ![...group.querySelectorAll('.word-entry')].some(entry => !entry.hidden); });
    count.textContent = query ? `Showing ${matches} of ${entries.length} words.` : `${entries.length} words explained.`;
    document.getElementById('no-word-results').hidden = matches !== 0;
  };
  search.addEventListener('input', filter);
  document.getElementById('clear-word-search').addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
  document.querySelectorAll('.word-category-links a, .word-index a, .word-related a').forEach(link => link.addEventListener('click', () => { search.value = ''; filter(); const index = link.closest('.word-alphabetical-index'); if (index) index.open = false; }));
  // Only known local guides can become a return destination.
  const guides = {
    'networks-and-travel':'Doctors, networks, and care in other states.',
    'medicaid':'What is Medicaid?', 'medicaid-by-state':'Find your state’s Medicaid program.',
    'turning-65':'Turning 65? Start here.', 'what-is-medicare':'What is Medicare?',
    'parts-of-medicare':'What do A, B, C, and D mean?', 'original-medicare':'What is Original Medicare?',
    'medicare-advantage':'What is Medicare Advantage?', 'medicare-supplement':'What is Medigap?',
    'prescription-drug-coverage':'How does Medicare cover medicines?', 'medicare-costs':'What might I have to pay?',
    'extra-help':'What is Extra Help?', 'medicare-and-medicaid':'Can I have Medicare and Medicaid?',
    'compare-coverage':'How do my coverage choices compare?', 'plan-differences':'Why are Medicare plans different?',
    'extra-benefits':'What extra benefits might a plan offer?', 'coverage-by-location':'Why does my address matter?',
    'enrollment-periods':'When can I sign up or change plans?'
  };
  const from = new URLSearchParams(window.location.search).get('from');
  if (Object.prototype.hasOwnProperty.call(guides, from)) {
    const link = document.getElementById('return-to-guide');
    link.href = `${from}.html`;
    link.textContent = `← Back to: ${guides[from]}`;
    document.getElementById('return-context').hidden = false;
  }
})();
