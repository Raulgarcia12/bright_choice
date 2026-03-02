import { supabaseAdmin } from './src/utils/supabaseAdmin';

async function check() {
    // 1. Check brands table
    const { data: brands, error: brandErr } = await supabaseAdmin
        .from('brands')
        .select('id, name, is_active');
    console.log('=== BRANDS ===');
    console.log(brands);
    if (brandErr) console.error('Brand error:', brandErr);

    // 2. Count RAB products
    const { count, error: countErr } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('brand', 'RAB Lighting');
    console.log('\n=== RAB PRODUCT COUNT ===');
    console.log('Count:', count);
    if (countErr) console.error('Count error:', countErr);

    // 3. Sample 3 RAB products
    const { data: sample, error: sampleErr } = await supabaseAdmin
        .from('products')
        .select('id, brand, model, category, lumens, watts, cri, state_province')
        .eq('brand', 'RAB Lighting')
        .limit(3);
    console.log('\n=== SAMPLE RAB PRODUCTS ===');
    console.log(JSON.stringify(sample, null, 2));
    if (sampleErr) console.error('Sample error:', sampleErr);

    // 4. Total products count
    const { count: totalCount } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true });
    console.log('\n=== TOTAL PRODUCT COUNT ===');
    console.log('Total:', totalCount);
}

check();
