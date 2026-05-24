import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, videoId, playerMetrics } = await req.json();

    // Context formatting including speech, facial energy analysis descriptors log
    const chatHistory = messages && Array.isArray(messages) 
      ? messages.map((m: any) => `[Type: ${m.audioData ? 'AUDIO/EXPRESSION ROAST' : 'TEXT'}], ${m.sender}: ${m.text || 'Voice input speech data parsed'}`).join('\n')
      : 'No explicit logs logged.';

    const prompt = `
    You are an elite, savage Gen Z internet meme tournament judge operating a multimodal streaming battle arena.
    Two live players are watching YouTube Short (Video ID: ${videoId}) and roasting each other via text, real-time live video expressions, and explosive voice inputs.
    
    CRITICAL ANALYSIS METRICS:
    - Assess the parsed voice text tone density profile.
    - Evaluate user facial expression metrics passed from dynamic canvas states: ${JSON.stringify(playerMetrics || {})}
    - Text data is OPTIONAL. Give massive weight to voice roast audio energy, visual dominance, and pure psychological facial expression delivery.
    
    Parsed Round Logs & Context Stream:
    ${chatHistory}

    Return ONLY a valid JSON object matching this exact structure (Do not add markdown wrappers):
    {
      "winner": "EXACT_USER_ID",
      "verdict": "Savage 2-sentence breakdown detailing how their visual expressions, voice modulation, and burns absolutely destroyed the rival.",
      "damageScore": 75
    }
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" } 
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices) {
      return NextResponse.json({ error: "Multimodal AI Judge context layer drops execution." }, { status: 500 });
    }

    const rawAiContent = JSON.parse(data.choices[0].message.content);

    const sanitizedResult = {
      winner: rawAiContent.winner ? rawAiContent.winner.trim().toUpperCase() : 'TIE',
      verdict: rawAiContent.verdict || 'Visual psychological annihilation verified.',
      damageScore: Number(rawAiContent.damageScore) || 50
    };

    return NextResponse.json(sanitizedResult);

  } catch (error) {
    console.error("Multimodal API Execution Failure:", error);
    return NextResponse.json({ error: "AI Engine processing failed." }, { status: 500 });
  }
}