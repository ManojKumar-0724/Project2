import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { monumentText, difficulty = 'medium', questionCount = 5 } = await req.json();
    
    if (!monumentText) {
      throw new Error('Monument text is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a quiz generator for cultural heritage education. Generate ${questionCount} multiple choice questions about the monument described below. 
    
    Difficulty: ${difficulty}
    
    Format your response as a JSON array of questions. Each question should have:
    - question: the question text
    - options: array of 4 options
    - correctAnswer: index of correct option (0-3)
    - explanation: brief explanation of the answer
    
    Example format:
    [
      {
        "question": "When was this monument built?",
        "options": ["12th century", "15th century", "18th century", "20th century"],
        "correctAnswer": 1,
        "explanation": "The monument was built in the 15th century during..."
      }
    ]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: monumentText }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI Gateway error:', error);
      throw new Error('Failed to generate quiz');
    }

    const data = await response.json();
    const quizText = data.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = quizText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse quiz format');
    }
    
    const questions = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quiz:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
