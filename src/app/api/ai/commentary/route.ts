import { NextResponse } from 'next/server';
import { COMMENTARY_PERSONA } from '@/lib/prompts';

export async function POST(req: Request) {
  try {
    const { recentRoasts } = await req.json();

    if (!recentRoasts || !Array.isArray(recentRoasts) || recentRoasts.length === 0) {
      return NextResponse.json(
        { error: 'recentRoasts array is required and must not be empty.' },
        { status: 400 }
      );
    }

    const roastSummary = recentRoasts
      .map((r: { sender: string; text: string; score?: number }) => {
        const scoreInfo = r.score ? ` [Score: ${r.score}/10]` : '';
        return `${r.sender}: "${r.text}"${scoreInfo}`;
      })
      .join('\n');

    const userPrompt = `Here are the recent roasts in this battle:\n\n${roastSummary}\n\nGive your live commentary.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: COMMENTARY_PERSONA },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 1.0,
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices) {
      console.error('[AI Commentary] Groq API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Groq API request failed.' },
        { status: 500 }
      );
    }

    const aiResult = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      commentary: aiResult.commentary || 'THE BATTLE RAGES ON!',
      hypeLevel: Math.min(10, Math.max(1, Number(aiResult.hypeLevel) || 5)),
    });
  } catch (error) {
    console.error('[AI Commentary] Error:', error);
    return NextResponse.json(
      { error: 'Commentary system is offline.' },
      { status: 500 }
    );
  }
}
