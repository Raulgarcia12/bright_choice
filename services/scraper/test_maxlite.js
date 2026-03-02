import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function test() {
    const url = 'https://greenlightingwholesale.com/collections/maxlite?view=all';
    // Often '&page=1' or '?view=all' works for shopify without limits, we'll see.
    // Actually, we'll just check .product-item or something.

    const res = await fetch('https://greenlightingwholesale.com/collections/maxlite', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    console.log('Title:', $('title').text());
    console.log('Product items length:', $('.product-item, .grid__item, .product-card').length);

    // Try to find the common product selector
    const links = $('a').toArray().map(el => $(el).attr('href')).filter(l => l && l.includes('/products/'));
    // Unique product links
    const uniqueProducts = [...new Set(links)];
    console.log('Found product links:', uniqueProducts.length);
    if (uniqueProducts.length > 0) {
        console.log('Sample link:', uniqueProducts[0]);
    }

    // Look for pagination
    const pagination = $('.pagination, .paginate, nav.pagination').text().replace(/\s+/g, ' ');
    console.log('Pagination text:', pagination.substring(0, 100));
}

test();
