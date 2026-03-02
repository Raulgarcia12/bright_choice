import * as cheerio from 'cheerio';

async function testProduct() {
    const url = 'https://greenlightingwholesale.com/products/maxlite-2-residential-recessed-downlight-color-selectable-2700k-3000k-3500k-4000k-5000k-120-277v';
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    console.log('Title:', $('title').text());

    // Look for Shopify JS data
    const scripts = $('script').toArray().map(s => $(s).html());
    const productDataScript = scripts.find(s => s && s.includes('var meta = {"product":'));
    if (productDataScript) {
        console.log('Found meta.product JSON!');
        const match = productDataScript.match(/"product":({.*})/);
        // It might be too large, just check keys
    }

    // Look for specs directly in the table/ul
    console.log('Specs from table/ul:');
    $('li, tr').each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text.match(/watt[s]?|lumen[s]?|cct|cri|life|warranty/i)) {
            console.log('- ', text);
        }
    });

    // Also check product description
    console.log('Description HTML:', $('.product__description, .product-description, .description').html()?.substring(0, 300));

}

testProduct();
