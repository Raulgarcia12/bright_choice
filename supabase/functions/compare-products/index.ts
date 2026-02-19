// Edge Function: Compare multiple products with Convenience Score
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { productIds } = await req.json();

        if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 5) {
            return new Response(
                JSON.stringify({ error: "Provide 2-5 product IDs" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // Fetch selected products
        const { data: products, error } = await supabase
            .from("products")
            .select("*, regions(name, abbreviation, country)")
            .in("id", productIds);

        if (error) throw error;

        // Fetch all products for percentile computation
        const { data: allProducts } = await supabase
            .from("products")
            .select("watts, lumens, price, cri, lifespan, warranty");

        const all = allProducts || [];

        // Compute comparison summary
        const comparison = (products || []).map((p: any) => {
            const efficiency = p.watts > 0 ? Math.round((p.lumens / p.watts) * 10) / 10 : 0;

            // Percentile calculations
            const effPercentile = all.filter((a) => a.watts > 0 && a.lumens / a.watts <= efficiency).length / all.length * 100;
            const pricePercentile = all.filter((a) => a.price >= p.price).length / all.length * 100;
            const criPercentile = all.filter((a) => a.cri <= p.cri).length / all.length * 100;

            return {
                ...p,
                efficiency,
                effPercentile: Math.round(effPercentile),
                pricePercentile: Math.round(pricePercentile),
                criPercentile: Math.round(criPercentile),
            };
        });

        // Determine "best in" categories
        const bestEfficiency = comparison.reduce((a: any, b: any) => a.efficiency > b.efficiency ? a : b);
        const bestPrice = comparison.reduce((a: any, b: any) => a.price < b.price ? a : b);
        const bestCRI = comparison.reduce((a: any, b: any) => a.cri > b.cri ? a : b);
        const bestLifespan = comparison.reduce((a: any, b: any) => a.lifespan > b.lifespan ? a : b);

        return new Response(
            JSON.stringify({
                products: comparison,
                highlights: {
                    bestEfficiency: bestEfficiency.id,
                    bestPrice: bestPrice.id,
                    bestCRI: bestCRI.id,
                    bestLifespan: bestLifespan.id,
                },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
