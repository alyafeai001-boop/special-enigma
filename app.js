const STORAGE_KEY = 'shopfyi-products-v1';
const CONTENT_COUNT_KEY = 'shopfyi-content-count-v1';
const currencySymbols = { USD: '$', CAD: 'CA$', EUR: '€', GBP: '£', AUD: 'A$' };
const form = document.querySelector('#analyzer-form');
const contentForm = document.querySelector('#content-form');
let contentMode = 'seo';
let products = readStored(STORAGE_KEY, []);
let contentCount = Number(readStored(CONTENT_COUNT_KEY, 0)) || 0;

function readStored(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
function saveProducts() { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }
function money(value, currency = 'USD') {
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${Number(value).toFixed(2)}`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function updateMetrics() {
  document.querySelector('#metric-count').textContent = products.length;
  document.querySelector('#metric-content').textContent = contentCount;
  const average = products.length ? products.reduce((sum, product) => sum + product.margin, 0) / products.length : null;
  document.querySelector('#metric-margin').textContent = average === null ? '—' : `${average.toFixed(1)}%`;
}
function renderProducts() {
  const empty = document.querySelector('#empty-state');
  const tableWrap = document.querySelector('#product-table-wrap');
  const clearButton = document.querySelector('#clear-products');
  empty.classList.toggle('hidden', products.length > 0);
  tableWrap.classList.toggle('hidden', products.length === 0);
  clearButton.classList.toggle('hidden', products.length === 0);
  document.querySelector('#product-table-body').innerHTML = products.map((product) => `
    <tr><td>${escapeHTML(product.name)}</td><td>${money(product.cost, product.currency)}</td><td>${money(product.price, product.currency)}</td><td>${money(product.profit, product.currency)}</td><td class="margin-cell">${product.margin.toFixed(1)}%</td><td><button class="delete-row" type="button" data-delete="${escapeHTML(product.id)}" aria-label="Remove ${escapeHTML(product.name)}">×</button></td></tr>
  `).join('');
  updateMetrics();
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = data.get('name').trim();
  const cost = Number(data.get('cost'));
  const price = Number(data.get('price'));
  const shipping = Number(data.get('shipping')) || 0;
  const fees = Number(data.get('fees')) || 0;
  const targetMargin = Number(data.get('targetMargin')) || 50;
  const currency = data.get('currency');
  const totalCost = cost + shipping + fees;
  if (price <= 0 || totalCost < 0) return;
  const profit = price - totalCost;
  const margin = (profit / price) * 100;
  const targetPrice = totalCost / (1 - targetMargin / 100);
  let status = 'Healthy margin';
  let statusClass = '';
  let insight = `At ${money(price, currency)}, you keep ${money(profit, currency)} per unit before other business expenses.`;
  if (profit <= 0) {
    status = 'Selling at a loss'; statusClass = 'low';
    insight = `Your estimated unit costs exceed your selling price by ${money(Math.abs(profit), currency)}. Consider raising the price or reducing costs.`;
  } else if (margin < 25) {
    status = 'Margin looks tight'; statusClass = 'warn';
    insight = `Your gross margin is under 25%. Check whether your price covers overhead, discounts, returns, and advertising.`;
  }
  let targetNote = '';
  if (targetPrice > 0 && targetPrice < 1000000) {
    targetNote = ` Target price for a ${targetMargin}% margin: ${money(targetPrice, currency)}.`;
  }
  const result = document.querySelector('#analysis-result');
  result.innerHTML = `<div class="result-top"><strong>${escapeHTML(name)} · pricing snapshot</strong><span class="health-pill ${statusClass}">${status}</span></div><div class="result-stats"><div class="result-stat"><span>Gross profit / unit</span><strong>${money(profit, currency)}</strong></div><div class="result-stat"><span>Gross margin</span><strong>${margin.toFixed(1)}%</strong></div><div class="result-stat"><span>Markup</span><strong>${totalCost > 0 ? `${((profit / totalCost) * 100).toFixed(1)}%` : '∞'}</strong></div></div><p class="insight-text">${escapeHTML(insight)}${targetNote ? `<span class="target-note">${escapeHTML(targetNote)}</span>` : ''} Gross margin is based on entered unit costs only, not a full accounting of overhead or taxes.</p>`;
  result.classList.remove('hidden');
  const existing = products.findIndex((product) => product.name.toLowerCase() === name.toLowerCase());
  const product = { id: existing >= 0 ? products[existing].id : (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`), name, cost: totalCost, price, profit, margin, currency };
  if (existing >= 0) products[existing] = product; else products.unshift(product);
  saveProducts(); renderProducts();
});

