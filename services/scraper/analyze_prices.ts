import { supabaseAdmin } from './src/utils/supabaseAdmin';

async function analyzePrices() {
    console.log('Fetching price statistics...');

    // Total products
    const { count: total, error: totalErr } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (totalErr || total === null) {
        console.error('Error fetching total count', totalErr);
        return;
    }

    // Products with price > 0
    const { count: withPrice, error: priceErr } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gt('price', 0);

    if (priceErr || withPrice === null) {
        console.error('Error fetching products with price', priceErr);
        return;
    }

    const withoutPrice = total - withPrice;

    const withPricePct = ((withPrice / total) * 100).toFixed(2);
    const withoutPricePct = ((withoutPrice / total) * 100).toFixed(2);

    console.log(`\n=== ANÁLISIS DE PRECIOS ===`);
    console.log(`Total de productos en DB: ${total}`);
    console.log(`Productos con precio REAL (>0) : ${withPrice} (${withPricePct}%)`);
    console.log(`Productos SIN precio (0 o null) : ${withoutPrice} (${withoutPricePct}%)`);
    console.log(`===========================\n`);

    // Let's also break it down by brand to give more context
    console.log(`=== POR MARCA ===`);
    const { data: brandsData, error: brandsErr } = await supabaseAdmin
        .from('products')
        .select('brand, price');

    if (brandsErr || !brandsData) {
        console.error('Error fetching brand data for breakdown', brandsErr);
        return;
    }

    const brandStats: Record<string, { total: number, withPrice: number }> = {};

    for (const p of brandsData) {
        if (!brandStats[p.brand]) {
            brandStats[p.brand] = { total: 0, withPrice: 0 };
        }
        brandStats[p.brand].total += 1;
        if (p.price > 0) {
            brandStats[p.brand].withPrice += 1;
        }
    }

    Object.entries(brandStats).forEach(([brand, stats]) => {
        const pct = ((stats.withPrice / stats.total) * 100).toFixed(2);
        console.log(`- ${brand}: ${stats.withPrice} / ${stats.total} tienen precio (${pct}%)`);
    });
}

analyzePrices().catch(console.error);
