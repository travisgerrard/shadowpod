// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for edge functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For production, set to your specific domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to parse and process the authorization header
const getJWTToken = (authHeader: string | null): string | null => {
  if (!authHeader) return null;
  
  // Extract the JWT token - it might be in the format "Bearer <token>" or just "<token>"
  const parts = authHeader.split(' ');
  return parts.length > 1 ? parts[1] : parts[0];
};

interface RequestBody {
  vocab: string[];
  grammar: string[];
  wanikaniLevel: string;
}

interface StoryContent {
  title: {
    japanese: string;
    english: string;
  };
  japanese: string;
  english: string;
}

interface ShadowingSegment {
  japanese: string;
  english: string;
}

interface SpeakingPrompt {
  question: {
    japanese: string;
    english: string;
  };
  modelAnswer: {
    japanese: string;
    english: string;
  };
}

interface GeneratedContent {
  story: StoryContent;
  shadowingSegments: ShadowingSegment[];
  speakingPrompts: SpeakingPrompt[];
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Edge function called");
    
    // Log headers for debugging (without sensitive data)
    console.log("Headers received:", [...req.headers.entries()]
      .filter(([key]) => !key.toLowerCase().includes('authorization')) // Don't log auth headers fully
      .map(([key, value]) => `${key}: ${value}`));
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    const token = getJWTToken(authHeader);
    
    if (!token) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "No valid authorization token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Log token info (partial/masked for security)
    console.log("Auth token found:", token.substring(0, 5) + "..." + token.substring(token.length - 5));

    // Env variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    console.log("Creating Supabase client with auth token");
    
    // Create a Supabase client with the Auth token
    const supabaseClient = createClient(
      supabaseUrl, 
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the token by getting the user
    console.log("Verifying auth token");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error("Auth token verification error:", userError);
      return new Response(
        JSON.stringify({ error: "Authentication error", details: userError }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }
    
    if (!user) {
      console.error("No user found with provided token");
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    console.log("Authenticated as user:", user.id);

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request body parsed successfully");
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get data from the parsed request
    const { vocab, grammar, wanikaniLevel } = requestData;

    console.log("Request data:", JSON.stringify({ 
      vocabCount: vocab?.length, 
      grammarCount: grammar?.length, 
      wanikaniLevel 
    }));

    if (!vocab?.length || !grammar?.length || !wanikaniLevel) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Call OpenAI API to generate content
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a Japanese language teaching assistant. Generate engaging, natural Japanese content for language learners. Your response must be in valid JSON format with the exact structure specified in the user prompt."
          },
          {
            role: "user",
            content: `Generate a titled story (50-100 characters) in Japanese with English translation using the following vocabulary: ${vocab.join(
              ", "
            )} and grammar points: ${grammar.join(
              ", "
            )}. The content should be appropriate for ${wanikaniLevel} level. Then, break the story into 3-5 shadowing segments with translations. Finally, create 2-3 speaking prompts (questions) related to the story with model answers.

            IMPORTANT: Return your response in this exact JSON structure:
            {
              "story": {
                "title": {
                  "japanese": "Japanese title here",
                  "english": "English title here"
                },
                "japanese": "Full Japanese story text here",
                "english": "Full English translation here"
              },
              "shadowingSegments": [
                {
                  "japanese": "First Japanese segment",
                  "english": "First English translation"
                },
                {
                  "japanese": "Second Japanese segment",
                  "english": "Second English translation"
                },
                ... (more segments)
              ],
              "speakingPrompts": [
                {
                  "question": {
                    "japanese": "First question in Japanese",
                    "english": "First question in English"
                  },
                  "modelAnswer": {
                    "japanese": "Model answer in Japanese",
                    "english": "Model answer in English"
                  }
                },
                ... (more prompts)
              ]
            }

            Ensure all properties shown above are present and correctly formatted.`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorData }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log("Received OpenAI response");

    // Parse the content from OpenAI
    let generatedContent;
    try {
      generatedContent = JSON.parse(openaiData.choices[0].message.content) as GeneratedContent;
      
      // Validate the structure
      if (!generatedContent.story || 
          !generatedContent.story.title || 
          !generatedContent.story.title.japanese || 
          !generatedContent.story.title.english || 
          !generatedContent.story.japanese || 
          !generatedContent.story.english || 
          !Array.isArray(generatedContent.shadowingSegments) || 
          !Array.isArray(generatedContent.speakingPrompts)) {
        
        console.error("Invalid content structure from OpenAI:", JSON.stringify(generatedContent));
        
        // Return error response with details
        return new Response(
          JSON.stringify({ 
            error: "Invalid content structure from OpenAI", 
            details: generatedContent
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      
      console.log("Content structure validated successfully");
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse OpenAI response", 
          details: parseError.message,
          rawContent: openaiData.choices[0].message.content
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Store the generated content in Supabase
    const userId = user.id;

    // Store the story
    const { data: storyData, error: storyError } = await supabaseClient
      .from("user_modules")
      .insert({
        user_id: userId,
        module_type: "story",
        content: generatedContent.story,
      })
      .select("id")
      .single();

    if (storyError) {
      return new Response(
        JSON.stringify({ error: "Failed to store story", details: storyError }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Store the shadowing segments
    const { error: shadowingError } = await supabaseClient
      .from("user_modules")
      .insert({
        user_id: userId,
        module_type: "shadowing",
        content: { segments: generatedContent.shadowingSegments, storyId: storyData.id },
      });

    if (shadowingError) {
      return new Response(
        JSON.stringify({
          error: "Failed to store shadowing segments",
          details: shadowingError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Store the speaking prompts
    const { error: promptsError } = await supabaseClient
      .from("user_modules")
      .insert({
        user_id: userId,
        module_type: "prompt",
        content: { prompts: generatedContent.speakingPrompts, storyId: storyData.id },
      });

    if (promptsError) {
      return new Response(
        JSON.stringify({
          error: "Failed to store speaking prompts",
          details: promptsError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Update encountered items in user profile
    const { error: profileError } = await supabaseClient.rpc(
      "update_encountered_items",
      {
        items: vocab.map((v) => ({ vocab: v, timestamp: new Date().toISOString() })),
      }
    );

    if (profileError) {
      console.error("Failed to update encountered items:", profileError);
    }

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 