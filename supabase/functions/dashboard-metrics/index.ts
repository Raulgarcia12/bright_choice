// Follow the Supabase Edge Functions conventions (Deno runtime)
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

        // Total product count
        const { count: totalProducts } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true });

        // Total brands
        const { count: totalBrands } = await supabase
            .from("brands")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true);

        // Average efficiency
        const { data: products } = await supabase
            .from("products")
            .select("watts, lumens, price, cri, cert_dlc");

        const allProducts = products || [];
        const avgEfficiency =
            allProducts.length > 0
                ? allProducts.reduce((s, p) => s + (p.watts > 0 ? p.lumens / p.watts : 0), 0) / allProducts.length
                : 0;
        const avgPrice =
            allProducts.length > 0
                ? allProducts.reduce((s, p) => s + p.price, 0) / allProducts.length
                : 0;
        const avgCRI =
            allProducts.length > 0
                ? allProducts.reduce((s, p) => s + p.cri, 0) / allProducts.length
                : 0;
        const dlcCertified = allProducts.filter((p) => p.cert_dlc).length;
        const dlcPercent = allProducts.length > 0 ? (dlcCertified / allProducts.length) * 100 : 0;

        // Recent changes (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { count: recentChangeCount } = await supabase
            .from("change_logs")
            .select("*", { count: "exact", head: true })
            .gte("detected_at", thirtyDaysAgo);

        // Last scrape run
        const { data: lastRun } = await supabase
            .from("scrape_runs")
            .select("completed_at, status, products_found")
            .order("started_at", { ascending: false })
            .limit(1)
            .single();

        return new Response(
            JSON.stringify({
                totalProducts: totalProducts || 0,
                totalBrands: totalBrands || 0,
                avgEfficiency: Math.round(avgEfficiency * 10) / 10,
                avgPrice: Math.round(avgPrice * 100) / 100,
                avgCRI: Math.round(avgCRI),
                dlcPercent: Math.round(dlcPercent),
                recentChangeCount: recentChangeCount || 0,
                lastScrapeRun: lastRun || null,
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
