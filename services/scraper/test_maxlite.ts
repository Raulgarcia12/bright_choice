import * as cheerio from 'cheerio';

function extractSpecs(text: string, title: string) {
    const specs: Record<string, string> = {};

    // Convert html to text
    const $ = cheerio.load(text);
    const plainText = $.text().replace(/\s+/g, ' ');

    const fullText = title + ' ' + plainText;

    // Watts: "18 Watt" or "10W/18W/23W" or "10W"
    const wattMatch = fullText.match(/(\d+(?:\.\d+)?)\s*(?:W|Watt|Watts)\b/i);
    if (wattMatch) specs['Watts'] = wattMatch[1];

    // Lumens: "2000 lumens" or "2,000 lm"
    const lmMatch = fullText.match(/(\d{1,3}(?:,\d{3})+|\d{4,5})\s*(?:lm|lumens|Lumen)\b/i);
    if (lmMatch) specs['Lumens'] = lmMatch[1].replace(/,/g, '');

    // CCT: "2700K", "3000K/4000K/5000K" -> we take the first or the whole string
    const cctMatch = fullText.match(/(?:2700K|3000K|3500K|4000K|5000K|6000K)(?:\s*\/\s*(?:2700K|3000K|3500K|4000K|5000K|6000K))*/ig);
    if (cctMatch) specs['CCT'] = cctMatch[0].split('/')[0]; // taking first one or default

    // CRI
    const criMatch = fullText.match(/CRI\s*(?:>|:|-|is)?\s*(\d{2})/i);
    if (criMatch) specs['CRI'] = criMatch[1];

    // Lifespan
    const lifeMatch = fullText.match(/(\d{2,3}(?:,\d{3})+)\s*(?:hours|hrs|hr)/i) ||
        fullText.match(/L70[^\d]*(\d{2,3}(?:,\d{3})+)/i);
    if (lifeMatch) specs['Lifespan'] = lifeMatch[1] + ' hours';

    // Warranty
    const warMatch = fullText.match(/(\d+)\s*(?:year|yr)\s*(?:limited\s*)?warranty/i);
    if (warMatch) specs['Warranty'] = warMatch[1] + ' years';

    // Voltage
    const vMatch = fullText.match(/(\d{3}(?:-\d{3})?)\s*(?:V|VAC|Volts)\b/i);
    if (vMatch) specs['Voltage'] = vMatch[1];

    return specs;
}

async function run() {
    const url = 'https://greenlightingwholesale.com/collections/maxlite/products.json?limit=25';
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();

    for (let i = 0; i < 5; i++) {
        const p = data.products[i];
        console.log('\n---', p.title, '---');
        console.log(extractSpecs(p.body_html, p.title));
    }
}

run();
