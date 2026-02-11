import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { text, language = 'en' } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const GOOGLE_TTS_API_KEY = Deno.env.get('GOOGLE_TTS_API_KEY');
    if (!GOOGLE_TTS_API_KEY) {
      throw new Error('GOOGLE_TTS_API_KEY is not configured');
    }

    // Map language codes to Google TTS language codes and voices
    const languageConfig = {
      'en': {
        languageCode: 'en-US',
        voice: 'en-US-Neural2-C'
      },
      'kn': {
        languageCode: 'kn-IN',
        voice: 'kn-IN-Standard-A'
      }
    };

    const config = languageConfig[language] || languageConfig['en'];

    // Call Google Cloud Text-to-Speech API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            text: text
          },
          voice: {
            languageCode: config.languageCode,
            name: config.voice,
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 0.95
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google TTS API error:', error);
      throw new Error('Failed to generate audio from Google TTS');
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    // Return audio as base64
    return new Response(
      JSON.stringify({ 
        audioContent: data.audioContent,
        language,
        contentType: 'audio/mpeg'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
