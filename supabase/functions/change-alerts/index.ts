// Edge Function: Change alerts — webhook/email notification trigger
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertConfig {
    type: "webhook" | "email";
    url?: string;
    email?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Get changes from last 24 hours
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: changes, error } = await supabase
            .from("change_logs")
            .select("*, products(brand, model, category)")
            .gte("detected_at", since)
            .order("detected_at", { ascending: false });

        if (error) throw error;
        if (!changes || changes.length === 0) {
            return new Response(
                JSON.stringify({ message: "No changes in the last 24 hours", alertsSent: 0 }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        // Build the alert summary
        const summary = {
            totalChanges: changes.length,
            affectedProducts: [...new Set(changes.map((c: any) => `${c.products?.brand} ${c.products?.model}`))],
            fieldsChanged: [...new Set(changes.map((c: any) => c.field_name))],
            details: changes.map((c: any) => ({
                product: `${c.products?.brand} ${c.products?.model}`,
                field: c.field_name,
                oldValue: c.old_value,
                newValue: c.new_value,
                detectedAt: c.detected_at,
            })),
        };

        // Check for configured webhooks
        const webhookUrl = Deno.env.get("ALERT_WEBHOOK_URL");
        let webhookSent = false;

        if (webhookUrl) {
            try {
                const webhookResponse = await fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: `🔔 Bright Choice Alert: ${summary.totalChanges} spec changes detected`,
                        blocks: [
                            {
                                type: "header",
                                text: { type: "plain_text", text: `🔔 ${summary.totalChanges} Spec Changes Detected` },
                            },
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: `*Products affected:* ${summary.affectedProducts.join(", ")}\n*Fields changed:* ${summary.fieldsChanged.join(", ")}`,
                                },
                            },
                        ],
                        summary,
                    }),
                });
                webhookSent = webhookResponse.ok;
            } catch {
                // Webhook failed silently — log but don't block
                console.error("Webhook delivery failed");
            }
        }

        // Email notification via Supabase Auth (if configured)
        const alertEmail = Deno.env.get("ALERT_EMAIL");
        let emailSent = false;

        if (alertEmail) {
            // Use a simple SMTP approach or integrate with a service
            // For now, log the intent — real implementation would use Resend/SendGrid
            console.log(`Would send email to ${alertEmail} with ${summary.totalChanges} changes`);
            emailSent = false; // Set to true once email service is integrated
        }

        return new Response(
            JSON.stringify({
                message: `Processed ${summary.totalChanges} changes`,
                alertsSent: (webhookSent ? 1 : 0) + (emailSent ? 1 : 0),
                webhookSent,
                emailSent,
                summary,
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
