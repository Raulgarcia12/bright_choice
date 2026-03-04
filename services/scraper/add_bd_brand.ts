import { supabaseAdmin } from './src/utils/supabaseAdmin';

async function addBrand() {
    console.log("Adding BulbsDepot to brands table...");

    // Check if exists
    const { data: existing } = await supabaseAdmin
        .from('brands')
        .select('id')
        .eq('name', 'BulbsDepot')
        .single();

    if (existing) {
        console.log("Brand already exists with ID:", existing.id);

        // Ensure it's active
        await supabaseAdmin
            .from('brands')
            .update({ is_active: true })
            .eq('id', existing.id);

        return;
    }

    // Insert new
    const { data, error } = await supabaseAdmin
        .from('brands')
        .insert({
            name: 'BulbsDepot',
            website_url: 'https://www.bulbsdepot.com',
            is_active: true,
            scraper_config: {}
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding brand:", error.message);
    } else {
        console.log("Successfully added BulbsDepot brand:", data.id);
    }
}

addBrand();
