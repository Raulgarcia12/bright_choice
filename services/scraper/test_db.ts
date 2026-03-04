import { createClient } from '@supabase/supabase-js';
import { config } from './src/config';

async function run() {
    const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    const { data, error } = await supabaseAdmin.from('products').select('brand, seller_name, model').not('seller_name', 'is', null).limit(5);
    if (error) {
        console.error("DB Error:", error);
    } else {
        console.log("Products with seller_name:", data);
        console.log("Count:", data?.length);
    }
}

run().catch(console.error);
