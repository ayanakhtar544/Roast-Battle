import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, videoId } = await req.json();

    const chatHistory = messages.map((m: any) => `${m.sender}: ${m.text}`).join('\n');

    const prompt = `
    You are a savage Gen Z internet meme judge. 
    Two players are watching YouTube Short (Video ID: ${videoId}) and roasting each other.
    
    Read their chat history and accurately judge who won this specific round. 
    
    RULES:
    1. You MUST pick exactly ONE winner from the chat history. No ties allowed.
    2. The "winner" field MUST match their EXACT username.
    3. The "verdict" MUST be a savage 2-sentence explanation quoting their best roast.
    
    Chat History:
    ${chatHistory}

    Return ONLY a valid JSON object:
    {
      "winner": "Exact Username",
      "verdict": "Savage explanation quoting the winning roast",
      "damageScore": "A random number between 1 to 100"
    }
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // NAYA UPDATED LATEST MODEL
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" } 
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices) {
      console.error("Groq API ne error diya hai:", data);
      return NextResponse.json(
        { error: data.error?.message || "Groq API reject kar rahi hai request." }, 
        { status: 500 }
      );
    }

    const aiResult = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(aiResult);

  } catch (error) {
    console.error("AI Judge Code Error:", error);
    return NextResponse.json({ error: "AI Judge abhi offline hai." }, { status: 500 });
  }
}