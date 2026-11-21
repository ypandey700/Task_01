import { validateRecords, filterRecords } from './board-core.js';

const $ = selector => document.querySelector(selector);
const domains = ['Full Stack Development', 'UI/UX', 'Data Analytics', 'Cyber Security'];
const storageKey = 'firststep.saved.v1';
let records = [], saved = new Set(), storageAvailable = true, lastTrigger;
try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(value)) saved = new Set(value.filter(id => typeof id === 'string')); } catch { storageAvailable = false; }
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  location: '<circle cx="12" cy="9" r="2.5"/><path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const money = value => value ? `₹${value.toLocaleString('en-IN')}` : 'Unpaid';
const dateLabel = value => new Intl.DateTimeFormat('en-IN', {day:'numeric', month:'short'}).format(new Date(value));
function announce(text) { $('#notification').textContent = text; }
function saveCount() { $('#saved-count').textContent = saved.size; }
function getFilters() {
  return {query: $('#search').value, domains: [...document.querySelectorAll('[name="domain"]:checked')].map(el => el.value), mode: $('#mode').value, paid: $('#paid').checked, savedOnly: $('#saved-only').checked, saved: [...saved], sort: $('#sort').value};
}
function showState(title, message, action, callback) {
  const state = $('#state'); state.replaceChildren();
  const heading = document.createElement('h3'); heading.textContent = title;
  const paragraph = document.createElement('p'); paragraph.textContent = message;
  const button = document.createElement('button'); button.type = 'button'; button.className = 'primary'; button.textContent = action; button.addEventListener('click', callback);
  state.append(heading, paragraph, button); state.hidden = false;
}
function card(item) {
  const isSaved = saved.has(item.id);
  return `<article class="card" data-domain="${escape(item.domain)}" aria-labelledby="title-${escape(item.id)}">
    <div class="card-top"><span class="company-logo" aria-hidden="true" style="background:${item.color}">${escape(item.logo)}</span><div><div class="company-name">${escape(item.company)}</div><div class="posted">Posted <time datetime="${escape(item.posted)}">${dateLabel(item.posted)}</time></div></div><button class="save-button" data-save="${escape(item.id)}" aria-label="Save ${escape(item.title)} at ${escape(item.company)}" aria-pressed="${isSaved}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z"/></svg></button></div>
    <h3 id="title-${escape(item.id)}">${escape(item.title)}</h3><div class="card-tags"><span class="tag domain">${escape(item.domain)}</span><span class="tag">${escape(item.mode)}</span></div>
    <div class="card-meta"><div class="meta-line">${icon('location')}${escape(item.location)}</div><div class="meta-line">${icon('clock')}${escape(item.duration)}<span class="separator">·</span>Internship</div></div>
    <div class="card-bottom"><span class="stipend">${money(item.stipend)} ${item.stipend ? '<small>/ month</small>' : ''}</span><button class="detail-button" data-details="${escape(item.id)}" aria-label="View details for ${escape(item.title)} at ${escape(item.company)}">View details</button></div></article>`;
}
function render() {
  const filters = getFilters(), matches = filterRecords(records, filters);
  $('#state').hidden = true;
  $('#result-count').innerHTML = `<strong>${matches.length} ${matches.length === 1 ? 'internship' : 'internships'}</strong> ${filters.savedOnly ? 'in your saved list' : 'to get you started'}`;
  $('#cards').innerHTML = matches.map(card).join('');
  $('#active-filters').replaceChildren();
  for (const domain of filters.domains) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = `${domain} ×`; button.setAttribute('aria-label', `Remove ${domain} filter`);
    button.addEventListener('click', () => { document.querySelector(`[name="domain"][value="${domain}"]`).checked = false; render(); document.querySelector(`[name="domain"][value="${domain}"]`).focus(); });
    $('#active-filters').append(button);
  }
  if (!matches.length) showState(filters.savedOnly ? 'Your shortlist starts here.' : 'No matches. Plenty of possibilities.', filters.savedOnly ? 'Save a role with the bookmark button, or adjust your filters to see your saved internships.' : 'Try a different keyword or clear your filters to explore all internships.', 'Explore all internships', reset);
}
function reset() {
  $('#search-form').reset(); document.querySelectorAll('.filters input').forEach(input => input.checked = false); $('#sort').value = 'newest'; render(); $('#search').focus();
}
async function load() {
  $('#state').hidden = true; $('#cards').innerHTML = ''; $('#cards').setAttribute('aria-busy', 'true'); $('#result-count').textContent = 'Loading opportunities…';
  try {
    const response = await fetch('./data/internships.json', {cache:'no-cache'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    records = validateRecords(await response.json());
    saved = new Set([...saved].filter(id => records.some(item => item.id === id))); saveCount();
    $('#domain-filters').innerHTML = '<legend>DOMAIN</legend>' + domains.map(domain => `<label class="check-row"><input type="checkbox" name="domain" value="${domain}">${domain}<span class="domain-number">${records.filter(item => item.domain === domain).length}</span></label>`).join('');
    render();
  } catch {
    $('#result-count').textContent = 'Opportunities unavailable';
    showState('A small detour.', 'We couldn’t load the internships. Check your connection and try again.', 'Try again', load);
  } finally { $('#cards').setAttribute('aria-busy', 'false'); }
}
$('#search-form').addEventListener('submit', event => { event.preventDefault(); if (records.length) render(); });
$('#search').addEventListener('input', () => { if (records.length) render(); });
$('#mode').addEventListener('change', () => { if (records.length) render(); });
$('.filters').addEventListener('change', () => { if (records.length) render(); });
$('#sort').addEventListener('change', () => { if (records.length) render(); });
$('#clear').addEventListener('click', () => { if (records.length) reset(); });
$('#saved-nav').addEventListener('click', () => { if (!records.length) return; reset(); $('#saved-only').checked = true; render(); $('#opportunities').scrollIntoView(); $('#saved-only').focus({preventScroll:true}); });
$('#cards').addEventListener('click', event => {
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) {
    const id = saveButton.dataset.save, item = records.find(item => item.id === id);
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    try { localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch { storageAvailable = false; }
    saveCount(); announce(`${item.title} ${saved.has(id) ? 'saved' : 'removed from saved internships'}.${storageAvailable ? '' : ' Saved roles are available for this session only.'}`);
    if ($('#saved-only').checked) { const buttons = [...document.querySelectorAll('[data-save]')]; const index = buttons.indexOf(saveButton); render(); const next = document.querySelectorAll('[data-save]')[Math.min(index, saved.size - 1)]; (next || $('#saved-only')).focus(); }
    else saveButton.setAttribute('aria-pressed', String(saved.has(id)));
    return;
  }
  const detailButton = event.target.closest('[data-details]');
  if (!detailButton) return;
  const item = records.find(item => item.id === detailButton.dataset.details); lastTrigger = detailButton;
  $('#detail-content').innerHTML = `<h2 id="detail-title">${escape(item.title)}</h2><p>${escape(item.company)} · ${escape(item.location)} · ${escape(item.mode)}</p><div class="card-tags"><span class="tag">${escape(item.domain)}</span><span class="tag">${escape(item.duration)}</span><span class="tag">${money(item.stipend)}${item.stipend ? ' / month' : ''}</span></div><h3>About the opportunity</h3><p>${escape(item.description)}</p><h3>Skills you’ll explore</h3><ul>${item.skills.map(skill => `<li>${escape(skill)}</li>`).join('')}</ul>`;
  $('#details').showModal(); $('#close-dialog').focus();
});
$('#close-dialog').addEventListener('click', () => $('#details').close());
$('#details').addEventListener('close', () => lastTrigger?.focus());
saveCount(); load();
