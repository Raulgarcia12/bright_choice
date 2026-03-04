import { createClient } from '@supabase/supabase-js';
import { config } from './src/config';

async function run() {
    const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey);

    console.log('Deleting outlier product: MaxLite Hex Car Shop...');
    const { error: e1 } = await supabaseAdmin
        .from('products')
        .delete()
        .ilike('model', '%MaxLite Hex Car Shop Decorative Light Kit with Frame%');
    if (e1) console.error('Error deleting outlier:', e1.message);
    else console.log('Outlier deleted.');

    console.log('Deleting mislabeled BulbsDepot products...');
    const { error: e2 } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('brand', 'BulbsDepot');
    if (e2) console.error('Error deleting BulbsDepot:', e2.message);
    else console.log('BulbsDepot products deleted.');

    console.log('Deleting mislabeled Green Lighting Wholesale products...');
    const { error: e3 } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('brand', 'Green Lighting Wholesale');
    if (e3) console.error('Error deleting GLW:', e3.message);
    else console.log('GLW products deleted.');

    console.log('Deleting old MaxLite products missing seller_name...');
    const { error: e4 } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('brand', 'MaxLite')
        .is('seller_name', null);
    if (e4) console.error('Error deleting old MaxLite:', e4.message);
    else console.log('Old MaxLite products deleted.');

    console.log('Done cleaning up database.');
}

run().catch(console.error);
