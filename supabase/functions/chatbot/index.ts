// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Groq from "npm:groq-sdk";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Agent Loop ---
async function runAgentLoop(userMessage: string, userId: string): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }
  const groq = new Groq({ apiKey });

  // Basic history array (In production, replace with actual DB history fetch using the Supabase Client)
  const messages = [
    {
      role: "system",
      content: "You are the Bright Choice Assistant, an advanced AI expert embedded inside the HD Supply dashboard. Keep your answers concise and business-focused. If the user asks for a voice note, start your response with the exact tag: [VOICE]"
    },
    {
      role: "user",
      content: userMessage
    }
  ];

  const MAX_ITERATIONS = 5;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages as any[],
    });

    const responseMessage = completion.choices[0].message;

    // Add tools logic here in the future
    if (!responseMessage.tool_calls) {
      return responseMessage.content || "Empty response from agent.";
    }

  }
  return "Error: Exceeded max loop iterations.";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, userId } = await req.json()
    console.log(`Received message from ${userId}: ${message}`)

    // -------------------------------------------------------------
    // ATENCIÓN: Core Agent Loop Execution
    // -------------------------------------------------------------
    const replyText = await runAgentLoop(message, userId);

    // Check if the agent wants to speak
    const isVoiceResponse = replyText.trim().startsWith("[VOICE]");
    let finalReply = replyText;
    let audioUrl = null;

    if (isVoiceResponse) {
      finalReply = replyText.replace("[VOICE]", "").trim();
      // Here we can hit ElevenLabs API via Deno `fetch` using Deno.env.get("ELEVENLABS_API_KEY")
      // audioUrl = await generateAudioAndStoreInBucket(finalReply);
    }

    const responseData = {
      success: true,
      reply: finalReply,
      audioUrl: audioUrl
    };

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    console.error("Agent Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