document.querySelector('#product-table-body').addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  products = products.filter((product) => product.id !== button.dataset.delete);
  saveProducts(); renderProducts();
});
document.querySelector('#clear-products').addEventListener('click', () => {
  if (!window.confirm('Remove all saved product analyses from this browser?')) return;
  products = []; saveProducts(); renderProducts();
});

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  contentMode = tab.dataset.tab;
  document.querySelectorAll('.tab').forEach((item) => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  document.querySelector('#generate-button').innerHTML = contentMode === 'seo' ? '<span>✦</span> Generate SEO description' : '<span>✦</span> Generate marketing ideas';
  document.querySelector('#content-result').classList.add('hidden');
}));
function sentenceCase(value) { return value.trim().replace(/\s+/g, ' '); }
function makeSeo(name, features, audience, category) {
  const niceName = sentenceCase(name);
  const featureList = features.length ? features.slice(0, 4) : ['thoughtful design', 'everyday quality'];
  const categoryPhrase = category ? sentenceCase(category).toLowerCase() : 'everyday essential';
  const audiencePhrase = audience ? `Made for ${sentenceCase(audience).toLowerCase()}, ` : '';
  const title = `${niceName} | ${categoryPhrase.charAt(0).toUpperCase()}${categoryPhrase.slice(1)}`;
  const description = `${audiencePhrase}${niceName} brings together ${featureList.join(', ').replace(/, ([^,]*)$/, ' and $1')}. Designed to make your day a little better, it’s an easy choice for quality you’ll reach for again and again. Find your new favorite today.`;
  return { title, description };
}
function makeMarketing(name, features, audience, category) {
  const niceName = sentenceCase(name);
  const target = audience ? sentenceCase(audience).toLowerCase() : 'your customers';
  const categoryPhrase = category ? sentenceCase(category).toLowerCase() : 'product';
  const detail = features[0] ? sentenceCase(features[0]) : 'the detail that makes it special';
  return `1. The “little upgrade” reel\nShow ${niceName} in a real daily routine. Open with the small frustration it solves, then reveal ${detail.toLowerCase()} in action. CTA: “Meet your new favorite ${categoryPhrase}.”\n\n2. A customer’s-eye carousel\nCreate a 3-slide post: the first impression, a close-up of ${detail.toLowerCase()}, and the product in use. Caption it for ${target} with a question that invites replies.\n\n3. A thoughtful welcome offer\nFeature ${niceName} in a short email to new subscribers. Pair a helpful tip about choosing a ${categoryPhrase} with a limited-time first-order perk. Keep the offer sustainable for your margins.\n\n4. Social proof spotlight\nAsk a recent buyer what they love most about ${niceName}. Share their response (with permission) alongside a product photo and a direct link.`;
}
contentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contentForm.reportValidity()) return;
  const name = document.querySelector('#content-product').value.trim();
  const features = document.querySelector('#features').value.split(',').map((feature) => feature.trim()).filter(Boolean);
  const audience = document.querySelector('#audience').value;
  const category = document.querySelector('#category').value;
  const result = document.querySelector('#content-result');
  let heading; let text;
  if (contentMode === 'seo') {
    const seo = makeSeo(name, features, audience, category);
    heading = 'SEO title + meta description';
    text = `${seo.title}\n\n${seo.description}`;
  } else {
    heading = 'Marketing campaign starters';
    text = makeMarketing(name, features, audience, category);
  }
  result.innerHTML = `<h4>${heading}</h4><p>${escapeHTML(text)}</p><div class="generated-meta">${contentMode === 'seo' ? `${text.length} characters · Edit to fit your brand voice` : '4 campaign starters · Tailor to your audience and budget'}</div><div class="generated-actions"><button class="copy-button" type="button" id="copy-content">Copy draft</button></div>`;
  result.classList.remove('hidden');
  contentCount += 1;
  localStorage.setItem(CONTENT_COUNT_KEY, JSON.stringify(contentCount));
  updateMetrics();
  document.querySelector('#copy-content').addEventListener('click', async (clickEvent) => {
    const button = clickEvent.currentTarget;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied!';
    } catch {
      button.textContent = 'Select and copy';
    }
  });
});
renderProducts();
