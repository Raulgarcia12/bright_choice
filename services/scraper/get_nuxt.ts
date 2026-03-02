import * as fs from 'fs';
import * as cheerio from 'cheerio';

async function run() {
    const html = fs.readFileSync('rab_indoor.html', 'utf8');
    const $ = cheerio.load(html);
    const scripts = $('script').toArray();
    let nuxtData = '';

    for (const s of scripts) {
        const text = $(s).html();
        if (text && text.includes('window.__REACT_DATA__=') || text?.includes('__NUXT__')) {
            nuxtData = text;
            break;
        }
    }

    if (!nuxtData) {
        // Just extract all URLs matching /feature/
        const matches = html.match(/\/feature\/[a-zA-Z0-9-_]+/gi);
        console.log('Regex /feature/ matches:', matches ? Array.from(new Set(matches)) : 0);

        // Let's also try to find any endpoints starting with /services/
        const services = html.match(/\/services\/[a-zA-Z0-9-_/]+/gi);
        console.log('Regex /services/ matches:', services ? Array.from(new Set(services)) : 0);

        fs.writeFileSync('nuxt_data.js', JSON.stringify({ error: 'no nuxt/react data block found' }));
    } else {
        fs.writeFileSync('nuxt_data.js', nuxtData);
        console.log('Saved nuxt_data.js, length:', nuxtData.length);
    }
}
run();
