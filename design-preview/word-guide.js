(() => {
  const search = document.getElementById('word-search');
  if (!search) return;
  const entries = [...document.querySelectorAll('.word-entry')];
  const groups = [...document.querySelectorAll('.word-group')];
  const count = document.getElementById('word-count');
  document.querySelector('.word-search').hidden = false;
  const filter = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let matches = 0;
    entries.forEach(entry => {
      entry.hidden = !entry.textContent.toLocaleLowerCase().includes(query);
      if (!entry.hidden) matches++;
    });
    groups.forEach(group => { group.hidden = ![...group.querySelectorAll('.word-entry')].some(entry => !entry.hidden); });
    count.textContent = query ? `${matches} of ${entries.length} words match your search.` : `${entries.length} words explained.`;
    document.getElementById('no-word-results').hidden = matches !== 0;
  };
  search.addEventListener('input', filter);
  document.getElementById('clear-word-search').addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
  document.querySelectorAll('.word-category-links a').forEach(link => link.addEventListener('click', () => { search.value = ''; filter(); }));
  // Only known local guides can become a return destination.
  const guides = {
    'turning-65':'Turning 65? Start here.', 'what-is-medicare':'What is Medicare?',
    'parts-of-medicare':'What do A, B, C, and D mean?', 'original-medicare':'What is Original Medicare?',
    'medicare-advantage':'What is Medicare Advantage?', 'medicare-supplement':'What is Medigap?',
    'prescription-drug-coverage':'How does Medicare cover medicines?', 'medicare-costs':'What might I have to pay?',
    'extra-help':'What is Extra Help?', 'medicare-and-medicaid':'Can I have Medicare and Medicaid?',
    'compare-coverage':'How do my coverage choices compare?', 'plan-differences':'Why are Medicare plans different?',
    'extra-benefits':'What about dental, vision, and hearing?', 'coverage-by-location':'Why does my address matter?',
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
