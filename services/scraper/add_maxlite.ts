import { supabaseAdmin } from './src/utils/supabaseAdmin.js';

async function addBrand() {
    const { data, error } = await supabaseAdmin.from('brands').select('id, name').eq('name', 'MaxLite').single();
    if (data) {
        console.log('Brand already exists:', data);
    } else {
        console.log('Inserting MaxLite...', error?.message);
        const { error: err } = await supabaseAdmin.from('brands').insert({
            name: 'MaxLite',
            website_url: 'https://greenlightingwholesale.com/collections/maxlite',
            is_active: true,
            scraper_config: { scraperName: 'MaxLiteScraper' }
        });
        if (err) console.error('Error inserting brand:', err.message);
        else console.log('Successfully added MaxLite brand to database.');
    }
}

addBrand();
